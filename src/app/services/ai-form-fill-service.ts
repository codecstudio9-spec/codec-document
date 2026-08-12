/**
 * Rellenar el formulario de una plantilla con lo que el usuario dictó.
 *
 * El audio nunca sale del navegador: el reconocimiento de voz lo hace el
 * propio navegador y aquí sólo viaja el texto. Ver la Edge Function
 * `ai-fill-form`, que valida cada valor contra el campo al que dice
 * pertenecer antes de devolverlo.
 */

import { supabase } from '../../lib/supabase';
import { AiReviewUpgradeRequiredError, extractEdgeFunctionErrorMessage } from './ai-review-service';
import type { DocumentField } from '../types/document';

export interface ResultadoRelleno {
  /** Sólo los campos que el modelo pudo extraer Y superaron la validación. */
  valores: Record<string, string | number | boolean>;
  /** Cuántos valores se descartaron por no encajar con su campo. */
  descartados: number;
}

export async function rellenarCamposDictando(
  transcripcion: string,
  campos: DocumentField[],
  language: 'en' | 'es',
): Promise<ResultadoRelleno> {
  const { data, error } = await supabase.functions.invoke('ai-fill-form', {
    body: {
      transcript: transcripcion,
      language,
      // Se manda sólo lo que el modelo necesita para repartir el texto. El
      // resto de la definición del campo (ayudas, marcadores) no aporta y
      // alarga la petición.
      fields: campos.map((c) => ({
        id: c.id,
        label: c.label,
        type: c.type,
        options: c.options,
        required: c.required,
      })),
    },
  });

  if (error) {
    const context = (error as { context?: Response })?.context;
    if (context?.status === 402) {
      throw new AiReviewUpgradeRequiredError(
        language === 'en'
          ? 'Filling the form by voice is available on paid plans.'
          : 'Rellenar el formulario dictando está disponible en los planes pagos.',
      );
    }
    throw new Error(await extractEdgeFunctionErrorMessage(
      error,
      language === 'en' ? 'Could not read what you dictated.' : 'No se pudo interpretar lo que dictaste.',
    ));
  }

  const d = data as { values?: Record<string, string | number | boolean>; discarded?: number };
  return { valores: d?.values ?? {}, descartados: Number(d?.discarded ?? 0) };
}
