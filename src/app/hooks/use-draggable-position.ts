import { useEffect, useRef, useState } from 'react';

/**
 * Deja arrastrar un botón flotante a donde no estorbe, y recuerda dónde lo
 * dejó el usuario (por navegador, entre sesiones).
 *
 * Un toque que no se mueve más de unos pocos píxeles sigue valiendo como clic
 * normal; un arrastre de verdad se traga el clic. Es el mismo truco de
 * «descartar el clic después de un gesto real» que usa `use-long-press.ts`.
 *
 * ── Por qué está aquí y no dentro de un componente ──────────────────────
 * Vivía dentro de `InstallAppPrompt`, que era su único usuario. Al aparecer
 * el segundo botón flotante —la ayuda del panel del contador— la opción era
 * copiarlo o subirlo; copiado, cualquier arreglo del arrastre habría quedado
 * aplicado en la mitad de los sitios.
 */
export function useDraggablePosition(storageKey: string) {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0, left: 0, top: 0 });

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { left: number; top: number };
      if (typeof parsed.left === 'number' && typeof parsed.top === 'number') setPos(parsed);
    } catch { /* ignore malformed value */ }
  }, [storageKey]);

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    draggingRef.current = true;
    movedRef.current = false;
    startRef.current = { x: e.clientX, y: e.clientY, left: rect.left, top: rect.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (!movedRef.current && Math.hypot(dx, dy) > 6) movedRef.current = true;
    if (!movedRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const left = Math.min(Math.max(startRef.current.left + dx, 8), window.innerWidth - rect.width - 8);
    const top = Math.min(Math.max(startRef.current.top + dy, 8), window.innerHeight - rect.height - 8);
    setPos({ left, top });
  };

  const onPointerUp = () => {
    draggingRef.current = false;
    if (movedRef.current) {
      setPos((current) => {
        if (current) localStorage.setItem(storageKey, JSON.stringify(current));
        return current;
      });
    }
  };

  return {
    pos,
    wasDragged: () => movedRef.current,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
