import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { PlacedSignature } from './types';

interface PageOffset {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface SimpleDraggableSignatureProps {
  sig: PlacedSignature;
  /** Pixel position/size of sig's current page, relative to the same
   * positioned ancestor this component renders into (the whole scrollable
   * content stack, not just one page) — lets this render as a single
   * persistent overlay instead of living inside one page's DOM subtree. */
  pageOffset: PageOffset;
  /** Current page's own container — only used for the resize handle, which
   * never needs to cross pages. */
  getContainer: () => HTMLDivElement | null;
  /** Hit-tests a viewport Y coordinate against every page's current
   * bounding rect (falls back to the nearest one if between pages), so a
   * drag can walk from page to page instead of clamping at the page it
   * started on. */
  resolvePageAt: (clientY: number) => { pageNum: number; rect: DOMRect } | null;
  /** The scrollable viewport — dragging near its top/bottom edge auto-scrolls it. */
  getScrollContainer: () => HTMLDivElement | null;
  onChange: (updates: Partial<PlacedSignature>) => void;
  onDelete: () => void;
}

const clamp = (min: number, max: number, v: number) => Math.max(min, Math.min(max, v));

// How close to the scroll viewport's edge (in px) triggers auto-scroll, and
// how fast (px/frame) it scrolls right at the very edge.
const AUTOSCROLL_EDGE_PX = 64;
const AUTOSCROLL_MAX_SPEED = 16;

/**
 * Adobe/DocuSign-style signature field: just the signature image, nothing
 * else — no branded header bar, no "FIRMA DIGITAL" label, no name/role
 * signing block. Touch the image itself to drag it anywhere in the
 * document — including onto a different page, auto-scrolling the document
 * as you drag near the top/bottom edge — a small corner handle resizes it.
 * This is deliberately a *different*, simpler component from
 * DraggableSignature (not a shared one) — that one is still used elsewhere
 * (preview-page.tsx, PdfSignatureEditor.tsx) where the fuller "professional
 * signing block" look is still wanted; this one is only for the guest
 * tap-to-place flow, where the ask was explicitly "just move the signature,
 * nothing else."
 */
export function SimpleDraggableSignature({
  sig, pageOffset, getContainer, resolvePageAt, getScrollContainer, onChange, onDelete,
}: SimpleDraggableSignatureProps) {
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);

  // Mirrors `dragging` but read inside the requestAnimationFrame loop,
  // which closes over whatever render created it — a plain state read
  // there would see a stale "not dragging yet" on the very first frame.
  const draggingRef = useRef(false);
  const lastPointer = useRef({ clientX: 0, clientY: 0 });
  const autoScrollFrame = useRef<number | null>(null);

  const resize = useRef({ startX: 0, startY: 0, startWF: 0, startHF: 0 });
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  const applyPointerPosition = (clientX: number, clientY: number) => {
    const target = resolvePageAt(clientY);
    if (!target) return;
    const { pageNum, rect } = target;
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    onChange({
      page: pageNum,
      xFraction: clamp(sig.widthFraction / 2, 1 - sig.widthFraction / 2, x),
      yFraction: clamp(sig.heightFraction / 2, 1 - sig.heightFraction / 2, y),
    });
  };

  const stopAutoScroll = () => {
    if (autoScrollFrame.current != null) {
      cancelAnimationFrame(autoScrollFrame.current);
      autoScrollFrame.current = null;
    }
  };

  const autoScrollTick = () => {
    if (!draggingRef.current) { stopAutoScroll(); return; }
    const container = getScrollContainer();
    if (container) {
      const rect = container.getBoundingClientRect();
      const { clientY } = lastPointer.current;
      let speed = 0;
      if (clientY < rect.top + AUTOSCROLL_EDGE_PX) {
        speed = -AUTOSCROLL_MAX_SPEED * clamp(0, 1, (rect.top + AUTOSCROLL_EDGE_PX - clientY) / AUTOSCROLL_EDGE_PX);
      } else if (clientY > rect.bottom - AUTOSCROLL_EDGE_PX) {
        speed = AUTOSCROLL_MAX_SPEED * clamp(0, 1, (clientY - (rect.bottom - AUTOSCROLL_EDGE_PX)) / AUTOSCROLL_EDGE_PX);
      }
      if (speed !== 0) {
        container.scrollBy({ top: speed });
        // Document moved under a stationary finger — re-resolve what's now underneath it.
        applyPointerPosition(lastPointer.current.clientX, lastPointer.current.clientY);
      }
    }
    autoScrollFrame.current = requestAnimationFrame(autoScrollTick);
  };

  const onDragPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragHandleRef.current?.setPointerCapture(e.pointerId);
    lastPointer.current = { clientX: e.clientX, clientY: e.clientY };
    draggingRef.current = true;
    setDragging(true);
    autoScrollFrame.current = requestAnimationFrame(autoScrollTick);
  };

  const onDragPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    lastPointer.current = { clientX: e.clientX, clientY: e.clientY };
    applyPointerPosition(e.clientX, e.clientY);
  };

  const onDragPointerUp = () => {
    draggingRef.current = false;
    setDragging(false);
    stopAutoScroll();
  };

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
        left: `${pageOffset.left + sig.xFraction * pageOffset.width}px`,
        top: `${pageOffset.top + sig.yFraction * pageOffset.height}px`,
        width: `${sig.widthFraction * pageOffset.width}px`,
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
