import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, RotateCcw, Loader } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Raw bytes — the modal loads them itself via pdfjs. Mutually exclusive
   * with pdfDoc (pass whichever the caller already has on hand). */
  pdfBytes?: Uint8Array | null;
  /** An already-loaded pdfjs document (e.g. guest-sign-page.tsx already
   * has one loaded for its own page-by-page render) — reused as-is,
   * avoiding a redundant fetch + re-parse of the same PDF.
   * eslint-disable-next-line @typescript-eslint/no-explicit-any */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdfDoc?: any;
  title?: string;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
// Pages are rendered once at this native pdf.js scale (sharp at up to
// MAX_ZOOM) — zoom in/out afterwards is a cheap CSS transform on the
// already-rendered canvases, not a pdf.js re-render on every click.
const RENDER_SCALE = 1.6;

/**
 * Full-document, scrollable, zoomable viewer — opened by clicking a small
 * inline PDF preview (PdfSignaturePreview, guest-sign-page's own canvas,
 * etc.) so a signer can actually read every page before signing, not just
 * the fixed-size single-page thumbnail those previews show inline.
 * Renders every page (not just the last one) stacked vertically.
 */
export function PdfViewerModal({ open, onOpenChange, pdfBytes, pdfDoc, title }: PdfViewerModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    setZoom(1);
  }, [open]);

  useEffect(() => {
    const source = pdfDoc ?? pdfBytes;
    if (!open || !source) return;
    if (source === renderedRef.current) return;
    renderedRef.current = source;

    void (async () => {
      setLoading(true);
      const container = containerRef.current;
      if (!container) return;
      container.innerHTML = '';
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let pdf: any;
        if (pdfDoc) {
          pdf = pdfDoc;
        } else {
          try {
            pdf = await pdfjsLib.getDocument({ data: (pdfBytes as Uint8Array).slice(0) }).promise;
          } catch {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            pdf = await pdfjsLib.getDocument({ data: (pdfBytes as Uint8Array).slice(0), disableWorker: true } as any).promise;
          }
        }
        setPageCount(pdf.numPages);
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const vp = page.getViewport({ scale: RENDER_SCALE });
          const canvas = document.createElement('canvas');
          canvas.width = vp.width;
          canvas.height = vp.height;
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          canvas.style.display = 'block';
          canvas.style.marginBottom = '16px';
          canvas.style.borderRadius = '8px';
          canvas.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)';
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
          container.appendChild(canvas);
        }
      } catch (e) {
        console.error('PdfViewerModal render error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, pdfBytes, pdfDoc]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="pdf-viewer-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => onOpenChange(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '16px',
            background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <motion.div
            key="pdf-viewer-card"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            style={{ maxHeight: '92vh' }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-4 py-3">
              <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800">
                {title ?? 'Documento'}{pageCount > 0 ? ` · ${pageCount} pág.` : ''}
              </p>
              <div className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.2).toFixed(2)))}
                  disabled={zoom <= MIN_ZOOM}
                  className="flex size-7 items-center justify-center rounded-full text-slate-600 hover:bg-white disabled:opacity-30"
                >
                  <ZoomOut className="size-3.5" />
                </button>
                <span className="w-10 text-center text-[11px] font-bold text-slate-500">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.2).toFixed(2)))}
                  disabled={zoom >= MAX_ZOOM}
                  className="flex size-7 items-center justify-center rounded-full text-slate-600 hover:bg-white disabled:opacity-30"
                >
                  <ZoomIn className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  title="Restablecer zoom"
                  className="flex size-7 items-center justify-center rounded-full text-slate-600 hover:bg-white"
                >
                  <RotateCcw className="size-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Scrollable, zoomable page stack */}
            <div className="flex-1 overflow-auto bg-slate-100 p-4">
              {loading && (
                <div className="flex h-full min-h-[200px] items-center justify-center gap-2 text-sm text-slate-400">
                  <Loader className="size-4 animate-spin" /> Cargando documento…
                </div>
              )}
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease',
                  maxWidth: 640,
                  margin: '0 auto',
                }}
              >
                <div ref={containerRef} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
