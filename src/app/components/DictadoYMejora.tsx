/**
 * Barra de «dictar» y «mejorar con IA» que se monta debajo de un campo de
 * texto largo del generador de documentos.
 *
 * Dictar y mejorar van juntos a propósito: el reconocimiento de voz no pone
 * comas ni puntos ni mayúsculas, así que un párrafo dictado sale como un
 * bloque corrido. Escribirlo a mano después anula la ventaja de haberlo
 * dictado; la IA lo puntúa y le da tono formal sin cambiar lo que dijiste.
 *
 * Se puede deshacer siempre. La IA reescribe texto de una carta que alguien
 * va a firmar, y hay que poder volver a la versión propia de un clic.
 */

import { useRef, useState } from 'react';
import { Mic, Square, Sparkles, Loader2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDictation, unirDictado } from '../hooks/use-dictation';
import { improveClauseWithAi, draftClauseWithAi, AiReviewUpgradeRequiredError } from '../services/ai-review-service';

interface Props {
  valor: string;
  onCambio: (v: string) => void;
  language: 'en' | 'es';
  /** Qué es este texto, para que la IA no lo trate como una cláusula legal
   *  cuando en realidad es, por ejemplo, el motivo de una renuncia. */
  contexto?: string;
  /** Sin IA: campos cortos (un nombre, una ciudad) donde sólo tiene sentido
   *  dictar. */
  soloDictado?: boolean;
  /** `letter` para un párrafo personal dentro de un documento formal —el
   *  agradecimiento de una carta de renuncia—. Con el tono de cláusula, ese
   *  texto sale con voz de contrato en vez de con la de quien lo escribe. */
  tono?: 'clause' | 'letter';
  /** El campo trata lo escrito como una INSTRUCCIÓN ("agrega una cláusula
   *  donde…") en vez de como el texto final de la cláusula: el botón pasa a
   *  "Redactar con IA" y la IA REDACTA una cláusula nueva a partir de eso,
   *  en vez de sólo pulir lo que ya había. Reservado a campos donde eso
   *  tiene sentido (p.ej. cláusulas personalizadas) — nunca el campo por
   *  omisión, porque para "qué incluye el servicio" lo escrito SÍ debe ser
   *  el contenido real, no una instrucción para que la IA lo invente. */
  modoInstruccion?: boolean;
}

export function DictadoYMejora({ valor, onCambio, language, contexto, soloDictado, tono = 'clause', modoInstruccion }: Props) {
  const es = language === 'es';
  const [mejorando, setMejorando] = useState(false);
  // Estado, no ref: el botón de deshacer tiene que aparecer y desaparecer
  // solo, y una ref no vuelve a pintar nada.
  const [previo, setPrevio] = useState<string | null>(null);

  // El reconocedor se crea una vez y conservaría el `valor` de ese momento;
  // con la ref siempre concatena sobre lo último que hay en el campo.
  const valorRef = useRef(valor);
  valorRef.current = valor;

  const { escuchando, parcial, alternar, detener, soportado } = useDictation({
    language,
    onTexto: (trozo) => onCambio(unirDictado(valorRef.current, trozo)),
    onError: (m) => toast.error(m),
  });

  const mejorar = async () => {
    const texto = valor.trim();
    if (!texto) {
      toast.error(es ? 'Escribe o dicta algo primero.' : 'Write or dictate something first.');
      return;
    }
    detener();
    setMejorando(true);
    try {
      const resultado = modoInstruccion
        ? await draftClauseWithAi(texto, language, contexto ?? '')
        : await improveClauseWithAi(texto, language, tono, contexto ?? '');
      const limpio = resultado.trim();
      if (!limpio) throw new Error(es ? 'La IA no devolvió texto.' : 'The AI returned no text.');
      setPrevio(valor);
      onCambio(limpio);
      toast.success(modoInstruccion
        ? (es ? 'Cláusula redactada. Revísala antes de continuar — puedes deshacer.' : 'Clause drafted. Review it before continuing — you can undo.')
        : (es ? 'Texto mejorado. Puedes deshacer.' : 'Text improved. You can undo.'));
    } catch (e) {
      if (e instanceof AiReviewUpgradeRequiredError) toast.error(e.message);
      else toast.error((e as Error).message || (es ? 'No se pudo mejorar el texto.' : 'Could not improve the text.'));
    } finally {
      setMejorando(false);
    }
  };

  const deshacer = () => {
    if (previo === null) return;
    onCambio(previo);
    setPrevio(null);
    toast.success(es ? 'Se restauró tu texto.' : 'Your text was restored.');
  };

  if (!soportado && soloDictado) return null;

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2">
      {soportado && (
        <button
          type="button"
          onClick={alternar}
          aria-pressed={escuchando}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            escuchando
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {escuchando
            ? <><Square className="size-3.5 fill-current" />{es ? 'Detener' : 'Stop'}</>
            : <><Mic className="size-3.5" />{es ? 'Dictar' : 'Dictate'}</>}
        </button>
      )}

      {!soloDictado && (
        <button
          type="button"
          onClick={mejorar}
          disabled={mejorando}
          className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
        >
          {mejorando
            ? <><Loader2 className="size-3.5 animate-spin" />{modoInstruccion ? (es ? 'Redactando…' : 'Drafting…') : (es ? 'Mejorando…' : 'Improving…')}</>
            : <><Sparkles className="size-3.5" />{modoInstruccion ? (es ? 'Redactar con IA' : 'Draft with AI') : (es ? 'Mejorar con IA' : 'Improve with AI')}</>}
        </button>
      )}

      {previo !== null && !mejorando && (
        <button
          type="button"
          onClick={deshacer}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
        >
          <Undo2 className="size-3.5" />{es ? 'Deshacer' : 'Undo'}
        </button>
      )}

      {escuchando && (
        <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
          <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-red-500" />
          <span className="truncate">
            {parcial || (es ? 'Escuchando… habla con normalidad.' : 'Listening… speak normally.')}
          </span>
        </span>
      )}
    </div>
  );
}
