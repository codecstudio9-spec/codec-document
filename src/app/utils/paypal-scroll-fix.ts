/**
 * PayPal's own SDK sometimes locks page scroll (sets `overflow: hidden` /
 * `position: fixed` on <body>, or adds an aria-hidden/data-scroll-locked
 * attribute) while its card-fields overlay is expanded — e.g. when a buyer
 * without a PayPal account picks "Debit or Credit Card" and the hosted
 * card form grows taller than the viewport. Our own scroll-lock cleanup
 * only ran on specific lifecycle events (approve/cancel/error/unmount), so
 * if PayPal applies its lock *during* an active card-entry session, the
 * page stays stuck — the buyer can't scroll down to reach the submit
 * button or scroll back up to fix a typo.
 *
 * This watches <body> continuously while a PayPal checkout is mounted and
 * strips any scroll lock the instant it appears, instead of waiting for
 * our own component lifecycle to fire.
 */
export function watchAndUnlockBodyScroll(): () => void {
  const unlock = () => {
    if (document.body.style.overflow === 'hidden') document.body.style.overflow = '';
    if (document.body.style.position === 'fixed') document.body.style.position = '';
    document.body.style.paddingRight = '';
    document.body.removeAttribute('data-scroll-locked');
    if (document.documentElement.style.overflow === 'hidden') {
      document.documentElement.style.overflow = '';
    }
  };

  unlock();

  const observer = new MutationObserver(unlock);
  observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'data-scroll-locked'] });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

  return () => observer.disconnect();
}
