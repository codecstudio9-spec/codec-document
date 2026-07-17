import { useRef, useState } from 'react';
import { X, Type, Calendar, PenLine, Braces } from 'lucide-react';
import type { PlacedField } from '../../services/template-service';

const clamp = (min: number, max: number, v: number) => Math.max(min, Math.min(max, v));

const TYPE_ICON = { text: Type, date: Calendar, signature: PenLine, initials: Braces } as const;
const TYPE_COLOR = { text: '#2563eb', date: '#7c3aed', signature: '#059669', initials: '#d97706' } as const;

/** Same drag/resize interaction as SimpleDraggableSignature, generalized
 * for any field type instead of just a signature image — shows the
 * field's label/type instead of an image, since there's nothing to
 * render yet at template-creation time. */
export function DraggableField({ field, getContainer, onChange, onDelete }: {
  field: PlacedField;
  getContainer: () => HTMLDivElement | null;
  onChange: (updates: Partial<PlacedField>) => void;
  onDelete: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const drag = useRef({ startX: 0, startY: 0, startFX: 0, startFY: 0 });
  const resize = useRef({ startX: 0, startY: 0, startWF: 0, startHF: 0 });
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  const color = TYPE_COLOR[field.type];
  const Icon = TYPE_ICON[field.type];

  const onDragPointerDown = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragHandleRef.current?.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, startFX: field.xFraction, startFY: field.yFraction };
    setDragging(true);
  };
  const onDragPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const rect = getContainer()?.getBoundingClientRect();
    if (!rect) return;
    const dx = (e.clientX - drag.current.startX) / rect.width;
    const dy = (e.clientY - drag.current.startY) / rect.height;
    onChange({
      xFraction: clamp(field.widthFraction / 2, 1 - field.widthFraction / 2, drag.current.startFX + dx),
      yFraction: clamp(field.heightFraction / 2, 1 - field.heightFraction / 2, drag.current.startFY + dy),
    });
  };
  const onDragPointerUp = () => setDragging(false);

  const onResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    resizeHandleRef.current?.setPointerCapture(e.pointerId);
    resize.current = { startX: e.clientX, startY: e.clientY, startWF: field.widthFraction, startHF: field.heightFraction };
    setResizing(true);
  };
  const onResizePointerMove = (e: React.PointerEvent) => {
    if (!resizing) return;
    const rect = getContainer()?.getBoundingClientRect();
    if (!rect) return;
    const dxF = (e.clientX - resize.current.startX) / rect.width;
    const dyF = (e.clientY - resize.current.startY) / rect.height;
    onChange({
      widthFraction: clamp(0.08, 0.6, resize.current.startWF + dxF),
      heightFraction: clamp(0.02, 0.2, resize.current.startHF + dyF),
    });
  };
  const onResizePointerUp = () => setResizing(false);

  const isActive = dragging || resizing;

  return (
    <div
      className="absolute select-none"
      style={{
        left: `${field.xFraction * 100}%`,
        top: `${field.yFraction * 100}%`,
        width: `${field.widthFraction * 100}%`,
        height: `${field.heightFraction * 100}%`,
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
          'relative flex size-full cursor-grab items-center gap-1 overflow-hidden rounded-md border-2 border-dashed px-1.5 active:cursor-grabbing',
          isActive ? 'shadow-lg' : 'shadow-sm',
        ].join(' ')}
        style={{ borderColor: color, background: `${color}14` }}
        title={field.label}
      >
        <Icon className="size-3 shrink-0" style={{ color }} />
        <span className="truncate text-[10px] font-bold" style={{ color }}>{field.label || field.type}</span>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -right-2.5 -top-2.5 flex size-5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm active:scale-90"
        >
          <X className="size-3" />
        </button>

        <div
          ref={resizeHandleRef}
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          onPointerCancel={onResizePointerUp}
          className="absolute -bottom-2 -right-2 flex size-6 cursor-se-resize items-center justify-center"
          style={{ touchAction: 'none' }}
        >
          <div className="size-2.5 rounded-sm border-2 border-white shadow" style={{ background: color }} />
        </div>
      </div>
    </div>
  );
}
