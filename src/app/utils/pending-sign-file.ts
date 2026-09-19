/**
 * One-shot handoff for "Crear nuevo" (ai-create-document-page.tsx) → the
 * existing "Firma Digital" flow (electronic-signature-page.tsx) — lets
 * the AI-generated, branded PDF walk straight into that page's normal
 * upload step instead of making the user download it and re-upload it
 * through PdfUploader.
 *
 * A plain module-level variable, not sessionStorage/localStorage: a File
 * object doesn't survive JSON serialization, and this only ever needs to
 * cross one client-side route change within the same page load (never a
 * full reload) — react-router's in-memory navigation keeps this module
 * instance alive the whole way. consumePendingSignFile() clears it after
 * reading so a later, unrelated visit to /electronic-signature never
 * silently auto-loads a stale file.
 */
let pendingFile: File | null = null;

export function setPendingSignFile(file: File): void {
  pendingFile = file;
}

export function consumePendingSignFile(): File | null {
  const file = pendingFile;
  pendingFile = null;
  return file;
}
