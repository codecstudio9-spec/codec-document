// Fase 2 del modulo empresarial — API publica de CodecDocument
// (/api/v1 en la especificacion; implementada como Edge Function porque
// este proyecto no tiene un backend Node propio, todo pasa por
// Supabase — mismo patron que paypal-verify/index.ts).
//
// Autenticacion: header "Authorization: Bearer cd_live_xxxxxxxxx"
// (API Key generada desde /my-company, ver
// supabase_add_api_keys_migration.sql). NUNCA un JWT de usuario — las
// API keys son un mecanismo de autenticacion completamente aparte,
// pensado para que un sistema externo llame a esto sin una sesion de
// navegador.
//
// Alcance de esta fase: los documentos "de la empresa" son los del
// usuario OWNER del workspace (Fase 1 no cambio la visibilidad de
// documents/signatures entre miembros a proposito, para no tocar RLS
// existente sin una revision dedicada) — cuando esa fase se construya,
// esto se ampliara a todos los documentos de company_members.
//
// Deploy:
//   supabase functions deploy api-v1

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// deno-lint-ignore no-explicit-any
async function authenticate(req: Request, admin: any): Promise<{ companyId: string; ownerUserId: string } | null> {
  const authHeader = req.headers.get('Authorization') ?? '';
  const rawKey = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!rawKey.startsWith('cd_live_')) return null;

  const keyHash = await sha256Hex(rawKey);
  const { data: keyRow } = await admin
    .from('api_keys')
    .select('company_id, revoked_at')
    .eq('key_hash', keyHash)
    .maybeSingle();
  if (!keyRow || keyRow.revoked_at) return null;

  const { data: company } = await admin
    .from('companies')
    .select('owner_user_id')
    .eq('id', keyRow.company_id)
    .maybeSingle();
  if (!company) return null;

  return { companyId: keyRow.company_id, ownerUserId: company.owner_user_id };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(origin) });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const auth = await authenticate(req, admin);
  if (!auth) {
    return json({ error: 'Invalid or revoked API key' }, 401, origin);
  }
  const { companyId, ownerUserId } = auth;

  const url = new URL(req.url);
  // Strip the function's own base path so routing works the same
  // whether it's called as /api-v1/documents or /functions/v1/api-v1/documents.
  const path = url.pathname.replace(/^.*\/api-v1/, '') || '/';
  const parts = path.split('/').filter(Boolean); // e.g. ['documents', '<id>']

  try {
    // ── /company ──────────────────────────────────────────────────────
    if (parts[0] === 'company' && parts.length === 1 && req.method === 'GET') {
      const { data, error } = await admin.from('companies').select('id, name, domain, logo_url, subscription_plan, created_at').eq('id', companyId).maybeSingle();
      if (error) return json({ error: error.message }, 500, origin);
      return json({ data }, 200, origin);
    }

    // ── /users ────────────────────────────────────────────────────────
    if (parts[0] === 'users' && parts.length === 1 && req.method === 'GET') {
      const { data, error } = await admin
        .from('company_members')
        .select('user_id, role, joined_at')
        .eq('company_id', companyId);
      if (error) return json({ error: error.message }, 500, origin);
      const withEmails = await Promise.all((data ?? []).map(async (m: { user_id: string; role: string; joined_at: string }) => {
        const { data: u } = await admin.auth.admin.getUserById(m.user_id);
        return { user_id: m.user_id, email: u?.user?.email ?? null, role: m.role, joined_at: m.joined_at };
      }));
      return json({ data: withEmails }, 200, origin);
    }

    // ── /documents ────────────────────────────────────────────────────
    if (parts[0] === 'documents' && parts.length === 1 && req.method === 'GET') {
      const { data, error } = await admin
        .from('documents')
        .select('id, name, status, original_pdf_url, signed_pdf_url, created_at')
        .eq('user_id', ownerUserId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) return json({ error: error.message }, 500, origin);
      return json({ data }, 200, origin);
    }

    if (parts[0] === 'documents' && parts.length === 1 && req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const name = String(body?.name ?? '').trim();
      if (!name) return json({ error: 'name is required' }, 400, origin);
      const { data, error } = await admin
        .from('documents')
        .insert({ name, status: 'pending', user_id: ownerUserId })
        .select('id, name, status, created_at')
        .single();
      if (error) return json({ error: error.message }, 500, origin);
      return json({ data }, 201, origin);
    }

    if (parts[0] === 'documents' && parts.length === 2 && req.method === 'GET') {
      const { data, error } = await admin
        .from('documents')
        .select('id, name, status, original_pdf_url, signed_pdf_url, created_at')
        .eq('id', parts[1]).eq('user_id', ownerUserId).maybeSingle();
      if (error) return json({ error: error.message }, 500, origin);
      if (!data) return json({ error: 'Document not found' }, 404, origin);
      return json({ data }, 200, origin);
    }

    if (parts[0] === 'documents' && parts.length === 2 && req.method === 'DELETE') {
      const { error } = await admin.from('documents').delete().eq('id', parts[1]).eq('user_id', ownerUserId);
      if (error) return json({ error: error.message }, 500, origin);
      return json({ data: { deleted: true } }, 200, origin);
    }

    // ── /signatures ───────────────────────────────────────────────────
    if (parts[0] === 'signatures' && parts.length === 1 && req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const documentId = String(body?.document_id ?? '');
      const name = String(body?.name ?? '').trim();
      const email = String(body?.email ?? '').trim();
      if (!documentId || !name || !email) {
        return json({ error: 'document_id, name and email are required' }, 400, origin);
      }
      const { data: doc } = await admin.from('documents').select('id').eq('id', documentId).eq('user_id', ownerUserId).maybeSingle();
      if (!doc) return json({ error: 'Document not found' }, 404, origin);

      const { data, error } = await admin
        .from('signers')
        .insert({ document_id: documentId, name, email, status: 'pending' })
        .select('id, document_id, name, email, status, created_at')
        .single();
      if (error) return json({ error: error.message }, 500, origin);
      return json({ data }, 201, origin);
    }

    if (parts[0] === 'signatures' && parts.length === 2 && req.method === 'GET') {
      const { data, error } = await admin
        .from('signers')
        .select('id, document_id, name, email, status, created_at')
        .eq('id', parts[1])
        .maybeSingle();
      if (error) return json({ error: error.message }, 500, origin);
      if (!data) return json({ error: 'Signature request not found' }, 404, origin);
      // Only expose signers for documents owned by this API key's company.
      const { data: doc } = await admin.from('documents').select('id').eq('id', data.document_id).eq('user_id', ownerUserId).maybeSingle();
      if (!doc) return json({ error: 'Signature request not found' }, 404, origin);
      return json({ data }, 200, origin);
    }

    return json({ error: 'Not found', path }, 404, origin);
  } catch (err) {
    console.error('api-v1 error:', err);
    return json({ error: err instanceof Error ? err.message : 'Internal error' }, 500, origin);
  }
});
