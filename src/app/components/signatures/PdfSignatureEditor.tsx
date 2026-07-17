import { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  CheckCircle, ChevronLeft, ChevronRight, Loader,
  PlusCircle, FileSignature, LayoutTemplate, ImageOff,
} from 'lucide-react';
import { DraggableSignature } from './DraggableSignature';
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

// Two-column mirror positions (fractions of page width / height).
// Signer 0 → left column (center at 25 %), signer 1 → right column (center at 75 %).
const COL_X = [0.25, 0.75] as const;
const AUTO_Y = 0.84; // near the bottom — 84 % from top

export function PdfSignatureEditor({ pdfBytes, signers, onConfirm, isLoading }: PdfSignatureEditorProps) {
  const [pageCount, setPageCount]   = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [placements, setPlacements] = useState<PlacedSignature[]>([]);

  const pdfDocRef        = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const mainCanvasRef    = useRef<HTMLCanvasElement | null>(null);
  const mainContainerRef = useRef<HTMLDivElement | null>(null);
  const thumbCanvasRefs  = useRef<(HTMLCanvasElement | null)[]>([]);
  const renderedPageRef  = useRef<number>(0);

  // ─── Phase 1: Load PDF ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pdfBytes) return;
    setPdfLoading(true);
    renderedPageRef.current = 0;

    const run = async () => {
      try {
        const safeData = pdfBytes.slice(0);
        let pdf: pdfjsLib.PDFDocumentProxy;
        try {
          pdf = await pdfjsLib.getDocument({ data: safeData }).promise;
        } catch {
          const fallback = pdfBytes.slice(0);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pdf = await pdfjsLib.getDocument({ data: fallback, disableWorker: true } as any).promise;
        }
        pdfDocRef.current = pdf;
        thumbCanvasRefs.current = new Array(pdf.numPages).fill(null);
        setPageCount(pdf.numPages);
        setActivePage(pdf.numPages); // last page — where signatures go
      } catch (e) {
        console.error('Error loading PDF:', e);
        setPdfLoading(false);
      }
    };
    void run();
  }, [pdfBytes]);

  // ─── Phase 2: Render thumbnails ───────────────────────────────────────────────
  useEffect(() => {
    if (!pdfDocRef.current || pageCount === 0) return;
    const pdf = pdfDocRef.current;

    const renderThumbs = async () => {
      for (let i = 1; i <= pageCount; i++) {
        const canvas = thumbCanvasRefs.current[i - 1];
        if (!canvas) continue;
        try {
          const page = await pdf.getPage(i);
          const vp = page.getViewport({ scale: 0.25 });
          canvas.width  = vp.width;
          canvas.height = vp.height;
          canvas.style.width  = '100%';
          canvas.style.height = 'auto';
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
        } catch (e) { console.error(`Thumb ${i}:`, e); }
      }
    };
    void renderThumbs();
  }, [pageCount]);

  // ─── Phase 3: Render active page ─────────────────────────────────────────────
  useEffect(() => {
    if (!pdfDocRef.current || activePage === 0 || pageCount === 0) return;
    if (renderedPageRef.current === activePage) return;

    const pdf = pdfDocRef.current;
    const renderActive = async () => {
      const canvas = mainCanvasRef.current;
      if (!canvas) return;
      try {
        const page = await pdf.getPage(activePage);
        const vp = page.getViewport({ scale: 2.0 });
        canvas.width  = vp.width;
        canvas.height = vp.height;
        canvas.style.width  = '100%';
        canvas.style.height = 'auto';
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        renderedPageRef.current = activePage;
      } catch (e) {
        console.error(`Page ${activePage}:`, e);
      } finally {
        setPdfLoading(false);
      }
    };
    void renderActive();
  }, [activePage, pageCount]);

  // ─── Auto-place on first load so the professional two-column layout is immediate
  useEffect(() => {
    if (pageCount > 0 && placements.length === 0) {
      autoPlaceTwoColumn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCount]);

  // ─── Sync placement images when signers' imageDataUrl loads later ────────────
  // This fixes the case where guestSigDataUrl arrives asynchronously after
  // placements were already added (they had imageDataUrl: '').
  useEffect(() => {
    setPlacements((prev) =>
      prev.map((p) => {
        if (p.imageDataUrl) return p; // already populated — don't overwrite
        const signer = signers.find((s) => s.id === p.signerId);
        if (!signer?.imageDataUrl) return p;
        return { ...p, imageDataUrl: signer.imageDataUrl };
      }),
    );
  }, [signers]);

  // ─── Placement helpers ────────────────────────────────────────────────────────
  const addPlacement = useCallback(
    (signer: EditorSigner, page: number, xFraction = 0.5, yFraction = 0.3) => {
      const id = `${signer.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setPlacements((prev) => [
        ...prev,
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
          heightFraction: DEFAULT_H,
          labelText:  signer.name,
          showLabel:  true,
        },
      ]);
    },
    [],
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

  // ─── Two-column auto-placement ───────────────────────────────────────────────
  // Places signers 0 and 1 symmetrically (left / right) on the last page.
  // Signers 2 and 3 go in a second row if present.
  const autoPlaceTwoColumn = useCallback(() => {
    if (!pageCount) return;
    const lastPage = pageCount;
    setActivePage(lastPage);

    const newPlacements: PlacedSignature[] = signers.slice(0, 4).map((signer, idx) => {
      const col = idx % 2;             // 0 = left, 1 = right
      const row = Math.floor(idx / 2); // 0 = first row, 1 = second row
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
        yFraction:      row === 0 ? AUTO_Y : Math.max(DEFAULT_H / 2, AUTO_Y - DEFAULT_H - 0.03),
        widthFraction:  DEFAULT_W,
        heightFraction: DEFAULT_H,
        labelText:  signer.name,
        showLabel:  true,
      };
    });
    setPlacements(newPlacements);
  }, [signers, pageCount]);

  // ─── Drop handler ─────────────────────────────────────────────────────────────
  const handlePageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const signerId = e.dataTransfer.getData('signer-id');
    const signer   = signers.find((s) => s.id === signerId);
    if (!signer) return;
    const rect = mainContainerRef.current?.getBoundingClientRect();
    if (!rect) { addPlacement(signer, activePage); return; }
    const x = clamp(DEFAULT_W / 2, 1 - DEFAULT_W / 2, (e.clientX - rect.left)  / rect.width);
    const y = clamp(DEFAULT_H / 2, 1 - DEFAULT_H / 2, (e.clientY - rect.top)   / rect.height);
    addPlacement(signer, activePage, x, y);
  };

  const activePlacements = placements.filter((p) => p.page === activePage);

  return (
    <div className="flex gap-3 lg:gap-4">

      {/* ══ LEFT SIDEBAR ════════════════════════════════════════════════════════ */}
      <aside className="w-56 shrink-0 space-y-3 lg:w-64">

        {/* ── Auto-place button ── */}
        <button
          type="button"
          onClick={autoPlaceTwoColumn}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 transition hover:border-indigo-500 hover:bg-indigo-100 hover:shadow-sm active:scale-[0.98]"
        >
          <LayoutTemplate className="size-4 shrink-0" />
          Colocar en espejo
        </button>

        {/* Instructions */}
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          <p className="font-semibold">¿Cómo colocar las firmas?</p>
          <ol className="mt-1.5 space-y-1 text-xs text-indigo-700/80">
            <li>1. Presiona <strong>Colocar en espejo</strong> para distribución automática.</li>
            <li>2. O arrastra cada firma al documento manualmente.</li>
            <li>3. Mueve y redimensiona con las manijas.</li>
          </ol>
        </div>

        {/* Signer cards */}
        <div className="space-y-3">
          {signers.map((signer) => {
            const hasImage = Boolean(signer.imageDataUrl);
            return (
              <div key={signer.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex size-3 shrink-0 rounded-full" style={{ backgroundColor: signer.color }} />
                  <p className="text-sm font-bold text-slate-900">{signer.name}</p>
                  <span className="ml-auto text-[11px] text-slate-500">{signer.role}</span>
                </div>

                {/* Signature preview — draggable when image is ready */}
                <div
                  className={[
                    'mb-2 overflow-hidden rounded-xl border-2 bg-white transition',
                    hasImage
                      ? 'cursor-grab active:cursor-grabbing hover:shadow-md'
                      : 'cursor-default opacity-60',
                  ].join(' ')}
                  style={{ borderColor: signer.color }}
                  draggable={hasImage}
                  onDragStart={(e) => {
                    if (!hasImage) { e.preventDefault(); return; }
                    e.dataTransfer.setData('signer-id', signer.id);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  title={hasImage ? 'Arrastra esta firma al documento' : 'Cargando firma…'}
                >
                  {hasImage ? (
                    <img
                      src={signer.imageDataUrl}
                      alt={`Firma de ${signer.name}`}
                      className="h-16 w-full object-contain p-2"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex h-16 flex-col items-center justify-center gap-1.5 text-slate-400">
                      {signer.storageUrl ? (
                        <>
                          <Loader className="size-4 animate-spin" />
                          <span className="text-[10px]">Cargando…</span>
                        </>
                      ) : (
                        <>
                          <ImageOff className="size-4" />
                          <span className="text-[10px]">Sin imagen</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {hasImage && (
                  <p className="mb-2 text-center text-[10px] text-slate-400">Arrastra ↑ al documento</p>
                )}

                {/* Quick-add to active page */}
                <button
                  type="button"
                  onClick={() => addPlacement(signer, activePage)}
                  disabled={!hasImage}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed px-3 py-2 text-xs font-semibold transition-all hover:border-solid hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ borderColor: signer.color, color: signer.color }}
                >
                  <PlusCircle className="size-3.5 shrink-0" />
                  Agregar a pág. {activePage || '…'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Placed list */}
        {placements.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs font-bold text-slate-800">
              <FileSignature className="mr-1.5 inline size-3.5" />
              Firmas colocadas
            </p>
            <ul className="space-y-1.5">
              {placements.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5"
                >
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-left"
                    onClick={() => setActivePage(p.page)}
                  >
                    <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-xs text-slate-700">{p.signerName} · Pág.&nbsp;{p.page}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePlacement(p.id)}
                    className="shrink-0 text-[10px] text-red-400 hover:text-red-600"
                  >✕</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Confirm */}
        <button
          type="button"
          disabled={placements.length === 0 || isLoading}
          onClick={() => onConfirm(placements)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01] hover:shadow-emerald-300/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <><Loader className="size-4 animate-spin" />Compilando…</>
          ) : (
            <><CheckCircle className="size-4" />Firmar</>
          )}
        </button>
      </aside>

      {/* ══ CENTER — Page viewer ═════════════════════════════════════════════════ */}
      <div className="min-w-0 flex-1 space-y-2">

        {/* Page nav */}
        {pageCount > 0 && (
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
              {activePlacements.length > 0 && (
                <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                  {activePlacements.length} firma{activePlacements.length > 1 ? 's' : ''}
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

        {/* Loading state */}
        {pdfLoading && (
          <div className="flex min-h-[500px] items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
            <Loader className="size-5 animate-spin text-indigo-500" />
            Renderizando página {activePage}…
          </div>
        )}

        {/* Scrollable PDF canvas */}
        <div
          className={`overflow-y-auto rounded-2xl ${pdfLoading ? 'h-0' : ''}`}
          style={{ maxHeight: '76vh' }}
        >
          <div
            ref={mainContainerRef}
            className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${pdfLoading ? 'invisible' : ''}`}
            style={{ touchAction: 'none' }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handlePageDrop}
          >
            <canvas ref={mainCanvasRef} className="block w-full" />

            {/* Empty-state hint */}
            {activePlacements.length === 0 && !pdfLoading && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="rounded-2xl border-2 border-dashed border-indigo-300/60 bg-indigo-50/50 px-6 py-4 text-center text-sm text-indigo-500/70">
                  <p className="font-semibold">Usa "Colocar en espejo" o arrastra una firma aquí</p>
                  <p className="text-xs">Los firmantes se distribuyen simétricamente en la última página</p>
                </div>
          </div>
            )}

            {/* Signature overlays */}
            {activePlacements.map((placement) => (
              <DraggableSignature
                key={placement.id}
                sig={placement}
                getContainer={() => mainContainerRef.current}
                onChange={(updates) => updatePlacement(placement.id, updates)}
                onDelete={() => deletePlacement(placement.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ══ RIGHT — Thumbnails ══════════════════════════════════════════════════ */}
      {pageCount > 0 && (
        <aside className="w-24 shrink-0 space-y-2 lg:w-28">
          <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Páginas
          </p>
          {Array.from({ length: pageCount }, (_, i) => {
            const pageNum = i + 1;
            const hasSigs = placements.some((p) => p.page === pageNum);
            const isActive = activePage === pageNum;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActivePage(pageNum)}
                className={`w-full overflow-hidden rounded-xl border-2 transition-all duration-150 ${
                  isActive
                    ? 'border-indigo-500 shadow-lg shadow-indigo-200/60 ring-2 ring-indigo-400/30'
                    : 'border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                }`}
              >
                <div className="relative">
                  <canvas
                    ref={(el) => { thumbCanvasRefs.current[i] = el; }}
                    className="block w-full bg-slate-100"
                  />
                  {isActive && <div className="absolute inset-0 bg-indigo-500/10" />}
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1">
                    <span className={`text-[9px] font-bold ${isActive ? 'text-indigo-200' : 'text-white'}`}>
                      {pageNum}
                    </span>
                    {hasSigs && (
                      <span className="size-2 rounded-full bg-emerald-400 shadow-sm" title="Firma colocada" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </aside>
      )}
    </div>
  );
}
