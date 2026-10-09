// Sends "you have a document to sign" emails through Resend, from
// notificaciones@codecdocument.com, on behalf of a logged-in user.
//
// Two kinds of signing link exist in this product, and both go through here:
//   · { transactionId, recipientEmail }  → /sign/:id (Word templates,
//     sign_transactions). The caller must be the transaction's creator.
//   · { signingToken, require }          → /guest-sign/:token (PDF signing
//     flow, signing_links + signers). The caller must own the document, and
//     the email goes to the signer's STORED address — never to one the
//     client passes in.
// The link is always built here from ids that were checked against the
// caller, never taken from the request, so this can't be used to mail an
// arbitrary URL from our domain.
//
// Requires a verified codecdocument.com domain in Resend (DKIM/SPF records
// in Hostinger DNS). Until then Resend answers 403 and the caller gets a
// clear error instead of a silent no-op.
//
// Deploy (verify_jwt = true in config.toml):
//   supabase functions deploy send-signing-invitation --workdir "<carpeta>" --yes

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SITE_URL = 'https://www.codecdocument.com';
const FROM_ADDRESS = 'Codec Document <notificaciones@codecdocument.com>';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

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

function oneLine(value: string, max = 150): string {
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, max);
}

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function invitationHtml(p: { signerName: string; senderName: string; documentName: string; url: string; expiresNote: string }) {
  const greeting = p.signerName ? `Hola ${escapeHtml(p.signerName)},` : 'Hola,';
  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <div style="background:linear-gradient(90deg,#2563eb,#7c3aed,#0891b2);height:4px;border-radius:4px;margin-bottom:20px"></div>
      <h2 style="color:#0f172a;margin:0 0 12px">Documento pendiente de firma</h2>
      <p style="color:#475569;line-height:1.6;margin:0 0 8px">${greeting}</p>
      <p style="color:#475569;line-height:1.6;margin:0">
        <strong>${escapeHtml(p.senderName)}</strong> te envió <strong>${escapeHtml(p.documentName)}</strong>
        para que lo revises y lo firmes electrónicamente.
      </p>
      <a href="${p.url}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#4338ca;color:#fff;text-decoration:none;border-radius:12px;font-weight:bold">Revisar y firmar</a>
      <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin-top:20px">${p.expiresNote}Si el botón no funciona, copia este enlace en tu navegador:<br><span style="word-break:break-all">${p.url}</span></p>
      <p style="margin-top:28px;font-size:12px;color:#94a3b8">Codec Document — codecdocument.com</p>
    </div>
  `;
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
    if (!accessToken) throw new HttpError(401, 'Authentication required');

    const userClient = createClient(SUPABASE_URL, ANON_KEY);
    const { data: authData, error: authError } = await userClient.auth.getUser(accessToken);
    if (authError || !authData.user) throw new HttpError(401, 'Invalid session');
    const user = authData.user;
    const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string };
    const senderName = oneLine(meta.full_name || meta.name || user.email || 'Codec Document', 80);

    const body = await req.json() as {
      transactionId?: string;
      recipientEmail?: string;
      signingToken?: string;
      require?: { idPhoto?: boolean; selfie?: boolean; biometric?: boolean };
    };

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    let to = '';
    let signerName = '';
    let documentName = '';
    let url = '';
    let expiresNote = '';

    if (body.signingToken) {
      // ── PDF flow: /guest-sign/:token ───────────────────────────────────
      const token = body.signingToken.trim();
      if (!UUID_RE.test(token)) throw new HttpError(400, 'Invalid signing token');

      const { data: link, error: linkError } = await admin
        .from('signing_links')
        .select('document_id, signer_id, expires_at')
        .eq('token', token)
        .maybeSingle();
      if (linkError) throw linkError;
      if (!link) throw new HttpError(404, 'Enlace de firma no encontrado');
      if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
        throw new HttpError(409, 'Este enlace de firma ya venció. Genera uno nuevo.');
      }

      const { data: doc, error: docError } = await admin
        .from('documents')
        .select('id, name, user_id')
        .eq('id', link.document_id)
        .maybeSingle();
      if (docError) throw docError;
      if (!doc || doc.user_id !== user.id) throw new HttpError(404, 'Documento no encontrado o no tienes permiso para enviarlo');

      const { data: signer, error: signerError } = await admin
        .from('signers')
        .select('name, email, status')
        .eq('id', link.signer_id)
        .maybeSingle();
      if (signerError) throw signerError;
      if (!signer) throw new HttpError(404, 'Firmante no encontrado');
      if (signer.status === 'signed' || signer.status === 'completed') throw new HttpError(409, 'Esta persona ya firmó el documento');

      to = (signer.email ?? '').trim().toLowerCase();
      signerName = oneLine(signer.name ?? '', 80);
      documentName = oneLine((doc.name ?? 'Documento').replace(/\.pdf$/i, ''));

      const qp = new URLSearchParams();
      if (body.require?.idPhoto) qp.set('req_id', '1');
      if (body.require?.selfie) qp.set('req_selfie', '1');
      if (body.require?.biometric) qp.set('req_bio', '1');
      const qs = qp.toString();
      url = `${SITE_URL}/guest-sign/${token}${qs ? `?${qs}` : ''}`;
      expiresNote = 'Este enlace es personal y vence en 48 horas. ';
    } else {
      // ── Word-template flow: /sign/:transactionId ───────────────────────
      const transactionId = body.transactionId?.trim() ?? '';
      to = body.recipientEmail?.trim().toLowerCase() ?? '';
      if (!UUID_RE.test(transactionId)) throw new HttpError(400, 'Invalid transaction id');

      const { data: transaction, error: transactionError } = await admin
        .from('sign_transactions')
        .select('id, creator_id, document_type, document_data, status')
        .eq('id', transactionId)
        .eq('creator_id', user.id)
        .maybeSingle();
      if (transactionError) throw transactionError;
      if (!transaction) throw new HttpError(404, 'Documento no encontrado o no tienes permiso para enviarlo');
      if (['completed', 'cancelled', 'canceled'].includes(transaction.status)) {
        throw new HttpError(409, 'Este documento ya no está pendiente de firma');
      }

      documentName = transaction.document_type.replace(/-/g, ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase());
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
      documentName = oneLine(documentName);

      if (EMAIL_RE.test(to)) {
        const { error: updateError } = await admin
          .from('sign_transactions')
          .update({ recipient_email: to })
          .eq('id', transaction.id);
        if (updateError) throw updateError;
      }
      url = `${SITE_URL}/sign/${transaction.id}`;
    }

    if (!EMAIL_RE.test(to)) throw new HttpError(400, 'Escribe un correo de destinatario válido');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to],
        // Replies go to the person who sent the document, not to a no-reply box.
        ...(user.email ? { reply_to: user.email } : {}),
        subject: `${senderName} te envió un documento para firmar: ${documentName}`,
        html: invitationHtml({ signerName, senderName, documentName, url, expiresNote }),
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error('[send-signing-invitation] Resend rejected the email:', response.status, detail);
      if (response.status === 403 && /not verified/i.test(detail)) {
        throw new HttpError(503, 'El correo de Codec Document aún no está activado (dominio sin verificar en Resend). Comparte el enlace por WhatsApp o cópialo mientras tanto.');
      }
      throw new Error(`Resend rechazó el correo (${response.status})`);
    }

    return new Response(JSON.stringify({ sent: true, to }), { headers: corsHeaders(origin) });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    if (status === 500) console.error('[send-signing-invitation] error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unexpected error' }), {
      status,
      headers: corsHeaders(origin),
    });
  }
});
