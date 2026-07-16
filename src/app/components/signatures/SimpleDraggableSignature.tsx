import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { PlacedSignature } from './types';

interface SimpleDraggableSignatureProps {
  sig: PlacedSignature;
  getContainer: () => HTMLDivElement | null;
  onChange: (updates: Partial<PlacedSignature>) => void;
  onDelete: () => void;
}

const clamp = (min: number, max: number, v: number) => Math.max(min, Math.min(max, v));

/**
 * Adobe/DocuSign-style signature field: just the signature image, nothing
 * else — no branded header bar, no "FIRMA DIGITAL" label, no name/role
 * signing block. Touch the image itself to drag it anywhere on the page;
 * a small corner handle resizes it. This is deliberately a *different*,
 * simpler component from DraggableSignature (not a shared one) — that one
 * is still used elsewhere (preview-page.tsx, PdfSignatureEditor.tsx) where
 * the fuller "professional signing block" look is still wanted; this one
 * is only for the guest tap-to-place flow, where the ask was explicitly
 * "just move the signature, nothing else."
 */
export function SimpleDraggableSignature({ sig, getContainer, onChange, onDelete }: SimpleDraggableSignatureProps) {
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);

  const drag = useRef({ startX: 0, startY: 0, startFX: 0, startFY: 0 });
  const resize = useRef({ startX: 0, startY: 0, startWF: 0, startHF: 0 });
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  const onDragPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragHandleRef.current?.setPointerCapture(e.pointerId);
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
      xFraction: clamp(sig.widthFraction / 2, 1 - sig.widthFraction / 2, drag.current.startFX + dx),
      yFraction: clamp(sig.heightFraction / 2, 1 - sig.heightFraction / 2, drag.current.startFY + dy),
    });
  };

  const onDragPointerUp = () => setDragging(false);

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
      widthFraction: clamp(0.12, 0.50, resize.current.startWF + dxF),
      heightFraction: clamp(0.04, 0.20, resize.current.startHF + dyF),
    });
  };

  const onResizePointerUp = () => setResizing(false);

  const isActive = dragging || resizing;

  return (
    <div
      className="absolute select-none"
      style={{
        left: `${sig.xFraction * 100}%`,
        top: `${sig.yFraction * 100}%`,
        width: `${sig.widthFraction * 100}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: isActive ? 50 : 20,
        touchAction: 'none',
      }}
    >
      <div
        ref={dragHandleRef}
        onPointerDown={onDragPointerDown}
        onPointerMove={onDragPointerMove}
        onPointerUp={onDragPointerUp}
        onPointerCancel={onDragPointerUp}
        className={[
          'relative flex cursor-grab items-center justify-center rounded-lg active:cursor-grabbing',
          isActive ? 'ring-2 ring-blue-400 shadow-xl' : 'ring-1 ring-blue-300/70 shadow-md',
        ].join(' ')}
        style={{ background: 'rgba(255,255,255,0.5)', aspectRatio: `${sig.widthFraction} / ${sig.heightFraction}` }}
      >
        {sig.imageDataUrl && (
          <img
            src={sig.imageDataUrl}
            alt={`Firma de ${sig.signerName}`}
            draggable={false}
            crossOrigin="anonymous"
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }}
          />
        )}

        {/* Small delete X — top-right, out of the way of the signature itself */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -right-3 -top-3 flex size-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm active:scale-90"
        >
          <X className="size-3.5" />
        </button>

        {/* Small resize handle — bottom-right corner only */}
        <div
          ref={resizeHandleRef}
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          onPointerCancel={onResizePointerUp}
          className="absolute -bottom-2.5 -right-2.5 flex size-8 cursor-se-resize items-center justify-center"
          style={{ touchAction: 'none' }}
        >
          <div className="size-3.5 rounded-sm border-2 border-white bg-blue-500 shadow" />
        </div>
      </div>
    </div>
  );
}
