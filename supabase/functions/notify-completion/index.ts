// Supabase Edge Function — sends a "your document was signed" email to
// both the document creator and the guest signer (if they gave an email),
// once a sign_transactions row is completed. Matches the paypal-verify/
// webauthn pattern: Deno.serve, service-role client, secrets via Deno.env.
//
// Sends via Resend (https://resend.com) from a Codec Document address —
// NOT from the creator's own inbox. Sending literally "from
// duglas.taborda@universal.edu.co" would require that company's Google
// Workspace admin to grant Gmail API domain-wide delegation to us, which
// can only happen once a company is an actual paying customer — see
// [[project_enterprise_module]] / the plan doc for that phase.
//
// Deploy:
//   supabase functions deploy notify-completion --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes
// Secrets (supabase secrets set):
//   RESEND_API_KEY=<from resend.com dashboard, after verifying codecdocument.com>
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by the platform)
//
// Fire-and-forget by design: called from the client right after
// complete_sign_transaction succeeds (see sign-transaction-page.tsx). A
// failure here must never surface as an error to a signer whose signature
// was already saved successfully — the caller ignores this function's
// response.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
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

function humanizeDocType(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn('[notify-completion] RESEND_API_KEY not configured — skipping send to', to);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html }),
  });
  if (!res.ok) {
    console.error('[notify-completion] Resend send failed for', to, res.status, await res.text().catch(() => ''));
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  try {
    const { txId } = (await req.json()) as { txId?: string };
    if (!txId) {
      return new Response(JSON.stringify({ error: 'Missing txId' }), { status: 400, headers: corsHeaders(origin) });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: tx } = await admin
      .from('sign_transactions')
      .select('id, creator_id, document_type, document_data, recipient_email')
      .eq('id', txId)
      .maybeSingle();

    if (!tx) {
      return new Response(JSON.stringify({ error: 'Transaction not found' }), { status: 404, headers: corsHeaders(origin) });
    }

    // Custom docx templates carry their real name in document_data.templateId
    // (see docx-template-service.ts) rather than a templates.ts slug — look
    // it up so the email says the actual template name, not "custom-template".
    let documentName = humanizeDocType(tx.document_type);
    if (tx.document_type === 'custom-template') {
      const templateId = (tx.document_data as { templateId?: string } | null)?.templateId;
      if (templateId) {
        const { data: template } = await admin.from('templates').select('name').eq('id', templateId).maybeSingle();
        if (template?.name) documentName = template.name;
      }
    }

    const signerUrl = `${SITE_URL}/sign/${tx.id}`;
    const creatorUrl = `${SITE_URL}/my-documents`;

    const emailShell = (bodyHtml: string) => `
      <div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(90deg,#2563eb,#7c3aed,#0891b2); height: 4px; border-radius: 4px; margin-bottom: 20px;"></div>
        ${bodyHtml}
        <p style="margin-top: 32px; font-size: 12px; color: #94a3b8;">Codec Document — codecdocument.com</p>
      </div>
    `;

    const sends: Promise<void>[] = [];

    if (tx.recipient_email) {
      sends.push(sendEmail(
        tx.recipient_email,
        `Firmaste "${documentName}" — aquí está tu copia`,
        emailShell(`
          <h2 style="color:#0f172a;">Documento firmado con éxito</h2>
          <p style="color:#475569; line-height:1.6;">Firmaste <strong>${documentName}</strong>. Puedes ver y descargar tu copia en cualquier momento con el siguiente enlace.</p>
          <a href="${signerUrl}" style="display:inline-block; margin-top:16px; padding:12px 24px; background:#4338ca; color:#fff; text-decoration:none; border-radius:12px; font-weight:bold;">Ver mi documento</a>
        `),
      ));
    }

    if (tx.creator_id) {
      const { data: userData } = await admin.auth.admin.getUserById(tx.creator_id);
      const creatorEmail = userData?.user?.email;
      if (creatorEmail) {
        sends.push(sendEmail(
          creatorEmail,
          `"${documentName}" fue firmado`,
          emailShell(`
            <h2 style="color:#0f172a;">Tu documento fue firmado</h2>
            <p style="color:#475569; line-height:1.6;"><strong>${documentName}</strong> ya fue firmado y está listo en tu panel de documentos.</p>
            <a href="${creatorUrl}" style="display:inline-block; margin-top:16px; padding:12px 24px; background:#4338ca; color:#fff; text-decoration:none; border-radius:12px; font-weight:bold;">Ver mis documentos</a>
          `),
        ));
      }
    }

    await Promise.all(sends);

    return new Response(JSON.stringify({ sent: sends.length }), { headers: corsHeaders(origin) });
  } catch (err) {
    console.error('[notify-completion] error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message ?? 'Unexpected error' }), {
      status: 500,
      headers: corsHeaders(origin),
    });
  }
});
