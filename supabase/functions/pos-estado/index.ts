// Codec POS → Contabilidad: ¿sigue viva la conexión?
//
// Codec POS lo llama con su token al abrir «Mi contador» (y antes de pedir un
// código nuevo). Sin esto, si el contador desconectaba la empresa, el negocio
// seguía viendo «Conectado» hasta su siguiente venta, y no podía pegar el
// código nuevo porque su pantalla creía que ya estaba conectado.
//
// Deploy (SIN JWT: el token es propio):
//   supabase functions deploy pos-estado --no-verify-jwt --workdir "<carpeta>"

import { createClient } from 'jsr:@supabase/supabase-js@2';

const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function sha256Hex(texto: string): Promise<string> {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') return json({ error: 'metodo_no_permitido' }, 405);
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token.startsWith('cdp_')) return json({ error: 'token_invalido' }, 401);

  const { data } = await admin.from('cont_pos_vinculos')
    .select('estado, vinculado_at, ultimo_envio_at, eventos_recibidos, empresa:fiscal_entities(nit, nombre_comercial, razon_social)')
    .eq('token_hash', await sha256Hex(token)).limit(1);
  const v = data?.[0] as {
    estado: string; vinculado_at: string | null; ultimo_envio_at: string | null; eventos_recibidos: number;
    empresa: { nit: string; nombre_comercial: string | null; razon_social: string } | null;
  } | undefined;
  if (!v) return json({ error: 'token_invalido' }, 401);
  if (v.estado !== 'activo') return json({ estado: 'revocado', error: 'conexion_revocada' }, 401);

  return json({
    estado: 'activo',
    empresa: v.empresa?.nombre_comercial || v.empresa?.razon_social || null,
    nit: v.empresa?.nit ?? null,
    vinculado_at: v.vinculado_at,
    ultimo_envio_at: v.ultimo_envio_at,
    eventos_recibidos: v.eventos_recibidos,
  });
});
