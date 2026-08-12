/**
 * «Dicta el documento»: el usuario cuenta en voz alta lo que necesita y la IA
 * reparte lo dicho entre los campos del formulario.
 *
 * Dos decisiones de diseño que no son cosméticas:
 *
 * 1. La transcripción se muestra y es EDITABLE antes de mandarla. El
 *    reconocimiento de voz confunde cifras y nombres propios, y una cédula mal
 *    oída metida en un documento firmado es un problema serio. Verla y poder
 *    corregirla cuesta un segundo.
 *
 * 2. Nada se escribe en el formulario hasta que el usuario ve QUÉ se va a
 *    escribir. Primero se listan los campos con su valor, y sólo al confirmar
 *    se aplican. Un relleno automático que actúa a ciegas obliga a revisar el
 *    formulario entero para saber si acertó, que es más trabajo que llenarlo a
 *    mano.
 *
 * Y siempre se puede deshacer: al aplicar se guarda el formulario anterior
 * completo.
 */

import { useState } from 'react';
import { Mic, Square, Sparkles, Loader2, X, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useDictation, unirDictado } from '../hooks/use-dictation';
import { rellenarCamposDictando } from '../services/ai-form-fill-service';
import { AiReviewUpgradeRequiredError } from '../services/ai-review-service';
import type { DocumentField, DocumentData } from '../types/document';

interface Props {
  campos: DocumentField[];
  language: 'en' | 'es';
  /** Nombre del documento, para el ejemplo de qué decir. */
  nombreDocumento: string;
  onAplicar: (valores: Record<string, string | number | boolean>) => void;
  onCerrar: () => void;
  /** Para avisar de lo que se va a sobrescribir. */
  datosActuales: DocumentData;
}

export function DictarFormulario({ campos, language, nombreDocumento, onAplicar, onCerrar, datosActuales }: Props) {
  const es = language === 'es';
  const [texto, setTexto] = useState('');
  const [analizando, setAnalizando] = useState(false);
  const [propuesta, setPropuesta] = useState<Record<string, string | number | boolean> | null>(null);
  const [descartados, setDescartados] = useState(0);

  const { escuchando, parcial, alternar, detener, soportado } = useDictation({
    language,
    onTexto: (trozo) => setTexto((prev) => unirDictado(prev, trozo)),
    onError: (m) => toast.error(m),
  });

  const etiqueta = (id: string) => campos.find((c) => c.id === id)?.label ?? id;

  const analizar = async () => {
    const limpio = texto.trim();
    if (limpio.length < 10) {
      toast.error(es ? 'Cuéntame un poco más para poder repartirlo entre los campos.' : 'Say a bit more so it can be split across the fields.');
      return;
    }
    detener();
    setAnalizando(true);
    try {
      const r = await rellenarCamposDictando(limpio, campos, language);
      const cuantos = Object.keys(r.valores).length;
      if (cuantos === 0) {
        toast.error(es
          ? 'No se reconoció ningún dato. Prueba diciendo los datos uno por uno: «me llamo…, mi cédula es…».'
          : 'No data was recognised. Try saying the details one by one: "my name is…, my ID is…".');
        setPropuesta(null);
      } else {
        setPropuesta(r.valores);
        setDescartados(r.descartados);
      }
    } catch (e) {
      if (e instanceof AiReviewUpgradeRequiredError) toast.error(e.message);
      else toast.error((e as Error).message);
    } finally {
      setAnalizando(false);
    }
  };

  const aplicar = () => {
    if (!propuesta) return;
    onAplicar(propuesta);
    onCerrar();
  };

  const sobrescribe = propuesta
    ? Object.keys(propuesta).filter((id) => {
        const v = datosActuales[id];
        return v !== undefined && v !== '' && v !== false && String(v) !== String(propuesta[id]);
      })
    : [];

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onClick={onCerrar}>
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-base font-black text-slate-900">
              <Sparkles className="size-4 text-blue-600" />
              {es ? 'Dicta el documento' : 'Dictate the document'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {es
                ? 'Cuenta en voz alta los datos y la IA los reparte en los campos.'
                : 'Say the details out loud and the AI spreads them across the fields.'}
            </p>
          </div>
          <button type="button" onClick={onCerrar} className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {!propuesta ? (
            <>
              {!soportado && (
                <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                  {es
                    ? 'Tu navegador no permite dictar. Puedes escribirlo abajo, o abrir la página en Chrome para usar el micrófono.'
                    : 'Your browser does not support dictation. You can type it below, or open the page in Chrome to use the microphone.'}
                </p>
              )}

              <p className="mb-2 text-xs font-semibold text-slate-500">
                {es ? `Por ejemplo, para «${nombreDocumento}»:` : `For example, for "${nombreDocumento}":`}
              </p>
              <p className="mb-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs italic leading-relaxed text-slate-600">
                {es
                  ? '«Me llamo Duglas Taborda, cédula 1045223, trabajo como analista contable en Comercial ABC desde marzo de 2020 y mi último día será el 30 de agosto.»'
                  : '"My name is John Smith, ID 1045223, I work as an accounting analyst at ABC Trading since March 2020 and my last day will be August 30th."'}
              </p>

              <textarea
                value={texto + (parcial ? (texto ? ' ' : '') + parcial : '')}
                onChange={(e) => setTexto(e.target.value)}
                rows={7}
                placeholder={es ? 'Pulsa el micrófono y habla, o escribe aquí…' : 'Press the microphone and speak, or type here…'}
                className="w-full resize-none rounded-2xl border border-slate-200 px-3.5 py-3 text-sm leading-relaxed text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
              />
              <p className="mt-1.5 text-xs text-slate-400">
                {es
                  ? 'Revísalo antes de continuar: el micrófono a veces confunde cifras y nombres.'
                  : 'Check it before continuing: the microphone sometimes mishears numbers and names.'}
              </p>
            </>
          ) : (
            <>
              <p className="mb-3 text-xs font-semibold text-slate-500">
                {es
                  ? `Esto es lo que entendí. Se rellenarán ${Object.keys(propuesta).length} campo(s):`
                  : `This is what it understood. ${Object.keys(propuesta).length} field(s) will be filled:`}
              </p>
              <div className="space-y-1.5">
                {Object.entries(propuesta).map(([id, v]) => (
                  <div key={id} className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{etiqueta(id)}</p>
                    <p className="mt-0.5 break-words text-sm text-slate-800">
                      {typeof v === 'boolean' ? (v ? (es ? 'Sí' : 'Yes') : 'No') : String(v)}
                    </p>
                  </div>
                ))}
              </div>

              {sobrescribe.length > 0 && (
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    {es
                      ? `Se cambiará lo que ya habías escrito en: ${sobrescribe.map(etiqueta).join(', ')}. Podrás deshacerlo.`
                      : `This will change what you already typed in: ${sobrescribe.map(etiqueta).join(', ')}. You will be able to undo it.`}
                  </span>
                </p>
              )}

              {descartados > 0 && (
                <p className="mt-2 text-xs text-slate-400">
                  {es
                    ? `Se descartaron ${descartados} dato(s) que no encajaban en ningún campo. Escríbelos a mano.`
                    : `${descartados} value(s) did not fit any field and were discarded. Type them in manually.`}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3.5">
          {!propuesta ? (
            <>
              {soportado && (
                <button
                  type="button"
                  onClick={alternar}
                  className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition ${
                    escuchando ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {escuchando
                    ? <><Square className="size-4 fill-current" />{es ? 'Detener' : 'Stop'}</>
                    : <><Mic className="size-4" />{es ? 'Hablar' : 'Speak'}</>}
                </button>
              )}
              <button
                type="button"
                onClick={analizar}
                disabled={analizando || texto.trim().length < 10}
                className="ml-auto flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}
              >
                {analizando
                  ? <><Loader2 className="size-4 animate-spin" />{es ? 'Leyendo…' : 'Reading…'}</>
                  : <><Sparkles className="size-4" />{es ? 'Rellenar campos' : 'Fill the fields'}</>}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setPropuesta(null)}
                className="rounded-full px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
              >
                {es ? 'Volver' : 'Back'}
              </button>
              <button
                type="button"
                onClick={aplicar}
                className="ml-auto flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition"
                style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}
              >
                <Check className="size-4" />
                {es ? 'Aplicar' : 'Apply'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
