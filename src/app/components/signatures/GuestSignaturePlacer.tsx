import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Loader, MousePointerClick, ArrowLeft, Minus, Plus, HelpCircle, X } from 'lucide-react';
import { SimpleDraggableSignature } from './SimpleDraggableSignature';
import type { PlacedSignature } from './types';

// NOTE: this component receives an already-loaded pdfDoc from its caller
// (see guest-sign-page.tsx) — the isOffscreenCanvasSupported iOS fix lives
// there, at the actual pdfjsLib.getDocument() call site.
interface GuestSignaturePlacerProps {
  // Already-loaded pdfjs document (PDFDocumentProxy) — reuses whatever the
  // caller already fetched for the read-only preview, including its
  // signed-URL fallback, instead of loading the PDF a second time.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdfDoc: any;
  pageCount: number;
  signatureDataUrl: string;
  signerName: string;
  documentName?: string;
  onConfirm: (placement: PlacedSignature) => void;
  onBack: () => void;
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
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.25;

/**
 * Adobe-Sign-style placement, full-screen: the guest already drew/typed
 * their signature (via SignatureModal, before this mounts). Every page of
 * the document renders stacked in one continuous scroll — no "page 1 of
 * 2" buttons to miss — with zoom controls, a page-thumbnail rail, and a
 * short help modal on top, so reviewing a multi-page document before
 * signing doesn't feel cramped. Tap wherever to place the signature, drag
 * to move it, resize from the corner. Whatever's on screen when they hit
 * "Firmar" is exactly what gets baked into the final PDF.
 */
export function GuestSignaturePlacer({
  pdfDoc, pageCount, signatureDataUrl, signerName, documentName, onConfirm, onBack, isLoading, fallbackPdfUrl,
}: GuestSignaturePlacerProps) {
  const [pdfLoading, setPdfLoading] = useState(true);
  const [renderFailed, setRenderFailed] = useState(false);
  const [placement, setPlacement] = useState<PlacedSignature | null>(null);
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map());
  const [showHelp, setShowHelp] = useState(false);

  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const pageContainerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const renderedPagesRef = useRef<Set<number>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null);
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
          await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
          renderedPagesRef.current.add(pageNum);

          // Cheap thumbnail: downscale the canvas we just rendered instead
          // of asking pdf.js to render the whole page a second time.
          try {
            const thumbWidth = 96;
            const thumbHeight = Math.max(1, Math.round((canvas.height / canvas.width) * thumbWidth));
            const thumbCanvas = document.createElement('canvas');
            thumbCanvas.width = thumbWidth;
            thumbCanvas.height = thumbHeight;
            const thumbCtx = thumbCanvas.getContext('2d');
            thumbCtx?.drawImage(canvas, 0, 0, thumbWidth, thumbHeight);
            const dataUrl = thumbCanvas.toDataURL('image/jpeg', 0.6);
            setThumbnails((prev) => new Map(prev).set(pageNum, dataUrl));
          } catch { /* thumbnail is a nice-to-have — never block signing over it */ }
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

  // Tracks which page is most visible in the scroll area, to drive the
  // "2 / 5" counter and highlight the active thumbnail — the same
  // container ref used for tap-to-place math doubles as the observed
  // element, so this stays in sync with whatever's actually on screen.
  useEffect(() => {
    if (pdfLoading || pageCount === 0) return;
    const root = scrollContainerRef.current;
    if (!root) return;

    const visibility = new Map<number, number>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const pageNum = Number((entry.target as HTMLElement).dataset.pageNum);
        if (pageNum) visibility.set(pageNum, entry.intersectionRatio);
      }
      let best = 0;
      let bestRatio = 0;
      visibility.forEach((ratio, pageNum) => {
        if (ratio > bestRatio) { bestRatio = ratio; best = pageNum; }
      });
      if (best > 0) setCurrentPage(best);
    }, { root, threshold: [0.25, 0.5, 0.75] });

    pageContainerRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pdfLoading, pageCount]);

  const scrollToPage = (pageNum: number) => {
    pageContainerRefs.current.get(pageNum)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const zoomBy = (delta: number) => setZoom((z) => clamp(ZOOM_MIN, ZOOM_MAX, Math.round((z + delta) * 100) / 100));

  // Trackpad pinch on desktop sends wheel events with ctrlKey set — this
  // lets "mouse" zoom (requirement: gestos táctiles en móvil, mouse en
  // escritorio) work without hijacking normal scroll-wheel scrolling.
  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    zoomBy(e.deltaY > 0 ? -ZOOM_STEP / 2 : ZOOM_STEP / 2);
  };

  // Two-finger pinch on mobile/tablet.
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 2) return;
    const [a, b] = [e.touches[0], e.touches[1]];
    pinchRef.current = { startDist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), startZoom: zoom };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2 || !pinchRef.current) return;
    const [a, b] = [e.touches[0], e.touches[1]];
    const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const ratio = dist / pinchRef.current.startDist;
    setZoom(clamp(ZOOM_MIN, ZOOM_MAX, Math.round(pinchRef.current.startZoom * ratio * 100) / 100));
  };
  const handleTouchEnd = () => { pinchRef.current = null; };

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

  const thumbnailRail = (variant: 'side' | 'bottom') => {
    if (pageCount <= 1) return null;
    const isSide = variant === 'side';
    return (
      <div
        className={
          isSide
            ? 'hidden w-20 shrink-0 flex-col gap-2 overflow-y-auto md:flex'
            : 'flex gap-2 overflow-x-auto border-t border-slate-100 bg-slate-50 px-3 py-2 md:hidden'
        }
      >
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => scrollToPage(n)}
            className={[
              'shrink-0 overflow-hidden rounded-lg border-2 transition',
              currentPage === n ? 'border-indigo-500' : 'border-slate-200',
            ].join(' ')}
            style={isSide ? undefined : { width: 48 }}
          >
            {thumbnails.get(n) ? (
              <img src={thumbnails.get(n)} alt={`Página ${n}`} className="block w-full" />
            ) : (
              <div className="flex h-16 items-center justify-center bg-white text-[10px] text-slate-300">{n}</div>
            )}
            {isSide && <span className="block bg-slate-50 py-0.5 text-center text-[10px] font-bold text-slate-400">{n}</span>}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9997] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft className="size-4" />
          Atrás
        </button>
        <p className="min-w-0 flex-1 truncate text-center text-sm font-bold text-slate-900">{documentName || 'Coloca tu firma'}</p>
        <button
          type="button"
          onClick={() => setShowHelp(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100"
        >
          <HelpCircle className="size-4" />
          <span className="hidden sm:inline">¿Necesitas ayuda?</span>
        </button>
      </div>

      {/* Simple 3-step tracker */}
      <div className="flex items-center justify-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2 text-[11px] font-bold">
        <span className="flex items-center gap-1 text-indigo-600">
          <span className="flex size-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] text-white">1</span>
          Coloca tu firma
        </span>
        <span className="h-px w-4 bg-slate-300" />
        <span className="flex items-center gap-1 text-slate-400">
          <span className="flex size-4 items-center justify-center rounded-full bg-slate-200 text-[10px] text-slate-500">2</span>
          Revisa
        </span>
        <span className="h-px w-4 bg-slate-300" />
        <span className="flex items-center gap-1 text-slate-400">
          <span className="flex size-4 items-center justify-center rounded-full bg-slate-200 text-[10px] text-slate-500">3</span>
          Firmar
        </span>
      </div>

      {/* Zoom + page toolbar */}
      <div className="mx-4 mt-2 flex items-center justify-between rounded-xl bg-slate-100 px-3 py-1.5">
        <span className="text-xs font-bold text-slate-500">{pdfLoading ? '…' : `${currentPage} / ${pageCount}`}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => zoomBy(-ZOOM_STEP)}
            disabled={zoom <= ZOOM_MIN}
            className="flex size-7 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm transition active:scale-90 disabled:opacity-30"
          >
            <Minus className="size-3.5" />
          </button>
          <span className="w-11 text-center text-xs font-bold text-slate-600">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => zoomBy(ZOOM_STEP)}
            disabled={zoom >= ZOOM_MAX}
            className="flex size-7 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm transition active:scale-90 disabled:opacity-30"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-3 px-4 py-3">
        {thumbnailRail('side')}

        <div className="flex min-w-0 flex-1 flex-col">
          {pdfLoading && (
            <div className="flex min-h-[400px] flex-1 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
              <Loader className="size-5 animate-spin text-indigo-500" />
              Cargando documento…
            </div>
          )}

          {/* Continuous scroll, zoomable and pannable in both directions —
              every page stacked like a real PDF viewer, instead of one
              page behind "Anterior/Siguiente" buttons easy to miss on a
              phone. */}
          <div
            ref={scrollContainerRef}
            className={`flex-1 overflow-auto rounded-2xl ${pdfLoading ? 'h-0' : ''}`}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="space-y-4 pb-2">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => {
                const pagePlacement = placement?.page === pageNum ? placement : null;
                return (
                  <div
                    key={pageNum}
                    className={pdfLoading ? 'invisible' : ''}
                    style={{ width: `${zoom * 100}%`, maxWidth: zoom <= 1 ? '100%' : 'none', margin: zoom <= 1 ? '0 auto' : undefined }}
                  >
                    <div
                      ref={(el) => { if (el) pageContainerRefs.current.set(pageNum, el); }}
                      data-page-num={pageNum}
                      className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
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
        </div>
      </div>

      {thumbnailRail('bottom')}

      {placement && (
        <p className="px-4 pt-2 text-center text-xs text-slate-500">
          ¿No quedó donde querías? Arrástrala, o toca la X para borrarla y volver a tocar donde quieras.
        </p>
      )}

      <div className="px-4 py-3">
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

      {showHelp && (
        <div
          className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setShowHelp(false)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-slate-900">¿Cómo firmar?</p>
              <button type="button" onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-slate-600">
                <X className="size-5" />
              </button>
            </div>
            <ol className="mt-3 space-y-3 text-sm text-slate-600">
              <li className="flex gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">1</span>
                Toca el lugar del documento donde quieres que aparezca tu firma.
              </li>
              <li className="flex gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">2</span>
                Arrástrala para moverla, o usa la esquina para agrandarla o achicarla.
              </li>
              <li className="flex gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">3</span>
                Usa los botones +/- (o pellizca con dos dedos) para hacer zoom, y desliza hacia arriba o abajo para ver todas las páginas.
              </li>
              <li className="flex gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">4</span>
                Cuando esté lista, toca "Firmar" para terminar.
              </li>
            </ol>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="mt-4 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
