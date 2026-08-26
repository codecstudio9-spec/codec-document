/**
 * Selecciona un pedazo del contrato en el editor de texto plano ("Editar
 * Contrato" en preview-page.tsx) y pídele a la IA que le haga un cambio
 * puntual — "agrégale que…", "cambia esto para que diga…" — sin tener que
 * reescribirlo a mano. El propio textarea sigue siendo editable como
 * siempre: esto es una ayuda encima, no un reemplazo de poder escribir
 * directamente.
 *
 * Vive fuera de preview-page.tsx porque el mismo patrón (seleccionar texto
 * dentro de un <textarea>, mandarlo a improveClauseWithAi con una
 * instrucción, reemplazar sólo esa selección) sirve para cualquier
 * documento basado en texto plano, no sólo el que ese archivo ya conoce.
 */
import { useEffect, useState } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { improveClauseWithAi, AiReviewUpgradeRequiredError } from '../services/ai-review-service';

interface Rango { start: number; end: number }

interface Props {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  content: string;
  onChange: (next: string) => void;
  language: 'en' | 'es';
  /** Qué documento es, para que el modelo sepa qué está editando. */
  documentName: string;
}

export function SelectionAiBar({ textareaRef, content, onChange, language, documentName }: Props) {
  const es = language === 'es';
  const [rango, setRango] = useState<Rango | null>(null);
  const [instruccion, setInstruccion] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const revisar = () => {
      if (ta.selectionStart === ta.selectionEnd) return;
      setRango({ start: ta.selectionStart, end: ta.selectionEnd });
    };
    ta.addEventListener('select', revisar);
    ta.addEventListener('mouseup', revisar);
    ta.addEventListener('keyup', revisar);
    return () => {
      ta.removeEventListener('select', revisar);
      ta.removeEventListener('mouseup', revisar);
      ta.removeEventListener('keyup', revisar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textareaRef.current]);

  const cerrar = () => { setRango(null); setInstruccion(''); };

  const aplicar = async () => {
    if (!rango) return;
    const seleccionado = content.slice(rango.start, rango.end);
    if (!seleccionado.trim()) return;
    setEnviando(true);
    try {
      const resultado = await improveClauseWithAi(seleccionado, language, 'clause', documentName, instruccion.trim());
      const limpio = resultado.trim();
      if (!limpio) throw new Error(es ? 'La IA no devolvió texto.' : 'The AI returned no text.');
      onChange(content.slice(0, rango.start) + limpio + content.slice(rango.end));
      toast.success(es ? 'Cláusula actualizada. Revísala antes de continuar.' : 'Clause updated. Review it before continuing.');
      cerrar();
    } catch (err) {
      if (err instanceof AiReviewUpgradeRequiredError) toast.error(err.message);
      else toast.error((err as Error).message || (es ? 'No se pudo aplicar el cambio.' : 'Could not apply the change.'));
    } finally {
      setEnviando(false);
    }
  };

  if (!rango) {
    return (
      <p className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">
        {es
          ? 'Selecciona cualquier parte del texto (por ejemplo, una cláusula completa) para pedirle a la IA que la cambie, o simplemente escribe encima.'
          : 'Select any part of the text (a whole clause, for example) to ask the AI to change it, or just type over it.'}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-blue-100 bg-blue-50/80 px-4 py-2.5">
      <span className="text-xs font-semibold text-blue-800 shrink-0">
        {es ? 'Texto seleccionado —' : 'Text selected —'}
      </span>
      <input
        autoFocus
        value={instruccion}
        onChange={(e) => setInstruccion(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !enviando) void aplicar(); }}
        placeholder={es
          ? 'Dile qué cambiar (opcional: déjalo vacío para solo mejorar la redacción)'
          : 'Tell it what to change (leave blank to just improve the wording)'}
        className="min-w-[220px] flex-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-blue-400"
      />
      <button
        type="button"
        onClick={() => void aplicar()}
        disabled={enviando}
        className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {enviando
          ? <><Loader2 className="size-3.5 animate-spin" />{es ? 'Aplicando…' : 'Applying…'}</>
          : <><Sparkles className="size-3.5" />{es ? 'Aplicar con IA' : 'Apply with AI'}</>}
      </button>
      <button
        type="button"
        onClick={cerrar}
        disabled={enviando}
        className="inline-flex items-center justify-center rounded-full p-1.5 text-slate-400 transition hover:text-slate-700 disabled:opacity-60"
        title={es ? 'Cancelar' : 'Cancel'}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
