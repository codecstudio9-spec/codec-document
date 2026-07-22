/**
 * Default zoom for a PDF viewer's initial render — 50% on desktop (a full
 * page at 100% is usually too tall to see without scrolling on a PC
 * screen; the user can still zoom back up to 100%+ manually), 100% on
 * mobile (where the viewport is already narrow, so 50% would be too small
 * to read anything). Same `max-width: 767px` breakpoint already used
 * elsewhere in this app (e.g. guest-sign-page.tsx's isMobile check).
 */
export function defaultViewerZoom(): number {
  if (typeof window === 'undefined') return 1;
  return window.matchMedia('(min-width: 768px)').matches ? 0.5 : 1;
}
