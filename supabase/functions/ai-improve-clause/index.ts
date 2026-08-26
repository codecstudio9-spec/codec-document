// Supabase Edge Function — polishes the wording of a clause block the
// template owner already wrote, for the "Mejorar redacción" button in the
// docx template editor's clause-blocks section. Deliberately narrow scope:
// it improves EXISTING text (grammar, clarity, formal legal tone), it does
// NOT invent a new clause from a one-line description — that's a much
// higher-risk "generate legal text from scratch" feature the user
// explicitly deferred (see ai-draft-clause). Same Deno.serve/service-role/
// Groq pattern as ai-document-review, gated the same way (paid plan or
// admin).
//
// 2026-08-25: also backs "select a clause in the live preview and tell the
// AI what to change" (preview-page.tsx's SelectionAiBar) — an optional
// `instruction` field switches buildPrompt from "just polish this" to
// "apply this specific change to this existing clause, touch nothing
// else", borrowing ai-draft-clause's guardrail against inventing facts the
// instruction didn't give.
//
// Deploy:
//   supabase functions deploy ai-improve-clause --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes
// Secrets: reuses the same GROQ_API_KEY already set for ai-document-review.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') ?? '';

const ADMIN_EMAILS = ['douglastabordasanchez@gmail.com'];
// Groq descontinuó llama-3.3-70b-versatile el 16-08-2026 — reemplazo
// oficial recomendado por Groq.
const GROQ_MODEL = 'openai/gpt-oss-120b';
const MAX_CLAUSE_CHARS = 4000;

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

/**
 * Hay dos tonos, y usar el equivocado se nota mucho.
 *
 * `clause` es el original: una cláusula de contrato, donde lo que importa es
 * no alterar el significado jurídico.
 *
 * `letter` es un párrafo personal dentro de un documento formal — el
 * agradecimiento y el motivo que alguien escribe en su carta de renuncia.
 * Pasarlo por el editor de cláusulas lo dejaba con voz de contrato ("por medio
 * del presente el suscrito manifiesta…"), que es justo lo contrario de lo que
 * hace falta: tiene que sonar a esa persona, sólo que bien escrito. Y hay una
 * regla que en una cláusula no aplica y aquí es esencial: si alguien dicta una
 * queja o un reproche, se reformula en términos neutros. Una carta de renuncia
 * queda en la hoja de vida laboral de quien la firma.
 */
function buildPrompt(clauseText: string, language: 'en' | 'es', tone: 'clause' | 'letter', context: string, instruction: string): string {
  const lang = language === 'en' ? 'English' : 'Spanish';

  // Con instrucción: la persona pide un cambio concreto sobre una cláusula
  // que YA existe ("agrégale que...", "cambia esto para que diga...") — a
  // medio camino entre improveClauseWithAi (nunca cambia nada, sólo pule) y
  // draftClauseWithAi (inventa una cláusula entera desde cero, sin texto de
  // partida). Mismo candado anti-invención que ai-draft-clause: nunca un
  // nombre/fecha/monto que la instrucción no dio.
  if (instruction) {
    return [
      `You are a legal-document editor. Below is an EXISTING contract clause${context ? ` (the field is: ${context})` : ''}, and a specific instruction for how to change it.`,
      `Apply ONLY what the instruction asks. Keep every other part of the clause exactly as it is — same obligations, same structure — unless the instruction says otherwise. Respond in ${lang}.`,
      `NEVER invent a specific name, date, amount, percentage or deadline the instruction did not give you. Where a specific value is genuinely needed and missing, write a bracketed placeholder in ${lang} such as [SPECIFY AMOUNT] / [ESPECIFICAR MONTO] instead of making one up.`,
      `If the instruction asks for something illegal, deceptive, or that would let one party abuse the other, do NOT apply it — instead respond with exactly one short sentence in ${lang} starting with "REFUSED:" explaining briefly why, and nothing else.`,
      `Respond with ONLY the full rewritten clause text — no markdown, no quotes, no explanation, no preamble.`,
      ``,
      `EXISTING CLAUSE:`,
      clauseText,
      ``,
      `INSTRUCTION:`,
      instruction,
    ].join('\n');
  }

  if (tone === 'letter') {
    return [
      `You are helping someone polish a personal paragraph they wrote for a formal letter${context ? ` (the field is: ${context})` : ''}.`,
      `Rewrite it in ${lang} so it reads professionally and warmly: correct grammar, punctuation and capitalisation, connect the ideas, and use the register of a formal letter — but keep it in the FIRST PERSON and keep the person's own voice and their reasons. It must still sound like them, only well written.`,
      `Do NOT turn it into contract or legalese language. Do NOT add facts, names, dates, job titles or reasons they did not write. Do not add a greeting or a sign-off — this is one paragraph inside a longer letter that already has both.`,
      `If the text contains a complaint, a reproach or anything said in anger, rewrite it in neutral, cordial terms without accusations: this letter stays in the person's employment record.`,
      `Keep it to a similar length, at most two short paragraphs. Respond with ONLY the rewritten text — no markdown, no quotes, no explanation.`,
      ``,
      `TEXT:`,
      clauseText,
    ].join('\n');
  }

  return [
    `You are a legal-document copy editor. Rewrite the following contract clause${context ? ` (the field is: ${context})` : ''} to be clearer and more formally worded in ${lang}, WITHOUT changing its legal meaning, without adding new obligations or removing existing ones, and without inventing facts, names, or numbers that aren't already in the text.`,
    `Keep roughly the same length. Respond with ONLY the rewritten clause text — no markdown, no quotes, no explanation, no preamble.`,
    ``,
    `CLAUSE TEXT:`,
    clauseText,
  ].join('\n');
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  try {
    if (!GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI clause improvement is not configured on the server yet.' }), {
        status: 500, headers: corsHeaders(origin),
      });
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'Authentication required.' }), {
        status: 401, headers: corsHeaders(origin),
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    const authedUser = userData?.user;
    if (userErr || !authedUser) {
      return new Response(JSON.stringify({ error: 'Invalid session.' }), {
        status: 401, headers: corsHeaders(origin),
      });
    }

    // ── Gate: paid plan OR admin — same rule as ai-document-review ────────
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
          error: 'Improving clauses with AI is available on paid plans.',
          code: 'UPGRADE_REQUIRED',
        }), { status: 402, headers: corsHeaders(origin) });
      }
    }

    const body = (await req.json()) as {
      clauseText?: string;
      language?: 'en' | 'es';
      tone?: 'clause' | 'letter';
      context?: string;
      instruction?: string;
    };
    const clauseText = String(body.clauseText ?? '').trim();
    const language: 'en' | 'es' = body.language === 'en' ? 'en' : 'es';
    // Por omisión, cláusula: es como se comportaba antes de existir el tono, y
    // los llamadores que ya había no lo mandan.
    const tone: 'clause' | 'letter' = body.tone === 'letter' ? 'letter' : 'clause';
    const context = String(body.context ?? '').trim().slice(0, 120);
    // Cuando viene, "mejorar" pasa a "aplicar este cambio concreto" — ver
    // buildPrompt. Truncada como MAX_INSTRUCTION_CHARS en ai-draft-clause.
    const instruction = String(body.instruction ?? '').trim().slice(0, 1500);

    if (!clauseText) {
      return new Response(JSON.stringify({ error: 'No clause text provided.' }), {
        status: 400, headers: corsHeaders(origin),
      });
    }

    const truncated = clauseText.slice(0, MAX_CLAUSE_CHARS);

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: buildPrompt(truncated, language, tone, context, instruction) }],
        temperature: 0.3,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text().catch(() => '');
      console.error('[ai-improve-clause] Groq request failed:', groqRes.status, errText);
      return new Response(JSON.stringify({ error: 'AI clause improvement is temporarily unavailable.' }), {
        status: 502, headers: corsHeaders(origin),
      });
    }

    const groqJson = await groqRes.json();
    const improvedText = String(groqJson?.choices?.[0]?.message?.content ?? '').trim();

    if (!improvedText) {
      return new Response(JSON.stringify({ error: 'AI returned an empty response.' }), {
        status: 502, headers: corsHeaders(origin),
      });
    }

    if (improvedText.startsWith('REFUSED:')) {
      return new Response(JSON.stringify({ error: improvedText.replace(/^REFUSED:\s*/, '') }), {
        status: 422, headers: corsHeaders(origin),
      });
    }

    return new Response(JSON.stringify({ improvedText }), { headers: corsHeaders(origin) });
  } catch (err) {
    console.error('[ai-improve-clause] error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message ?? 'Unexpected error' }), {
      status: 500,
      headers: corsHeaders(origin),
    });
  }
});
