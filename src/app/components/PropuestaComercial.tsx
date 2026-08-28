/**
 * El cuerpo de la cotización, con dos caminos y ninguna obligación de
 * rellenar diez cajas.
 *
 * Antes esta sección eran diez bloques plegables —introducción, problema,
 * solución, beneficios, exclusiones, cronograma, condiciones, garantías, forma
 * de pago, observaciones— cada uno con su textarea. Nadie rellena diez cajas
 * para mandar una cotización de treinta agendas, así que en la práctica la
 * gente escribía en una o en ninguna, y el PDF salía vacío por dentro.
 *
 * Ahora hay dos formas de resolverlo, y las dos terminan en el mismo sitio:
 *
 *   1. PEGAR   — el texto ya escrito se pega tal cual y eso es lo que sale.
 *   2. PEDIRLO — se le dice a la agente qué se necesita, hablando o
 *                escribiendo, y ella redacta el texto y de paso deja los
 *                productos puestos en la tabla.
 *
 * El segundo camino existe porque es lo que la gente ya hace: se van a otra
 * herramienta, escriben «hazme una cotización de 30 agendas a 30.000 cada
 * una», y vuelven a pegar el resultado. Eso es la plataforma perdiendo al
 * usuario a mitad de tarea.
 *
 * Los diez bloques siguen existiendo, plegados, para quien quiera separar su
 * propuesta en secciones. Dejan de ser el camino principal para ser el camino
 * largo, que es lo que siempre fueron.
 */

import { useRef, useState } from 'react';
import { ClipboardType, Loader2, Mic, Sparkles, Square, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDictation, unirDictado } from '../hooks/use-dictation';
import { escribirCotizacion, AiReviewUpgradeRequiredError } from '../services/ai-review-service';
import type { QuoteLineItem } from '../services/quotes-service';

interface Props {
  /** El texto que acabará en el PDF. */
  texto: string;
  onTexto: (v: string) => void;
  language: 'en' | 'es';
  /** Contexto para que la redacción hable del cliente por su nombre. */
  clientName?: string;
  clientCompany?: string;
  projectName?: string;
  /** La agente también deja los productos puestos: es la mitad del trabajo. */
  onItems: (items: QuoteLineItem[]) => void;
  /** Y si se dijo el nombre, teléfono o correo del cliente, también los deja
   *  puestos en su campo — el llamador decide si pisa lo que ya había
   *  (normalmente no, si el campo no está vacío). */
  onCliente?: (c: { name: string; phone: string; email: string }) => void;
}

type Via = 'pegar' | 'pedir';

const EJEMPLO_PEDIDO_ES =
  'Ejemplo: «Hazme una cotización de 30 agendas ejecutivas a 30.000 cada una, '
  + 'con el logo del cliente impreso en la portada y entrega para la primera '
  + 'semana de diciembre en Bogotá.»';
const EJEMPLO_PEDIDO_EN =
  'Example: "Write me a quote for 30 executive planners at 30,000 each, with '
  + 'the client\'s logo printed on the cover, delivered in the first week of '
  + 'December in Bogotá."';

export function PropuestaComercial({
  texto, onTexto, language, clientName, clientCompany, projectName, onItems, onCliente,
}: Props) {
  const es = language === 'es';
  const [via, setVia] = useState<Via>('pegar');
  const [peticion, setPeticion] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);

  // El reconocedor se crea una vez y se quedaría con el valor de ese momento;
  // con la ref siempre concatena sobre lo último que hay escrito.
  const peticionRef = useRef(peticion);
  peticionRef.current = peticion;

  const { escuchando, parcial, alternar, detener, soportado } = useDictation({
    language,
    onTexto: (trozo) => setPeticion((prev) => unirDictado(prev, trozo)),
    onError: (m) => toast.error(m),
  });

  const pedirRedaccion = async () => {
    const pide = peticion.trim();
    if (pide.length < 8) {
      toast.error(es ? 'Cuéntame un poco más de lo que necesitas cotizar.' : 'Tell me a bit more about what you need to quote.');
      return;
    }
    detener();
    setEscribiendo(true);
    try {
      const r = await escribirCotizacion(pide, language, {
        clientName, clientCompany, projectName,
      });

      if (r.proposal) onTexto(r.proposal);

      // Los productos sólo se ponen si de verdad salió alguno. Vaciar una
      // tabla que la persona ya había llenado a mano sería peor que no hacer
      // nada: perdería trabajo suyo sin haberlo pedido.
      if (r.items.length > 0) {
        onItems(r.items.map((it) => ({
          description: it.description, quantity: it.quantity, unit: it.unit,
          unit_price: it.unit_price, discount_pct: it.discount_pct, tax_pct: it.tax_pct,
          option_group: it.option_group || null,
        })));
      }

      const huboCliente = Boolean(onCliente && (r.client.name || r.client.phone || r.client.email));
      if (onCliente && huboCliente) onCliente(r.client);

      const sinPrecio = r.items.filter((i) => !i.unit_price).length;
      const notaCliente = huboCliente
        ? (es ? ' También puse los datos del cliente que dijiste.' : ' I also filled in the client details you mentioned.')
        : '';
      toast.success(
        (sinPrecio > 0
          ? (es
            ? `Listo. Dejé ${sinPrecio === 1 ? 'un producto sin precio' : `${sinPrecio} productos sin precio`} porque no me lo dijiste — ponlo tú y yo sumo.`
            : `Done. I left ${sinPrecio === 1 ? 'one item without a price' : `${sinPrecio} items without a price`} because you didn't mention it — add it and I'll do the maths.`)
          : (es ? 'Listo, ya te lo escribí. Revísalo y cámbiale lo que quieras.' : "Done — I wrote it. Read it over and change anything you like.")
        ) + notaCliente,
      );
      setVia('pegar');
    } catch (err) {
      if (err instanceof AiReviewUpgradeRequiredError) {
        toast.error(err.message);
      } else {
        toast.error(err instanceof Error ? err.message : (es ? 'No pude escribirla.' : 'I could not write it.'));
      }
    } finally {
      setEscribiendo(false);
    }
  };

  const pestana = (id: Via, icono: React.ReactNode, etiqueta: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setVia(id)}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
        via === id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {icono}
      {etiqueta}
    </button>
  );

  return (
    <div data-seccion-voz="propuesta" className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold text-slate-800">
        {es ? 'Propuesta Comercial' : 'Commercial Proposal'}
      </p>
      <p className="mb-4 mt-1 text-xs text-slate-500">
        {es
          ? 'Tienes dos opciones: pegas el texto en el recuadro y eso es exactamente lo que va a quedar en tu cotización, o me dices qué quieres y yo te escribo el texto completo.'
          : 'Two options: paste your text in the box and that is exactly what goes into your quote, or tell me what you need and I will write the whole thing for you.'}
      </p>

      <div className="mb-4 flex gap-1 rounded-2xl bg-slate-100 p-1">
        {pestana('pegar', <ClipboardType className="size-3.5" />, es ? 'Pegar mi texto' : 'Paste my text')}
        {pestana('pedir', <Sparkles className="size-3.5" />, es ? 'Que me lo escriban' : 'Write it for me')}
      </div>

      {via === 'pegar' ? (
        <>
          <textarea
            value={texto}
            onChange={(e) => onTexto(e.target.value)}
            rows={9}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400"
            placeholder={es
              ? 'Pega aquí el texto que quieres que vaya en la cotización.\n\nSale tal cual lo escribas. Deja una línea en blanco entre párrafos, y empieza con un guion las líneas que quieras como lista:\n\n- Agenda ejecutiva de pasta dura, 200 hojas\n- Marcado del logo en la portada'
              : 'Paste here the text you want in the quote.\n\nIt comes out exactly as you write it. Leave a blank line between paragraphs, and start a line with a dash to make it a bullet:\n\n- Hardcover executive planner, 200 pages\n- Logo printed on the cover'}
          />
          <p className="mt-2 text-[11px] text-slate-400">
            {es
              ? 'No hace falta que repitas los precios: van justo debajo, en la tabla de productos.'
              : 'No need to repeat the prices — they appear right below, in the products table.'}
          </p>
        </>
      ) : (
        <>
          <textarea
            value={escuchando && parcial ? unirDictado(peticion, parcial) : peticion}
            onChange={(e) => setPeticion(e.target.value)}
            rows={5}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-relaxed text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400"
            placeholder={es
              ? `Dime qué necesitas cotizar y yo lo escribo todo.\n\n${EJEMPLO_PEDIDO_ES}`
              : `Tell me what you need to quote and I will write it all.\n\n${EJEMPLO_PEDIDO_EN}`}
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {soportado && (
              <button
                type="button"
                onClick={alternar}
                disabled={escribiendo}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition disabled:opacity-50 ${
                  escuchando
                    ? 'bg-red-500 text-white'
                    : 'bg-gradient-to-br from-slate-700 via-slate-500 to-slate-800 text-white shadow-sm'
                }`}
              >
                {escuchando ? <Square className="size-3.5" /> : <Mic className="size-3.5" />}
                {escuchando ? (es ? 'Detener' : 'Stop') : (es ? 'Háblame' : 'Talk to me')}
              </button>
            )}
            <button
              type="button"
              onClick={() => void pedirRedaccion()}
              disabled={escribiendo}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50"
            >
              {escribiendo ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
              {escribiendo
                ? (es ? 'Escribiéndola…' : 'Writing it…')
                : (es ? 'Escríbeme la cotización' : 'Write my quote')}
            </button>
          </div>

          <p className="mt-2.5 text-[11px] leading-relaxed text-slate-400">
            {es
              ? 'Escribo el texto y de paso te dejo los productos puestos en la tabla. Los precios sólo los pongo si me los dices — nunca me los invento.'
              : "I write the text and leave the products filled in below. I only set a price if you tell me one — I never make prices up."}
          </p>
        </>
      )}
    </div>
  );
}
