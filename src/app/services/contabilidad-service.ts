/**
 * Acceso a datos del módulo Contabilidad.
 *
 * Igual que dian-service: la única capa que conoce Supabase. Las reglas que
 * importan (tope de empresas, que el comprobante cuadre, el consecutivo, que
 * nadie escriba sin plan) viven en la base; aquí sólo se llama y se traduce.
 */

import { supabase } from '../../lib/supabase';
import type { CuentaPropia } from '../../lib/contabilidad/puc';
import type { FilaSaldo } from '../../lib/contabilidad/reportes';
import type { DocCausable, LineaCausable, ResultadoCausacion } from '../../lib/dian/causacion';

// ── Plan ──────────────────────────────────────────────────────────────────

export interface PlanContabilidad {
  code: string;
  nombre: string;
  descripcion: string | null;
  maxEmpresas: number;
  precioMes: number | null;
  precioAnual: number | null;
  incluyeDian: string | null;
  dianNombre: string | null;
  dianLimite: number | null;
}

export interface EstadoContabilidad {
  activo: boolean;
  admin: boolean;
  enPrueba: boolean;
  planCode: string | null;
  planNombre: string | null;
  maxEmpresas: number | null;
  empresasUsadas: number;
  hasta: string | null;
  pruebaDisponible: boolean;
  planes: PlanContabilidad[];
}

function aEstado(d: Record<string, unknown>): EstadoContabilidad {
  const planes = (d.planes as Array<Record<string, unknown>> | undefined) ?? [];
  return {
    activo: Boolean(d.activo),
    admin: Boolean(d.admin),
    enPrueba: Boolean(d.en_prueba),
    planCode: (d.plan_code as string) ?? null,
    planNombre: (d.plan_nombre as string) ?? null,
    maxEmpresas: d.max_empresas == null ? null : Number(d.max_empresas),
    empresasUsadas: Number(d.empresas_usadas ?? 0),
    hasta: (d.hasta as string) ?? null,
    pruebaDisponible: Boolean(d.prueba_disponible),
    planes: planes.map((p) => ({
      code: String(p.code),
      nombre: String(p.nombre),
      descripcion: (p.descripcion as string) ?? null,
      maxEmpresas: Number(p.max_empresas),
      precioMes: p.precio_mes == null ? null : Number(p.precio_mes),
      precioAnual: p.precio_anual == null ? null : Number(p.precio_anual),
      incluyeDian: (p.incluye_dian as string) ?? null,
      dianNombre: (p.dian_nombre as string) ?? null,
      dianLimite: p.dian_limite == null ? null : Number(p.dian_limite),
    })),
  };
}

export async function estadoContabilidad(): Promise<EstadoContabilidad> {
  const { data, error } = await supabase.rpc('cont_estado');
  if (error) throw new Error(error.message);
  return aEstado((data ?? {}) as Record<string, unknown>);
}

export async function iniciarPrueba(): Promise<EstadoContabilidad> {
  const { data, error } = await supabase.rpc('cont_iniciar_prueba');
  if (error) throw new Error(error.message);
  return aEstado((data ?? {}) as Record<string, unknown>);
}

/** Devuelve la URL del checkout de Wompi. El precio lo pone la base. */
export async function pagarContabilidad(planCode: string, meses: 1 | 12): Promise<string> {
  const { data, error } = await supabase.functions.invoke('wompi-checkout', {
    body: { plan: planCode, producto: 'contabilidad', meses },
  });
  if (error) throw new Error(error.message);
  const c = data as {
    publicKey: string; reference: string; amountInCents: number; currency: string;
    signature: string; redirectUrl: string; email?: string; error?: string;
  };
  if (c?.error) throw new Error(c.error);
  if (!c?.signature) throw new Error('No se pudo abrir el cobro.');
  const q = new URLSearchParams({
    'public-key': c.publicKey,
    currency: c.currency,
    'amount-in-cents': String(c.amountInCents),
    reference: c.reference,
    'signature:integrity': c.signature,
    'redirect-url': c.redirectUrl,
  });
  if (c.email) q.set('customer-data:email', c.email);
  return `https://checkout.wompi.co/p/?${q.toString()}`;
}

// ── Empresas ──────────────────────────────────────────────────────────────

export interface Empresa {
  id: string;
  nit: string;
  dv: string | null;
  razon_social: string;
  nombre_comercial: string | null;
  regimen: string | null;
  ciudad: string | null;
  email: string | null;
  telefono: string | null;
  notas: string | null;
  color: string | null;
  activo: boolean;
  causacion_automatica: boolean;
  created_at: string;
}

export interface ResumenEmpresa {
  empresa_id: string;
  documentos_mes: number;
  por_causar: number;
  avisos: number;
  ultimo_documento: string | null;
  comprobantes: number;
}

const CAMPOS_EMPRESA = 'id,nit,dv,razon_social,nombre_comercial,regimen,ciudad,email,telefono,notas,color,activo,causacion_automatica,created_at';

export async function listarEmpresas(): Promise<Empresa[]> {
  const { data, error } = await supabase.from('fiscal_entities').select(CAMPOS_EMPRESA).order('razon_social');
  if (error) throw new Error(error.message);
  return (data ?? []) as Empresa[];
}

export async function resumenEmpresas(): Promise<Map<string, ResumenEmpresa>> {
  const { data, error } = await supabase.rpc('cont_resumen_empresas');
  if (error) throw new Error(error.message);
  return new Map(((data ?? []) as ResumenEmpresa[]).map((r) => [r.empresa_id, r]));
}

export type DatosEmpresa = Partial<Omit<Empresa, 'id' | 'created_at'>> & { nit: string; razon_social: string };

export async function guardarEmpresa(datos: DatosEmpresa, id?: string): Promise<Empresa> {
  const fila = {
    nit: datos.nit,
    dv: datos.dv || null,
    razon_social: datos.razon_social.trim(),
    nombre_comercial: datos.nombre_comercial?.trim() || null,
    regimen: datos.regimen || null,
    ciudad: datos.ciudad?.trim() || null,
    email: datos.email?.trim() || null,
    telefono: datos.telefono?.trim() || null,
    notas: datos.notas?.trim() || null,
    color: datos.color || null,
    ...(datos.causacion_automatica === undefined ? {} : { causacion_automatica: datos.causacion_automatica }),
    ...(datos.activo === undefined ? {} : { activo: datos.activo }),
  };
  const q = id
    ? supabase.from('fiscal_entities').update(fila).eq('id', id).select(CAMPOS_EMPRESA).single()
    : supabase.from('fiscal_entities').insert(fila).select(CAMPOS_EMPRESA).single();
  const { data, error } = await q;
  if (error) {
    if (error.code === '23505') throw new Error('Ya tienes una empresa con ese NIT.');
    throw new Error(error.message);
  }
  return data as Empresa;
}

export async function borrarEmpresa(id: string): Promise<void> {
  const { error } = await supabase.from('fiscal_entities').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** NIT que aparecen en los XML del contador como receptor o emisor y que
 *  todavía no son empresas suyas: son las candidatas a agregar. */
export async function nitsSinRegistrar(registrados: Set<string>): Promise<Array<{ nit: string; nombre: string; documentos: number }>> {
  const { data, error } = await supabase
    .from('ed_documents')
    .select('issuer_nit,issuer_name,receiver_nit,receiver_name')
    .is('fiscal_entity_id', null)
    .in('doc_type', ['factura', 'nota_credito', 'nota_debito', 'documento_equivalente', 'documento_soporte'])
    .order('issue_date', { ascending: false })
    .limit(1000);
  if (error) throw new Error(error.message);
  const m = new Map<string, { nombre: string; documentos: number }>();
  const sumar = (nit: string | null, nombre: string | null) => {
    const n = String(nit ?? '').replace(/[^0-9]/g, '');
    if (!n || n.length < 6 || registrados.has(n) || /^2{6,}$/.test(n)) return;
    const e = m.get(n) ?? { nombre: nombre ?? '', documentos: 0 };
    e.documentos++;
    m.set(n, e);
  };
  for (const d of (data ?? []) as Array<Record<string, string | null>>) {
    sumar(d.receiver_nit, d.receiver_name);
    sumar(d.issuer_nit, d.issuer_name);
  }
  // Las empresas del contador aparecen en muchos documentos; un proveedor
  // suelto, en uno o dos. Por eso sólo se proponen los que se repiten.
  return [...m.entries()]
    .map(([nit, e]) => ({ nit, nombre: e.nombre, documentos: e.documentos }))
    .filter((e) => e.documentos >= 3)
    .sort((a, b) => b.documentos - a.documentos)
    .slice(0, 8);
}

// ── Avisos ────────────────────────────────────────────────────────────────

export interface AvisoContable {
  id: string;
  empresa_id: string | null;
  tipo: 'xml_nuevos' | 'pos_nuevos' | 'sistema';
  fecha: string;
  cantidad: number;
  monto: number;
  detalle: Record<string, number>;
  leido: boolean;
  updated_at: string;
}

export async function listarAvisos(): Promise<AvisoContable[]> {
  const { data, error } = await supabase
    .from('cont_avisos')
    .select('id,empresa_id,tipo,fecha,cantidad,monto,detalle,leido,updated_at')
    .order('updated_at', { ascending: false })
    .limit(60);
  if (error) throw new Error(error.message);
  return (data ?? []) as AvisoContable[];
}

export async function marcarAvisosLeidos(empresaId?: string): Promise<void> {
  let q = supabase.from('cont_avisos').update({ leido: true }).eq('leido', false);
  if (empresaId) q = q.eq('empresa_id', empresaId);
  const { error } = await q;
  if (error) throw new Error(error.message);
}

// ── Documentos de una empresa (las carpetas) ─────────────────────────────

export interface DocumentoEmpresa {
  id: string;
  doc_type: string;
  full_number: string | null;
  issue_date: string | null;
  issuer_nit: string | null;
  issuer_name: string | null;
  receiver_nit: string | null;
  receiver_name: string | null;
  total: number;
  total_iva: number;
  cufe: string | null;
  status: string;
  accounting_status: string;
}

/** Filtro PostgREST: los documentos donde la empresa es receptor o emisor. */
const filtroEmpresa = (e: Pick<Empresa, 'id' | 'nit'>) =>
  `fiscal_entity_id.eq.${e.id},receiver_nit.eq.${e.nit},issuer_nit.eq.${e.nit}`;

export async function documentosEmpresa(
  e: Pick<Empresa, 'id' | 'nit'>,
  desde: string,
  hasta: string,
): Promise<DocumentoEmpresa[]> {
  const todos: DocumentoEmpresa[] = [];
  for (let desdeFila = 0; ; desdeFila += 1000) {
    const { data, error } = await supabase
      .from('ed_documents')
      .select('id,doc_type,full_number,issue_date,issuer_nit,issuer_name,receiver_nit,receiver_name,total,total_iva,cufe,status,accounting_status')
      .or(filtroEmpresa(e))
      .gte('issue_date', desde)
      .lte('issue_date', hasta)
      .order('issue_date', { ascending: false })
      .range(desdeFila, desdeFila + 999);
    if (error) throw new Error(error.message);
    todos.push(...((data ?? []) as DocumentoEmpresa[]));
    if (!data || data.length < 1000) break;
  }
  return todos;
}

/** Meses (AAAA-MM) en que la empresa tiene documentos o comprobantes, para
 *  las carpetas por periodo. */
export async function periodosEmpresa(e: Pick<Empresa, 'id' | 'nit'>): Promise<string[]> {
  const [docs, comp] = await Promise.all([
    supabase.from('ed_documents').select('issue_date').or(filtroEmpresa(e)).order('issue_date', { ascending: false }).limit(5000),
    supabase.from('cont_comprobantes').select('fecha').eq('empresa_id', e.id).limit(5000),
  ]);
  const s = new Set<string>();
  for (const d of (docs.data ?? []) as Array<{ issue_date: string | null }>) if (d.issue_date) s.add(d.issue_date.slice(0, 7));
  for (const c of (comp.data ?? []) as Array<{ fecha: string }>) s.add(c.fecha.slice(0, 7));
  return [...s].sort().reverse();
}

/** Lo que necesita el panel de causación, sólo de esta empresa. */
export async function datosCausacionEmpresa(e: Pick<Empresa, 'id' | 'nit'>): Promise<{ documentos: DocCausable[]; lineas: LineaCausable[] }> {
  const documentos: DocCausable[] = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await supabase.from('ed_documents').select('*').or(filtroEmpresa(e))
      .order('issue_date', { ascending: false }).range(desde, desde + 999);
    if (error) throw new Error(error.message);
    documentos.push(...((data ?? []) as unknown as DocCausable[]));
    if (!data || data.length < 1000) break;
  }
  const ids = documentos.map((d) => d.id);
  const lineas: LineaCausable[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await supabase.from('ed_document_lines').select('document_id,description').in('document_id', ids.slice(i, i + 200));
    if (error) throw new Error(error.message);
    lineas.push(...((data ?? []) as LineaCausable[]));
  }
  return { documentos, lineas };
}

/** XML original para descargar desde la carpeta. */
export async function urlXmlOriginal(documentId: string): Promise<string | null> {
  const { data } = await supabase.from('ed_document_files').select('storage_path').eq('document_id', documentId).limit(1).maybeSingle();
  const ruta = (data as { storage_path?: string } | null)?.storage_path;
  if (!ruta || ruta.startsWith('pendiente/')) return null;
  const { data: firmada } = await supabase.storage.from('fiscal-documents').createSignedUrl(ruta, 120);
  return firmada?.signedUrl ?? null;
}

// ── Comprobantes ──────────────────────────────────────────────────────────

export interface MovimientoEntrada {
  cuenta: string;
  tercero_nit?: string;
  tercero_nombre?: string;
  documento?: string;
  detalle?: string;
  debito: number;
  credito: number;
  base?: number;
  centro_costo?: string;
}

export interface Comprobante {
  id: string;
  tipo: string;
  numero: number;
  fecha: string;
  descripcion: string | null;
  origen: string;
  origen_ref: string | null;
  total: number;
  anulado: boolean;
}

export interface Movimiento extends MovimientoEntrada {
  id: number;
  comprobante_id: string;
  fecha: string;
}

export const TIPOS_COMPROBANTE: Array<{ id: string; nombre: string }> = [
  { id: 'CC', nombre: 'Causación' },
  { id: 'RC', nombre: 'Recibo de caja' },
  { id: 'CE', nombre: 'Comprobante de egreso' },
  { id: 'NC', nombre: 'Nota contable' },
  { id: 'SI', nombre: 'Saldos iniciales' },
  { id: 'VP', nombre: 'Ventas Codec POS' },
];

export async function listarComprobantes(empresaId: string, desde: string, hasta: string): Promise<Comprobante[]> {
  const { data, error } = await supabase
    .from('cont_comprobantes')
    .select('id,tipo,numero,fecha,descripcion,origen,origen_ref,total,anulado')
    .eq('empresa_id', empresaId)
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha', { ascending: false })
    .order('numero', { ascending: false })
    .limit(2000);
  if (error) throw new Error(error.message);
  return (data ?? []) as Comprobante[];
}

export async function movimientosDe(comprobanteIds: string[]): Promise<Movimiento[]> {
  const todos: Movimiento[] = [];
  for (let i = 0; i < comprobanteIds.length; i += 150) {
    const { data, error } = await supabase.from('cont_movimientos').select('*')
      .in('comprobante_id', comprobanteIds.slice(i, i + 150)).order('id');
    if (error) throw new Error(error.message);
    todos.push(...((data ?? []) as Movimiento[]));
  }
  return todos;
}

/** Movimientos de un periodo (libro diario, auxiliares). Filtro opcional por
 *  prefijo de cuenta o por tercero. */
export async function movimientosPeriodo(
  empresaId: string, desde: string, hasta: string, filtro: { cuenta?: string; tercero?: string } = {},
): Promise<Movimiento[]> {
  const todos: Movimiento[] = [];
  for (let desdeFila = 0; ; desdeFila += 1000) {
    let q = supabase.from('cont_movimientos').select('*').eq('empresa_id', empresaId)
      .gte('fecha', desde).lte('fecha', hasta);
    if (filtro.cuenta) q = q.like('cuenta', `${filtro.cuenta}%`);
    if (filtro.tercero) q = q.eq('tercero_nit', filtro.tercero);
    const { data, error } = await q.order('fecha').order('id').range(desdeFila, desdeFila + 999);
    if (error) throw new Error(error.message);
    todos.push(...((data ?? []) as Movimiento[]));
    if (!data || data.length < 1000) break;
  }
  return todos;
}

export async function guardarComprobante(args: {
  empresaId: string; tipo: string; fecha: string; descripcion: string; movimientos: MovimientoEntrada[];
  origen?: 'manual' | 'xml' | 'pos' | 'saldos'; origenRef?: string; id?: string;
}): Promise<{ id: string; numero: number; duplicado: boolean }> {
  const { data, error } = await supabase.rpc('cont_guardar_comprobante', {
    p_empresa: args.empresaId,
    p_tipo: args.tipo,
    p_fecha: args.fecha,
    p_descripcion: args.descripcion,
    p_movimientos: args.movimientos,
    p_origen: args.origen ?? 'manual',
    p_origen_ref: args.origenRef ?? null,
    p_id: args.id ?? null,
  });
  if (error) throw new Error(error.message);
  return data as { id: string; numero: number; duplicado: boolean };
}

export async function anularComprobante(id: string): Promise<void> {
  const { error } = await supabase.rpc('cont_anular_comprobante', { p_id: id });
  if (error) throw new Error(error.message);
}

/** Pasa la causación de los XML a la contabilidad de la empresa: un
 *  comprobante CC por documento. Idempotente: el XML ya contabilizado se
 *  salta solo (lo resuelve la base por origen_ref). */
export async function contabilizarCausacion(
  empresaId: string,
  r: ResultadoCausacion,
  alAvanzar?: (hechos: number, total: number) => void,
): Promise<{ nuevos: number; repetidos: number; errores: string[] }> {
  const porDoc = new Map<string, ResultadoCausacion['movimientos']>();
  for (const m of r.movimientos) {
    const l = porDoc.get(m.documentoId) ?? [];
    l.push(m);
    porDoc.set(m.documentoId, l);
  }
  let nuevos = 0;
  let repetidos = 0;
  const errores: string[] = [];
  let hechos = 0;
  for (const [docId, movs] of porDoc) {
    try {
      const res = await guardarComprobante({
        empresaId,
        tipo: 'CC',
        fecha: movs[0].fecha,
        descripcion: `${movs[0].documento} ${movs[0].terceroNombre}`.trim(),
        origen: 'xml',
        origenRef: docId,
        movimientos: movs.map((m) => ({
          cuenta: m.cuenta,
          tercero_nit: m.terceroNit,
          tercero_nombre: m.terceroNombre,
          documento: m.documento,
          detalle: m.detalle,
          debito: m.debito,
          credito: m.credito,
          base: m.base,
          centro_costo: m.centroCosto,
        })),
      });
      if (res.duplicado) repetidos++; else nuevos++;
    } catch (e) {
      errores.push(`${movs[0].documento}: ${e instanceof Error ? e.message : 'error'}`);
    }
    hechos++;
    alAvanzar?.(hechos, porDoc.size);
  }
  return { nuevos, repetidos, errores };
}

// ── Plan de cuentas de la empresa ─────────────────────────────────────────

export async function cuentasPropias(empresaId: string): Promise<CuentaPropia[]> {
  const { data, error } = await supabase.from('cont_cuentas').select('codigo,nombre,naturaleza,activa').eq('empresa_id', empresaId);
  if (error) throw new Error(error.message);
  return (data ?? []) as CuentaPropia[];
}

export async function guardarCuenta(empresaId: string, c: CuentaPropia): Promise<void> {
  const { error } = await supabase.from('cont_cuentas').upsert({
    empresa_id: empresaId, codigo: c.codigo, nombre: c.nombre.trim(), naturaleza: c.naturaleza, activa: c.activa,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'empresa_id,codigo' });
  if (error) throw new Error(error.message);
}

// ── Saldos ────────────────────────────────────────────────────────────────

export async function saldos(empresaId: string, desde: string, hasta: string, porTercero = false): Promise<FilaSaldo[]> {
  const { data, error } = await supabase.rpc('cont_saldos', {
    p_empresa: empresaId, p_desde: desde, p_hasta: hasta, p_por_tercero: porTercero,
  });
  if (error) throw new Error(error.message);
  return ((data ?? []) as FilaSaldo[]).map((s) => ({
    ...s, anterior: Number(s.anterior), debitos: Number(s.debitos), creditos: Number(s.creditos),
  }));
}

// ── Archivos por empresa ──────────────────────────────────────────────────

export interface ArchivoEmpresa {
  id: string;
  carpeta: string;
  periodo: string | null;
  nombre: string;
  storage_path: string;
  tamano: number | null;
  tipo_mime: string | null;
  created_at: string;
}

export async function listarArchivos(empresaId: string): Promise<ArchivoEmpresa[]> {
  const { data, error } = await supabase.from('cont_archivos')
    .select('id,carpeta,periodo,nombre,storage_path,tamano,tipo_mime,created_at')
    .eq('empresa_id', empresaId).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ArchivoEmpresa[];
}

export async function subirArchivo(empresaId: string, archivo: File, carpeta: string, periodo: string | null): Promise<void> {
  const { data: sesion } = await supabase.auth.getUser();
  const uid = sesion.user?.id;
  if (!uid) throw new Error('Inicia sesión para subir archivos');
  if (archivo.size > 25 * 1024 * 1024) throw new Error(`${archivo.name} pesa más de 25 MB`);
  const limpio = archivo.name.replace(/[^\w.\- ]+/g, '_').slice(-120);
  const ruta = `${uid}/contabilidad/${empresaId}/${crypto.randomUUID()}-${limpio}`;
  const subida = await supabase.storage.from('fiscal-documents').upload(ruta, archivo, {
    contentType: archivo.type || 'application/octet-stream', upsert: false,
  });
  if (subida.error) throw new Error(subida.error.message);
  const { error } = await supabase.from('cont_archivos').insert({
    empresa_id: empresaId, carpeta, periodo, nombre: archivo.name, storage_path: ruta,
    tamano: archivo.size, tipo_mime: archivo.type || null,
  });
  if (error) {
    await supabase.storage.from('fiscal-documents').remove([ruta]);
    throw new Error(error.message);
  }
}

export async function urlArchivo(a: ArchivoEmpresa): Promise<string> {
  const { data, error } = await supabase.storage.from('fiscal-documents').createSignedUrl(a.storage_path, 120);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? 'No pude abrir el archivo');
  return data.signedUrl;
}

export async function borrarArchivo(a: ArchivoEmpresa): Promise<void> {
  const { error } = await supabase.from('cont_archivos').delete().eq('id', a.id);
  if (error) throw new Error(error.message);
  await supabase.storage.from('fiscal-documents').remove([a.storage_path]);
}

/** Cómo quedaron repartidos por empresa los XML que llegaron hoy y no se han
 *  visto. Lo usa Documentos DIAN para avisar al terminar una importación. */
export async function repartoDeHoy(): Promise<Array<{ empresa: string; cantidad: number }>> {
  const hoy = new Date();
  const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  const { data, error } = await supabase
    .from('cont_avisos')
    .select('cantidad, fiscal_entities(razon_social, nombre_comercial)')
    .eq('tipo', 'xml_nuevos')
    .eq('leido', false)
    .gte('fecha', fecha)
    .order('cantidad', { ascending: false });
  if (error) return [];
  return ((data ?? []) as unknown as Array<{ cantidad: number; fiscal_entities: { razon_social: string; nombre_comercial: string | null } | null }>)
    .map((a) => ({ empresa: a.fiscal_entities?.nombre_comercial || a.fiscal_entities?.razon_social || 'Empresa', cantidad: a.cantidad }));
}

// ── Codec POS ─────────────────────────────────────────────────────────────

export interface VinculoPos {
  id: string;
  estado: 'pendiente' | 'activo' | 'revocado';
  codigo: string | null;
  codigo_vence: string | null;
  nombre_negocio: string | null;
  vinculado_at: string | null;
  ultimo_envio_at: string | null;
  eventos_recibidos: number;
  updated_at?: string;
}

export async function vinculoPos(empresaId: string): Promise<VinculoPos | null> {
  const { data, error } = await supabase.from('cont_pos_vinculos')
    .select('id,estado,codigo,codigo_vence,nombre_negocio,vinculado_at,ultimo_envio_at,eventos_recibidos')
    .eq('empresa_id', empresaId).neq('estado', 'revocado').limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data as VinculoPos | null;
}

/** La última conexión que se cortó, para decirle al contador que tiene que
 *  reconectar (el negocio no se entera solo de que se desconectó). */
export async function conexionPosAnterior(empresaId: string): Promise<VinculoPos | null> {
  const { data, error } = await supabase.from('cont_pos_vinculos')
    .select('id,estado,codigo,codigo_vence,nombre_negocio,vinculado_at,ultimo_envio_at,eventos_recibidos,updated_at')
    .eq('empresa_id', empresaId).eq('estado', 'revocado').not('vinculado_at', 'is', null)
    .order('updated_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data as VinculoPos | null;
}

export async function generarCodigoPos(empresaId: string): Promise<{ codigo: string; vence: string }> {
  const { data, error } = await supabase.rpc('cont_pos_generar_codigo', { p_empresa: empresaId });
  if (error) throw new Error(error.message);
  return data as { codigo: string; vence: string };
}

export async function desconectarPos(empresaId: string): Promise<void> {
  const { error } = await supabase.rpc('cont_pos_desconectar', { p_empresa: empresaId });
  if (error) throw new Error(error.message);
}

export interface VentaPos {
  id: string;
  id_origen: string;
  numero: string | null;
  fecha: string;
  total: number;
  subtotal: number;
  iva: number;
  descuento: number;
  propina: number;
  medio_pago: string | null;
  cajero: string | null;
  tienda: string | null;
  factura_cufe: string | null;
  items: Array<{ nombre: string | null; cantidad: number; precio_unitario: number; subtotal: number; iva_pct: number }>;
  anulada: boolean;
  comprobante_id: string | null;
}

export async function ventasPos(empresaId: string, desde: string, hasta: string): Promise<VentaPos[]> {
  const todas: VentaPos[] = [];
  for (let d = 0; ; d += 1000) {
    const { data, error } = await supabase.from('pos_ventas')
      .select('id,id_origen,numero,fecha,total,subtotal,iva,descuento,propina,medio_pago,cajero,tienda,factura_cufe,items,anulada,comprobante_id')
      .eq('empresa_id', empresaId)
      .gte('fecha', `${desde}T00:00:00-05:00`).lte('fecha', `${hasta}T23:59:59-05:00`)
      .order('fecha', { ascending: false }).range(d, d + 999);
    if (error) throw new Error(error.message);
    todas.push(...((data ?? []) as VentaPos[]));
    if (!data || data.length < 1000) break;
  }
  return todas;
}

export async function contabilizarDiaPos(empresaId: string, fecha: string): Promise<{ numero?: number; ventas: number; devoluciones?: number }> {
  const { data, error } = await supabase.rpc('pos_contabilizar_dia', { p_empresa: empresaId, p_fecha: fecha });
  if (error) throw new Error(error.message);
  return data as { numero?: number; ventas: number; devoluciones?: number };
}

export interface GastoPos {
  id: string;
  fecha: string;
  concepto: string | null;
  categoria: string | null;
  valor: number;
  iva: number;
  medio_pago: string | null;
  proveedor_nombre: string | null;
  proveedor_nit: string | null;
  numero_soporte: string | null;
  cajero: string | null;
  tienda: string | null;
  anulado: boolean;
  comprobante_id: string | null;
}

export interface DevolucionPos {
  id: string;
  venta_id_origen: string | null;
  fecha: string;
  total: number;
  iva: number;
  medio_pago: string | null;
  motivo: string | null;
  nota_credito_cufe: string | null;
  items: Array<{ nombre: string | null; cantidad: number }>;
  anulada: boolean;
  comprobante_id: string | null;
}

export interface CierrePos {
  id: string;
  apertura: string | null;
  cierre: string;
  cajero: string | null;
  tienda: string | null;
  caja: string | null;
  base_inicial: number;
  ventas_total: number;
  ventas_por_medio: Record<string, number>;
  gastos_efectivo: number;
  efectivo_esperado: number;
  efectivo_contado: number;
  diferencia: number;
  num_ventas: number;
  observaciones: string | null;
}

/** Lee todo el mes de una tabla de Codec POS, de a 1000 filas. */
async function delMes<T>(tabla: string, columnas: string, campoFecha: string, empresaId: string, desde: string, hasta: string): Promise<T[]> {
  const todas: T[] = [];
  for (let d = 0; ; d += 1000) {
    const { data, error } = await supabase.from(tabla).select(columnas)
      .eq('empresa_id', empresaId)
      .gte(campoFecha, `${desde}T00:00:00-05:00`).lte(campoFecha, `${hasta}T23:59:59-05:00`)
      .order(campoFecha, { ascending: false }).range(d, d + 999);
    if (error) throw new Error(error.message);
    todas.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return todas;
}

export const gastosPos = (empresaId: string, desde: string, hasta: string) => delMes<GastoPos>('pos_gastos',
  'id,fecha,concepto,categoria,valor,iva,medio_pago,proveedor_nombre,proveedor_nit,numero_soporte,cajero,tienda,anulado,comprobante_id',
  'fecha', empresaId, desde, hasta);

export const devolucionesPos = (empresaId: string, desde: string, hasta: string) => delMes<DevolucionPos>('pos_devoluciones',
  'id,venta_id_origen,fecha,total,iva,medio_pago,motivo,nota_credito_cufe,items,anulada,comprobante_id',
  'fecha', empresaId, desde, hasta);

export const cierresPos = (empresaId: string, desde: string, hasta: string) => delMes<CierrePos>('pos_cierres_caja',
  'id,apertura,cierre,cajero,tienda,caja,base_inicial,ventas_total,ventas_por_medio,gastos_efectivo,efectivo_esperado,efectivo_contado,diferencia,num_ventas,observaciones',
  'cierre', empresaId, desde, hasta);

export async function contabilizarGastosDiaPos(empresaId: string, fecha: string): Promise<{ numero?: number; gastos: number }> {
  const { data, error } = await supabase.rpc('pos_contabilizar_gastos_dia', { p_empresa: empresaId, p_fecha: fecha });
  if (error) throw new Error(error.message);
  return data as { numero?: number; gastos: number };
}

/** Las facturas electrónicas que mandó Codec POS esperan en la bandeja (la
 *  misma del correo). Se leen con el mismo motor que todo lo demás, sin que
 *  el contador tenga que hacer nada: basta con abrir Contabilidad. */
export async function facturasPosPendientes(): Promise<number> {
  const { count } = await supabase.from('ed_inbox_files').select('id', { count: 'exact', head: true })
    .eq('status', 'PENDING').eq('origen', 'pos');
  return count ?? 0;
}
