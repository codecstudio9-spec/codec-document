import { useEffect, useMemo, useRef, useState } from 'react';
import type { DetectedField } from '../../../lib/docxTemplateEngine';
import { fetchDocxArrayBuffer, inferSectionsFromDocx, withInferredSections } from '../../../lib/docxTemplateEngine';
import { rememberFieldValue, recallFieldValue } from '../../utils/field-memory';
import { DictarFormulario } from '../DictarFormulario';
import { BotonDictado } from '../BotonDictado';
import { useGuiaFormulario } from '../../hooks/use-guia-formulario';
import type { DocumentField } from '../../types/document';

interface DynamicDocFormProps {
  fields: DetectedField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  language: 'en' | 'es';
  /** Nombre de la plantilla, para el ejemplo del panel de dictado y para que
   *  la guía por voz diga qué se está llenando. */
  nombreDocumento?: string;
  /** Si esta cuenta puede usar el dictado con IA. Cambia lo que dice la guía:
   *  a quien ya lo tiene se le explica cómo usarlo, y a quien no, qué gana. */
  tienePremium?: boolean;
  /** Falso en el enlace público: lo rellena un invitado sin sesión y el
   *  dictado devolvería «necesitas iniciar sesión». */
  mostrarDictado?: boolean;
  /** Field keys that should render with a red border/label — set by the
   * caller after a failed "Next"/"Generate" click, so the user can see
   * exactly which required fields are still empty instead of only a
   * generic toast. */
  invalidKeys?: Set<string>;
  /** El Word de la plantilla. Si la plantilla no tiene secciones puestas a
   *  mano, se sacan de los títulos del propio documento. */
  docxFileUrl?: string;
}

/**
 * Renders one input per detected {{variable}} from a Word template —
 * text/date/number/choice, using each field's own label (either the
 * contextual label lifted from text like "Nombre del Cliente: {{tag}}",
 * or a humanized version of the variable key — see
 * src/lib/docxTemplateEngine.ts). A `type: 'section'` field renders as a
 * full-width group heading instead of an input, letting a template owner
 * break a long form into labeled subsections (see the editor's "Agregar
 * subsección" control).
 *
 * Single column on phones, two columns from `md` up — a form with 10+
 * fields (common for a real contract template) reads as one long scroll
 * on mobile either way, so single-column there is still the right call;
 * two columns is purely a desktop/tablet space win. Multi-choice fields
 * with more than a few options span both columns so the dropdown/options
 * don't fight a narrow half-width column.
 */
export function DynamicDocForm({ fields: camposOriginales, values, onChange, language, invalidKeys, nombreDocumento, tienePremium = false, mostrarDictado = true, docxFileUrl }: DynamicDocFormProps) {
  const [dictadoAbierto, setDictadoAbierto] = useState(false);

  // Secciones sacadas del Word cuando la plantilla no trae las suyas. Si el
  // documento no se puede leer, el formulario sale como antes, sin agrupar:
  // es una ayuda de lectura, nunca un motivo para no poder llenar.
  const [seccionesDelDocumento, setSeccionesDelDocumento] = useState<Map<string, string>>(new Map());
  const yaTieneSecciones = camposOriginales.some((f) => f.type === 'section');
  useEffect(() => {
    if (!docxFileUrl || yaTieneSecciones) return;
    let cancelado = false;
    fetchDocxArrayBuffer(docxFileUrl)
      .then((buf) => { if (!cancelado) setSeccionesDelDocumento(inferSectionsFromDocx(buf)); })
      .catch(() => { /* sin secciones automáticas */ });
    return () => { cancelado = true; };
  }, [docxFileUrl, yaTieneSecciones]);
  const fields = useMemo(
    () => withInferredSections(camposOriginales, seccionesDelDocumento),
    [camposOriginales, seccionesDelDocumento],
  );

  /**
   * Los campos detectados en el Word, en el formato que entiende el panel de
   * dictado.
   *
   * Una plantilla de Word puede traer treinta variables, que es justo donde
   * dictar rinde más: contar los datos de corrido y encontrarse el formulario
   * medio lleno. Las secciones se quedan fuera porque son títulos, no campos,
   * y `choice` se traduce a `select` para que el modelo sepa que tiene que
   * copiar una de las opciones tal cual en vez de inventar el texto.
   */
  const camposParaDictado: DocumentField[] = useMemo(() => {
    // Cada campo lleva el título de su sección: «Celular» del estudiante y
    // «Celular» de la referencia son campos distintos, y sin la sección ni
    // quien dicta ni la IA saben cuál es cuál.
    let seccion = '';
    const out: DocumentField[] = [];
    for (const f of fields) {
      if (f.type === 'section') { seccion = f.label; continue; }
      out.push({
        id: f.key,
        label: f.label,
        type: f.type === 'choice' ? 'select' : f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text',
        options: f.options,
        required: f.required,
        section: seccion || undefined,
      });
    }
    return out;
  }, [fields]);
  /**
   * Guía por voz. Las secciones son las que el dueño de la plantilla creó con
   * «Agregar subsección»: sus propios títulos, así que el guion sale de la
   * plantilla y no de una lista fija — cada plantilla de Word es distinta y
   * decir siempre lo mismo no ayudaría a nadie.
   */
  //
  // Cada sección dice QUÉ datos lleva: «Referencia familiar: aquí van nombre
  // completo, celular y parentesco». Antes era la misma frase genérica en
  // todas, que no ayudaba a saber qué tener a mano ni qué dictar.
  const seccionesDeVoz = useMemo(() => {
    const mapa: Record<string, { es: string; en: string }> = {};
    fields.forEach((f, i) => {
      if (f.type !== 'section') return;
      const siguientes: DetectedField[] = [];
      for (const g of fields.slice(i + 1)) {
        if (g.type === 'section') break;
        siguientes.push(g);
      }
      const nombres = siguientes.slice(0, 7).map((g) => g.label.toLowerCase());
      const mas = siguientes.length > 7;
      const lista = (y: string) => nombres.length <= 1
        ? nombres.join('')
        : `${nombres.slice(0, -1).join(', ')} ${y} ${nombres[nombres.length - 1]}`;
      const obligatorios = siguientes.filter((g) => g.required).length;
      mapa[f.key] = siguientes.length === 0
        ? { es: `Sección ${f.label}.`, en: `Section ${f.label}.` }
        : {
          es: `Sección ${f.label}. Aquí van ${lista('y')}${mas ? ', entre otros' : ''}.${obligatorios ? ' Los que tienen asterisco son obligatorios; si alguno no aplica, escribe N A.' : ''}`,
          en: `Section ${f.label}. This part asks for ${lista('and')}${mas ? ', among others' : ''}.${obligatorios ? ' Fields with an asterisk are required; if one does not apply, type N A.' : ''}`,
        };
    });
    return mapa;
  }, [fields]);

  useGuiaFormulario({
    nombreDocumento: nombreDocumento || (language === 'en' ? 'this document' : 'este documento'),
    cuantosCampos: camposParaDictado.length,
    tienePremium,
    secciones: seccionesDeVoz,
    mencionarDictado: mostrarDictado,
  });

  // Pre-fill empty fields from the last value remembered for that LABEL,
  // once per field the first time it appears — never overwrites something
  // the user (or the template) already put in `values`.
  //
  // Salvo si la etiqueta se repite en el formulario: «Celular» del estudiante
  // y «Celular» de la referencia comparten etiqueta, y precargar recordaría
  // el mismo número en los dos.
  const prefilled = useRef(new Set<string>());
  useEffect(() => {
    const repetidas = new Set(
      fields.filter((f) => f.type !== 'section').map((f) => f.label.trim().toLowerCase())
        .filter((l, i, arr) => arr.indexOf(l) !== i),
    );
    for (const f of fields) {
      if (f.type === 'section' || prefilled.current.has(f.key)) continue;
      if (repetidas.has(f.label.trim().toLowerCase())) { prefilled.current.add(f.key); continue; }
      prefilled.current.add(f.key);
      if (!values[f.key]?.trim()) {
        const remembered = recallFieldValue(f.label);
        if (remembered) onChange(f.key, remembered);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields]);

  return (
    <>
      {dictadoAbierto && mostrarDictado && (
        <DictarFormulario
          campos={camposParaDictado}
          language={language}
          nombreDocumento={nombreDocumento || (language === 'en' ? 'this document' : 'este documento')}
          datosActuales={values}
          onAplicar={(vals) => {
            for (const [clave, valor] of Object.entries(vals)) onChange(clave, String(valor));
          }}
          onCerrar={() => setDictadoAbierto(false)}
        />
      )}

      {mostrarDictado && camposParaDictado.length > 0 && (
        <BotonDictado
          onClick={() => setDictadoAbierto(true)}
          language={language}
          cuantosCampos={camposParaDictado.length}
          className="mb-4"
        />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {fields.map((f) => {
        if (f.type === 'section') {
          return (
            <div key={f.key} data-seccion-voz={f.key} className="col-span-1 mt-2 border-b border-slate-200 pb-1.5 first:mt-0 md:col-span-2">
              <h3 className="text-xs font-black uppercase tracking-wide text-indigo-600">{f.label}</h3>
            </div>
          );
        }

        const wide = f.type === 'choice' && (f.options?.length ?? 0) > 3;
        const invalid = invalidKeys?.has(f.key) ?? false;
        const fieldClass = `w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-indigo-400 ${
          invalid ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-slate-200'
        }`;

        return (
          <div key={f.key} className={wide ? 'md:col-span-2' : undefined}>
            <label className={`mb-1 block text-xs font-bold ${invalid ? 'text-red-600' : 'text-slate-600'}`}>
              {f.label}
              {f.required && <span className="text-red-500"> *</span>}
            </label>
            {f.type === 'choice' ? (
              <select
                value={values[f.key] ?? ''}
                onChange={(e) => onChange(f.key, e.target.value)}
                onBlur={() => rememberFieldValue(f.label, values[f.key] ?? '')}
                className={fieldClass}
              >
                <option value="">{language === 'en' ? 'Select...' : 'Selecciona...'}</option>
                {(f.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : (
              <input
                type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}
                value={values[f.key] ?? ''}
                onChange={(e) => onChange(f.key, e.target.value)}
                onBlur={(e) => rememberFieldValue(f.label, e.target.value)}
                className={fieldClass}
              />
            )}
            {invalid && (
              <p className="mt-1 text-[11px] font-semibold text-red-500">
                {language === 'en' ? 'Required' : 'Obligatorio'}
              </p>
            )}
          </div>
        );
      })}
      </div>
    </>
  );
}
