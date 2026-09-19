// Supabase Edge Function — "Crear nuevo" en Mis Documentos: el usuario
// pega texto que generó en cualquier IA externa (ChatGPT, Claude, etc.) y
// esto lo reestructura en secciones con títulos, para que el cliente lo
// renderice como un documento con la marca de la empresa (logo,
// encabezado/pie — ver branding-service.ts) y opcionalmente lo pase al
// flujo de firma existente (electronic-signature-page.tsx).
//
// Un solo trabajo, deliberadamente acotado: reestructurar, NUNCA redactar
// contenido nuevo. El modelo no puede inventar ni alterar nombres, fechas,
// montos u obligaciones — solo puede limpiar redacción y partir el texto
// en secciones con encabezado. Igual que ai-fill-form, la respuesta se
// valida contra un esquema antes de devolverla; cualquier desviación se
// descarta con un error explícito en vez de dejar pasar algo a medio
// formar hacia un documento que alguien puede terminar firmando.
//
// Deploy:
//   supabase functions deploy ai-format-pasted-document --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes
// Secrets: reutiliza el OPENROUTER_API_KEY ya configurado para las demás
// funciones ai-*.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') ?? '';

const ADMIN_EMAILS = ['douglastabordasanchez@gmail.com'];
const AI_MODEL = 'openai/gpt-oss-120b';

const MAX_INPUT_CHARS = 20000;
const MAX_SECTIONS = 60;
const MAX_HEADING_CHARS = 140;
const MAX_BODY_CHARS = 8000;
const MAX_TITLE_CHARS = 160;

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

interface FormattedSection {
  heading: string | null;
  body: string;
}

function buildPrompt(text: string, language: 'en' | 'es'): string {
  const lang = language === 'en' ? 'English' : 'Spanish';
  return [
    `You are formatting a document for a business — the raw text below was drafted elsewhere (often by another AI tool) and pasted in as-is. Your ONLY job is to restructure it for a professional, print-ready look. You are NOT a lawyer or the author — never draft new content.`,
    ``,
    `Rules, all mandatory:`,
    `1. NEVER invent, remove, alter, or "correct" any fact — names, dates, amounts, percentages, deadlines, obligations, addresses. If something looks like a typo or seems odd, leave it exactly as written. Your job is structure and formatting, not editing content.`,
    `2. You MAY fix obvious grammar/spelling and improve sentence flow WITHOUT changing meaning, and you MAY split run-on text into clearer paragraphs.`,
    `3. Produce a short, accurate title in ${lang} that describes what the document is (e.g. "Contrato de Prestación de Servicios", "Acuerdo de Confidencialidad") — infer it from the content, don't invent a generic placeholder if the content makes it clear.`,
    `4. Split the body into logical sections. Give each section a short heading in ${lang} (a few words, Title Case) that describes what it covers — e.g. "Partes", "Objeto del Contrato", "Obligaciones", "Duración", "Firmas". If the input already has numbered clauses or clear headings, preserve that structure and just clean up wording.`,
    `5. Each section's "body" is plain text only — paragraphs separated by a single blank line, NO markdown, NO HTML tags, NO bullet characters unless they were already numbered/lettered items in the source.`,
    `6. Respond with ONLY a JSON object, no other text, in exactly this shape: {"title": "string", "sections": [{"heading": "string or null", "body": "string"}]}. "heading" can be null only for an introductory section with no natural title (e.g. an opening paragraph before the first real section).`,
    ``,
    `TEXT TO FORMAT:`,
    text,
  ].join('\n');
}

function validateFormatted(raw: unknown): { title: string; sections: FormattedSection[] } | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const title = typeof obj.title === 'string' ? obj.title.trim().slice(0, MAX_TITLE_CHARS) : '';
  if (!title) return null;
  if (!Array.isArray(obj.sections) || obj.sections.length === 0) return null;

  const sections: FormattedSection[] = [];
  for (const raw_section of obj.sections.slice(0, MAX_SECTIONS)) {
    if (!raw_section || typeof raw_section !== 'object') continue;
    const s = raw_section as Record<string, unknown>;
    const body = typeof s.body === 'string' ? s.body.trim().slice(0, MAX_BODY_CHARS) : '';
    if (!body) continue;
    const heading = typeof s.heading === 'string' && s.heading.trim() ? s.heading.trim().slice(0, MAX_HEADING_CHARS) : null;
    sections.push({ heading, body });
  }
  if (sections.length === 0) return null;

  return { title, sections };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  try {
    if (!OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: 'El formateo con IA no está configurado en el servidor todavía.' }), {
        status: 500, headers: corsHeaders(origin),
      });
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'Se requiere iniciar sesión.' }), {
        status: 401, headers: corsHeaders(origin),
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    const authedUser = userData?.user;
    if (userErr || !authedUser) {
      return new Response(JSON.stringify({ error: 'Sesión inválida.' }), {
        status: 401, headers: corsHeaders(origin),
      });
    }

    // Mismo gate que el resto de funciones ai-*: plan pago o admin.
    const email = (authedUser.email ?? '').toLowerCase().trim();
    const isAdmin = ADMIN_EMAILS.includes(email);
    if (!isAdmin) {
      const { data: profile } = await admin
        .from('users')
        .select('plan_status, plan_expires_at, role')
        .eq('id', authedUser.id)
        .maybeSingle();
      const notExpired = !profile?.plan_expires_at || new Date(profile.plan_expires_at as string) > new Date();
      const planActive = profile?.plan_status === 'active' && notExpired;
      const dbAdmin = profile?.role === 'admin';
      if (!planActive && !dbAdmin) {
        return new Response(JSON.stringify({
          error: 'Crear documentos con IA está disponible en planes pagos.',
          code: 'UPGRADE_REQUIRED',
        }), { status: 402, headers: corsHeaders(origin) });
      }
    }

    const body = (await req.json()) as { text?: string; language?: 'en' | 'es' };
    const text = String(body.text ?? '').trim();
    const language: 'en' | 'es' = body.language === 'en' ? 'en' : 'es';

    if (!text) {
      return new Response(JSON.stringify({ error: 'No se recibió texto para formatear.' }), {
        status: 400, headers: corsHeaders(origin),
      });
    }

    const truncated = text.slice(0, MAX_INPUT_CHARS);

    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://codecdocument.com',
        'X-Title': 'Codec Document',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: 'user', content: buildPrompt(truncated, language) }],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => '');
      console.error('[ai-format-pasted-document] OpenRouter request failed:', aiRes.status, errText);
      return new Response(JSON.stringify({ error: 'El formateo con IA no está disponible en este momento.' }), {
        status: 502, headers: corsHeaders(origin),
      });
    }

    const aiJson = await aiRes.json();
    const rawContent = String(aiJson?.choices?.[0]?.message?.content ?? '');

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      console.error('[ai-format-pasted-document] OpenRouter returned non-JSON:', rawContent.slice(0, 500));
      return new Response(JSON.stringify({ error: 'La IA devolvió una respuesta inválida, intenta de nuevo.' }), {
        status: 502, headers: corsHeaders(origin),
      });
    }

    const validated = validateFormatted(parsed);
    if (!validated) {
      return new Response(JSON.stringify({ error: 'La IA devolvió una respuesta con un formato inesperado, intenta de nuevo.' }), {
        status: 502, headers: corsHeaders(origin),
      });
    }

    return new Response(JSON.stringify(validated), { headers: corsHeaders(origin) });
  } catch (err) {
    console.error('[ai-format-pasted-document] error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message ?? 'Error inesperado' }), {
      status: 500,
      headers: corsHeaders(origin),
    });
  }
});
