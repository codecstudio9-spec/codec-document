import { getSignedUrlFallback } from '../../lib/signatureService';

/**
 * Opens a stored document/signature Storage URL in a new tab, transparently
 * recovering via a signed URL when the direct fetch 400s/401s — which is the
 * normal case for anything uploaded to the private `documents-private`
 * bucket (see signatureService.ts's uploadPdfToStorage). Every list/dashboard
 * "open PDF" action was previously a raw `window.open(url)`, which worked
 * only by accident because `documents-bucket` used to be public; this is the
 * one place all of them now go through instead of duplicating the retry
 * logic guest-sign-page.tsx already had for its own PDF viewer.
 *
 * Must be called synchronously from a user-gesture handler (a click). It
 * opens a blank tab immediately, before the async HEAD check, so browsers
 * don't treat the later `location.href` assignment as a popup — `win.opener
 * = null` gets the same tabnabbing protection as `noopener` while still
 * letting this function hold a reference to navigate later.
 */
export function openDocumentUrl(url: string): void {
  if (!url) return;
  const win = window.open('', '_blank');
  if (win) win.opener = null;

  void (async () => {
    let target = url;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (!res.ok) throw new Error(`HEAD ${res.status}`);
    } catch {
      const signed = await getSignedUrlFallback(url);
      if (signed) target = signed;
    }
    if (win) win.location.href = target;
    else window.open(target, '_blank');
  })();
}
