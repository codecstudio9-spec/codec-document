// Supabase Edge Function — drafts a NEW contract clause from a one-line
// instruction ("agrega una cláusula donde el cliente deba avisar con 15
// días de anticipación cualquier cambio"). This is the feature
// ai-improve-clause/index.ts explicitly deferred as "higher-risk... the
// user explicitly deferred" — the user asked for it again (2026-08-24),
// so it exists here as its OWN function instead of loosening
// ai-improve-clause's scope: that one stays narrow (polish text someone
// already wrote), this one is honest about doing something riskier
// (inventing clause language) and carries its own guardrails:
//   - never invents names, dates or amounts the instruction didn't give —
//     it must use a bracketed placeholder like [ESPECIFICAR] instead;
//   - drafts ONE clause, not a whole contract;
//   - declines instructions asking for something illegal/abusive instead
//     of drafting them.
// The client-side caller (DictadoYMejora.tsx, modoInstruccion) never
// applies the result silently either — same "show it before it's written"
// rule as everywhere else AI touches a document in this app.
//
// Deploy:
//   supabase functions deploy ai-draft-clause --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes
// Secrets: reuses the same GROQ_API_KEY already set for ai-improve-clause.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') ?? '';

const ADMIN_EMAILS = ['douglastabordasanchez@gmail.com'];
// Groq descontinuó llama-3.3-70b-versatile el 16-08-2026 — esta función se
// desplegó el 23-08-2026 copiando ese modelo de las funciones hermanas, así
// que nació ya rota sin que nadie lo notara hasta ahora. Reemplazo oficial
// recomendado por Groq.
const GROQ_MODEL = 'openai/gpt-oss-120b';
const MAX_INSTRUCTION_CHARS = 1500;

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

function buildPrompt(instruction: string, language: 'en' | 'es', context: string): string {
  const lang = language === 'en' ? 'English' : 'Spanish';
  return [
    `You draft a single contract clause in ${lang} from a short instruction a non-lawyer wrote${context ? ` for a field called "${context}"` : ''}.`,
    `Rules, all mandatory:`,
    `1. Write ONLY the clause itself — no title unless the instruction implies one, no explanation, no markdown, no preamble like "Here is the clause:".`,
    `2. Formal contract register, third person ("the Client", "the Provider" or the roles implied by the instruction) — never first person.`,
    `3. NEVER invent a specific name, date, amount, percentage or deadline the instruction did not give you. Where a specific value is genuinely needed and missing, write a bracketed placeholder in ${lang} such as [SPECIFY AMOUNT] / [ESPECIFICAR MONTO] instead of making one up.`,
    `4. Draft ONE clause covering what was asked — not a whole contract, not multiple unrelated clauses.`,
    `5. If the instruction asks for something illegal, deceptive, or that would let one party abuse the other (e.g. waiving a right the law doesn't allow waiving, hiding a fee, discriminating against a protected class), do NOT draft it — instead respond with exactly one short sentence in ${lang} starting with "REFUSED:" explaining briefly why, and nothing else.`,
    `6. Keep it to a realistic clause length — a short paragraph, occasionally a lettered list if the instruction describes multiple related obligations.`,
    ``,
    `INSTRUCTION:`,
    instruction,
  ].join('\n');
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  try {
    if (!GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI clause drafting is not configured on the server yet.' }), {
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

    // ── Gate: paid plan OR admin — same rule as ai-improve-clause ─────────
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
          error: 'Drafting clauses with AI is available on paid plans.',
          code: 'UPGRADE_REQUIRED',
        }), { status: 402, headers: corsHeaders(origin) });
      }
    }

    const body = (await req.json()) as {
      instruction?: string;
      language?: 'en' | 'es';
      context?: string;
    };
    const instruction = String(body.instruction ?? '').trim();
    const language: 'en' | 'es' = body.language === 'en' ? 'en' : 'es';
    const context = String(body.context ?? '').trim().slice(0, 120);

    if (!instruction) {
      return new Response(JSON.stringify({ error: 'No instruction provided.' }), {
        status: 400, headers: corsHeaders(origin),
      });
    }

    const truncated = instruction.slice(0, MAX_INSTRUCTION_CHARS);

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: buildPrompt(truncated, language, context) }],
        temperature: 0.4,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text().catch(() => '');
      console.error('[ai-draft-clause] Groq request failed:', groqRes.status, errText);
      return new Response(JSON.stringify({ error: 'AI clause drafting is temporarily unavailable.' }), {
        status: 502, headers: corsHeaders(origin),
      });
    }

    const groqJson = await groqRes.json();
    const draftedText = String(groqJson?.choices?.[0]?.message?.content ?? '').trim();

    if (!draftedText) {
      return new Response(JSON.stringify({ error: 'AI returned an empty response.' }), {
        status: 502, headers: corsHeaders(origin),
      });
    }

    if (draftedText.startsWith('REFUSED:')) {
      return new Response(JSON.stringify({ error: draftedText.replace(/^REFUSED:\s*/, '') }), {
        status: 422, headers: corsHeaders(origin),
      });
    }

    return new Response(JSON.stringify({ draftedText }), { headers: corsHeaders(origin) });
  } catch (err) {
    console.error('[ai-draft-clause] error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message ?? 'Unexpected error' }), {
      status: 500,
      headers: corsHeaders(origin),
    });
  }
});
