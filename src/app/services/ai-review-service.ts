/**
 * AI document review — calls the `ai-document-review` Supabase Edge
 * Function, which runs the actual analysis server-side (Groq API key never
 * touches the browser) and is gated to paid plans / admin there, not just
 * in the UI. See supabase/functions/ai-document-review/index.ts.
 */
import { supabase } from '../../lib/supabase';

export interface AiReviewItem {
  title: string;
  detail: string;
}

export interface AiReviewResult {
  summary: string;
  risks: AiReviewItem[];
  missingClauses: AiReviewItem[];
}

/** Same "the real error is JSON in the response body" unwrap used by
 * lib/paypal-verify.ts — supabase-js otherwise surfaces only a generic
 * "Edge Function returned a non-2xx status code" message. */
async function extractEdgeFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  const context = (error as { context?: Response })?.context;
  if (context && typeof context.json === 'function') {
    try {
      const body = await context.clone().json();
      if (body?.error) return String(body.error);
    } catch { /* not JSON — fall through */ }
  }
  return (error as { message?: string })?.message || fallback;
}

export class AiReviewUpgradeRequiredError extends Error {}

export async function reviewDocumentWithAi(content: string, language: 'en' | 'es'): Promise<AiReviewResult> {
  const { data, error } = await supabase.functions.invoke('ai-document-review', {
    body: { content, language },
  });

  if (error) {
    const context = (error as { context?: Response })?.context;
    if (context?.status === 402) {
      throw new AiReviewUpgradeRequiredError(
        language === 'en' ? 'AI document review is available on paid plans.' : 'La revisión con IA está disponible en planes pagos.',
      );
    }
    throw new Error(await extractEdgeFunctionErrorMessage(
      error,
      language === 'en' ? 'Could not run the AI review.' : 'No se pudo ejecutar la revisión con IA.',
    ));
  }

  return data as AiReviewResult;
}
