/**
 * Saved signature for guest signers (no account) — mirrors
 * signature-storage-service.ts's getSavedSignature/saveSavedSignature but
 * persists to this browser's localStorage instead of the user's profile
 * row, since a guest has no profile to save to.
 */

const KEY = 'codec_guest_signature';

export function getGuestSignature(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveGuestSignature(dataUrl: string): void {
  try {
    window.localStorage.setItem(KEY, dataUrl);
  } catch {
    /* storage unavailable or full — signature still confirms, just isn't remembered */
  }
}

export function clearGuestSignature(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
