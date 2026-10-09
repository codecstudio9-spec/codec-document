import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { Loader } from 'lucide-react';
import {
  fetchDocxArrayBuffer, extractFormattedParagraphs, applyClauseOverrides, applyExtraClauses,
  type DetectedField, type DocxParagraph, type ExtraClause,
} from '../../../lib/docxTemplateEngine';

/**
 * El documento tal como va quedando mientras se llena el formulario: cada
 * dato escrito aparece en su lugar, resaltado, y los que faltan se ven como
 * una etiqueta amarilla con su nombre. Se abre sólo si el cliente lo pide
 * (botón «Ver documento» en GenerateSendModal).
 *
 * Usa el mismo Word y las mismas cláusulas editadas que el PDF final, así que
 * lo que se ve es el texto que se va a firmar. La tipografía imita la del PDF
 * (título centrado, cláusulas con el encabezado en negrita, texto
 * justificado) sin pretender ser idéntica página por página.
 */
export function VistaPreviaDocumento({
  docxFileUrl, clauseOverrides, extraClauses, fields, values, language, campoActivo,
}: {
  docxFileUrl: string;
  clauseOverrides?: Record<string, string>;
  extraClauses?: ExtraClause[];
  fields: DetectedField[];
  values: Record<string, string>;
  language: 'en' | 'es';
  campoActivo?: string | null;
}) {
  const es = language === 'es';
  const [parrafos, setParrafos] = useState<DocxParagraph[] | null>(null);
  const [error, setError] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let vivo = true;
    setParrafos(null);
    setError(false);
    fetchDocxArrayBuffer(docxFileUrl)
      .then((buf) => {
        if (!vivo) return;
        setParrafos(applyExtraClauses(applyClauseOverrides(extractFormattedParagraphs(buf), clauseOverrides), extraClauses));
      })
      .catch(() => { if (vivo) setError(true); });
    return () => { vivo = false; };
  }, [docxFileUrl, clauseOverrides, extraClauses]);

  // Al pasar a otro campo del formulario, el documento se desplaza hasta él.
  useEffect(() => {
    if (!campoActivo || !contenedor.current) return;
    const el = contenedor.current.querySelector<HTMLElement>(`[data-campo="${CSS.escape(campoActivo)}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [campoActivo]);

  const etiquetaDe = useMemo(() => new Map(fields.map((f) => [f.key, f.label])), [fields]);

  const enfocarCampo = (clave: string) => {
    const input = document.getElementById(`campo-${clave}`);
    input?.focus();
    input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  if (error) {
    return <p className="p-6 text-center text-sm text-slate-500">{es ? 'No se pudo mostrar el documento.' : 'Could not show the document.'}</p>;
  }
  if (!parrafos) {
    return <div className="flex items-center justify-center p-10"><Loader className="size-5 animate-spin text-slate-400" /></div>;
  }

  let tituloPuesto = false;

  const pintar = (para: DocxParagraph, i: number) => {
    // Texto con su negrita carácter por carácter, para poder cortar los
    // {{campos}} aunque Word los haya partido en varios trozos.
    const chars: Array<{ ch: string; bold: boolean }> = [];
    for (const r of para.runs) for (const ch of r.text) chars.push({ ch, bold: r.bold });
    const texto = chars.map((c) => c.ch).join('');
    if (!texto.trim()) return <div key={i} className="h-2" />;

    const t = texto.trim();
    const mayus = t === t.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(t);
    const esDato = (t.match(/:\s*\S/g) ?? []).length >= 2;
    let rol: 'titulo' | 'seccion' | 'clausula' | 'cuerpo' = 'cuerpo';
    if (!tituloPuesto && mayus && t.replace(/\{\{[^}]*\}\}/g, '').length >= 10 && !esDato) { rol = 'titulo'; tituloPuesto = true; }
    else if (mayus && t.length < 70 && !esDato) rol = 'seccion';
    else if (/^(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|S[ÉE]PTIMA|OCTAVA|NOVENA|D[ÉE]CIMA|PAR[ÁA]GRAFO|FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\b[^:]{0,80}:/iu.test(t)) rol = 'clausula';
    const finEncabezado = rol === 'clausula' ? (texto.indexOf(':') + 1) : 0;

    const nodos: ReactElement[] = [];
    let literal = '';
    let negritaLiteral = false;
    const cerrarLiteral = (k: string) => {
      if (!literal) return;
      nodos.push(negritaLiteral ? <strong key={k}>{literal}</strong> : <span key={k}>{literal}</span>);
      literal = '';
    };

    const tagRe = /\{\{\s*([^}:]+?)\s*(?::[^}]*)?\}\}/g;
    let cursor = 0;
    const agregarLiteral = (desde: number, hasta: number) => {
      for (let k = desde; k < hasta; k++) {
        const negrita = chars[k].bold || k < finEncabezado;
        if (literal && negrita !== negritaLiteral) cerrarLiteral(`l${k}`);
        negritaLiteral = negrita;
        literal += chars[k].ch;
      }
    };
    for (const m of texto.matchAll(tagRe)) {
      agregarLiteral(cursor, m.index!);
      cerrarLiteral(`l${m.index}`);
      const clave = m[1];
      const valor = (values[clave] ?? '').trim();
      const activo = campoActivo === clave;
      nodos.push(
        <button
          key={`c${m.index}`}
          type="button"
          data-campo={clave}
          onClick={() => enfocarCampo(clave)}
          // Un <button> no hereda el tamaño de letra del párrafo: sin esto el
          // dato escrito salía más grande que el texto que lo rodea.
          style={{ fontSize: valor ? 'inherit' : undefined, lineHeight: 'inherit' }}
          className={valor
            ? `rounded px-0.5 text-left font-semibold text-indigo-900 transition ${activo ? 'bg-indigo-200 ring-2 ring-indigo-400' : 'bg-indigo-50 hover:bg-indigo-100'}`
            : `rounded border-b border-dashed px-1 text-left font-sans text-[10.5px] font-bold transition ${activo ? 'border-indigo-500 bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300' : 'border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
          title={etiquetaDe.get(clave) ?? clave}
        >
          {valor || (etiquetaDe.get(clave) ?? clave)}
        </button>,
      );
      cursor = m.index! + m[0].length;
    }
    agregarLiteral(cursor, chars.length);
    cerrarLiteral('fin');

    const clase = rol === 'titulo'
      ? 'mb-4 mt-1 text-center text-[15px] font-bold uppercase tracking-wide'
      : rol === 'seccion'
        ? 'mt-3 font-bold uppercase'
        : para.align === 'center'
          ? 'text-center'
          : para.align === 'right'
            ? 'text-right'
            : 'text-justify';
    return <p key={i} className={`whitespace-pre-wrap ${clase}`}>{nodos}</p>;
  };

  return (
    <div ref={contenedor} className="h-full overflow-y-auto bg-slate-100 p-3 sm:p-5">
      <div className="mx-auto min-h-full max-w-[640px] space-y-2 rounded-sm bg-white px-6 py-8 font-sans text-[12.5px] leading-[1.6] text-slate-900 shadow-md sm:px-10">
        {parrafos.map(pintar)}
      </div>
    </div>
  );
}
