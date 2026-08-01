import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onTap?: () => void;
  delay?: number;
}

/**
 * Press-and-hold detector for list rows (mouse + touch). A long press
 * fires `onLongPress`; a normal press/release that never reaches the
 * delay fires `onTap` instead. The synthetic click that browsers emit
 * right after `touchend` is swallowed when a long press already fired,
 * so it never also triggers whatever the click would normally do (e.g.
 * opening the document).
 */
export function useLongPress({ onLongPress, onTap, delay = 500 }: UseLongPressOptions) {
  const timerRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    firedRef.current = false;
    clear();
    timerRef.current = window.setTimeout(() => {
      firedRef.current = true;
      if (navigator.vibrate) navigator.vibrate(15);
      onLongPress();
    }, delay);
  }, [onLongPress, delay, clear]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (firedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      firedRef.current = false;
      return;
    }
    onTap?.();
  }, [onTap]);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    onTouchCancel: clear,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    onClick: handleClick,
  };
}
