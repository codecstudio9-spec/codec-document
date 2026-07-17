import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, Loader, Type, Calendar, PenLine, Braces, Check, X } from 'lucide-react';
import { DraggableField } from './DraggableField';
import type { FieldType, PlacedField } from '../../services/template-service';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const DEFAULT_W = 0.28;
const DEFAULT_H = 0.035;

const FIELD_TYPES: Array<{ type: FieldType; icon: typeof Type; labelEs: string; needsLabel: boolean }> = [
  { type: 'text', icon: Type, labelEs: 'Texto', needsLabel: true },
  { type: 'date', icon: Calendar, labelEs: 'Fecha', needsLabel: true },
  { type: 'signature', icon: PenLine, labelEs: 'Firma', needsLabel: false },
  { type: 'initials', icon: Braces, labelEs: 'Iniciales', needsLabel: false },
];

/** Click-to-place field editor for custom templates — same interactive
 * PDF viewer pattern already proven in PdfSignatureEditor.tsx (thumbnail
 * rail, active-page canvas), but placing arbitrary labeled fields
 * instead of only signatures. A small popover appears where the user
 * clicks, asking what kind of field goes there and (for text/date) what
 * to call it — that label is what the fill-in form shows later. */
export function TemplateFieldEditor({ pdfBytes, fields, onFieldsChange }: {
  pdfBytes: Uint8Array;
  fields: PlacedField[];
  onFieldsChange: (fields: PlacedField[]) => void;
}) {
  const [pageCount, setPageCount] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [picker, setPicker] = useState<{ xFraction: number; yFraction: number } | null>(null);
  const [pickerType, setPickerType] = useState<FieldType>('text');
  const [pickerLabel, setPickerLabel] = useState('');

  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mainContainerRef = useRef<HTMLDivElement | null>(null);
  const thumbCanvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const renderedPageRef = useRef<number>(0);

  useEffect(() => {
    if (!pdfBytes) return;
    setPdfLoading(true);
    renderedPageRef.current = 0;
    void (async () => {
      try {
        const safeData = pdfBytes.slice(0);
        let pdf: pdfjsLib.PDFDocumentProxy;
        try {
          pdf = await pdfjsLib.getDocument({ data: safeData }).promise;
        } catch {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pdf = await pdfjsLib.getDocument({ data: pdfBytes.slice(0), disableWorker: true } as any).promise;
        }
        pdfDocRef.current = pdf;
        thumbCanvasRefs.current = new Array(pdf.numPages).fill(null);
        setPageCount(pdf.numPages);
        setActivePage(1);
      } catch (e) {
        console.error('TemplateFieldEditor: error loading PDF:', e);
        setPdfLoading(false);
      }
    })();
  }, [pdfBytes]);

  useEffect(() => {
    if (!pdfDocRef.current || pageCount === 0) return;
    const pdf = pdfDocRef.current;
    void (async () => {
      for (let i = 1; i <= pageCount; i++) {
        const canvas = thumbCanvasRefs.current[i - 1];
        if (!canvas) continue;
        try {
          const page = await pdf.getPage(i);
          const vp = page.getViewport({ scale: 0.25 });
          canvas.width = vp.width; canvas.height = vp.height;
          canvas.style.width = '100%'; canvas.style.height = 'auto';
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
        } catch (e) { console.error(`Thumb ${i}:`, e); }
      }
    })();
  }, [pageCount]);

  useEffect(() => {
    if (!pdfDocRef.current || activePage === 0 || pageCount === 0) return;
    if (renderedPageRef.current === activePage) return;
    const pdf = pdfDocRef.current;
    void (async () => {
      const canvas = mainCanvasRef.current;
      if (!canvas) return;
      try {
        const page = await pdf.getPage(activePage);
        const vp = page.getViewport({ scale: 2.0 });
        canvas.width = vp.width; canvas.height = vp.height;
        canvas.style.width = '100%'; canvas.style.height = 'auto';
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
    })();
  }, [activePage, pageCount]);

  const updateField = (id: string, updates: Partial<PlacedField>) =>
    onFieldsChange(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  const deleteField = (id: string) => onFieldsChange(fields.filter((f) => f.id !== id));

  const handlePageClick = (e: React.PointerEvent<HTMLDivElement>) => {
    if (picker) return;
    const rect = mainContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setPicker({ xFraction: x, yFraction: y });
    setPickerType('text');
    setPickerLabel('');
  };

  const confirmPicker = () => {
    if (!picker) return;
    const meta = FIELD_TYPES.find((t) => t.type === pickerType)!;
    const label = meta.needsLabel ? (pickerLabel.trim() || meta.labelEs) : meta.labelEs;
    const newField: PlacedField = {
      id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: pickerType,
      label,
      page: activePage,
      xFraction: picker.xFraction,
      yFraction: picker.yFraction,
      widthFraction: pickerType === 'signature' ? 0.24 : pickerType === 'initials' ? 0.1 : DEFAULT_W,
      heightFraction: pickerType === 'signature' ? 0.07 : DEFAULT_H,
      required: true,
    };
    onFieldsChange([...fields, newField]);
    setPicker(null);
  };

  const activeFields = fields.filter((f) => f.page === activePage);

  return (
    <div className="flex gap-3 lg:gap-4">
      {/* LEFT — field list */}
      <aside className="w-56 shrink-0 space-y-3 lg:w-64">
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          <p className="font-semibold">¿Cómo agregar campos?</p>
          <p className="mt-1 text-xs text-indigo-700/80">Haz clic en cualquier parte del documento donde quieras que vaya un campo (nombre, fecha, firma…).</p>
        </div>

        {fields.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs font-bold text-slate-800">Campos ({fields.length})</p>
            <ul className="space-y-1.5">
              {fields.map((f) => {
                const meta = FIELD_TYPES.find((t) => t.type === f.type)!;
                const Icon = meta.icon;
                return (
                  <li key={f.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5">
                    <button type="button" className="flex min-w-0 items-center gap-1.5 text-left" onClick={() => setActivePage(f.page)}>
                      <Icon className="size-3 shrink-0 text-slate-500" />
                      <span className="truncate text-xs text-slate-700">{f.label} · pág. {f.page}</span>
                    </button>
                    <button type="button" onClick={() => deleteField(f.id)} className="shrink-0 text-[10px] text-red-400 hover:text-red-600">✕</button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </aside>

      {/* CENTER — page viewer */}
      <div className="min-w-0 flex-1 space-y-2">
        {pageCount > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <button type="button" onClick={() => setActivePage((p) => Math.max(1, p - 1))} disabled={activePage <= 1}
              className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40">
              <ChevronLeft className="size-3.5" />Anterior
            </button>
            <span className="text-xs font-semibold text-slate-700">
              Página <span className="text-indigo-600">{activePage}</span> <span className="text-slate-400">de {pageCount}</span>
            </span>
            <button type="button" onClick={() => setActivePage((p) => Math.min(pageCount, p + 1))} disabled={activePage >= pageCount}
              className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40">
              Siguiente<ChevronRight className="size-3.5" />
            </button>
          </div>
        )}

        {pdfLoading && (
          <div className="flex min-h-[500px] items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
            <Loader className="size-5 animate-spin text-indigo-500" />
            Renderizando página {activePage}…
          </div>
        )}

        <div className={`overflow-y-auto rounded-2xl ${pdfLoading ? 'h-0' : ''}`} style={{ maxHeight: '76vh' }}>
          <div
            ref={mainContainerRef}
            className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${pdfLoading ? 'invisible' : ''}`}
            style={{ touchAction: 'none', cursor: picker ? 'default' : 'crosshair' }}
            onPointerDown={handlePageClick}
          >
            <canvas ref={mainCanvasRef} className="block w-full" />

            {activeFields.map((f) => (
              <DraggableField
                key={f.id}
                field={f}
                getContainer={() => mainContainerRef.current}
                onChange={(updates) => updateField(f.id, updates)}
                onDelete={() => deleteField(f.id)}
              />
            ))}

            {picker && (
              <div
                className="absolute z-[60] w-64 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"
                style={{ left: `${picker.xFraction * 100}%`, top: `${picker.yFraction * 100}%` }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-800">Nuevo campo</p>
                  <button type="button" onClick={() => setPicker(null)} className="text-slate-400 hover:text-slate-600"><X className="size-3.5" /></button>
                </div>
                <div className="mb-3 grid grid-cols-2 gap-1.5">
                  {FIELD_TYPES.map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => setPickerType(t.type)}
                      className={[
                        'flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-semibold transition',
                        pickerType === t.type ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <t.icon className="size-3.5" />
                      {t.labelEs}
                    </button>
                  ))}
                </div>
                {FIELD_TYPES.find((t) => t.type === pickerType)?.needsLabel && (
                  <input
                    autoFocus
                    value={pickerLabel}
                    onChange={(e) => setPickerLabel(e.target.value)}
                    placeholder="Nombre del campo (ej. Nombre del cliente)"
                    className="mb-3 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400"
                  />
                )}
                <button
                  type="button"
                  onClick={confirmPicker}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  <Check className="size-3.5" />
                  Agregar campo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT — thumbnails */}
      {pageCount > 0 && (
        <aside className="w-24 shrink-0 space-y-2 lg:w-28">
          <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">Páginas</p>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => {
            const hasFields = fields.some((f) => f.page === pageNum);
            const isActive = activePage === pageNum;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => setActivePage(pageNum)}
                className={`w-full overflow-hidden rounded-xl border-2 transition-all ${isActive ? 'border-indigo-500 shadow-lg' : 'border-slate-200 hover:border-indigo-300'}`}
              >
                <div className="relative">
                  <canvas ref={(el) => { thumbCanvasRefs.current[pageNum - 1] = el; }} className="block w-full bg-slate-100" />
                  {hasFields && <span className="absolute bottom-1 right-1 size-2 rounded-full bg-emerald-400" />}
                  <span className="absolute bottom-0 left-0 bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white">{pageNum}</span>
                </div>
              </button>
            );
          })}
        </aside>
      )}
    </div>
  );
}
