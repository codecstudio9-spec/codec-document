import { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  CheckCircle, Loader, PlusCircle, FileSignature, LayoutTemplate, ImageOff,
  Minus, Plus, HelpCircle, X, MousePointerClick,
} from 'lucide-react';
import { SimpleDraggableSignature } from './SimpleDraggableSignature';
import type { PlacedSignature } from './types';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export interface EditorSigner {
  id: string;
  name: string;
  role: string;
  color: string;
  imageDataUrl: string;
  storageUrl: string;
}

interface PdfSignatureEditorProps {
  pdfBytes: Uint8Array;
  signers: EditorSigner[];
  onConfirm: (placements: PlacedSignature[]) => void;
  isLoading?: boolean;
}

const clamp = (min: number, max: number, v: number) => Math.max(min, Math.min(max, v));

// Proportional defaults — big enough to read clearly, small enough not to
// dominate the page (a real ink signature is a few inches wide, not half
// the sheet).
const DEFAULT_W = 0.30;
const DEFAULT_H = 0.11;

// Two-column mirror positions (fractions of page width / height), used by
// the "Colocar en espejo" quick auto-placement.
const COL_X = [0.25, 0.75] as const;
const AUTO_Y = 0.84; // near the bottom — 84 % from top

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.25;

/**
 * Same tap-to-place / drag / resize / zoom / continuous-scroll experience
 * as the guest-signing placer (GuestSignaturePlacer), adapted for the
 * document owner who may be placing MORE THAN ONE signer's signature
 * (themselves + whoever they're inviting). Native HTML5 drag-and-drop —
 * the previous mechanism — doesn't work via touch on mobile browsers at
 * all, which is exactly why this screen felt broken/confusing on phones;
 * tapping a signer chip to "arm" them, then tapping the document, works
 * identically with mouse or touch.
 */
export function PdfSignatureEditor({ pdfBytes, signers, onConfirm, isLoading }: PdfSignatureEditorProps) {
  const [pageCount, setPageCount]   = useState(0);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [renderFailed, setRenderFailed] = useState(false);
  const [placements, setPlacements] = useState<PlacedSignature[]>([]);
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map());
  const [showHelp, setShowHelp] = useState(false);
  const [activeSignerId, setActiveSignerId] = useState<string | null>(signers[0]?.id ?? null);

  const pdfDocRef        = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const canvasRefs       = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const pageContainerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null);
  // Real width/height ratio of each signer's ink (trimmed of transparent
  // margins upstream), keyed by signer id — so a placement box starts out
  // shaped like the actual signature instead of a generic wide rectangle
  // that pads or visually squashes it.
  const imgAspectRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    signers.forEach((signer) => {
      if (!signer.imageDataUrl || imgAspectRef.current.has(signer.id)) return;
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          imgAspectRef.current.set(signer.id, img.naturalWidth / img.naturalHeight);
        }
      };
      img.src = signer.imageDataUrl;
    });
  }, [signers]);

  // Default the armed signer to whoever doesn't have a placement yet, so
  // after placing signer 1 the tool naturally hands off to signer 2
  // without an extra tap.
  useEffect(() => {
    setActiveSignerId((prev) => {
      if (prev && signers.some((s) => s.id === prev)) {
        const stillUnplaced = !placements.some((p) => p.signerId === prev);
        if (stillUnplaced) return prev;
      }
      const nextUnplaced = signers.find((s) => !placements.some((p) => p.signerId === s.id));
      return nextUnplaced?.id ?? prev ?? signers[0]?.id ?? null;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signers, placements.length]);

  // ─── Load + render every page, continuous-scroll style ───────────────────
  useEffect(() => {
    if (!pdfBytes || pdfBytes.length === 0) return;
    setPdfLoading(true);
    setRenderFailed(false);
    let cancelled = false;

    const run = async () => {
      let pdf: pdfjsLib.PDFDocumentProxy;
      try {
        try {
          // isOffscreenCanvasSupported disabled: on iOS/iPadOS Safari,
          // pdf.js's OffscreenCanvas-backed render path silently produces a
          // blank canvas (render() resolves fine, nothing is painted) —
          // confirmed live on iPhone. Desktop/Android are unaffected either way.
          pdf = await pdfjsLib.getDocument({ data: pdfBytes.slice(0), isOffscreenCanvasSupported: false }).promise;
        } catch {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pdf = await pdfjsLib.getDocument({ data: pdfBytes.slice(0), isOffscreenCanvasSupported: false, disableWorker: true } as any).promise;
        }
      } catch (e) {
        console.error('PdfSignatureEditor: error loading PDF:', e);
        if (!cancelled) { setRenderFailed(true); setPdfLoading(false); }
        return;
      }
      if (cancelled) return;
      pdfDocRef.current = pdf;
      setPageCount(pdf.numPages);

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        if (cancelled) return;
        // Canvas refs populate on render after `pageCount` triggers the
        // page list — wait a tick for React to have mounted them.
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 0));
        const canvas = canvasRefs.current.get(pageNum);
        if (!canvas) continue;
        try {
          const page = await pdf.getPage(pageNum);
          const vp = page.getViewport({ scale: 1.8 });
          canvas.width = vp.width;
          canvas.height = vp.height;
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('canvas 2D context unavailable');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;

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
          } catch { /* thumbnail is a nice-to-have — never block over it */ }
        } catch (e) {
          console.error(`PdfSignatureEditor: page ${pageNum} failed to render:`, e);
          if (!cancelled) setRenderFailed(true);
        }
      }
      if (!cancelled) setPdfLoading(false);
    };
    void run();

    return () => { cancelled = true; };
  }, [pdfBytes]);

  // Tracks which page is most visible, for the "X / N" counter + active
  // thumbnail highlight.
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
  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    zoomBy(e.deltaY > 0 ? -ZOOM_STEP / 2 : ZOOM_STEP / 2);
  };
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

  // Page-fraction boxes aren't square pixels — matching the box to the
  // image's real w/h ratio also needs the target page's own on-screen
  // aspect ratio, not just the raw image ratio.
  const heightFractionFor = useCallback((signerId: string, widthFraction: number, pageNum: number) => {
    const rect = pageContainerRefs.current.get(pageNum)?.getBoundingClientRect();
    const pageAspect = rect && rect.height > 0 ? rect.width / rect.height : 1;
    const imgAspect = imgAspectRef.current.get(signerId) ?? DEFAULT_W / DEFAULT_H;
    return clamp(0.05, 0.22, (widthFraction / imgAspect) * pageAspect);
  }, []);

  const addPlacement = useCallback(
    (signer: EditorSigner, page: number, xFraction = 0.5, yFraction = 0.3) => {
      const id = `${signer.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const heightFraction = heightFractionFor(signer.id, DEFAULT_W, page);
      // A signer can only ever have ONE placement at a time — replace,
      // never append, or a signer could accumulate a stale placement
      // alongside a new one and onConfirm would compile the wrong one.
      setPlacements((prev) => [
        ...prev.filter((p) => p.signerId !== signer.id),
        {
          id,
          signerId:     signer.id,
          signerName:   signer.name,
          signerRole:   signer.role,
          color:        signer.color,
          imageDataUrl: signer.imageDataUrl,
          storageUrl:   signer.storageUrl,
          page,
          xFraction,
          yFraction,
          widthFraction:  DEFAULT_W,
          heightFraction,
          labelText:  signer.name,
          showLabel:  true,
        },
      ]);
    },
    [heightFractionFor],
  );

  const updatePlacement = useCallback(
    (id: string, updates: Partial<PlacedSignature>) =>
      setPlacements((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p))),
    [],
  );

  const deletePlacement = useCallback(
    (id: string) => setPlacements((prev) => prev.filter((p) => p.id !== id)),
    [],
  );

  // ─── Two-column auto-placement ───────────────────────────────────────────
  const autoPlaceTwoColumn = useCallback(() => {
    if (!pageCount) return;
    const lastPage = pageCount;
    const newPlacements: PlacedSignature[] = signers.slice(0, 4).map((signer, idx) => {
      const col = idx % 2;             // 0 = left, 1 = right
      const row = Math.floor(idx / 2); // 0 = first row, 1 = second row
      const heightFraction = heightFractionFor(signer.id, DEFAULT_W, lastPage);
      return {
        id: `${signer.id}-auto-${Date.now()}-${idx}`,
        signerId:     signer.id,
        signerName:   signer.name,
        signerRole:   signer.role,
        color:        signer.color,
        imageDataUrl: signer.imageDataUrl,
        storageUrl:   signer.storageUrl,
        page: lastPage,
        xFraction:      COL_X[col],
        yFraction:      row === 0 ? AUTO_Y : Math.max(heightFraction / 2, AUTO_Y - heightFraction - 0.03),
        widthFraction:  DEFAULT_W,
        heightFraction,
        labelText:  signer.name,
        showLabel:  true,
      };
    });
    setPlacements(newPlacements);
    requestAnimationFrame(() => scrollToPage(lastPage));
  }, [signers, pageCount, heightFractionFor]);

  // Tap-to-place: taps only place the currently-armed signer, and only if
  // they don't already have a placement — once placed, dragging (via
  // SimpleDraggableSignature, already touch-friendly) is how you move it,
  // so a stray tap elsewhere on the page can't yank it away by accident.
  const handlePageTap = (pageNum: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeSignerId) return;
    const signer = signers.find((s) => s.id === activeSignerId);
    if (!signer || !signer.imageDataUrl) return;
    if (placements.some((p) => p.signerId === signer.id)) return;
    const rect = pageContainerRefs.current.get(pageNum)?.getBoundingClientRect();
    if (!rect) return;
    const x = clamp(DEFAULT_W / 2, 1 - DEFAULT_W / 2, (e.clientX - rect.left) / rect.width);
    const y = clamp(DEFAULT_H / 2, 1 - DEFAULT_H / 2, (e.clientY - rect.top) / rect.height);
    addPlacement(signer, pageNum, x, y);
  };

  const activeSigner = signers.find((s) => s.id === activeSignerId) ?? null;
  const activeSignerPlaced = activeSigner ? placements.some((p) => p.signerId === activeSigner.id) : false;

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
        style={isSide ? { maxHeight: '76vh' } : undefined}
      >
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => {
          const hasSigs = placements.some((p) => p.page === n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => scrollToPage(n)}
              className={[
                'relative shrink-0 overflow-hidden rounded-lg border-2 transition',
                currentPage === n ? 'border-indigo-500' : 'border-slate-200',
              ].join(' ')}
              style={isSide ? undefined : { width: 48 }}
            >
              {thumbnails.get(n) ? (
                <img src={thumbnails.get(n)} alt={`Página ${n}`} className="block w-full" />
              ) : (
                <div className="flex h-16 items-center justify-center bg-white text-[10px] text-slate-300">{n}</div>
              )}
              {hasSigs && <span className="absolute right-1 top-1 size-2 rounded-full bg-emerald-400 shadow-sm" />}
              {isSide && <span className="block bg-slate-50 py-0.5 text-center text-[10px] font-bold text-slate-400">{n}</span>}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Signer chips + help */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3">
        {signers.map((signer) => {
          const hasImage = Boolean(signer.imageDataUrl);
          const isPlaced = placements.some((p) => p.signerId === signer.id);
          const isActive = activeSignerId === signer.id;
          return (
            <button
              key={signer.id}
              type="button"
              disabled={!hasImage}
              onClick={() => setActiveSignerId(signer.id)}
              className={[
                'flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50',
                isActive ? 'shadow-sm' : 'border-slate-200 text-slate-500 hover:border-slate-300',
              ].join(' ')}
              style={isActive ? { borderColor: signer.color, color: signer.color, background: `${signer.color}12` } : undefined}
            >
              <span className="flex size-3 shrink-0 rounded-full" style={{ backgroundColor: signer.color }} />
              {signer.name}
              {!hasImage && <Loader className="size-3 animate-spin" />}
              {isPlaced && <CheckCircle className="size-3.5 text-emerald-500" />}
            </button>
          );
        })}

        <button
          type="button"
          onClick={autoPlaceTwoColumn}
          className="flex items-center gap-1.5 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:border-indigo-500 hover:bg-indigo-100"
        >
          <LayoutTemplate className="size-3.5" />
          Colocar en espejo
        </button>

        <button
          type="button"
          onClick={() => setShowHelp(true)}
          className="ml-auto flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100"
        >
          <HelpCircle className="size-4" />
          <span className="hidden sm:inline">¿Necesitas ayuda?</span>
        </button>
      </div>

      {activeSigner && !activeSignerPlaced && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-bold text-amber-800">
          <MousePointerClick className="size-4 shrink-0" />
          Toca el documento donde quieres la firma de {activeSigner.name}.
        </div>
      )}

      {/* Zoom + page toolbar */}
      <div className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-1.5">
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

      <div className="flex gap-3">
        {thumbnailRail('side')}

        <div className="min-w-0 flex-1">
          {pdfLoading && (
            <div className="flex min-h-[500px] items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
              <Loader className="size-5 animate-spin text-indigo-500" />
              Cargando documento…
            </div>
          )}

          <div
            ref={scrollContainerRef}
            className={`overflow-auto rounded-2xl ${pdfLoading ? 'h-0' : ''}`}
            style={{ maxHeight: '76vh' }}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="space-y-4 pb-2">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => {
                const pagePlacements = placements.filter((p) => p.page === pageNum);
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
                      style={{ touchAction: activeSigner && !activeSignerPlaced ? 'none' : 'pan-y' }}
                      onPointerDown={handlePageTap(pageNum)}
                    >
                      {renderFailed ? (
                        <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                          No se pudo previsualizar esta página.
                        </div>
                      ) : (
                        <canvas
                          ref={(el) => { if (el) canvasRefs.current.set(pageNum, el); }}
                          className="block w-full"
                        />
                      )}

                      {pagePlacements.map((placement) => (
                        <SimpleDraggableSignature
                          key={placement.id}
                          sig={placement}
                          getContainer={() => pageContainerRefs.current.get(pageNum) ?? null}
                          onChange={(updates) => updatePlacement(placement.id, updates)}
                          onDelete={() => deletePlacement(placement.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {thumbnailRail('bottom')}

      {/* Placed list */}
      {placements.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <p className="mb-2 text-xs font-bold text-slate-800">
            <FileSignature className="mr-1.5 inline size-3.5" />
            Firmas colocadas
          </p>
          <div className="flex flex-wrap gap-2">
            {placements.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5"
              >
                <button type="button" className="flex items-center gap-1.5" onClick={() => scrollToPage(p.page)}>
                  <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-xs text-slate-700">{p.signerName} · Pág.&nbsp;{p.page}</span>
                </button>
                <button type="button" onClick={() => deletePlacement(p.id)} className="text-[10px] text-red-400 hover:text-red-600">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick-add for signers without an image yet / fallback for the current page */}
      {signers.some((s) => s.imageDataUrl && !placements.some((p) => p.signerId === s.id)) && (
        <div className="flex flex-wrap gap-2">
          {signers.filter((s) => s.imageDataUrl && !placements.some((p) => p.signerId === s.id)).map((signer) => (
            <button
              key={signer.id}
              type="button"
              onClick={() => addPlacement(signer, currentPage)}
              className="flex items-center gap-1.5 rounded-xl border border-dashed px-3 py-2 text-xs font-semibold transition-all hover:border-solid hover:shadow-sm"
              style={{ borderColor: signer.color, color: signer.color }}
            >
              <PlusCircle className="size-3.5 shrink-0" />
              Agregar {signer.name} en pág. {currentPage}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        disabled={placements.length === 0 || isLoading}
        onClick={() => onConfirm(placements)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-200/70 transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isLoading ? (
          <><Loader className="size-5 animate-spin" />Compilando…</>
        ) : (
          <><CheckCircle className="size-5" />Firmar</>
        )}
      </button>

      {showHelp && (
        <div
          className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setShowHelp(false)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-slate-900">¿Cómo colocar las firmas?</p>
              <button type="button" onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-slate-600">
                <X className="size-5" />
              </button>
            </div>
            <ol className="mt-3 space-y-3 text-sm text-slate-600">
              <li className="flex gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">1</span>
                Toca la burbuja del firmante que quieras colocar (se resalta con su color).
              </li>
              <li className="flex gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">2</span>
                Toca el lugar del documento donde quieres que aparezca su firma.
              </li>
              <li className="flex gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">3</span>
                Arrástrala para moverla, o usa la esquina para agrandarla o achicarla.
              </li>
              <li className="flex gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">4</span>
                Usa los botones +/- (o pellizca con dos dedos) para hacer zoom, y "Colocar en espejo" para una distribución automática.
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
