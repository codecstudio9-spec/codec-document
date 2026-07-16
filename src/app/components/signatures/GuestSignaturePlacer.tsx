import { useEffect, useRef, useState } from 'react';
import { CheckCircle, ChevronLeft, ChevronRight, Loader, MousePointerClick } from 'lucide-react';
import { DraggableSignature } from './DraggableSignature';
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
   * instead of a blank canvas. Tap-to-place, drag and resize keep working
   * identically either way — they're computed from the container's
   * bounding box, not from canvas pixels. */
  fallbackPdfUrl?: string;
}

const clamp = (min: number, max: number, v: number) => Math.max(min, Math.min(max, v));
const DEFAULT_W = 0.42;
const DEFAULT_H = 0.16;

/**
 * Adobe-Sign-style placement: the guest already drew/typed their
 * signature (via SignatureModal, before this mounts). Here they scroll
 * through the FULL document — every page, PC or mobile — tap wherever
 * they want to sign, and the signature appears right there. From then
 * on it behaves like any DraggableSignature: drag to reposition, drag
 * the corner handle to resize, and whatever is on screen when they hit
 * "Confirmar firma" is exactly what gets baked into the final PDF.
 */
export function GuestSignaturePlacer({
  pdfDoc, pageCount, signatureDataUrl, signerName, onConfirm, isLoading, fallbackPdfUrl,
}: GuestSignaturePlacerProps) {
  const [activePage, setActivePage] = useState(pageCount || 1);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [renderFailed, setRenderFailed] = useState(false);
  const [placement, setPlacement]   = useState<PlacedSignature | null>(null);

  const canvasRef       = useRef<HTMLCanvasElement | null>(null);
  const containerRef    = useRef<HTMLDivElement | null>(null);
  const renderedPageRef = useRef(0);

  // pageCount arrives as a prop, sometimes after this component's first
  // render (e.g. if it mounts a beat before the parent's page-count state
  // settles) — useState(pageCount) alone would freeze activePage at
  // whatever pageCount was on that very first render, permanently, even
  // once the real value shows up. Re-sync explicitly instead.
  useEffect(() => {
    if (pageCount > 0 && activePage === 0) setActivePage(pageCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCount]);

  useEffect(() => {
    setRenderFailed(false);
    if (!pdfDoc || activePage === 0 || pageCount === 0) return;
    if (renderedPageRef.current === activePage) return;
    const render = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        const page = await pdfDoc.getPage(activePage);
        const vp = page.getViewport({ scale: 1.8 });
        canvas.width = vp.width;
        canvas.height = vp.height;
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas 2D context unavailable');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        renderedPageRef.current = activePage;
      } catch (e) {
        console.error(`GuestSignaturePlacer: page ${activePage} failed to render, falling back to iframe:`, e);
        setRenderFailed(true);
      } finally {
        setPdfLoading(false);
      }
    };
    void render();
  }, [activePage, pageCount, pdfDoc]);

  const placeAt = (xFraction: number, yFraction: number) => {
    setPlacement({
      id: `guest-${Date.now()}`,
      signerId: 'guest',
      signerName,
      signerRole: 'Firmante',
      color: '#4f46e5',
      imageDataUrl: signatureDataUrl,
      storageUrl: '',
      page: activePage,
      xFraction: clamp(DEFAULT_W / 2, 1 - DEFAULT_W / 2, xFraction),
      yFraction: clamp(DEFAULT_H / 2, 1 - DEFAULT_H / 2, yFraction),
      widthFraction: DEFAULT_W,
      heightFraction: DEFAULT_H,
      labelText: signerName,
      showLabel: true,
    });
  };

  // Tap-to-place: only fires when nothing is placed on this page yet —
  // once it exists, taps on the page shouldn't relocate it (that's what
  // dragging the handle bar is for) or every accidental tap would move it.
  const handlePageTap = (e: React.PointerEvent<HTMLDivElement>) => {
    if (placement) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    placeAt(x, y);
  };

  const visiblePlacement = placement?.page === activePage ? placement : null;

  return (
    <div className="space-y-3">
      {/* Page nav — full document is browsable, not locked to one page */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <button
            type="button"
            onClick={() => setActivePage((p) => Math.max(1, p - 1))}
            disabled={activePage <= 1}
            className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
          >
            <ChevronLeft className="size-3.5" />Anterior
          </button>
          <span className="text-xs font-semibold text-slate-700">
            Página <span className="text-indigo-600">{activePage}</span>{' '}
            <span className="text-slate-400">de {pageCount}</span>
            {placement && placement.page === activePage && (
              <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                Firma aquí
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setActivePage((p) => Math.min(pageCount, p + 1))}
            disabled={activePage >= pageCount}
            className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
          >
            Siguiente<ChevronRight className="size-3.5" />
          </button>
        </div>
      )}

      {pdfLoading && (
        <div className="flex min-h-[400px] items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
          <Loader className="size-5 animate-spin text-indigo-500" />
          Cargando página {activePage}…
        </div>
      )}

      <div className={`overflow-y-auto rounded-2xl ${pdfLoading ? 'h-0' : ''}`} style={{ maxHeight: '68vh' }}>
        <div
          ref={containerRef}
          className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${pdfLoading ? 'invisible' : ''}`}
          style={{ touchAction: placement ? 'pan-y' : 'none' }}
          onPointerDown={handlePageTap}
        >
          {renderFailed && fallbackPdfUrl ? (
            <iframe
              src={fallbackPdfUrl}
              title="Documento"
              className="block h-[70vh] w-full border-0"
            />
          ) : (
            <canvas ref={canvasRef} className="block w-full" />
          )}

          {renderFailed && (
            <div className="pointer-events-none absolute left-2 top-2 rounded-lg bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-800 shadow-sm">
              Vista de respaldo — toca igual donde quieras firmar
            </div>
          )}

          {!visiblePlacement && !pdfLoading && (
            <div className="pointer-events-none absolute inset-0 flex items-end justify-end p-6 sm:items-center sm:justify-center">
              {/* Classic "sign here" tag — the same yellow flag convention
                  Adobe Sign / DocuSign use to mark a signature field, with
                  a pointer tail instead of a full-screen dashed overlay
                  that blocks the page. Anchored bottom-right on mobile
                  (where signatures conventionally go); centered as a
                  general instruction on wider screens. */}
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

          {visiblePlacement && (
            <DraggableSignature
              sig={visiblePlacement}
              getContainer={() => containerRef.current}
              onChange={(updates) => setPlacement((prev) => (prev ? { ...prev, ...updates } : prev))}
              onDelete={() => setPlacement(null)}
            />
          )}
        </div>
      </div>

      {placement && (
        <p className="text-center text-xs text-slate-500">
          ¿No quedó donde querías? Arrástrala por la barra superior o bórrala y toca de nuevo.
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
          <><CheckCircle className="size-5" />Confirmar firma en este lugar</>
        )}
      </button>
    </div>
  );
}
