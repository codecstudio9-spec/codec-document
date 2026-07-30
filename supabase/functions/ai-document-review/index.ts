// Supabase Edge Function — AI document review (risk + missing-clause
// analysis) using Groq's free/fast inference API. Matches the
// notify-completion/paypal-verify pattern: Deno.serve, service-role client,
// secrets via Deno.env, Bearer JWT resolved to a real user id server-side
// (never trust a client-supplied plan flag for a paid-feature gate).
//
// Streams the Groq response straight through to the client (Server-Sent
// Events, same OpenAI-compatible wire format Groq emits) once the gate
// passes — the client accumulates `delta.content` chunks for a live
// "typing" effect, then JSON.parses the finished string. Everything
// BEFORE the Groq call (auth, plan gate, validation) still returns a
// normal buffered JSON error response — only the successful path streams.
//
// Deploy:
//   supabase functions deploy ai-document-review --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes
// Secrets (supabase secrets set):
//   GROQ_API_KEY=<from console.groq.com/keys>
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by the platform)
//
// Gated to paid plans (monthly/semiannual/annual) OR admin — same rule as
// every other paywalled feature in the app (auth-service.ts:
// fetchSubscriptionStatus). The client's own `isAdmin`/`subscriptionActive`
// flags are never trusted here since they're just React state; this
// function re-derives both directly from `public.users` using the caller's
// verified JWT.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') ?? '';

// Kept in sync with src/app/utils/admin-access.ts — Deno can't import that
// frontend module directly, so the same short hardcoded list is mirrored
// here for the server-side gate.
const ADMIN_EMAILS = ['douglastabordasanchez@gmail.com'];

// Groq's fast/free-tier model — plenty for a structured-JSON legal review;
// swap this constant for a more powerful model later without touching
// anything else once the platform can justify the extra cost.
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Keeps a runaway paste (or someone probing the endpoint) from turning
// into an enormous, expensive prompt — a real document body is a few
// thousand characters at most.
const MAX_CONTENT_CHARS = 20000;

function corsHeaders(origin: string | null, contentType = 'application/json') {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': contentType,
  };
}

function buildPrompt(content: string, language: 'en' | 'es'): string {
  const lang = language === 'en' ? 'English' : 'Spanish';
  return [
    `You are a careful legal-document reviewer. Analyze the following document text and respond ONLY with a single JSON object (no markdown, no prose outside the JSON) in ${lang}, with this exact shape:`,
    `{"summary": string, "risks": [{"title": string, "detail": string, "severity": "high"|"medium"|"low", "suggestion": string}], "missingClauses": [{"title": string, "detail": string, "suggestion": string}]}`,
    `"summary" is 2-3 sentences describing what the document is and does.`,
    `"risks" lists ambiguous, one-sided, or legally risky clauses actually present in the text (empty array if none found — never invent risks that aren't there).`,
    `"severity" reflects how serious the risk is for whoever is less protected by the clause: "high" for something that could cause real financial/legal harm, "medium" for a real but limited concern, "low" for a minor wording nitpick.`,
    `"suggestion" (on both risks and missingClauses) is a short, concrete alternative wording or addition — not just "consider revising", an actual proposed clause/phrase.`,
    `"missingClauses" lists standard clauses a document of this type would normally include but that are missing here (empty array if the document looks complete).`,
    `Keep each "detail" and "suggestion" to 1-2 sentences. Do not include any text outside the JSON object.`,
    ``,
    `DOCUMENT TEXT:`,
    content,
  ].join('\n');
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  try {
    if (!GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI review is not configured on the server yet.' }), {
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

    // ── Gate: paid plan OR admin — mirrors fetchSubscriptionStatus() ──────
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
          error: 'AI document review is available on paid plans.',
          code: 'UPGRADE_REQUIRED',
        }), { status: 402, headers: corsHeaders(origin) });
      }
    }

    const body = (await req.json()) as { content?: string; language?: 'en' | 'es' };
    const content = String(body.content ?? '').trim();
    const language: 'en' | 'es' = body.language === 'en' ? 'en' : 'es';

    if (!content) {
      return new Response(JSON.stringify({ error: 'No document content provided.' }), {
        status: 400, headers: corsHeaders(origin),
      });
    }

    const truncated = content.slice(0, MAX_CONTENT_CHARS);

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: buildPrompt(truncated, language) }],
        temperature: 0.2,
        response_format: { type: 'json_object' },
        stream: true,
      }),
    });

    if (!groqRes.ok || !groqRes.body) {
      const errText = await groqRes.text().catch(() => '');
      console.error('[ai-document-review] Groq request failed:', groqRes.status, errText);
      return new Response(JSON.stringify({ error: 'AI review service is temporarily unavailable.' }), {
        status: 502, headers: corsHeaders(origin),
      });
    }

    // Direct passthrough — Groq's stream is already OpenAI-compatible SSE
    // (`data: {...}\n\n` chunks ending in `data: [DONE]\n\n`); the client
    // reads it the same way it would read OpenAI's.
    return new Response(groqRes.body, { headers: corsHeaders(origin, 'text/event-stream; charset=utf-8') });
  } catch (err) {
    console.error('[ai-document-review] error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message ?? 'Unexpected error' }), {
      status: 500,
      headers: corsHeaders(origin),
    });
  }
});
