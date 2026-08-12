import { memo, useEffect, useMemo, useRef } from 'react';
import { DocumentData } from '../types/document';
import { useLanguage } from '../contexts/language-context';
import { enrichDocumentDataWithDates } from '../utils/document-dates';

const EMPTY_FIELD_TOKEN = '__EMPTY_FIELD__';
const ACTIVE_EMPTY_TOKEN = '__ACTIVE_EMPTY__';
const ACTIVE_OPEN = '\x01';
const ACTIVE_CLOSE = '\x02';

interface DocumentPreviewProps {
  template: string;
  data: DocumentData;
  activeFieldId?: string;
  showWatermark?: boolean;
  /** Base64 or URL of the signature to stamp in the LEFT column (Arrendador / Party 1) */
  leftSignatureUrl?: string;
  /** Base64 or URL of the signature to stamp in the RIGHT column (Arrendatario / Party 2) */
  rightSignatureUrl?: string;
  /** Id de la plantilla. Con él, las opciones elegidas en un desplegable se
   *  muestran en el idioma del documento y no en su forma canónica inglesa. */
  templateId?: string;
  /**
   * Idioma del DOCUMENTO, que no siempre es el de la interfaz.
   *
   * En la vista previa se puede elegir descargar en inglés teniendo la app en
   * español. Sin este dato, la plantilla llegaba en inglés pero las fechas y
   * los términos locales se resolvían con el idioma de la interfaz, y el
   * documento salía mezclado: «SUBJECT: Voluntary resignation… con cédula de
   * ciudadanía… 12 de agosto de 2026».
   */
  documentLanguage?: 'en' | 'es';
}

// US Legal Standard document formatting
function formatDocumentContent(
  content: string,
  leftSigUrl?: string,
  rightSigUrl?: string,
  /** Los valores que escribió el usuario, en mayúsculas. Un dato suyo nunca se
   *  maqueta como encabezado, aunque venga todo en mayúsculas. */
  datosUsuario: Set<string> = new Set(),
): React.ReactNode {
  const renderSolidDivider = (key: string) => (
    <div key={key} className="my-3">
      <div className="border-b border-slate-300 w-full" aria-hidden="true" />
    </div>
  );

  const renderTokens = (text: string, keyPrefix: string): React.ReactNode => {
    const hasAny = text.includes(EMPTY_FIELD_TOKEN) || text.includes(ACTIVE_EMPTY_TOKEN) || text.includes(ACTIVE_OPEN);
    if (!hasAny) return text;
    const parts = text.split(new RegExp(`(${ACTIVE_OPEN}[^${ACTIVE_CLOSE}]*${ACTIVE_CLOSE}|${ACTIVE_EMPTY_TOKEN}|${EMPTY_FIELD_TOKEN})`, 'g'));
    return parts.map((part, i) => {
      if (part === EMPTY_FIELD_TOKEN) {
        return <span key={`${keyPrefix}-ef-${i}`} className="inline-flex min-w-[8rem] h-[1.1em] border-b border-slate-400 align-bottom mx-1" aria-hidden="true" />;
      }
      if (part === ACTIVE_EMPTY_TOKEN) {
        return <span key={`${keyPrefix}-ae-${i}`} data-active-field="true" className="inline-flex min-w-[8rem] h-[1.1em] border-b-2 border-blue-400 align-bottom mx-1 animate-pulse bg-blue-50/60 rounded-sm" aria-hidden="true" />;
      }
      if (part.startsWith(ACTIVE_OPEN) && part.endsWith(ACTIVE_CLOSE)) {
        return <mark key={`${keyPrefix}-av-${i}`} data-active-field="true" className="bg-yellow-100 border-b-2 border-blue-500 rounded-sm px-0.5 not-italic font-[inherit]">{part.slice(1, -1)}</mark>;
      }
      return part || null;
    });
  };

  // Separador horizontal. Las plantillas lo escriben con guiones o con una
  // fila de comillas —la convención que ya venía del catálogo—, y hasta ahora
  // sólo se reconocía la de guiones: la de comillas caía en la rama de título
  // en mayúsculas y se imprimía tal cual, una banda de setenta y cinco
  // comillas centrada y en negrita en mitad del contrato.
  const DIVIDER_RE = /^(-{5,}|"{5,})$/;

  // Ojo con el orden: esto se comprueba DESPUÉS del separador, porque una
  // línea de guiones no debe confundirse con un renglón de firma.
  const SIG_LINE_RE = /_{5,}|Signature\s*:|Firma\s*:/i;

  // El título del documento es el primer renglón en mayúsculas, y el único
  // que va centrado y a mayor cuerpo. Todo lo demás en mayúsculas es un
  // encabezado de cláusula y va a la izquierda.
  let tituloEmitido = false;
  const LEGAL_TERMS = [
    'WITNESSETH', 'WHEREAS', 'NOW THEREFORE', 'IN WITNESS WHEREOF',
    'CONSIDERANDO', 'POR LO TANTO', 'EN TESTIMONIO DE LO CUAL',
    'IMPORTANT', 'IMPORTANTE', 'WARNING', 'ADVERTENCIA',
    'ATTESTATION', 'NOTARY', 'NOTARIO', 'IN WITNESS',
  ];

  // ── Normal single-line renderer ───────────────────────────────────────────────
  function renderLine(trimmedLine: string, key: string, gapClass: string, inSigBlock: boolean): React.ReactNode {
    if (DIVIDER_RE.test(trimmedLine)) return renderSolidDivider(key);

    if (SIG_LINE_RE.test(trimmedLine)) {
      const label = trimmedLine.replace(/_{5,}/g, '').replace(/Signature\s*:/i, '').replace(/Firma\s*:/i, '').trim();
      return (
        <div key={key} className={`mt-3 ${gapClass}`} style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}>
          <div className="border-b-[1.5px] border-black w-full" />
          {label && <p className="mt-0.5 text-[10px] font-semibold text-black">{label}</p>}
        </div>
      );
    }

    if (inSigBlock && /^(Name|Nombre|Title|Cargo|Date|Fecha|Printed Name|Role)\s*:/i.test(trimmedLine)) {
      const colonIdx = trimmedLine.indexOf(':');
      const label    = trimmedLine.slice(0, colonIdx).trim();
      const rest     = trimmedLine.slice(colonIdx + 1).trim();
      return (
        <div key={key} className="mt-0.5 flex items-baseline gap-1" style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}>
          <span className="text-[10px] font-bold text-black min-w-[60px]">{label}:</span>
          {rest
            ? <span className="text-[10px] font-semibold text-black">{rest}</span>
            : <span className="flex-1 border-b border-slate-600 min-w-[130px] h-[1em]" />
          }
        </div>
      );
    }

    // Debajo del renglón de firma van el nombre, el documento y el teléfono.
    // Con el tratamiento de párrafo normal salían sangrados y justificados,
    // que es lo contrario de lo que se espera ahí: un bloque de firma se lee
    // en columna, pegado al margen.
    //
    // Va ANTES de la rama de mayúsculas, y no después, porque «C.C. 1.045.223»
    // y «311 272 6359» son sólo letras mayúsculas, cifras y puntos: la rama de
    // mayúsculas los reclamaba y los centraba como si fueran encabezados.
    if (inSigBlock) {
      return (
        <div key={key} className={`text-[10px] leading-[1.35] ${gapClass}`}>
          {renderTokens(trimmedLine, `sig-${key}`)}
        </div>
      );
    }

    // Sin CIFRAS, y no es un detalle: «C.C. 1022925002» es mayúsculas con
    // números y se maquetaba como encabezado justo debajo de la firma, donde
    // sólo es un dato. «ARTÍCULO 1 - VENTA» también lleva número, y lo recoge
    // mejor la rama de artículos de más abajo, que es la que sabe qué es.
    //
    // Y nunca es encabezado un valor que escribió el usuario: quien puso el
    // nombre de su empresa en mayúsculas se lo encontraba compuesto como
    // título del documento.
    if (
      /^[A-ZÀ-ſ\s\-–—()&,.'"]+$/.test(trimmedLine) &&
      trimmedLine.length > 3 && trimmedLine.length <= 80 &&
      !/[:;]/.test(trimmedLine) &&
      !datosUsuario.has(trimmedLine.toUpperCase())
    ) {
      // Sólo el título del documento va centrado. Los encabezados de cláusula
      // van a la izquierda, que es como se componen en un contrato de verdad:
      // centrarlos todos rompe el eje de lectura —el ojo salta al centro y
      // vuelve al margen en cada cláusula— y además hace que el título no se
      // distinga de las cláusulas, porque comparten alineación.
      //
      // Es también lo que ya hacía el maquetador del PDF, que centra el
      // primero y alinea el resto a la izquierda. Los dos coinciden por fin:
      // hasta ahora la vista previa y el documento descargado componían los
      // encabezados de forma distinta.
      const esTitulo = !tituloEmitido;
      tituloEmitido = true;
      return (
        <div
          key={key}
          className={`font-bold uppercase leading-tight ${
            esTitulo
              ? 'text-center text-[13px] tracking-[0.08em] mt-[0.2em] mb-[0.9em]'
              : 'text-[10.5px] tracking-[0.06em] mt-[0.5em] mb-[0.15em]'
          } ${gapClass}`}
          style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
        >
          {renderTokens(trimmedLine, `title-${key}`)}
        </div>
      );
    }

    if (/^(ARTICLE|ART\.|ARTÍCULO|SECTION|SECCIÓN)\s+[IVXivx\d]+/i.test(trimmedLine)) {
      return (
        <div key={key} className={`font-bold uppercase tracking-wide text-[10px] leading-tight mt-[0.4em] mb-[0.05em] ${gapClass}`} style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}>
          {renderTokens(trimmedLine, `article-${key}`)}
        </div>
      );
    }

    if (/^\d+\.\d+/.test(trimmedLine)) {
      const match = trimmedLine.match(/^(\d+\.\d+\s+[A-ZÀ-ſ][A-ZÀ-ſ\s.]+?)(\s+.*)$/s);
      if (match) {
        return (
          <div key={key} className={`text-[10px] leading-[1.2] ${gapClass}`}>
            <span className="font-bold">{match[1]}</span>
            <span>{renderTokens(match[2], `sub-${key}`)}</span>
          </div>
        );
      }
      return (
        <div key={key} className={`text-[10px] leading-[1.2] ${gapClass}`}>
          {renderTokens(trimmedLine, `numbered-${key}`)}
        </div>
      );
    }

    if (/^[A-ZÀ-ſ][A-Za-zÀ-ſ\s/()-]+:\s/.test(trimmedLine)) {
      const colonIdx = trimmedLine.indexOf(':');
      const label    = trimmedLine.slice(0, colonIdx);
      const rest     = trimmedLine.slice(colonIdx + 1);
      return (
        <div key={key} className={`text-[10px] leading-[1.2] ${gapClass}`}>
          <span className="font-semibold">{label}:</span>
          {renderTokens(rest, `lbl-${key}`)}
        </div>
      );
    }

    // Enumeraciones «a) …», «b) …». La sangría de primera línea las rompía:
    // sangraba la letra y dejaba el resto del texto pegado al margen. Con
    // sangría francesa la letra queda fuera y el párrafo alineado bajo sí
    // mismo, que es como se compone una enumeración.
    if (/^[a-z]\)\s/.test(trimmedLine) || /^[•·]\s/.test(trimmedLine)) {
      return (
        <div
          key={key}
          className={`text-[10px] text-justify leading-[1.2] ${gapClass}`}
          style={{ paddingLeft: '1.4em', textIndent: '-1.4em' }}
        >
          {renderTokens(trimmedLine, `item-${key}`)}
        </div>
      );
    }

    let formattedLine = trimmedLine;
    LEGAL_TERMS.forEach(term => {
      formattedLine = formattedLine.replace(new RegExp(`\\b${term}\\b`, 'gi'), `**${term}**`);
    });

    if (formattedLine.includes('**')) {
      const parts = formattedLine.split(/(\*\*[^*]+\*\*)/g);
      return (
        <div key={key} className={`text-[10px] text-justify leading-[1.2] ${gapClass}`}>
          {parts.map((part, i) =>
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>
              : renderTokens(part, `bold-${key}-${i}`)
          )}
        </div>
      );
    }

    return (
      <div key={key} className={`text-[10px] text-justify leading-[1.2] indent-[1em] ${gapClass}`}>
        {renderTokens(trimmedLine, `line-${key}`)}
      </div>
    );
  }

  // ── Enhanced renderer for lines inside a flex signature column ────────────────
  function renderFlexColLine(trimmedLine: string, key: string, sigUrl?: string): React.ReactNode {
    if (!trimmedLine) return null;
    if (/^-{5,}$/.test(trimmedLine)) {
      return <div key={key} style={{ borderTop: '1px solid #e2e8f0', width: '100%', margin: '6px 0' }} />;
    }
    if (SIG_LINE_RE.test(trimmedLine)) {
      const m        = trimmedLine.match(/^([^_]*)_{5,}(.*)$/s);
      const rawLabel = m ? m[1].trim().replace(/:$/, '').trim() : '';
      const rawDate  = m ? m[2].replace(/_{5,}/g, '').trim() : '';
      return (
        <div key={key} style={{ marginTop: 14 }}>
          <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, marginBottom: 10, overflow: 'hidden', backgroundColor: sigUrl ? 'transparent' : '#f9fafb', border: sigUrl ? 'none' : '1px dashed #e2e8f0' }}>
            {sigUrl ? (
              <img src={sigUrl} alt="Firma" data-sig="true" style={{ maxHeight: 64, maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
            ) : (
              <span style={{ color: '#cbd5e1', fontSize: 11, fontStyle: 'italic', fontFamily: 'system-ui, sans-serif' }}>
                Espacio para firma
              </span>
            )}
          </div>
          <div style={{ borderTop: '1.5px solid #1e293b', width: '100%', marginBottom: 6 }} />
          {rawLabel && (
            <strong style={{ fontSize: 10, color: '#0f172a', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: '"Times New Roman", Times, Georgia, serif' }}>
              {rawLabel}
            </strong>
          )}
          {rawDate && (
            <span style={{ fontSize: 9, color: '#64748b', display: 'block', marginTop: 3, fontFamily: '"Times New Roman", Times, Georgia, serif' }}>
              {rawDate}
            </span>
          )}
        </div>
      );
    }
    // All-caps label (e.g. "ARRENDADOR:" with colon)
    if (/^[A-Z0-9\sÀ-ſ\-–—()&,.:'"]+$/.test(trimmedLine) && trimmedLine.length > 2 && trimmedLine.length <= 60) {
      return (
        <div key={key} style={{ fontWeight: 700, fontSize: 10, color: '#1e293b', marginBottom: 6, fontFamily: '"Times New Roman", Times, Georgia, serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {trimmedLine}
        </div>
      );
    }
    return (
      <div key={key} style={{ fontSize: 10, color: '#475569', marginBottom: 2, fontFamily: '"Times New Roman", Times, Georgia, serif' }}>
        {renderTokens(trimmedLine, key)}
      </div>
    );
  }

  // ── Render a paragraph's lines in normal flow ─────────────────────────────────
  function renderParaLines(lines: string[], baseKey: string): React.ReactNode[] {
    let blankCount = 0;
    let inSigBlock = false;
    return lines.flatMap((line, li) => {
      const trimmed = line.trim();
      if (!trimmed) { blankCount++; return [] as React.ReactNode[]; }
      // Una línea en blanco en la plantilla se convertía en 0,18em, que a
      // 10px son menos de dos píxeles: en la práctica no se veía, y el
      // documento salía como un bloque continuo sin respiración entre la
      // fecha y el destinatario o entre un párrafo y el siguiente. Ahora
      // separa de verdad, y dos líneas en blanco separan el doble, que es lo
      // que la plantilla quiere decir cuando las escribe.
      const gapClass = blankCount >= 2 ? 'mt-[1.5em]' : blankCount === 1 ? 'mt-[0.85em]' : '';
      blankCount = 0;
      if (SIG_LINE_RE.test(trimmed)) inSigBlock = true;
      const node = renderLine(trimmed, `${baseKey}-${li}`, gapClass, inSigBlock);
      return node ? [node] : [] as React.ReactNode[];
    });
  }

  // ── Render a paragraph's lines inside a flex signature column ─────────────────
  function renderFlexColLines(lines: string[], baseKey: string, sigUrl?: string): React.ReactNode[] {
    return lines.flatMap((line, li) => {
      const trimmed = line.trim();
      if (!trimmed) return [] as React.ReactNode[];
      const node = renderFlexColLine(trimmed, `${baseKey}-${li}`, sigUrl);
      return node ? [node] : [] as React.ReactNode[];
    });
  }

  // ── Build paragraph list (blank-line-separated groups) ───────────────────────
  // `blancosAntes` es cuántas líneas en blanco separaban este párrafo del
  // anterior en la plantilla.
  //
  // Antes se perdía: el separador consumía las líneas vacías y nadie volvía a
  // preguntar por ellas, así que todos los párrafos quedaban pegados sin
  // ninguna separación —el documento salía como un muro de texto, sin aire
  // entre la fecha y el destinatario ni entre un párrafo y el siguiente—.
  // Y una plantilla que deja tres líneas en blanco antes de la firma lo hace
  // para reservar sitio donde firmar; esa intención también se perdía.
  type Para = { lines: string[]; pidx: number; isSig: boolean; blancosAntes: number };
  const allLines = content.split('\n');
  const paragraphs: Para[] = [];
  let cur: string[] = [];
  let pidx = 0;
  let blancos = 0;

  const cerrar = () => {
    if (cur.length === 0) return;
    paragraphs.push({
      lines: cur,
      pidx: pidx++,
      isSig: cur.some(l => SIG_LINE_RE.test(l.trim())),
      blancosAntes: paragraphs.length === 0 ? 0 : blancos,
    });
    cur = [];
    blancos = 0;
  };

  for (const line of allLines) {
    if (line.trim() === '') {
      cerrar();
      blancos++;
    } else {
      cur.push(line);
    }
  }
  cerrar();

  /** El hueco antes de un párrafo, en función de cuántas líneas en blanco lo
   *  precedían. Se topa: una plantilla con cinco saltos seguidos quiere
   *  espacio para firmar, no media página vacía. */
  const separacion = (n: number): string =>
    n <= 0 ? '' : n === 1 ? 'mt-[0.9em]' : n === 2 ? 'mt-[1.6em]' : 'mt-[2.6em]';

  // ── Detect and pair adjacent signature sections for side-by-side layout ──────
  // Pattern: (header + sigPara) + (header + sigPara) within a gap of ≤3 paragraphs
  const sigIndices = paragraphs.reduce<number[]>((acc, p, i) => { if (p.isSig) acc.push(i); return acc; }, []);

  type FlexBlock = { startIdx: number; endIdx: number; leftParas: Para[]; rightParas: Para[] };
  const flexBlocks: FlexBlock[] = [];

  /** ¿Hay una línea divisoria entre estos dos párrafos? Un separador es una
   *  frontera visual explícita: lo que queda a cada lado pertenece a partes
   *  distintas del documento y no puede fundirse en una misma fila.
   *
   *  Sin esta comprobación, en la carta de renuncia la firma de quien renuncia
   *  se maquetaba en dos columnas junto al «Recibido por» de la constancia de
   *  recibido, que va después del separador y es de otra persona. */
  const hayDivisorEntre = (desde: number, hasta: number): boolean => {
    for (let j = desde + 1; j < hasta; j++) {
      if (paragraphs[j].lines.length === 1 && DIVIDER_RE.test(paragraphs[j].lines[0].trim())) return true;
    }
    return false;
  };

  for (let k = 0; k < sigIndices.length - 1; k++) {
    const leftSig  = sigIndices[k];
    const rightSig = sigIndices[k + 1];
    if (rightSig - leftSig <= 3 && !hayDivisorEntre(leftSig, rightSig)) {
      const leftHeader  = leftSig  > 0 && !paragraphs[leftSig  - 1].isSig ? leftSig  - 1 : leftSig;
      const rightHeader = rightSig > 0 && !paragraphs[rightSig - 1].isSig ? rightSig - 1 : rightSig;
      const leftParas  = leftHeader  < leftSig  ? [paragraphs[leftHeader],  paragraphs[leftSig]]  : [paragraphs[leftSig]];
      const rightParas = rightHeader < rightSig ? [paragraphs[rightHeader], paragraphs[rightSig]] : [paragraphs[rightSig]];
      flexBlocks.push({ startIdx: leftHeader, endIdx: rightSig, leftParas, rightParas });
      k++; // consumed rightSig — skip to avoid triple-pairing
    }
  }

  const flexByStart = new Map(flexBlocks.map(fb => [fb.startIdx, fb]));

  // ── Final render ──────────────────────────────────────────────────────────────
  const result: React.ReactNode[] = [];
  let i = 0;
  while (i < paragraphs.length) {
    if (flexByStart.has(i)) {
      const fb = flexByStart.get(i)!;
      result.push(
        <div
          key={`sflex-${i}`}
          style={{ display: 'flex', justifyContent: 'space-between', gap: '40px', marginTop: '48px', width: '100%' }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {fb.leftParas.flatMap((p, pi) => renderFlexColLines(p.lines, `lc-${p.pidx}-${pi}`, leftSigUrl))}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {fb.rightParas.flatMap((p, pi) => renderFlexColLines(p.lines, `rc-${p.pidx}-${pi}`, rightSigUrl))}
          </div>
        </div>
      );
      i = fb.endIdx + 1;
    } else {
      const p = paragraphs[i];
      // Un título encabeza el documento o no existe. Una carta empieza por la
      // ciudad y la fecha y no lleva ninguno, y sin este corte el primer
      // renglón en mayúsculas que apareciera —el «C.C. 1.045.223» de debajo de
      // la firma— se ascendía a título y se imprimía en grande al final.
      if (p.pidx > 2) tituloEmitido = true;
      result.push(
        <div key={`para-${p.pidx}`} className={separacion(p.blancosAntes)}>
          {renderParaLines(p.lines, `p-${p.pidx}`)}
        </div>
      );
      i++;
    }
  }

  return result;
}

export const DocumentPreview = memo(function DocumentPreview({ template, data, activeFieldId, showWatermark = true, leftSignatureUrl, rightSignatureUrl, templateId, documentLanguage }: DocumentPreviewProps) {
  const { language: idiomaInterfaz } = useLanguage();
  const language = documentLanguage ?? idiomaInterfaz;
  const previewContentRef = useRef<HTMLDivElement | null>(null);

  const enrichedData = useMemo(
    () => enrichDocumentDataWithDates(data, language, templateId),
    [data, language, templateId],
  );

  /** Lo que el usuario escribió, para poder distinguirlo del texto de la
   *  plantilla al maquetar. Se descartan los valores muy cortos: un «SÍ» o un
   *  número suelto coincidiría con demasiadas cosas. */
  const datosUsuario = useMemo(
    () => new Set(
      Object.values(data)
        .map((v) => String(v ?? '').trim().toUpperCase())
        .filter((v) => v.length >= 4),
    ),
    [data],
  );

  const contentAfterConditionals = useMemo(() => {
    return template.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_match, fieldName, innerContent) => {
      const cleanFieldName = fieldName.trim() as keyof typeof enrichedData;
      const fieldValue = enrichedData[cleanFieldName];
      if (fieldValue && fieldValue !== '' && fieldValue !== 'No' && fieldValue !== 'false') {
        return innerContent;
      }
      return '';
    });
  }, [template, enrichedData]);

  const formattedContent = useMemo(() => {
    let processedContent = contentAfterConditionals;

    // Active field gets special highlight markers — processed FIRST so the general
    // loop doesn't overwrite the marker with a plain string.
    if (activeFieldId) {
      const activeVal = String(enrichedData[activeFieldId as keyof typeof enrichedData] ?? '');
      const escapedId = activeFieldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const reId = new RegExp(`\\{\\{${escapedId}\\}\\}`, 'g');
      processedContent = processedContent.replace(
        reId,
        activeVal ? `${ACTIVE_OPEN}${activeVal}${ACTIVE_CLOSE}` : ACTIVE_EMPTY_TOKEN,
      );
    }

    Object.entries(enrichedData).forEach(([key, value]) => {
      if (key === activeFieldId) return; // already handled above
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g');
      processedContent = processedContent.replace(regex, String(value ?? ''));
    });
    processedContent = processedContent.replace(/\{\{([^}]+)\}\}/g, EMPTY_FIELD_TOKEN);
    return formatDocumentContent(processedContent, leftSignatureUrl, rightSignatureUrl, datosUsuario);
  }, [contentAfterConditionals, enrichedData, activeFieldId, leftSignatureUrl, rightSignatureUrl, datosUsuario]);

  // Scrolls the preview just enough to bring the field the user just
  // focused into view — nothing moves if it's already visible, and it
  // never re-fires while they keep typing into the SAME field (deps are
  // just activeFieldId, not the content, which changes on every
  // keystroke). Previously this estimated a scroll offset from the
  // active field's character position in the raw template string, which
  // didn't match the field's real rendered position (formatting adds
  // headers/spacing, substituted values are a different length than
  // "{{tag}}") — that mismatch is what caused the preview to visibly
  // jump around instead of settling.
  useEffect(() => {
    if (!activeFieldId) return;
    const target = previewContentRef.current?.querySelector('[data-active-field="true"]') as HTMLElement | null;
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [activeFieldId]);

  const handleCopy = (e: React.ClipboardEvent) => {
    if (showWatermark) {
      e.preventDefault();
      alert(language === 'es'
        ? '⚠️ La copia está deshabilitada en modo vista previa.'
        : '⚠️ Copying is disabled in preview mode.');
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (showWatermark) e.preventDefault();
  };

  return (
    <div
      className="relative bg-white shadow-sm border border-slate-200 overflow-hidden"
      style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}
      onCopy={handleCopy}
      onCut={handleCopy}
      onContextMenu={handleContextMenu}
    >
      {/* Márgenes de la hoja. Estaban en 24px y el texto llegaba casi al
          borde del papel, que es lo que más delata a un documento generado:
          una carta o un contrato reales respiran por los cuatro lados. 44px
          se acerca a media pulgada a esta escala sin desperdiciar hoja. */}
      <div
        ref={previewContentRef}
        className="px-[44px] pt-[34px] pb-[40px] relative z-10"
        style={{
          color: '#000000',
          userSelect: showWatermark ? 'none' : 'auto',
          WebkitUserSelect: showWatermark ? 'none' : 'auto',
          MozUserSelect: showWatermark ? 'none' : 'auto',
          msUserSelect: showWatermark ? 'none' : undefined,
        }}
      >
        {formattedContent}
      </div>

      {/* Watermark Overlay */}
      {showWatermark && (
        <>
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            <div className="transform -rotate-45">
              <div className="space-y-20">
                {[...Array(5)].map((_, rowIndex) => (
                  <div key={rowIndex} className="flex gap-40">
                    {[...Array(3)].map((_, colIndex) => (
                      <div
                        key={colIndex}
                        className="text-black/[0.07] text-4xl font-bold whitespace-nowrap select-none tracking-widest"
                      >
                        {language === 'es' ? 'VISTA PREVIA' : 'PREVIEW'}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-slate-800/80 text-white/80 text-center py-1.5 text-[10px] font-medium tracking-wide">
            {language === 'es'
              ? 'VISTA PREVIA — Descarga el documento certificado para obtener la versión final sin marcas de agua'
              : 'PREVIEW — Download the certified document to obtain the final watermark-free version'}
          </div>
        </>
      )}
    </div>
  );
});
