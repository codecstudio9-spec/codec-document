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
}

// US Legal Standard document formatting
function formatDocumentContent(content: string, leftSigUrl?: string, rightSigUrl?: string): React.ReactNode {
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
        return <span key={`${keyPrefix}-ae-${i}`} className="inline-flex min-w-[8rem] h-[1.1em] border-b-2 border-blue-400 align-bottom mx-1 animate-pulse bg-blue-50/60 rounded-sm" aria-hidden="true" />;
      }
      if (part.startsWith(ACTIVE_OPEN) && part.endsWith(ACTIVE_CLOSE)) {
        return <mark key={`${keyPrefix}-av-${i}`} className="bg-yellow-100 border-b-2 border-blue-500 rounded-sm px-0.5 not-italic font-[inherit]">{part.slice(1, -1)}</mark>;
      }
      return part || null;
    });
  };

  const SIG_LINE_RE = /_{5,}|Signature\s*:|Firma\s*:/i;
  const LEGAL_TERMS = [
    'WITNESSETH', 'WHEREAS', 'NOW THEREFORE', 'IN WITNESS WHEREOF',
    'CONSIDERANDO', 'POR LO TANTO', 'EN TESTIMONIO DE LO CUAL',
    'IMPORTANT', 'IMPORTANTE', 'WARNING', 'ADVERTENCIA',
    'ATTESTATION', 'NOTARY', 'NOTARIO', 'IN WITNESS',
  ];

  // ── Normal single-line renderer ───────────────────────────────────────────────
  function renderLine(trimmedLine: string, key: string, gapClass: string, inSigBlock: boolean): React.ReactNode {
    if (/^-{5,}$/.test(trimmedLine)) return renderSolidDivider(key);

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

    if (
      /^[A-Z0-9\sÀ-ſ\-–—()&,.'"]+$/.test(trimmedLine) &&
      trimmedLine.length > 3 && trimmedLine.length <= 80 &&
      !/[:;]/.test(trimmedLine)
    ) {
      return (
        <div key={key} className={`text-center font-bold uppercase tracking-[0.05em] text-[10.5px] leading-tight ${gapClass}`} style={{ fontFamily: '"Times New Roman", Times, Georgia, serif' }}>
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
      const gapClass = blankCount > 0 ? 'mt-[0.18em]' : '';
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
  type Para = { lines: string[]; pidx: number; isSig: boolean };
  const allLines = content.split('\n');
  const paragraphs: Para[] = [];
  let cur: string[] = [];
  let pidx = 0;

  for (const line of allLines) {
    if (line.trim() === '') {
      if (cur.length > 0) {
        paragraphs.push({ lines: cur, pidx: pidx++, isSig: cur.some(l => SIG_LINE_RE.test(l.trim())) });
        cur = [];
      }
    } else {
      cur.push(line);
    }
  }
  if (cur.length > 0) {
    paragraphs.push({ lines: cur, pidx: pidx++, isSig: cur.some(l => SIG_LINE_RE.test(l.trim())) });
  }

  // ── Detect and pair adjacent signature sections for side-by-side layout ──────
  // Pattern: (header + sigPara) + (header + sigPara) within a gap of ≤3 paragraphs
  const sigIndices = paragraphs.reduce<number[]>((acc, p, i) => { if (p.isSig) acc.push(i); return acc; }, []);

  type FlexBlock = { startIdx: number; endIdx: number; leftParas: Para[]; rightParas: Para[] };
  const flexBlocks: FlexBlock[] = [];

  for (let k = 0; k < sigIndices.length - 1; k++) {
    const leftSig  = sigIndices[k];
    const rightSig = sigIndices[k + 1];
    if (rightSig - leftSig <= 3) {
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
      result.push(
        <div key={`para-${p.pidx}`}>
          {renderParaLines(p.lines, `p-${p.pidx}`)}
        </div>
      );
      i++;
    }
  }

  return result;
}

export const DocumentPreview = memo(function DocumentPreview({ template, data, activeFieldId, showWatermark = true, leftSignatureUrl, rightSignatureUrl }: DocumentPreviewProps) {
  const { language } = useLanguage();
  const previewContentRef = useRef<HTMLDivElement | null>(null);

  const enrichedData = useMemo(
    () => enrichDocumentDataWithDates(data, language),
    [data, language],
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
    return formatDocumentContent(processedContent, leftSignatureUrl, rightSignatureUrl);
  }, [contentAfterConditionals, enrichedData, activeFieldId, leftSignatureUrl, rightSignatureUrl]);

  useEffect(() => {
    if (!activeFieldId) return;
    const container = previewContentRef.current?.closest('[data-preview-scroll-container]') as HTMLElement | null;
    if (!container) return;
    const escapedFieldId = activeFieldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fieldTokenRegex = new RegExp(`\\{\\{\\s*${escapedFieldId}\\s*\\}\\}`, 'i');
    const match = fieldTokenRegex.exec(contentAfterConditionals);
    if (!match) return;
    const contentLength = Math.max(contentAfterConditionals.length, 1);
    const relativePosition = match.index / contentLength;
    const maxScroll = Math.max(container.scrollHeight - container.clientHeight, 0);
    const targetTop = Math.max((relativePosition * maxScroll) - (container.clientHeight * 0.2), 0);
    container.scrollTo({ top: targetTop, behavior: 'smooth' });
  }, [activeFieldId, contentAfterConditionals]);

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
      {/* US Legal standard: 1-inch margins. At typical screen scale (96 dpi × ~0.75 zoom)
          px-[72px] ≈ 0.75 in — maintains professional legal look without excessive whitespace. */}
      <div
        ref={previewContentRef}
        className="px-[24px] pt-[18px] pb-[24px] relative z-10"
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
