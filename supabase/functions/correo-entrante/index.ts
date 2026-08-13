// Recibe los correos con facturas y deja los XML en la bandeja del contador.
//
// ── El recorrido que sustituye ─────────────────────────────────────────
//
// Hoy: abrir el correo, bajar el adjunto, buscarlo en el explorador, volver a
// la aplicación y arrastrarlo. Por cada proveedor, todos los meses.
// Con esto: el correo llega y los XML ya están dentro.
//
// ── Por qué aquí NO se procesa nada ────────────────────────────────────
//
// El motor (src/lib/dian/) es TypeScript puro y correría perfectamente en
// Deno. Aun así los documentos NO se procesan aquí: hacerlo dejaría dos
// implementaciones del mismo cálculo, y el día que se toque una y no la otra,
// el mismo documento daría dos cifras según por dónde entró. En contabilidad
// eso no es una molestia, es una declaración mal presentada.
//
// Esta función guarda y avisa. El motor sigue siendo uno.
//
// ── Firma ──────────────────────────────────────────────────────────────
//
// Resend firma con Svix. Sin verificarla, cualquiera que conozca la URL
// inyecta facturas falsas en la contabilidad de un cliente — que es
// exactamente el ataque que más daño hace en esta herramienta.
//
// ── Variables de entorno ───────────────────────────────────────────────
//   RESEND_API_KEY              para bajar los adjuntos
//   RESEND_INBOUND_SECRET       whsec_… del webhook (panel de Resend)
//   SUPABASE_SERVICE_ROLE_KEY
//
// Deploy (SIN JWT: quien llama es Resend):
//   supabase functions deploy correo-entrante --no-verify-jwt --workdir "<carpeta>"

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const INBOUND_SECRET = Deno.env.get('RESEND_INBOUND_SECRET') ?? '';

const BUCKET = 'fiscal-documents';

/** Un XML de la DIAN son decenas de KB; un ZIP de un mes, unos pocos MB. 25 MB
 *  es holgado y a la vez impide que un adjunto absurdo agote la memoria. */
const MAX_BYTES = 25 * 1024 * 1024;

/** Sólo lo que el motor sabe leer. Un PDF adjunto es la representación
 *  gráfica, no el documento: el que tiene validez legal es el XML. */
const EXTENSIONES = /\.(xml|zip)$/i;

// ── Firma Svix ────────────────────────────────────────────────────────────

function base64ABytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesABase64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function igualSeguro(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

/**
 * Verifica la firma Svix: HMAC-SHA256 sobre `id.timestamp.cuerpo`.
 *
 * La cabecera trae una LISTA de firmas separadas por espacios (`v1,xxx v1,yyy`)
 * porque durante una rotación de secreto conviven dos. Con quedarse sólo con
 * la primera, las entregas se caerían justo el día de la rotación.
 */
async function firmaValida(
  cuerpo: string,
  id: string,
  timestamp: string,
  cabecera: string,
  secreto: string,
): Promise<boolean> {
  const bruto = secreto.startsWith('whsec_') ? secreto.slice(6) : secreto;

  const key = await crypto.subtle.importKey(
    'raw', base64ABytes(bruto),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const mac = await crypto.subtle.sign(
    'HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${cuerpo}`),
  );
  const esperada = bytesABase64(new Uint8Array(mac));

  return cabecera
    .split(' ')
    .map((p) => p.split(',')[1] ?? '')
    .some((f) => f && igualSeguro(f, esperada));
}

/** Rechaza lo viejo. Sin esto, quien capture una entrega válida puede
 *  repetirla cuando quiera y la firma seguiría siendo correcta. */
function timestampFresco(timestamp: string, toleranciaSeg = 300): boolean {
  const t = Number(timestamp);
  if (!Number.isFinite(t)) return false;
  return Math.abs(Date.now() / 1000 - t) <= toleranciaSeg;
}

// ── Utilidades ────────────────────────────────────────────────────────────

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Saca el token de la dirección a la que escribieron.
 *  `f3a9c1…@facturas.codecdocument.com` → `f3a9c1…` */
function tokenDeDireccion(direccion: string): string {
  const limpia = direccion.includes('<')
    ? direccion.slice(direccion.indexOf('<') + 1, direccion.indexOf('>'))
    : direccion;
  return limpia.trim().toLowerCase().split('@')[0] ?? '';
}

/** Un nombre de archivo que llega de fuera no se usa como ruta. Sin esto,
 *  un adjunto llamado `../../otro/archivo.xml` escribiría donde no debe. */
function nombreSeguro(nombre: string): string {
  return (nombre || 'documento.xml')
    .replace(/[/\\]/g, '_')
    .replace(/\.\./g, '_')
    .replace(/[^\w.\-]/g, '_')
    .slice(0, 120);
}

interface AdjuntoResend {
  id: string;
  filename: string;
  size?: number;
  content_type?: string;
  download_url?: string;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Método no permitido', { status: 405 });

  if (!INBOUND_SECRET || !SERVICE_KEY || !RESEND_API_KEY) {
    console.error('correo-entrante sin configurar');
    return new Response('No configurado', { status: 503 });
  }

  // El cuerpo se lee como TEXTO y se firma sobre ese texto exacto. Volver a
  // serializar el JSON cambiaría un espacio y la firma dejaría de coincidir.
  const cuerpo = await req.text();
  const svixId = req.headers.get('svix-id') ?? '';
  const svixTs = req.headers.get('svix-timestamp') ?? '';
  const svixSig = req.headers.get('svix-signature') ?? '';

  if (!svixId || !svixTs || !svixSig) {
    return new Response('Sin firma', { status: 400 });
  }
  if (!timestampFresco(svixTs)) {
    return new Response('Entrega caducada', { status: 400 });
  }
  if (!(await firmaValida(cuerpo, svixId, svixTs, svixSig, INBOUND_SECRET))) {
    console.warn('correo-entrante: firma no coincide');
    return new Response('Firma inválida', { status: 401 });
  }

  let evento: Record<string, unknown>;
  try {
    evento = JSON.parse(cuerpo);
  } catch {
    return new Response('JSON inválido', { status: 400 });
  }

  if (evento.type !== 'email.received') {
    // 200 a lo que no interesa: devolver error haría que Resend lo reintente
    // eternamente sin que nada cambie nunca.
    return new Response('ok', { status: 200 });
  }

  const data = (evento.data ?? {}) as {
    email_id?: string; from?: string; to?: string[]; received_for?: string[];
    subject?: string; message_id?: string; attachments?: AdjuntoResend[];
  };

  const emailId = String(data.email_id ?? '');
  if (!emailId) return new Response('ok', { status: 200 });

  // `received_for` es la dirección real de entrega; `to` puede traer la del
  // buzón original cuando el correo llega reenviado, que es justo el caso
  // más común aquí.
  const destinos = [...(data.received_for ?? []), ...(data.to ?? [])];
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  let token = '';
  let owner: string | null = null;
  let motivo = 'desconocido';

  for (const d of destinos) {
    const t = tokenDeDireccion(d);
    if (!t) continue;
    const { data } = await admin.rpc('ed_email_destino', { p_token: t });
    const r = (data ?? {}) as { ok?: boolean; motivo?: string; owner?: string };
    if (r.ok) { token = t; owner = r.owner ?? null; break; }
    if (r.motivo) motivo = r.motivo;
  }

  if (!owner) {
    // Se distinguen los dos casos a proposito. Uno es alguien escribiendo a
    // una direccion inventada, que no requiere ninguna accion. El otro es un
    // cliente de verdad cuyo plan vencio, y a ese hay que llamarlo — si los
    // dos se registraran igual, el segundo se perderia entre el ruido.
    if (motivo === 'sin_plan') {
      console.warn('correo-entrante: plan vencido, correo declinado', destinos.join(','));
    } else {
      console.warn('correo-entrante: destino sin dueño', destinos.join(','));
    }
    // 200 en ambos casos: reintentar no crea una dirección ni renueva un plan.
    // Y no se pierde nada — el correo original sigue en el buzón del contador,
    // que es desde donde nos lo reenvió.
    return new Response('ok', { status: 200 });
  }

  // Los adjuntos NO vienen en el webhook, sólo sus metadatos. Hay que pedir la
  // lista para obtener una URL de descarga firmada (válida una hora).
  const resLista = await fetch(
    `https://api.resend.com/emails/receiving/${emailId}/attachments`,
    { headers: { Authorization: `Bearer ${RESEND_API_KEY}` } },
  );
  if (!resLista.ok) {
    console.error('correo-entrante: no se pudo listar adjuntos', resLista.status);
    // 500 para que Resend reintente: el correo existe y sus facturas también.
    return new Response('Error al listar adjuntos', { status: 500 });
  }
  const lista = await resLista.json() as { data?: AdjuntoResend[] };
  const adjuntos = (lista.data ?? []).filter((a) => EXTENSIONES.test(a.filename ?? ''));

  if (adjuntos.length === 0) {
    console.log('correo-entrante: correo sin XML ni ZIP', emailId);
    return new Response('ok', { status: 200 });
  }

  let guardados = 0;
  let repetidos = 0;

  for (const a of adjuntos) {
    if (!a.download_url) continue;
    try {
      const resArchivo = await fetch(a.download_url);
      if (!resArchivo.ok) {
        console.error('correo-entrante: fallo al bajar', a.filename, resArchivo.status);
        continue;
      }

      const bytes = new Uint8Array(await resArchivo.arrayBuffer());
      if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) {
        console.warn('correo-entrante: adjunto descartado por tamaño', a.filename, bytes.byteLength);
        continue;
      }

      const hash = await sha256Hex(bytes);
      const nombre = nombreSeguro(a.filename);
      // Bajo la carpeta del dueño: es lo que hace que las políticas del
      // bucket privado sigan valiendo para lo que entró por correo.
      const ruta = `${owner}/correo/${hash.slice(0, 16)}-${nombre}`;

      const { error: errSubida } = await admin.storage
        .from(BUCKET)
        .upload(ruta, bytes, {
          contentType: a.content_type || 'application/xml',
          upsert: true,
        });
      if (errSubida) {
        console.error('correo-entrante: fallo al guardar', nombre, errSubida.message);
        continue;
      }

      const { data: r } = await admin.rpc('ed_email_recibir', {
        p_token: token,
        p_from: data.from ?? null,
        p_subject: data.subject ?? null,
        p_message_id: data.message_id ?? null,
        p_filename: nombre,
        p_size: bytes.byteLength,
        p_content_type: a.content_type ?? null,
        p_storage_path: ruta,
        p_sha256: hash,
      });

      const motivo = (r as { motivo?: string } | null)?.motivo;
      if (motivo === 'repetido') repetidos++;
      else if (motivo === 'guardado') guardados++;
    } catch (e) {
      console.error('correo-entrante: error con', a.filename, (e as Error).message);
    }
  }

  console.log(
    `correo-entrante: ${emailId} → ${guardados} nuevos, ${repetidos} repetidos, de ${adjuntos.length} adjuntos`,
  );
  return new Response('ok', { status: 200 });
});
