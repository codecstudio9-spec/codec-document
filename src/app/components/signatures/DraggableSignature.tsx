import { useRef, useState } from 'react';
import { GripHorizontal, Trash2, Type, X, CornerRightDown } from 'lucide-react';
import type { PlacedSignature } from './types';

interface DraggableSignatureProps {
  sig: PlacedSignature;
  getContainer: () => HTMLDivElement | null;
  onChange: (updates: Partial<PlacedSignature>) => void;
  onDelete: () => void;
}

const clamp = (min: number, max: number, v: number) => Math.max(min, Math.min(max, v));

export function DraggableSignature({ sig, getContainer, onChange, onDelete }: DraggableSignatureProps) {
  const [dragging,    setDragging]    = useState(false);
  const [resizing,    setResizing]    = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);

  const drag        = useRef({ startX: 0, startY: 0, startFX: 0, startFY: 0 });
  const resize      = useRef({ startX: 0, startY: 0, startWF: 0, startHF: 0 });
  const handleRef   = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  // ─── Drag ─────────────────────────────────────────────────────────────────────
  const onDragPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleRef.current?.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, startFX: sig.xFraction, startFY: sig.yFraction };
    setDragging(true);
  };

  const onDragPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const rect = getContainer()?.getBoundingClientRect();
    if (!rect) return;
    const dx = (e.clientX - drag.current.startX) / rect.width;
    const dy = (e.clientY - drag.current.startY) / rect.height;
    onChange({
      xFraction: clamp(sig.widthFraction / 2,  1 - sig.widthFraction / 2,  drag.current.startFX + dx),
      yFraction: clamp(sig.heightFraction / 2, 1 - sig.heightFraction / 2, drag.current.startFY + dy),
    });
  };

  const onDragPointerUp = () => setDragging(false);

  // ─── Resize ───────────────────────────────────────────────────────────────────
  const onResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeHandleRef.current?.setPointerCapture(e.pointerId);
    resize.current = { startX: e.clientX, startY: e.clientY, startWF: sig.widthFraction, startHF: sig.heightFraction };
    setResizing(true);
  };

  const onResizePointerMove = (e: React.PointerEvent) => {
    if (!resizing) return;
    const rect = getContainer()?.getBoundingClientRect();
    if (!rect) return;
    const dxF = (e.clientX - resize.current.startX) / rect.width;
    const dyF = (e.clientY - resize.current.startY) / rect.height;
    onChange({
      widthFraction:  clamp(0.10, 0.65, resize.current.startWF + dxF),
      heightFraction: clamp(0.08, 0.35, resize.current.startHF + dyF),
    });
  };

  const onResizePointerUp = () => setResizing(false);

  const isActive = dragging || resizing;

  return (
    <div
      className="absolute select-none"
      style={{
        left:      `${sig.xFraction * 100}%`,
        top:       `${sig.yFraction * 100}%`,
        width:     `${sig.widthFraction * 100}%`,
        transform: 'translate(-50%, -50%)',
        zIndex:    isActive ? 50 : 20,
        touchAction: 'none',
      }}
    >
      <div
        className={[
          'group relative rounded-xl border-2 bg-white transition-shadow',
          isActive ? 'shadow-2xl ring-2 ring-blue-400/40' : 'shadow-md hover:shadow-xl',
        ].join(' ')}
        style={{ borderColor: sig.color }}
      >
        {/* ── Drag handle bar ─────────────────────────────────────────────────── */}
        <div
          ref={handleRef}
          className="flex h-7 cursor-grab items-center justify-between rounded-t-[10px] px-2 active:cursor-grabbing"
          style={{ backgroundColor: sig.color }}
          onPointerDown={onDragPointerDown}
          onPointerMove={onDragPointerMove}
          onPointerUp={onDragPointerUp}
        >
          <span className="flex items-center gap-1 text-[11px] font-semibold text-white/90">
            <GripHorizontal className="size-3.5 opacity-70" />
            {sig.signerName}
            {sig.signerRole && (
              <span className="ml-1 font-normal opacity-60">· {sig.signerRole}</span>
            )}
          </span>

          {/* Controls — always visible, see resize/delete note above */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              title={sig.showLabel ? 'Ocultar texto' : 'Agregar texto'}
              className="rounded px-1 py-0.5 text-white/80 hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); onChange({ showLabel: !sig.showLabel }); }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Type className="size-3" />
            </button>
            <button
              type="button"
              title="Eliminar firma"
              className="rounded px-1 py-0.5 text-white/80 hover:bg-red-400/40"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <X className="size-3" />
            </button>
          </div>
        </div>

        {/* ── "FIRMA DIGITAL" label ────────────────────────────────────────────── */}
        <div className="px-3 pt-2 pb-0">
          <p className="text-[8px] font-bold uppercase tracking-[0.18em]" style={{ color: `${sig.color}bb` }}>
            Firma Digital
          </p>
        </div>

        {/* ── Signature image — spacious so it's the protagonist ───────────────── */}
        <div className="bg-white px-3 pt-1 pb-2" style={{ minHeight: 180 }}>
          {sig.imageDataUrl ? (
            <img
              src={sig.imageDataUrl}
              alt={`Firma de ${sig.signerName}`}
              draggable={false}
              crossOrigin="anonymous"
              style={{ width: '100%', maxHeight: 145, objectFit: 'contain', display: 'block', margin: '0 auto', minHeight: 110 }}
            />
          ) : (
            <div
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed"
              style={{
                minHeight: 110,
                borderColor: `${sig.color}60`,
                backgroundColor: `${sig.color}08`,
              }}
            >
              <span className="text-[10px] italic text-slate-400">Sin firma</span>
            </div>
          )}
        </div>

        {/* ── Professional signing block (X line + name + role) ─────────────────── */}
        <div className="mx-3 mb-2 mt-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm font-black leading-none select-none" style={{ color: sig.color }}>X</span>
            <div className="flex-1 border-t-2" style={{ borderColor: `${sig.color}80` }} />
          </div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-900 leading-tight">
            {sig.signerName}
          </p>
          {sig.signerRole && (
            <p className="text-[8px] uppercase tracking-wide mt-0.5 leading-tight" style={{ color: sig.color }}>
              {sig.signerRole}
            </p>
          )}
        </div>

        {/* ── Editable label ─────────────────────────────────────────────────── */}
        {sig.showLabel && (
          <div
            className="border-t px-3 py-1.5"
            style={{ borderColor: `${sig.color}30` }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {editingLabel ? (
              <input
                autoFocus
                value={sig.labelText}
                onChange={(e) => onChange({ labelText: e.target.value })}
                onBlur={() => setEditingLabel(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingLabel(false)}
                className="w-full bg-transparent text-[11px] text-slate-800 outline-none placeholder:text-slate-400"
                placeholder="Nombre, fecha, cargo…"
              />
            ) : (
              <p
                className="cursor-text text-[11px] text-slate-700"
                onClick={() => setEditingLabel(true)}
              >
                {sig.labelText || (
                  <span className="italic text-slate-400">Clic para agregar texto…</span>
                )}
              </p>
            )}
          </div>
        )}

        {/* ── Resize handle ─────────────────────────────────────────────────── */}
        {/* Always visible (not hover-gated) — :hover doesn't exist on touch
            devices, so a phone user would never be able to see or reach
            this at all under the old group-hover:opacity-100 pattern. */}
        <div
          ref={resizeHandleRef}
          className="absolute -bottom-2.5 -right-2.5 flex size-7 cursor-se-resize items-center justify-center rounded-full border-2 border-white shadow-md"
          style={{ backgroundColor: sig.color, touchAction: 'none' }}
          title="Redimensionar"
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
        >
          <CornerRightDown className="size-3.5 text-white" />
        </div>

        {/* ── Delete button — always visible for the same reason ─────────────── */}
        <button
          type="button"
          className="absolute -right-3 -top-3 flex size-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-red-600"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          onPointerDown={(e) => e.stopPropagation()}
          title="Eliminar"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
