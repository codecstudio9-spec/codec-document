/**
 * AI document review — calls the `ai-document-review` Supabase Edge
 * Function, which runs the actual analysis server-side (Groq API key never
 * touches the browser) and is gated to paid plans / admin there, not just
 * in the UI. See supabase/functions/ai-document-review/index.ts.
 *
 * Streams the response (same OpenAI-compatible SSE format Groq emits) so
 * the caller can show live-updating raw text while it generates, instead
 * of a silent wait — a plain `supabase.functions.invoke()` buffers the
 * whole response and can't give us that, so this calls the function URL
 * directly with a manual fetch + ReadableStream reader.
 */
import { supabase, supabaseUrl, supabaseAnonKey } from '../../lib/supabase';

export interface AiRiskItem {
  title: string;
  detail: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface AiClauseItem {
  title: string;
  detail: string;
  suggestion: string;
}

export interface AiReviewResult {
  summary: string;
  risks: AiRiskItem[];
  missingClauses: AiClauseItem[];
}

export class AiReviewUpgradeRequiredError extends Error {}

function extractJson(raw: string): AiReviewResult {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const parsed = JSON.parse(cleaned);
  return {
    summary: String(parsed.summary ?? ''),
    risks: Array.isArray(parsed.risks) ? parsed.risks.map((r: any) => ({
      title: String(r?.title ?? ''),
      detail: String(r?.detail ?? ''),
      severity: (['high', 'medium', 'low'] as const).includes(r?.severity) ? r.severity : 'medium',
      suggestion: String(r?.suggestion ?? ''),
    })) : [],
    missingClauses: Array.isArray(parsed.missingClauses) ? parsed.missingClauses.map((c: any) => ({
      title: String(c?.title ?? ''),
      detail: String(c?.detail ?? ''),
      suggestion: String(c?.suggestion ?? ''),
    })) : [],
  };
}

/**
 * @param onPartial called with the accumulated raw text as it streams in —
 * purely for a live "typing" preview; the caller doesn't need to parse it.
 */
export async function reviewDocumentWithAi(
  content: string,
  language: 'en' | 'es',
  onPartial?: (raw: string) => void,
): Promise<AiReviewResult> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error(language === 'en' ? 'Please sign in first.' : 'Inicia sesión primero.');
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/ai-document-review`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, language }),
  });

  if (!res.ok) {
    let message = language === 'en' ? 'Could not run the AI review.' : 'No se pudo ejecutar la revisión con IA.';
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch { /* not JSON */ }
    if (res.status === 402) throw new AiReviewUpgradeRequiredError(message);
    throw new Error(message);
  }

  if (!res.body) {
    throw new Error(language === 'en' ? 'Empty response from AI review.' : 'Respuesta vacía de la revisión con IA.');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const json = JSON.parse(payload);
        const delta = json?.choices?.[0]?.delta?.content ?? '';
        if (delta) {
          full += delta;
          onPartial?.(full);
        }
      } catch {
        // Partial/malformed SSE line — the buffer above handles true
        // line-splitting boundaries; this just skips a stray fragment.
      }
    }
  }

  return extractJson(full);
}
