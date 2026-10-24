// Codec POS → Contabilidad: recibe todo lo que el negocio comparte con su
// contador. Tipos de evento:
//   venta · gasto · devolucion · cierre_caja · anulacion (campo `de`:
//   venta | gasto | devolucion) · factura_electronica · nota_credito ·
//   nota_debito · documento_soporte (estos cuatro llevan el XML).
//
// Lo llama la nube de Codec POS con el token que le dio pos-vincular, en
// lotes de hasta 200 eventos. Es idempotente por `id_origen`: reenviar un
// lote completo tras un fallo no duplica nada.
//
// ── Por qué el XML NO se lee aquí ──────────────────────────────────────
// Igual que el correo (ver correo-entrante): el XML se guarda en la bandeja
// del contador y lo lee el mismo motor que lee los XML subidos a mano. Un
// segundo lector daría, tarde o temprano, dos cifras distintas para la misma
// factura según por dónde entró.
//
// Deploy (SIN JWT: el token es propio):
//   supabase functions deploy pos-ingesta --no-verify-jwt --workdir "<carpeta>"

import { createClient } from 'jsr:@supabase/supabase-js@2';

const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const BUCKET = 'fiscal-documents';
const MAX_EVENTOS = 200;
const MAX_XML = 5 * 1024 * 1024;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function sha256Hex(datos: string | Uint8Array): Promise<string> {
  const bytes = typeof datos === 'string' ? new TextEncoder().encode(datos) : datos;
  const h = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const num = (v: unknown) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
};
const txt = (v: unknown, max = 200) => (v === null || v === undefined || v === '' ? null : String(v).slice(0, max));

interface Vinculo {
  id: string;
  owner_user_id: string;
  empresa_id: string;
  nombre_negocio: string | null;
  eventos_recibidos: number;
}

type Evento = Record<string, unknown>;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'metodo_no_permitido' }, 405);

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token.startsWith('cdp_')) return json({ error: 'token_invalido' }, 401);
  const hash = await sha256Hex(token);

  const { data: filas } = await admin.from('cont_pos_vinculos')
    .select('id, owner_user_id, empresa_id, nombre_negocio, eventos_recibidos, estado')
    .eq('token_hash', hash).limit(1);
  const fila = filas?.[0] as (Vinculo & { estado: string }) | undefined;
  if (!fila) return json({ error: 'token_invalido' }, 401);
  if (fila.estado !== 'activo') return json({ error: 'conexion_revocada' }, 401);
  const v: Vinculo = fila;

  let eventos: Evento[];
  try {
    const body = await req.json();
    eventos = Array.isArray(body?.eventos) ? body.eventos : [];
  } catch {
    return json({ error: 'json_invalido' }, 400);
  }
  if (eventos.length === 0) return json({ aceptados: [], duplicados: [], rechazados: [] });
  if (eventos.length > MAX_EVENTOS) return json({ error: `maximo_${MAX_EVENTOS}_eventos` }, 413);

  const aceptados: string[] = [];
  const duplicados: string[] = [];
  const rechazados: Array<{ id_origen: string; motivo: string }> = [];

  for (const e of eventos) {
    const id = txt(e.id_origen, 100);
    if (!id) { rechazados.push({ id_origen: '', motivo: 'falta_id_origen' }); continue; }
    try {
      const r = await procesar(v, id, e);
      if (r === 'ok') aceptados.push(id);
      else if (r === 'duplicado') duplicados.push(id);
      else rechazados.push({ id_origen: id, motivo: r });
    } catch (err) {
      console.error('pos-ingesta', id, (err as Error).message);
      // Un fallo nuestro no es culpa del evento: 500 para que Codec POS
      // reintente el lote. Lo ya aceptado vuelve como duplicado.
      return json({ error: 'error_interno', aceptados, duplicados, rechazados }, 500);
    }
  }

  await admin.from('cont_pos_vinculos').update({
    ultimo_envio_at: new Date().toISOString(),
    eventos_recibidos: v.eventos_recibidos + aceptados.length,
    updated_at: new Date().toISOString(),
  }).eq('id', v.id);

  return json({ aceptados, duplicados, rechazados });
});

/** Documentos electrónicos: todos entran a la bandeja y los lee el mismo motor. */
const TIPOS_XML: Record<string, string> = {
  factura_electronica: 'pos',
  nota_credito: 'pos-nc',
  nota_debito: 'pos-nd',
  documento_soporte: 'pos-ds',
};

/** Fecha del evento; null si no se puede leer. */
const fechaDe = (v: unknown) => {
  const f = new Date(String(v ?? ''));
  return Number.isNaN(f.getTime()) ? null : f.toISOString();
};

const lineas = (v: unknown) => Array.isArray(v) ? (v as Evento[]).slice(0, 500).map((i) => ({
  nombre: txt(i.nombre, 200),
  cantidad: num(i.cantidad),
  precio_unitario: num(i.precio_unitario),
  subtotal: num(i.subtotal),
  iva_pct: num(i.iva_pct),
})) : [];

/** Insert idempotente: la fila repetida (mismo id_origen) es un duplicado, no un error. */
async function insertar(tabla: string, fila: Record<string, unknown>): Promise<'ok' | 'duplicado'> {
  const { error } = await admin.from(tabla).insert(fila);
  if (error?.code === '23505') return 'duplicado';
  if (error) throw new Error(error.message);
  return 'ok';
}

async function procesar(v: Vinculo, id: string, e: Evento): Promise<'ok' | 'duplicado' | string> {
  const tipo = String(e.tipo ?? '');
  const base = { owner_user_id: v.owner_user_id, empresa_id: v.empresa_id, vinculo_id: v.id, id_origen: id };

  if (tipo in TIPOS_XML) {
    const xml = typeof e.xml === 'string' ? e.xml : '';
    if (!xml.trim().startsWith('<') || xml.length > MAX_XML) return 'xml_invalido';
    const bytes = new TextEncoder().encode(xml);
    const sha = await sha256Hex(bytes);
    const cufe = txt(e.cufe, 120) ?? txt(e.cude, 120) ?? id;
    const nombre = `${TIPOS_XML[tipo]}-${cufe.replace(/[^\w-]/g, '').slice(0, 60)}.xml`;
    const ruta = `${v.owner_user_id}/pos/${v.empresa_id}/${sha.slice(0, 16)}-${nombre}`;
    const subida = await admin.storage.from(BUCKET).upload(ruta, bytes, { contentType: 'application/xml', upsert: true });
    if (subida.error) throw new Error(subida.error.message);
    const { error } = await admin.from('ed_inbox_files').insert({
      owner_user_id: v.owner_user_id,
      from_address: 'Codec POS',
      subject: v.nombre_negocio,
      message_id: id,
      filename: nombre,
      size_bytes: bytes.byteLength,
      content_type: 'application/xml',
      storage_path: ruta,
      sha256: sha,
      origen: 'pos',
      empresa_id: v.empresa_id,
    });
    if (error?.code === '23505') return 'duplicado';
    if (error) throw new Error(error.message);
    return 'ok';
  }

  if (tipo === 'venta') {
    const fecha = fechaDe(e.fecha);
    if (!fecha) return 'fecha_invalida';
    return insertar('pos_ventas', {
      ...base,
      numero: txt(e.numero, 40),
      fecha,
      total: num(e.total),
      subtotal: num(e.subtotal),
      iva: num(e.iva),
      descuento: num(e.descuento),
      propina: num(e.propina),
      medio_pago: txt(e.medio_pago, 40)?.toLowerCase() ?? null,
      metodos_multiples: Array.isArray(e.metodos_multiples) ? e.metodos_multiples : null,
      cajero: txt(e.cajero, 120),
      tienda: txt(e.tienda, 120),
      factura_cufe: txt(e.factura_cufe, 120),
      items: lineas(e.items),
    });
  }

  if (tipo === 'gasto') {
    const fecha = fechaDe(e.fecha);
    if (!fecha) return 'fecha_invalida';
    const valor = num(e.valor);
    if (valor <= 0) return 'valor_invalido';
    return insertar('pos_gastos', {
      ...base,
      fecha,
      concepto: txt(e.concepto, 300),
      categoria: txt(e.categoria, 120),
      valor,
      iva: Math.min(num(e.iva), valor),
      medio_pago: txt(e.medio_pago, 40)?.toLowerCase() ?? null,
      proveedor_nombre: txt(e.proveedor_nombre, 200),
      proveedor_nit: txt(e.proveedor_nit, 30),
      numero_soporte: txt(e.numero_soporte, 60),
      cajero: txt(e.cajero, 120),
      tienda: txt(e.tienda, 120),
      notas: txt(e.notas, 500),
    });
  }

  if (tipo === 'devolucion') {
    const fecha = fechaDe(e.fecha);
    if (!fecha) return 'fecha_invalida';
    return insertar('pos_devoluciones', {
      ...base,
      venta_id_origen: txt(e.venta_id_origen, 100),
      fecha,
      total: num(e.total),
      subtotal: num(e.subtotal),
      iva: num(e.iva),
      medio_pago: txt(e.medio_pago, 40)?.toLowerCase() ?? null,
      motivo: txt(e.motivo, 300),
      nota_credito_cufe: txt(e.nota_credito_cufe, 120),
      items: lineas(e.items),
    });
  }

  if (tipo === 'cierre_caja') {
    const cierre = fechaDe(e.cierre);
    if (!cierre) return 'fecha_invalida';
    const porMedio = e.ventas_por_medio && typeof e.ventas_por_medio === 'object' && !Array.isArray(e.ventas_por_medio)
      ? Object.fromEntries(Object.entries(e.ventas_por_medio as Evento).slice(0, 30).map(([k, val]) => [k.slice(0, 40).toLowerCase(), num(val)]))
      : {};
    return insertar('pos_cierres_caja', {
      ...base,
      apertura: fechaDe(e.apertura),
      cierre,
      cajero: txt(e.cajero, 120),
      tienda: txt(e.tienda, 120),
      caja: txt(e.caja, 60),
      base_inicial: num(e.base_inicial),
      ventas_total: num(e.ventas_total),
      ventas_por_medio: porMedio,
      gastos_efectivo: num(e.gastos_efectivo),
      retiros: num(e.retiros),
      ingresos_extra: num(e.ingresos_extra),
      efectivo_esperado: num(e.efectivo_esperado),
      efectivo_contado: num(e.efectivo_contado),
      diferencia: num(e.diferencia),
      num_ventas: Math.max(0, Math.round(num(e.num_ventas))),
      observaciones: txt(e.observaciones, 500),
    });
  }

  if (tipo === 'anulacion') {
    // `id_origen` es el del registro anulado; `de` dice de qué tabla (venta por defecto).
    const de = String(e.de ?? 'venta');
    const destino = de === 'gasto'
      ? { tabla: 'pos_gastos', campo: 'anulado' }
      : de === 'devolucion'
        ? { tabla: 'pos_devoluciones', campo: 'anulada' }
        : de === 'venta' ? { tabla: 'pos_ventas', campo: 'anulada' } : null;
    if (!destino) return 'tipo_desconocido';
    const { data, error } = await admin.from(destino.tabla)
      .update({ [destino.campo]: true, updated_at: new Date().toISOString() })
      .eq('empresa_id', v.empresa_id).eq('id_origen', id).select('id');
    if (error) throw new Error(error.message);
    return data && data.length > 0 ? 'ok' : `${de}_no_encontrada`;
  }

  return 'tipo_desconocido';
}
