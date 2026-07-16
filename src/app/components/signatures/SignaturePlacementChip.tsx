import { useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface SignaturePlacementChipProps {
  dataUrl: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  containerRef: React.RefObject<HTMLDivElement | null>;
  onChange: (pos: { x: number; y: number }) => void;
  onRemove?: () => void;
}

/**
 * Draggable signature chip for the "place it wherever you want" (Adobe/
 * DocuSign-style) placement step — percentage-based position within
 * containerRef, direct DOM mutation during the drag (no React re-render
 * mid-gesture) so it stays smooth on mobile. Pointer Events unify mouse
 * and touch, so this works the same on a phone as a desktop browser.
 */
export function SignaturePlacementChip({ dataUrl, x, y, containerRef, onChange, onRemove }: SignaturePlacementChipProps) {
  const chipRef  = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const livePos  = useRef({ x, y });
  const startRef = useRef({ px: 0, py: 0, ox: 0, oy: 0 });

  // Sync DOM position when parent commits a new position (after drag ends)
  useEffect(() => {
    if (!dragging.current && chipRef.current) {
      chipRef.current.style.left = `${x}%`;
      chipRef.current.style.top  = `${y}%`;
      livePos.current = { x, y };
    }
  }, [x, y]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dragging.current = true;
    startRef.current = { px: e.clientX, py: e.clientY, ox: livePos.current.x, oy: livePos.current.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !containerRef.current || !chipRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx   = ((e.clientX - startRef.current.px) / rect.width) * 100;
    const dy   = ((e.clientY - startRef.current.py) / (containerRef.current.scrollHeight || rect.height)) * 100;
    const newX = Math.max(2, Math.min(88, startRef.current.ox + dx));
    const newY = Math.max(1, Math.min(93, startRef.current.oy + dy));
    livePos.current = { x: newX, y: newY };
    chipRef.current.style.left = `${newX}%`;
    chipRef.current.style.top  = `${newY}%`;
  }, [containerRef]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    const pos = livePos.current;
    requestAnimationFrame(() => onChange(pos));
  }, [onChange]);

  return (
    <div
      ref={chipRef}
      style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)', zIndex: 50, touchAction: 'none', cursor: 'grab', willChange: 'left, top', pointerEvents: 'auto' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative group rounded-lg border-2 border-blue-500 bg-white shadow-xl px-2 py-1">
        <img src={dataUrl} alt="firma" className="h-14 w-[160px] object-contain" draggable={false} crossOrigin="anonymous" />
        {onRemove && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="absolute -top-2.5 -right-2.5 hidden group-hover:flex size-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
          >
            <X className="size-3" />
          </button>
        )}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-blue-500 font-medium whitespace-nowrap select-none">
          ⠿ arrastrar
        </div>
      </div>
    </div>
  );
}
