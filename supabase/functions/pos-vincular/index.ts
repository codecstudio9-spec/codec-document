// Codec POS → Contabilidad: el negocio pega el código que le dio su contador.
//
// Lo llama la nube de Codec POS (no un navegador), una sola vez por empresa.
// Si el código existe, no venció y el NIT del negocio es el de la empresa del
// contador, se activa la conexión y se devuelve un token que Codec POS debe
// guardar cifrado: aquí sólo queda su SHA-256, así que no se puede volver a
// mostrar.
//
// Deploy (SIN JWT: quien llama es Codec POS con su propio token):
//   supabase functions deploy pos-vincular --no-verify-jwt --workdir "<carpeta>"

import { createClient } from 'jsr:@supabase/supabase-js@2';

const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function sha256Hex(texto: string): Promise<string> {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function tokenNuevo(): string {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return 'cdp_' + btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const ESTADO: Record<string, number> = { codigo_invalido: 404, codigo_vencido: 410, nit_no_coincide: 409 };

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'metodo_no_permitido' }, 405);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: 'json_invalido' }, 400); }

  const codigo = String(body.codigo ?? '').trim().toUpperCase();
  const nit = String(body.nit ?? '').trim();
  if (!/^CD-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(codigo)) return json({ error: 'codigo_invalido' }, 404);
  if (!nit) return json({ error: 'nit_no_coincide' }, 409);

  const token = tokenNuevo();
  const { data, error } = await admin.rpc('pos_vincular', {
    p_codigo: codigo,
    p_nit: nit,
    p_nombre: String(body.nombre_negocio ?? '').slice(0, 200) || null,
    p_pos_cliente_id: String(body.pos_cliente_id ?? '').slice(0, 100) || null,
    p_token_hash: await sha256Hex(token),
  });
  if (error) {
    console.error('pos-vincular', error.message);
    return json({ error: 'error_interno' }, 500);
  }
  const r = data as { ok: boolean; error?: string; empresa?: string; contador?: string };
  if (!r.ok) return json({ error: r.error }, ESTADO[r.error ?? ''] ?? 400);
  return json({ token, empresa: r.empresa, contador: r.contador });
});
