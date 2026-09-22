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
export interface PendingSignFile {
  file: File;
  /** First named signer from "Crea un documento nuevo"'s optional signer
   * list, if any — lets the signing tool pre-fill "Tu nombre legal"
   * instead of making the person retype a name they already entered two
   * steps ago. Just a starting value, not a hard assignment: the field
   * stays editable in case the sender isn't the signer. */
  creatorName?: string;
  /** Signers #2+ from that same list (signer #1 became creatorName
   * above), each with the email needed to actually generate their
   * signing link. The signing tool auto-creates a real `signers` row +
   * signing link for every one of these once the document exists —
   * signer #2 becomes the main guest link, #3 onward become "extra
   * signers" — instead of making the sender retype names/emails they
   * already entered here. Signers with no email are left out (a
   * `signers` link needs one); their printed name/C.C. on the document
   * itself is unaffected, the sender can still add them manually via
   * "Añadir otro firmante". */
  additionalSigners?: { name: string; email: string }[];
  /** Signers #2+ that were named (and possibly given an ID number) but
   * left without an email — too little to auto-create a real signing
   * link (createSigningLink needs an email to send it to), but their
   * name shouldn't just vanish either. The signing tool queues these and
   * pre-fills them one at a time into the "invitado"/"otro firmante"
   * name field as the sender works through the invite step, so the
   * sender only has to type the email they're missing instead of
   * retyping a name they already entered in "Crea un documento nuevo". */
  signersNeedingEmail?: { name: string }[];
}

let pending: PendingSignFile | null = null;

export function setPendingSignFile(
  file: File,
  creatorName?: string,
  additionalSigners?: { name: string; email: string }[],
  signersNeedingEmail?: { name: string }[],
): void {
  pending = { file, creatorName, additionalSigners, signersNeedingEmail };
}

export function consumePendingSignFile(): PendingSignFile | null {
  const value = pending;
  pending = null;
  return value;
}
