import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SITE_URL = 'https://www.codecdocument.com';
const FROM_ADDRESS = 'Codec Document <notificaciones@codecdocument.com>';

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return value.replace(/[&<>"']/g, (character) => entities[character] ?? character);
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(origin) });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders(origin) });
  }

  try {
    if (!RESEND_API_KEY) throw new Error('El servicio de correo no tiene RESEND_API_KEY configurada');
    const authorization = req.headers.get('Authorization') ?? '';
    const accessToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: corsHeaders(origin) });
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY);
    const { data: authData, error: authError } = await userClient.auth.getUser(accessToken);
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: corsHeaders(origin) });
    }

    const body = await req.json() as { transactionId?: string; recipientEmail?: string };
    const transactionId = body.transactionId?.trim() ?? '';
    const recipientEmail = body.recipientEmail?.trim().toLowerCase() ?? '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(transactionId)) {
      return new Response(JSON.stringify({ error: 'Invalid transaction id' }), { status: 400, headers: corsHeaders(origin) });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipientEmail)) {
      return new Response(JSON.stringify({ error: 'Escribe un correo de destinatario válido' }), { status: 400, headers: corsHeaders(origin) });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: transaction, error: transactionError } = await admin
      .from('sign_transactions')
      .select('id, creator_id, document_type, document_data, status')
      .eq('id', transactionId)
      .eq('creator_id', authData.user.id)
      .maybeSingle();
    if (transactionError) throw transactionError;
    if (!transaction) {
      return new Response(JSON.stringify({ error: 'Documento no encontrado o no tienes permiso para enviarlo' }), {
        status: 404,
        headers: corsHeaders(origin),
      });
    }
    if (transaction.status === 'completed' || transaction.status === 'cancelled' || transaction.status === 'canceled') {
      return new Response(JSON.stringify({ error: 'Este documento ya no está pendiente de firma' }), {
        status: 409,
        headers: corsHeaders(origin),
      });
    }

    let documentName = transaction.document_type.replace(/-/g, ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase());
    if (transaction.document_type === 'custom-template') {
      const templateId = (transaction.document_data as { templateId?: string } | null)?.templateId;
      if (templateId) {
        const { data: template, error: templateError } = await admin
          .from('templates')
          .select('name')
          .eq('id', templateId)
          .maybeSingle();
        if (templateError) throw templateError;
        if (template?.name) documentName = template.name;
      }
    }

    const { error: updateError } = await admin
      .from('sign_transactions')
      .update({ recipient_email: recipientEmail })
      .eq('id', transaction.id);
    if (updateError) throw updateError;

    const signingUrl = `${SITE_URL}/sign/${transaction.id}`;
    const safeName = escapeHtml(documentName);
    const subjectName = documentName.replace(/[\r\n]/g, ' ').slice(0, 150);
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [recipientEmail],
        subject: `Tienes un documento para firmar: ${subjectName}`,
        html: `
          <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <div style="background:linear-gradient(90deg,#2563eb,#7c3aed,#0891b2);height:4px;border-radius:4px;margin-bottom:20px"></div>
            <h2 style="color:#0f172a">Documento pendiente de firma</h2>
            <p style="color:#475569;line-height:1.6">Te han enviado <strong>${safeName}</strong> para que lo revises y firmes de forma electrónica.</p>
            <a href="${signingUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#4338ca;color:#fff;text-decoration:none;border-radius:12px;font-weight:bold">Revisar y firmar</a>
            <p style="margin-top:32px;font-size:12px;color:#94a3b8">Codec Document — codecdocument.com</p>
          </div>
        `,
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error('[send-signing-invitation] Resend rejected the email:', response.status, detail);
      throw new Error(`Resend rechazó el correo (${response.status})`);
    }

    return new Response(JSON.stringify({ sent: true }), { headers: corsHeaders(origin) });
  } catch (error) {
    console.error('[send-signing-invitation] error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected error' }), {
      status: 500,
      headers: corsHeaders(origin),
    });
  }
});
