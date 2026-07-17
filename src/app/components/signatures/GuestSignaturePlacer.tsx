import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Loader, MousePointerClick } from 'lucide-react';
import { SimpleDraggableSignature } from './SimpleDraggableSignature';
import type { PlacedSignature } from './types';

interface GuestSignaturePlacerProps {
  // Already-loaded pdfjs document (PDFDocumentProxy) — reuses whatever the
  // caller already fetched for the read-only preview, including its
  // signed-URL fallback, instead of loading the PDF a second time.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdfDoc: any;
  pageCount: number;
  signatureDataUrl: string;
  signerName: string;
  onConfirm: (placement: PlacedSignature) => void;
  isLoading?: boolean;
  /** Same URL the outer read-only preview used. Purely a rendering
   * fallback: if pdfjs's own canvas render throws (a real-world risk on
   * some mobile browsers/webviews independent of network/CORS), an
   * <iframe> using the browser's native PDF viewer fills the same spot
   * instead of a blank canvas. Tap-to-place and drag keep working
   * identically either way — they're computed from each page's own
   * bounding box, not from canvas pixels. */
  fallbackPdfUrl?: string;
}

const clamp = (min: number, max: number, v: number) => Math.max(min, Math.min(max, v));
const DEFAULT_W = 0.32;
const DEFAULT_H = 0.09;

/**
 * Adobe-Sign-style placement: the guest already drew/typed their
 * signature (via SignatureModal, before this mounts). Every page of the
 * document renders stacked in one continuous, near-full-height scroll —
 * no "page 1 of 2" buttons to miss — they scroll through the whole thing
 * like a real PDF viewer, tap wherever they want to sign, and just the
 * signature image appears right there, draggable. Whatever's on screen
 * when they hit "Confirmar firma" is exactly what gets baked into the
 * final PDF.
 */
export function GuestSignaturePlacer({
  pdfDoc, pageCount, signatureDataUrl, signerName, onConfirm, isLoading, fallbackPdfUrl,
}: GuestSignaturePlacerProps) {
  const [pdfLoading, setPdfLoading] = useState(true);
  const [renderFailed, setRenderFailed] = useState(false);
  const [placement, setPlacement] = useState<PlacedSignature | null>(null);

  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const pageContainerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const renderedPagesRef = useRef<Set<number>>(new Set());
  // Real width/height of the drawn ink (SignaturePad already trims
  // transparent margins, so this is the actual stroke's proportions, not
  // the canvas it was drawn on) — used so the placement box starts out
  // shaped like the signature instead of a generic wide rectangle that
  // pads/squashes it.
  const imgAspectRef = useRef(DEFAULT_W / DEFAULT_H);

  useEffect(() => {
    if (!signatureDataUrl) return;
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        imgAspectRef.current = img.naturalWidth / img.naturalHeight;
      }
    };
    img.src = signatureDataUrl;
  }, [signatureDataUrl]);

  useEffect(() => {
    setRenderFailed(false);
    renderedPagesRef.current = new Set();
    if (!pdfDoc || pageCount === 0) return;

    let cancelled = false;
    const renderAll = async () => {
      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        if (cancelled) return;
        const canvas = canvasRefs.current.get(pageNum);
        if (!canvas) continue;
        try {
          const page = await pdfDoc.getPage(pageNum);
          const vp = page.getViewport({ scale: 1.8 });
          canvas.width = vp.width;
          canvas.height = vp.height;
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('canvas 2D context unavailable');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
          renderedPagesRef.current.add(pageNum);
        } catch (e) {
          console.error(`GuestSignaturePlacer: page ${pageNum} failed to render, falling back to iframe:`, e);
          if (!cancelled) setRenderFailed(true);
        }
      }
      if (!cancelled) setPdfLoading(false);
    };
    void renderAll();

    return () => { cancelled = true; };
  }, [pageCount, pdfDoc]);

  const placeAt = (pageNum: number, xFraction: number, yFraction: number) => {
    // Page-fraction boxes aren't square pixels — widthFraction/heightFraction
    // are relative to the page's own width/height, so matching the box to
    // the image's real w/h ratio also needs the page's own on-screen aspect
    // ratio (its rendered container), not just the raw image ratio.
    const rect = pageContainerRefs.current.get(pageNum)?.getBoundingClientRect();
    const pageAspect = rect && rect.height > 0 ? rect.width / rect.height : 1;
    const heightFraction = clamp(0.04, 0.20, (DEFAULT_W / imgAspectRef.current) * pageAspect);

    setPlacement({
      id: `guest-${Date.now()}`,
      signerId: 'guest',
      signerName,
      signerRole: 'Firmante',
      color: '#4f46e5',
      imageDataUrl: signatureDataUrl,
      storageUrl: '',
      page: pageNum,
      xFraction: clamp(DEFAULT_W / 2, 1 - DEFAULT_W / 2, xFraction),
      yFraction: clamp(heightFraction / 2, 1 - heightFraction / 2, yFraction),
      widthFraction: DEFAULT_W,
      heightFraction,
      labelText: signerName,
      showLabel: true,
    });
  };

  // Tap-to-place: only fires when nothing is placed anywhere yet — once it
  // exists, taps on a page shouldn't relocate it (that's what dragging is
  // for) or every accidental tap would move it.
  const handlePageTap = (pageNum: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (placement) return;
    const rect = pageContainerRefs.current.get(pageNum)?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    placeAt(pageNum, x, y);
  };

  return (
    <div className="space-y-3">
      {pdfLoading && (
        <div className="flex min-h-[400px] items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
          <Loader className="size-5 animate-spin text-indigo-500" />
          Cargando documento…
        </div>
      )}

      {/* Near-full-height continuous scroll — every page stacked, like a
          real PDF viewer, instead of one page behind "Anterior/Siguiente"
          buttons that are easy to miss on a phone. */}
      <div className={`overflow-y-auto rounded-2xl ${pdfLoading ? 'h-0' : ''}`} style={{ maxHeight: '82vh' }}>
        <div className="space-y-4">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => {
            const pagePlacement = placement?.page === pageNum ? placement : null;
            return (
              <div key={pageNum} className={pdfLoading ? 'invisible' : ''}>
                {pageCount > 1 && (
                  <p className="mb-1 text-center text-[11px] font-semibold text-slate-400">
                    Página {pageNum} de {pageCount}
                  </p>
                )}
                <div
                  ref={(el) => { if (el) pageContainerRefs.current.set(pageNum, el); }}
                  className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  style={{ touchAction: placement ? 'pan-y' : 'none' }}
                  onPointerDown={handlePageTap(pageNum)}
                >
                  {renderFailed && fallbackPdfUrl ? (
                    pageNum === 1 ? (
                      <iframe src={fallbackPdfUrl} title="Documento" className="block h-[82vh] w-full border-0" />
                    ) : null
                  ) : (
                    <canvas
                      ref={(el) => { if (el) canvasRefs.current.set(pageNum, el); }}
                      className="block w-full"
                    />
                  )}

                  {!pagePlacement && !placement && !pdfLoading && pageNum === 1 && (
                    <div className="pointer-events-none absolute inset-0 flex items-end justify-end p-6 sm:items-center sm:justify-center">
                      <div className="relative">
                        <span className="absolute -inset-1.5 animate-pulse rounded-xl bg-amber-400/50 blur-sm" />
                        <div className="relative flex items-center gap-2 rounded-lg border-2 border-amber-500 bg-amber-400 px-4 py-2.5 text-slate-900 shadow-lg">
                          <MousePointerClick className="size-4 shrink-0" />
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide leading-none">Firme aquí</p>
                            <p className="mt-0.5 text-[10px] font-medium leading-none text-slate-700">Toca donde quieras firmar</p>
                          </div>
                        </div>
                        <div className="absolute -bottom-1.5 left-5 size-3 rotate-45 border-b-2 border-r-2 border-amber-500 bg-amber-400" />
                      </div>
                    </div>
                  )}

                  {pagePlacement && (
                    <SimpleDraggableSignature
                      sig={pagePlacement}
                      getContainer={() => pageContainerRefs.current.get(pageNum) ?? null}
                      onChange={(updates) => setPlacement((prev) => (prev ? { ...prev, ...updates } : prev))}
                      onDelete={() => setPlacement(null)}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {placement && (
        <p className="text-center text-xs text-slate-500">
          ¿No quedó donde querías? Arrástrala, o toca la X para borrarla y volver a tocar donde quieras.
        </p>
      )}

      <button
        type="button"
        disabled={!placement || isLoading}
        onClick={() => placement && onConfirm(placement)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-200/70 transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isLoading ? (
          <><Loader className="size-5 animate-spin" />Guardando tu firma…</>
        ) : (
          <><CheckCircle className="size-5" />Firmar</>
        )}
      </button>
    </div>
  );
}
