import { useEffect, useState } from 'react';

/**
 * JS-decided (matchMedia), not CSS-only show/hide — used across the mobile
 * app-shell so screens can branch layout in JS (e.g. redirect, pick a
 * different data-fetch strategy) rather than just hiding markup with
 * Tailwind breakpoints.
 */
export function useIsMobile(breakpointPx = 768): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${breakpointPx - 1}px)`).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);

    // `MediaQueryList.addEventListener` is absent in older Android WebViews
    // and Samsung Internet versions. This hook runs before the mobile shell
    // can render, so calling it unconditionally crashes the whole route on
    // those phones. Keep the legacy listener as a compatibility fallback.
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }

    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, [breakpointPx]);

  return isMobile;
}
