import { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { SignaturePlacement, Signer } from './types';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfViewerProps {
  pdfBytes: Uint8Array | null;
  loading: boolean;
  placements: SignaturePlacement[];
  signers: Signer[];
  onLoadingChange: (value: boolean) => void;
  onError: (message: string) => void;
  onDropSigner: (signerId: Signer['id'], page: number, x: number, y: number) => void;
}

export function PdfViewer({
  pdfBytes,
  loading,
  placements,
  signers,
  onLoadingChange,
  onError,
  onDropSigner,
}: PdfViewerProps) {
  const viewerRef = useRef<HTMLDivElement | null>(null);

  // Keep the drop callback in a ref so the render effect never needs it as a dep.
  // This prevents pdf.js from re-rendering the whole document just because the
  // parent re-created the handler function reference.
  const onDropSignerRef = useRef(onDropSigner);
  useEffect(() => {
    onDropSignerRef.current = onDropSigner;
  });

  // Track which Uint8Array we already rendered so we never re-render the same
  // buffer (re-renders would try to re-transfer an already-detached ArrayBuffer).
  const renderedBytesRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    // Skip if nothing changed or the viewer isn't mounted yet.
    if (!pdfBytes || !viewerRef.current) return;
    if (pdfBytes === renderedBytesRef.current) return;
    renderedBytesRef.current = pdfBytes;

    const renderPdf = async () => {
      if (!viewerRef.current) return;
      onLoadingChange(true);
      onError('');
      viewerRef.current.innerHTML = '';

      try {
        // ─── KEY FIX ────────────────────────────────────────────────────────────
        // pdf.js transfers the ArrayBuffer to its Web Worker with postMessage
        // transferable semantics — this *detaches* the original buffer so it
        // becomes empty and unusable everywhere else (including pdf-lib later).
        // .slice(0) creates a brand-new copy whose ArrayBuffer is never detached.
        const safeData = pdfBytes.slice(0);

        let pdf: Awaited<ReturnType<typeof pdfjsLib.getDocument>['promise']>;
        try {
          pdf = await pdfjsLib.getDocument({ data: safeData }).promise;
        } catch (workerError) {
          // Fallback: some CSP / extension setups break the worker.
          // We use another fresh slice so the fallback path is also safe.
          const fallbackData = pdfBytes.slice(0);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pdf = await pdfjsLib.getDocument({ data: fallbackData, disableWorker: true } as any).promise;
          console.warn('pdf.js worker fallback activado:', workerError);
        }

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1.2 });

          const wrapper = document.createElement('div');
          wrapper.className =
            'relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm';
          wrapper.setAttribute('data-page', String(pageNumber));

          const header = document.createElement('div');
          header.className =
            'border-b bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600';
          header.textContent = `Página ${pageNumber}`;

          const canvas = document.createElement('canvas');
          canvas.className = 'block w-full';
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = '100%';
          canvas.style.height = 'auto';

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;

          wrapper.addEventListener('dragover', (e) => e.preventDefault());
          wrapper.addEventListener('drop', (e) => {
            e.preventDefault();
            const signerId = e.dataTransfer?.getData('application/signer-id') as
              | Signer['id']
              | undefined;
            if (!signerId) return;
            const rect = canvas.getBoundingClientRect();
            const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
            // Use the ref so this always calls the latest handler without being
            // listed as an effect dependency (which would retrigger the render).
            onDropSignerRef.current(signerId, pageNumber, x, y);
          });

          wrapper.appendChild(header);
          wrapper.appendChild(canvas);
          viewerRef.current?.appendChild(wrapper);
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error || 'Error desconocido');
        console.error('Error renderizando PDF:', error);
        onError(`No fue posible renderizar el PDF. Detalle: ${reason}`);
      } finally {
        onLoadingChange(false);
      }
    };

    void renderPdf();
    // onDropSigner intentionally excluded — handled via ref above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfBytes, onError, onLoadingChange]);

  // ─── Overlay signature placements ────────────────────────────────────────────
  useEffect(() => {
    if (!viewerRef.current) return;

    viewerRef.current
      .querySelectorAll('[data-placement="true"]')
      .forEach((node) => node.remove());

    placements.forEach((placement) => {
      const pageEl = viewerRef.current?.querySelector<HTMLElement>(
        `[data-page="${placement.page}"]`,
      );
      if (!pageEl) return;

      const box = document.createElement('div');
      box.setAttribute('data-placement', 'true');
      box.className =
        'absolute z-20 rounded-lg border-2 bg-white/85 px-2 py-1 text-[11px] font-semibold text-slate-800 shadow transition-all';
      box.style.borderColor = placement.color;
      box.style.left = `calc(${placement.x * 100}% - ${placement.width / 2}px)`;
      box.style.top = `calc(${placement.y * 100}% - ${placement.height / 2}px)`;
      box.style.width = `${placement.width}px`;
      box.style.height = `${placement.height}px`;
      box.innerHTML = `<div>Firma aquí</div><div style="font-size:10px;opacity:.75">${placement.signerName}</div>`;

      pageEl.appendChild(box);
    });
  }, [placements, signers]);

  return (
    <div className="relative min-h-[520px] rounded-2xl border border-slate-200 bg-slate-50 p-4">
      {loading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm">
          <p className="text-sm font-semibold text-slate-700">Renderizando documento…</p>
        </div>
      )}
      {!pdfBytes && !loading && (
        <div className="flex min-h-[460px] items-center justify-center text-center text-sm text-slate-500">
          <p>Sube un PDF para activar la vista previa.</p>
        </div>
      )}
      <div ref={viewerRef} className="space-y-4" />
    </div>
  );
}