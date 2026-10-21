// Codec POS → Contabilidad: el negocio deja de compartir sus ventas.
//
// Deploy: supabase functions deploy pos-desvincular --no-verify-jwt --workdir "<carpeta>"

import { createClient } from 'jsr:@supabase/supabase-js@2';

const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function sha256Hex(texto: string): Promise<string> {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'metodo_no_permitido' }, 405);
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token.startsWith('cdp_')) return json({ error: 'token_invalido' }, 401);
  const { data } = await admin.from('cont_pos_vinculos')
    .update({ estado: 'revocado', updated_at: new Date().toISOString() })
    .eq('token_hash', await sha256Hex(token)).neq('estado', 'revocado').select('id');
  return json({ ok: true, desconectadas: data?.length ?? 0 });
});
