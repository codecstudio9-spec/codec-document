/**
 * AI document review — calls the `ai-document-review` Supabase Edge
 * Function, which runs the actual analysis server-side (Groq API key never
 * touches the browser) and is gated to paid plans / admin there, not just
 * in the UI. See supabase/functions/ai-document-review/index.ts.
 *
 * Uses supabase.functions.invoke() (buffered request/response) — a manual
 * fetch + SSE-stream passthrough was tried for a live "typing" effect but
 * broke in production (Supabase's Edge Runtime doesn't reliably forward a
 * raw upstream ReadableStream across the isolate boundary); this is the
 * same proven call pattern lib/paypal-verify.ts already uses successfully.
 */
import { supabase } from '../../lib/supabase';

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

/** Same "the real error is JSON in the response body" unwrap used by
 * lib/paypal-verify.ts — supabase-js otherwise surfaces only a generic
 * "Edge Function returned a non-2xx status code" message. */
export async function extractEdgeFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  const context = (error as { context?: Response })?.context;
  if (context && typeof context.json === 'function') {
    try {
      const body = await context.clone().json();
      if (body?.error) return String(body.error);
    } catch { /* not JSON — fall through */ }
  }
  return (error as { message?: string })?.message || fallback;
}

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

/**
 * Polishes the wording of a single clause block the template owner already
 * wrote — the "Mejorar redacción" button in the docx template editor's
 * clause-blocks section. Also backs preview-page.tsx's SelectionAiBar
 * (select a clause in the live preview, tell it what to change) via the
 * `instruction` param. See supabase/functions/ai-improve-clause/index.ts:
 * without an instruction it never invents a new clause from scratch, gated
 * to paid plans/admin the same way as the AI review.
 */
export async function improveClauseWithAi(
  clauseText: string,
  language: 'en' | 'es',
  /** `letter` para un párrafo personal dentro de un documento formal —el
   *  agradecimiento de una carta de renuncia—, que necesita otro registro que
   *  una cláusula de contrato. Por omisión, cláusula. */
  tone: 'clause' | 'letter' = 'clause',
  /** Qué campo es, para que el modelo sepa qué está corrigiendo. */
  context = '',
  /** Un cambio concreto sobre ESTA cláusula ("agrégale que...", "cambia
   *  esto para que diga...") — a medio camino entre pulir sin tocar nada
   *  (sin instrucción) y redactar desde cero con draftClauseWithAi (sin
   *  texto de partida). Ver el comentario de buildPrompt en
   *  ai-improve-clause/index.ts. */
  instruction = '',
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-improve-clause', {
    body: { clauseText, language, tone, context, instruction },
  });

  if (error) {
    const context = (error as { context?: Response })?.context;
    if (context?.status === 402) {
      throw new AiReviewUpgradeRequiredError(
        language === 'en' ? 'Improving clauses with AI is available on paid plans.' : 'Mejorar cláusulas con IA está disponible en planes pagos.',
      );
    }
    throw new Error(await extractEdgeFunctionErrorMessage(
      error,
      language === 'en' ? 'Could not improve this clause.' : 'No se pudo mejorar esta cláusula.',
    ));
  }

  return String((data as { improvedText?: string })?.improvedText ?? '');
}

/**
 * Drafts a NEW clause from a one-line instruction ("agrega una cláusula
 * donde el cliente deba avisar con 15 días de anticipación") — different
 * from improveClauseWithAi above, which deliberately never invents text.
 * See supabase/functions/ai-draft-clause/index.ts for the guardrails
 * (never invents names/dates/amounts, drafts one clause, declines
 * abusive/illegal instructions instead of writing them).
 */
export async function draftClauseWithAi(
  instruction: string,
  language: 'en' | 'es',
  context = '',
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-draft-clause', {
    body: { instruction, language, context },
  });

  if (error) {
    const context = (error as { context?: Response })?.context;
    if (context?.status === 402) {
      throw new AiReviewUpgradeRequiredError(
        language === 'en' ? 'Drafting clauses with AI is available on paid plans.' : 'Redactar cláusulas con IA está disponible en planes pagos.',
      );
    }
    throw new Error(await extractEdgeFunctionErrorMessage(
      error,
      language === 'en' ? 'Could not draft this clause.' : 'No se pudo redactar esta cláusula.',
    ));
  }

  return String((data as { draftedText?: string })?.draftedText ?? '');
}

export interface CotizacionRedactada {
  /** Cuerpo comercial listo para el PDF. */
  proposal: string;
  /** Productos detectados en la petición, ya validados en el servidor. */
  items: Array<{
    description: string; quantity: number; unit: string;
    unit_price: number; discount_pct: number; tax_pct: number;
  }>;
  /** Datos del cliente que la persona haya dicho al pedir la cotización
   *  («…para Ruth, al 3001234567…»). Cadena vacía en lo que no se dijo —
   *  nunca se adivina, y nunca pisa lo que ya estaba en el formulario. */
  client: { name: string; phone: string; email: string };
}

/**
 * La agente escribe la cotización entera a partir de una petición en lenguaje
 * normal: «hazme una cotización de 30 agendas a 30.000 cada una».
 *
 * Es la alternativa a pegar el texto ya escrito. Devuelve el cuerpo comercial
 * y los productos por separado para que caigan cada uno en su sitio del
 * formulario, en vez de dejar un bloque de texto que el usuario tenga que
 * desarmar a mano.
 *
 * Ver supabase/functions/ai-quote-writer/index.ts: los precios sólo se
 * rellenan si la persona los dijo — nunca se estiman.
 */
export async function escribirCotizacion(
  peticion: string,
  language: 'en' | 'es',
  contexto: { clientName?: string; clientCompany?: string; projectName?: string; currency?: string } = {},
): Promise<CotizacionRedactada> {
  const { data, error } = await supabase.functions.invoke('ai-quote-writer', {
    body: {
      request: peticion,
      language,
      client_name: contexto.clientName,
      client_company: contexto.clientCompany,
      project_name: contexto.projectName,
      currency: contexto.currency,
    },
  });

  if (error) {
    const ctx = (error as { context?: Response })?.context;
    if (ctx?.status === 402) {
      throw new AiReviewUpgradeRequiredError(
        language === 'en'
          ? 'Having me write the whole quote is available on paid plans.'
          : 'Que yo te escriba la cotización completa está disponible en los planes pagos.',
      );
    }
    throw new Error(await extractEdgeFunctionErrorMessage(
      error,
      language === 'en' ? 'I could not write the quote.' : 'No pude escribir la cotización.',
    ));
  }

  const d = data as Partial<CotizacionRedactada> | null;
  const c = d?.client;
  return {
    proposal: String(d?.proposal ?? ''),
    items: Array.isArray(d?.items) ? d.items : [],
    client: {
      name: String(c?.name ?? ''),
      phone: String(c?.phone ?? ''),
      email: String(c?.email ?? ''),
    },
  };
}
