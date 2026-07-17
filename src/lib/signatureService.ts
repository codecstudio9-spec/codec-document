import { supabase, publicSupabase } from './supabase';

export async function getPublicIp(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json() as { ip: string };
    return data.ip || 'unknown';
  } catch {
    return 'unknown';
  }
}

export async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  if (!dataUrl || !dataUrl.includes(',')) throw new Error('dataUrlToBlob: invalid data URL');
  const [header, base64] = dataUrl.split(',');
  if (!base64) throw new Error('dataUrlToBlob: missing base64 payload');
  const mimeMatch = header.match(/data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: mime });
}

// ─── Documents ─────────────────────────────────────────────────────────────
// Schema: id, user_id, original_pdf_url, signed_pdf_url, status, created_at, name, description

export async function createDocumentRecord(params: {
  name: string;
  userId?: string | null;
}): Promise<string> {
  // The caller (electronic-signature-page.tsx's handleUploadPdf) already
  // gates on consumeDocumentLimit72h / consumeAnonUsage72h before ever
  // calling this. This used to run a SECOND, independent quota check here
  // via an opaque RPC (check_user_usage_limit) not defined anywhere in this
  // repo's SQL migrations — with unknown logic, on an unknown table, using
  // a different rule (unclear if daily or 72h) than the one actually
  // documented and tested. A silent bug in that hidden function was a real
  // candidate for "brand-new account instantly blocked" reports: even after
  // correctly passing the real gate, this second opaque gate could still
  // return `false` and abort with an empty documentId. Removed.
  const { data, error } = await supabase
    .from('documents')
    .insert({
      name: params.name,
      status: 'pending',
      user_id: params.userId ?? null,
    })
    .select('id')
    .single();
  if (error) throw new Error(`createDocument: ${error.message}`);
  return data.id as string;
}

/**
 * Reads the current status/signed_pdf_url for a document the caller owns.
 * A plain `.select()` (not an RPC) is fine here — unlike the guest/anon
 * cases elsewhere in this file, the creator is authenticated and the
 * existing owner-based RLS SELECT policy on `documents` already grants
 * this (the same policy `fetchAssociatedDocuments` in documents-service.ts
 * already relies on).
 */
export async function getDocumentStatus(
  documentId: string,
): Promise<{ status: string; signedPdfUrl: string | null } | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('status, signed_pdf_url')
    .eq('id', documentId)
    .maybeSingle();
  if (error) throw new Error(`getDocumentStatus: ${error.message}`);
  if (!data) return null;
  return { status: data.status as string, signedPdfUrl: (data.signed_pdf_url as string | null) ?? null };
}

// These three go through SECURITY DEFINER RPCs (update_document_pdf_url /
// update_document_signed_pdf_url / finalize_document), not a raw
// `.update(...).eq('id', documentId)` — a plain client-side UPDATE that
// matches zero rows under RLS returns success with no error at all
// (PostgREST doesn't treat "0 rows affected" as a failure), so a silent
// RLS mismatch used to leave original_pdf_url/signed_pdf_url stuck at
// NULL forever with nothing in the console to explain why.
//
// update_document_pdf_url's live definition (recreated 2026-07-16,
// see supabase_FIX_document_url_updates.sql history) differs from the
// other two: its 2nd param is named p_pdf_url (not p_original_pdf_url),
// it writes original_pdf_url, and on success it RETURNS JSONB — the
// full updated row — instead of a boolean; on no matching row it RAISEs
// an exception instead of returning false, so that failure already
// surfaces through `error` below, not through a falsy `data` check.
export async function updateDocumentPdfUrl(
  documentId: string,
  originalPdfUrl: string,
): Promise<void> {
  const { data, error } = await supabase.rpc('update_document_pdf_url', {
    p_document_id: documentId,
    p_pdf_url: originalPdfUrl,
  });
  if (error) throw new Error(`updateDocumentPdfUrl: ${error.message}`);
  if (!data || !(data as { id?: string }).id) {
    throw new Error('updateDocumentPdfUrl: unexpected response — no updated row returned');
  }
}

export async function updateDocumentSignedPdfUrl(
  documentId: string,
  signedPdfUrl: string,
): Promise<void> {
  const { data, error } = await supabase.rpc('update_document_signed_pdf_url', {
    p_document_id: documentId,
    p_signed_pdf_url: signedPdfUrl,
  });
  if (error) throw new Error(`updateDocumentSignedPdfUrl: ${error.message}`);
  if (!data) throw new Error('updateDocumentSignedPdfUrl: no matching document row was updated (0 rows affected)');
}

export async function finalizeDocument(
  documentId: string,
  signedPdfUrl: string,
): Promise<void> {
  const { data, error } = await supabase.rpc('finalize_document', {
    p_document_id: documentId,
    p_signed_pdf_url: signedPdfUrl,
  });
  if (error) throw new Error(`finalizeDocument: ${error.message}`);
  if (!data) throw new Error('finalizeDocument: no matching document row was updated (0 rows affected)');
}

// ─── Storage ────────────────────────────────────────────────────────────────

const BUCKET = 'documents-bucket';

export async function uploadPdfToStorage(
  documentId: string,
  pdfBlob: Blob,
  pathSuffix = 'original.pdf',
): Promise<string> {
  const path = `documents/${documentId}/${pathSuffix}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, pdfBlob, { contentType: 'application/pdf', upsert: true });
  if (error) throw new Error(`uploadPdf: ${error.message}`);

  const { data, error: urlError } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (urlError || !data?.publicUrl) {
    throw new Error(`uploadPdf: could not retrieve public URL${urlError ? ` (${urlError.message})` : ''}`);
  }
  return data.publicUrl;
}

/**
 * getPublicUrl() only actually works if the `documents-bucket` bucket is
 * flagged "Public" in Supabase — a setting separate from the storage.objects
 * RLS policy. If it's private (default when a bucket is created from the
 * dashboard without explicitly checking "Public"), the "public" URL 400s for
 * anyone without a session, even though the RLS policy
 * (`public_read_documents_bucket`, unconditional SELECT for that bucket)
 * would happily allow generating a signed URL instead. This lets guest PDF
 * viewers recover from that case without needing to know which one it is.
 */
export async function getSignedUrlFallback(publicUrl: string, expiresInSeconds = 3600): Promise<string | null> {
  // Parse the bucket name out of the URL itself instead of assuming it's
  // BUCKET ('documents-bucket') — a stored original_pdf_url may have been
  // written under a differently-named bucket at some point, and hardcoding
  // the wrong one here would make this fallback silently no-op exactly
  // when it's needed most.
  const match = publicUrl.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/([^?]+)/);
  if (!match) {
    console.error('getSignedUrlFallback: could not parse bucket/path from URL:', publicUrl);
    return null;
  }
  const [, bucket, path] = match;

  const { data, error } = await publicSupabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) {
    console.error(`getSignedUrlFallback: createSignedUrl failed for bucket "${bucket}", path "${path}":`, error);
    return null;
  }
  return data.signedUrl;
}

export async function uploadSignatureImage(
  documentId: string,
  suffix: 'creator' | 'guest',
  blob: Blob,
): Promise<string> {
  const path = `signatures/${documentId}_${suffix}.png`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: 'image/png', upsert: true });
  if (error) throw new Error(`uploadSignature: ${error.message}`);

  const { data, error: urlError } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (urlError || !data?.publicUrl) {
    throw new Error(`uploadSignature: could not retrieve public URL${urlError ? ` (${urlError.message})` : ''}`);
  }
  return data.publicUrl;
}

// ─── Signatures ─────────────────────────────────────────────────────────────
// Schema: id, document_id, signer_name, signer_email, ip, user_agent, signed_at, signature_url

export async function insertSignature(params: {
  documentId: string;
  signerName: string;
  signerEmail: string;
  ip: string;
  userAgent: string;
  signatureUrl: string;
}): Promise<void> {
  const { error } = await supabase.from('signatures').insert({
    document_id:  params.documentId,
    signer_name:  params.signerName,
    signer_email: params.signerEmail,
    ip:           params.ip,
    user_agent:   params.userAgent,
    signature_url: params.signatureUrl,
    signed_at:    new Date().toISOString(),
  });
  if (error) throw new Error(`insertSignature: ${error.message}`);
}

export async function getDocumentSignatures(
  documentId: string,
): Promise<Array<{
  signature_url: string;
  signer_email: string;
  signer_name: string;
  signed_at: string;
}>> {
  // Goes through a SECURITY DEFINER RPC (not a raw table SELECT) so that
  // RLS can deny public listing of `signatures` while this by-id lookup
  // still works for guests who hold a valid document id. See
  // supabase_lockdown_public_read_migration.sql.
  const { data, error } = await supabase.rpc('get_document_signatures', {
    p_document_id: documentId,
  });
  if (error) throw new Error(`getSignatures: ${error.message}`);
  return data ?? [];
}

// ─── Signers ────────────────────────────────────────────────────────────────
// Schema: id, document_id, name, email, status, created_at

export async function createSigner(params: {
  documentId: string;
  name: string;
  email: string;
}): Promise<string> {
  // Goes through a SECURITY DEFINER RPC — `signers` has no SELECT policy at
  // all (it's guest-signing PII), so `.insert(...).select('id').single()`
  // always errored (zero rows readable back), breaking the "invite signer"
  // step entirely.
  const { data, error } = await supabase.rpc('create_signer', {
    p_document_id: params.documentId,
    p_name: params.name,
    p_email: params.email,
  });
  if (error) throw new Error(`createSigner: ${error.message}`);
  return data as string;
}

export async function updateSignerStatus(signerId: string, status: string): Promise<void> {
  const { error } = await supabase.from('signers').update({ status }).eq('id', signerId);
  if (error) throw new Error(`updateSignerStatus: ${error.message}`);
}

/**
 * Same as updateSignerStatus, but guarded: only applies the transition if the
 * signer's current status still matches `fromStatus`. Returns false (no throw)
 * if a concurrent request already completed it — e.g. the same signing link
 * opened twice — so the caller can stop before compiling a duplicate PDF
 * instead of silently racing another in-flight submission.
 *
 * Goes through a SECURITY DEFINER RPC (not a raw UPDATE...select()) because
 * a guest signer has no RLS SELECT permission on `signers` — an
 * UPDATE...select() would return zero rows even when the update succeeded,
 * making this guard falsely report "already completed" every time.
 */
export async function tryCompleteSignerOnce(signerId: string, fromStatus: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('try_complete_signer_once', {
    p_signer_id: signerId,
    p_from_status: fromStatus,
  });
  if (error) throw new Error(`tryCompleteSignerOnce: ${error.message}`);
  return Boolean(data);
}

// ─── Signing Links ───────────────────────────────────────────────────────────
// Schema: id, document_id, signer_id, token, expires_at, created_at

export async function createSigningLink(params: {
  documentId: string;
  signerId: string;
  guestName?: string;
  guestEmail?: string;
}): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from('signing_links').insert({
    document_id: params.documentId,
    signer_id:   params.signerId,
    token,
    expires_at: expiresAt,
  });
  if (error) throw new Error(`createSigningLink: ${error.message}`);

  // Best-effort: also record the invitation in document_invitations (same
  // token) so that table stays populated/auditable for the invite. The
  // actual guest-read authorization still goes through verify_signing_link
  // (signing_links + documents, already SECURITY DEFINER and proven safe) —
  // this insert never blocks link creation if it fails.
  try {
    await supabase.rpc('record_document_invitation', {
      p_document_id: params.documentId,
      p_guest_email: params.guestEmail ?? '',
      p_guest_name:  params.guestName ?? '',
      p_token:       token,
      p_expires_at:  expiresAt,
    });
  } catch { /* non-fatal — see supabase_guest_dashboard_anon_migration.sql */ }

  return token;
}

/** Best-effort: marks the invitation as signed once the guest completes signing. */
export async function markDocumentInvitationSigned(token: string): Promise<void> {
  try {
    await publicSupabase.rpc('mark_document_invitation_signed', { p_token: token });
  } catch { /* non-fatal */ }
}

export async function verifySigningTokenPublic(token: string): Promise<{
  documentId: string;
  signerId: string;
  originalPdfUrl: string;
  signedPdfUrl: string;
  documentName: string;
  documentStatus: string;
} | null> {
  // Goes through a SECURITY DEFINER RPC (not a raw table SELECT) so that
  // RLS can deny public listing of `signing_links` while this by-token
  // lookup still works for guests who hold a valid signing link. See
  // supabase_lockdown_public_read_migration.sql.
  const { data, error } = await publicSupabase
    .rpc('verify_signing_link', { p_token: token })
    .maybeSingle();

  console.log('Validando token de firma:', {
    token: token.slice(0, 8) + '...',
    found: !!data,
    error: error?.message ?? null,
  });

  if (error) {
    console.error('verifySigningTokenPublic — DB error:', error.code, error.message);
    return null;
  }
  if (!data) {
    console.warn('verifySigningTokenPublic — token not found in signing_links');
    return null;
  }

  const row = data as {
    document_id: string; signer_id: string; expires_at: string | null;
    doc_name: string | null; original_pdf_url: string | null;
    signed_pdf_url: string | null; doc_status: string | null;
  };

  console.log('Validando transaccion de firma:', {
    id: row.document_id,
    status: row.doc_status ?? 'unknown',
    expire_at: row.expires_at,
    original_pdf: row.original_pdf_url ?? null,
  });

  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : Number.NaN;
  if (Number.isFinite(expiresAt) && Date.now() > expiresAt) {
    console.warn('verifySigningTokenPublic — token expired at:', row.expires_at);
    return null;
  }

  const activeStatuses = new Set(['pending_recipient', 'pending', 'sender_signed', 'signing']);
  const terminalStatuses = new Set(['completed', 'cancelled', 'expired']);
  const status = String(row.doc_status || '').toLowerCase();

  if (terminalStatuses.has(status)) {
    console.warn('verifySigningTokenPublic — document in terminal status:', row.doc_status);
    return null;
  }

  if (!activeStatuses.has(status)) {
    console.warn('verifySigningTokenPublic — document status is not signable:', row.doc_status);
    return null;
  }

  return {
    documentId:     row.document_id,
    signerId:       row.signer_id,
    originalPdfUrl: row.original_pdf_url || '',
    signedPdfUrl:   row.signed_pdf_url || '',
    documentName:   row.doc_name || 'Documento',
    documentStatus: status,
  };
}

// ─── Signature Positions (additional table — kept as-is) ─────────────────────

export async function insertSignaturePositions(
  documentId: string,
  positions: Array<{ x: number; y: number; width: number; height: number; page: number }>,
): Promise<void> {
  const rows = positions.map((p) => ({
    document_id: documentId,
    x: p.x, y: p.y, width: p.width, height: p.height, page: p.page,
  }));
  const { error } = await supabase.from('signature_positions').insert(rows);
  if (error) throw new Error(`insertPositions: ${error.message}`);
}

// ─── Audit Logs (additional table — non-fatal) ────────────────────────────────

export async function insertAuditLog(params: {
  documentId: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  hashSha256?: string;
}): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert({
    document_id: params.documentId,
    action:      params.action,
    ip_address:  params.ipAddress,
    user_agent:  params.userAgent,
    hash_sha256: params.hashSha256 ?? '',
  });
  if (error) {
    console.warn('audit_log insert failed (non-fatal):', error.message);
  }
}


// ─── PDF Compilation ─────────────────────────────────────────────────────────

export interface SignatureToEmbed {
  imageUrl: string;
  storageUrl?: string;
  signerName?: string;
  signerRole?: string;
  page: number;
  xFraction: number;
  yFraction: number;
  widthFraction?: number;
  heightFraction?: number;
}

export interface EvidenceReportPayload {
  signerName?: string;
  signerEmail?: string;
  selfieDataUrl?: string;
  idDataUrl?: string;
  idFrontDataUrl?: string;
  idBackDataUrl?: string;
  ip?: string;
  userAgent?: string;
  signedAt?: string;
}

async function resolveImageBytes(sig: SignatureToEmbed): Promise<Uint8Array | null> {
  if (!sig?.imageUrl) return null;

  if (sig.imageUrl.startsWith('data:')) {
    const base64 = sig.imageUrl.split(',')[1];
    if (base64) {
      try {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
      } catch {
        return null;
      }
    }
    return null;
  }

  const candidates = [sig.imageUrl, sig.storageUrl].filter(
    (u): u is string => Boolean(u) && !u.startsWith('data:'),
  );
  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: 'force-cache' });
      if (res.ok) return new Uint8Array(await res.arrayBuffer());
    } catch {
      // try next
    }
  }
  return null;
}

async function embedImageSafely(pdfDoc: any, bytes: Uint8Array | null): Promise<any | null> {
  if (!bytes || bytes.length === 0) return null;

  try {
    return await pdfDoc.embedPng(bytes);
  } catch {
    try {
      return await pdfDoc.embedJpg(bytes);
    } catch {
      return null;
    }
  }
}

// 🛡️ FIX "Unknown font format" en Firma Digital Mutua: vercel.json reescribe
// CUALQUIER ruta sin archivo estático real hacia /index.html con status 200
// (rewrite de SPA). Cuando arialbd.ttf no existe en public/fonts (se borró en
// una limpieza anterior), `fetch('/fonts/arialbd.ttf')` no da 404 — devuelve
// el HTML de index.html con `.ok === true`, así que el chequeo `boldRes.ok`
// no detecta el problema y esos bytes de HTML se pasan como si fueran una
// fuente válida. fontkit truena con "Unknown font format" al intentar
// interpretarlos en pdfDoc.embedFont(), y como esa llamada no tenía try/catch,
// el error se propagaba hasta el flujo de guardado de la firma. Validamos la
// cabecera binaria real (magic bytes) de cada fuente antes de aceptarla —
// así una respuesta HTML nunca se confunde con un TTF/OTF válido, y el bundle
// cae correctamente al camino ya existente de "sin bold real" (negrita falsa)
// o "sin fuente custom" (Helvetica nativo) en vez de reventar.
function isValidFontBytes(bytes: Uint8Array): boolean {
  if (!bytes || bytes.length < 4) return false;
  const sig = `${bytes[0]},${bytes[1]},${bytes[2]},${bytes[3]}`;
  return (
    sig === '0,1,0,0' || // TrueType (sfnt 1.0)
    sig === '116,114,117,101' || // 'true'
    sig === '116,116,99,102' || // 'ttcf' (TrueType collection)
    sig === '79,84,84,79' // 'OTTO' (OpenType/CFF)
  );
}

async function loadPdfFontBundle(): Promise<{ regular: Uint8Array; bold?: Uint8Array } | null> {
  try {
    const [regularRes, boldRes] = await Promise.all([
      fetch('/fonts/arial.ttf'),
      fetch('/fonts/arialbd.ttf'),
    ]);

    if (!regularRes.ok) return null;

    const regularBytes = new Uint8Array(await regularRes.arrayBuffer());
    if (!isValidFontBytes(regularBytes)) return null;

    let boldBytes: Uint8Array | undefined;
    if (boldRes.ok) {
      const candidate = new Uint8Array(await boldRes.arrayBuffer());
      if (isValidFontBytes(candidate)) boldBytes = candidate;
    }
    return { regular: regularBytes, bold: boldBytes };
  } catch {
    return null;
  }
}

export async function compilePdfWithSignatures(params: {
  pdfBytes: Uint8Array;
  signatures: SignatureToEmbed[];
  documentId: string;
  fileHash: string;
  evidence?: EvidenceReportPayload;
  /** The FULL signer roster for the "INFORME DE FIRMAS" report page —
   * independent from `signatures` above, which is only the NEW ink being
   * stamped inline on this pass. Every prior signer's ink is already
   * flattened into the incoming pdfBytes as pixels (re-stamping it would
   * double it up), but the report page still needs to list everyone, or
   * the second signer's compile call would otherwise append a SECOND,
   * separate report page — each showing only one signer, and each
   * generating the same "-01" audit token (the token is derived from the
   * signer's position in this array), which is worse than redundant: it's
   * two different people certified under one colliding token. Defaults to
   * `signatures` so single-signer callers (the creator's own compile, with
   * nobody signed yet) don't need to pass anything extra. */
  reportSigners?: Array<Pick<SignatureToEmbed, 'imageUrl' | 'storageUrl' | 'signerName' | 'signerRole'>>;
  /** Set to `false` for a PARTIAL compile (the creator saving their own
   * signature before anyone else has signed) — skips the "INFORME DE
   * FIRMAS" report page entirely. Without this, that first partial compile
   * always added its own report page (1 signer), and once a later signer's
   * compile pass added its own unified report page on top, the final PDF
   * ended up with two of them back to back — the first showing only the
   * creator, confirmed live in a real compiled document. A certification
   * page only makes sense once the document is actually done; defaults to
   * `true` so the final/single-signer-only compile still gets one. */
  includeCertificationPage?: boolean;
}): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const { default: fontkit } = await import('@pdf-lib/fontkit');

  const reportSigners = params.reportSigners ?? params.signatures;
  const includeCertificationPage = params.includeCertificationPage !== false;

  // Phase 0: pre-load ALL images in parallel before touching the PDF
  const resolvedImages = await Promise.all(
    params.signatures.map((sig) => resolveImageBytes(sig)),
  );
  // Separate resolution for the report roster — may reference signers (and
  // therefore image URLs) that aren't in `signatures` at all this pass.
  const resolvedReportImages = reportSigners === params.signatures
    ? resolvedImages
    : await Promise.all(reportSigners.map((sig) => resolveImageBytes(sig as SignatureToEmbed)));

  const pdfDoc  = await PDFDocument.load(params.pdfBytes.slice(0));
  pdfDoc.registerFontkit(fontkit);
  const pages   = pdfDoc.getPages();
  const fontBundle = await loadPdfFontBundle();
  const fontBold = fontBundle?.bold
    ? await pdfDoc.embedFont(fontBundle.bold)
    : fontBundle?.regular
      ? await pdfDoc.embedFont(fontBundle.regular)
      : await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = fontBundle?.regular
    ? await pdfDoc.embedFont(fontBundle.regular)
    : await pdfDoc.embedFont(StandardFonts.Helvetica);

  // No real bold TTF is shipped (public/fonts has no arialbd.ttf), so `fontBold`
  // above falls back to the *regular* accent-safe custom font — correct glyphs,
  // but visually not bold. Switching that fallback to StandardFonts.HelveticaBold
  // would bring back the exact mojibake/missing-glyph bug the fontkit fix solved
  // (WinAnsi standard fonts don't render á/é/í/ó/ú/ñ correctly). Instead, when
  // there's no real bold face, we fake it by drawing the text twice with a
  // sub-pixel horizontal offset, which thickens the strokes without touching
  // the font/encoding at all.
  const hasRealBoldFace = Boolean(fontBundle?.bold);
  function drawBold(
    pageObj: { drawText: (t: string, o: Record<string, unknown>) => void },
    text: string,
    opts: { x: number; y: number; size: number; color: unknown },
  ) {
    pageObj.drawText(text, { ...opts, font: fontBold });
    if (!hasRealBoldFace) {
      pageObj.drawText(text, { ...opts, font: fontBold, x: opts.x + 0.35 });
    }
  }

  const nowStr = new Intl.DateTimeFormat('es-CO', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZoneName: 'short',
  }).format(new Date());

  // Phase 1: embed inline signatures on placed pages
  for (let idx = 0; idx < params.signatures.length; idx++) {
    const sig      = params.signatures[idx];
    const imgBytes = resolvedImages[idx];
    const page     = pages[sig.page - 1];
    if (!page || !imgBytes) continue;

    const { width: pw, height: ph } = page.getSize();
    const pdfImage = await embedImageSafely(pdfDoc, imgBytes);
    if (!pdfImage) continue;

    const sigW = (sig.widthFraction  ?? 0.38) * pw;
    const sigH = (sig.heightFraction ?? 0.16) * ph;
    const rawX = sig.xFraction * pw - sigW / 2;
    const rawY = (1 - sig.yFraction) * ph - sigH / 2;
    const x = Math.max(0, Math.min(pw - sigW, rawX));
    const y = Math.max(0, Math.min(ph - sigH, rawY));

    const PAD = 5, DATE_H = 10, ROLE_H = 9, NAME_H = 12, LINE_H = 13;
    const TEXT_ZONE = DATE_H + ROLE_H + NAME_H + LINE_H;
    const IMG_ZONE  = Math.max(10, sigH - TEXT_ZONE);

    // No filled box behind the signature — DocuSign/Adobe Sign-style: just
    // the (already-transparent) ink, the signing line, and the printed
    // name/role/date underneath, sitting directly on the page like a real
    // stamped signature instead of a card floating on top of the content.

    // Fit the signature image into its box preserving aspect ratio — drawing
    // it at the raw box dimensions stretches/squishes it whenever the canvas
    // ratio doesn't match the box ratio.
    const imgDims  = pdfImage.size() as { width: number; height: number };
    const imgAspect = imgDims.width / imgDims.height;
    const maxImgW  = sigW - 2 * PAD;
    const maxImgH  = IMG_ZONE - 4;
    let imgDrawW = maxImgW, imgDrawH = maxImgW / imgAspect;
    if (imgDrawH > maxImgH) { imgDrawH = maxImgH; imgDrawW = maxImgH * imgAspect; }
    page.drawImage(pdfImage, {
      x: x + PAD + (maxImgW - imgDrawW) / 2,
      y: y + TEXT_ZONE + 2 + (maxImgH - imgDrawH) / 2,
      width: imgDrawW, height: imgDrawH, opacity: 0.97,
    });
    drawBold(page, 'X', { x: x + PAD, y: y + TEXT_ZONE - LINE_H / 2 - 1, size: 8, color: rgb(0.07, 0.10, 0.24) });
    page.drawLine({ start: { x: x + PAD + 12, y: y + TEXT_ZONE - LINE_H / 2 + 2 }, end: { x: x + sigW - PAD, y: y + TEXT_ZONE - LINE_H / 2 + 2 }, thickness: 0.9, color: rgb(0.35, 0.40, 0.65) });

    const name = (sig.signerName ?? '').trim().toUpperCase().substring(0, 30);
    if (name) drawBold(page, name, { x: x + PAD, y: y + DATE_H + ROLE_H + PAD + 1, size: Math.max(5.5, Math.min(7.5, sigW / 16)), color: rgb(0.07, 0.08, 0.14) });
    const role = (sig.signerRole ?? '').trim().substring(0, 34);
    if (role) page.drawText(role, { x: x + PAD, y: y + DATE_H + PAD + 1, size: Math.max(4.5, Math.min(6, sigW / 22)), font: fontReg, color: rgb(0.35, 0.41, 0.91) });
    page.drawText(new Intl.DateTimeFormat('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()), { x: x + PAD, y: y + PAD, size: 5, font: fontReg, color: rgb(0.50, 0.55, 0.72) });
  }

  // Phase 2: certification report page (mirror grid + legal compliance)
  if (includeCertificationPage && reportSigners.length > 0) {
    const PAGE_W = 595.28, PAGE_H = 841.89;
    const MARGIN = 36, COL_GAP = 18;
    const COL_W  = (PAGE_W - 2 * MARGIN - COL_GAP) / 2;
    const HEADER_H = 76, BLOCK_H = 250, IMG_AREA_H = 165, BLOCK_GAP_V = 18;
    const LEGAL_H = 162, BLOCK_STOP_Y = MARGIN + LEGAL_H + 16;

    const reportPage = pdfDoc.addPage([PAGE_W, PAGE_H]);

    // Background
    reportPage.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: rgb(0.972, 0.974, 0.983) });

    // Dark header
    reportPage.drawRectangle({ x: 0, y: PAGE_H - HEADER_H, width: PAGE_W, height: HEADER_H, color: rgb(0.07, 0.08, 0.13) });
    reportPage.drawRectangle({ x: 0, y: PAGE_H - HEADER_H - 2, width: PAGE_W, height: 2.5, color: rgb(0.35, 0.41, 0.91) });

    const TITLE = 'INFORME DE FIRMAS';
    drawBold(reportPage, TITLE, { x: (PAGE_W - fontBold.widthOfTextAtSize(TITLE, 15)) / 2, y: PAGE_H - 30, size: 15, color: rgb(0.97, 0.97, 1) });

    const docRef  = params.documentId.replace(/-/g, '').toUpperCase().substring(0, 16);
    const subText = `Codec Document  ·  Ref: ${docRef}`;
    reportPage.drawText(subText, { x: (PAGE_W - fontReg.widthOfTextAtSize(subText, 7.5)) / 2, y: PAGE_H - 47, size: 7.5, font: fontReg, color: rgb(0.63, 0.66, 0.78) });
    reportPage.drawText(`Generado: ${nowStr}`, { x: (PAGE_W - fontReg.widthOfTextAtSize(`Generado: ${nowStr}`, 6.5)) / 2, y: PAGE_H - 63, size: 6.5, font: fontReg, color: rgb(0.50, 0.53, 0.63) });

    // Signature blocks — repeat(2, 1fr) mirror grid
    const contentStartY = PAGE_H - HEADER_H - 22;
    const docPrefix     = params.documentId.replace(/-/g, '').toUpperCase().substring(0, 8);

    for (let i = 0; i < reportSigners.length; i++) {
      const sig       = reportSigners[i];
      const imgBytes  = resolvedReportImages[i];
      const col       = i % 2;
      const row       = Math.floor(i / 2);
      const blockX    = MARGIN + col * (COL_W + COL_GAP);
      const blockTopY = contentStartY - row * (BLOCK_H + BLOCK_GAP_V);
      const blockBotY = blockTopY - BLOCK_H;
      if (blockBotY < BLOCK_STOP_Y) break;

      const token = `CDX-${docPrefix.substring(0, 4)}-${docPrefix.substring(4, 8)}-${String(i + 1).padStart(2, '0')}`;

      reportPage.drawRectangle({ x: blockX, y: blockBotY, width: COL_W, height: BLOCK_H, color: rgb(1, 1, 1), borderColor: rgb(0.90, 0.91, 0.95), borderWidth: 0.4 });

      const textAreaTopY = blockTopY - IMG_AREA_H;
      const INNER_PAD = 14, maxImgW = COL_W - 2 * INNER_PAD, maxImgH = IMG_AREA_H - 24;

      if (imgBytes) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let pdfImg: any;
        try { pdfImg = await pdfDoc.embedPng(imgBytes); }
        catch { try { pdfImg = await pdfDoc.embedJpg(imgBytes); } catch { /* skip */ } }
        if (pdfImg) {
          const dims = pdfImg.size() as { width: number; height: number };
          const aspect = dims.width / dims.height;
          let dW = maxImgW, dH = maxImgW / aspect;
          if (dH > maxImgH) { dH = maxImgH; dW = maxImgH * aspect; }
          reportPage.drawImage(pdfImg, {
            x: blockX + INNER_PAD + (maxImgW - dW) / 2,
            y: textAreaTopY + 12 + (maxImgH - dH) / 2,
            width: dW, height: dH, opacity: 1,
          });
        }
      }

      reportPage.drawLine({ start: { x: blockX + 8, y: textAreaTopY }, end: { x: blockX + COL_W - 8, y: textAreaTopY }, thickness: 0.5, color: rgb(0.82, 0.85, 0.92) });

      // Signing line
      const sigLineY = textAreaTopY - 20;
      reportPage.drawLine({ start: { x: blockX + INNER_PAD, y: sigLineY }, end: { x: blockX + COL_W - INNER_PAD, y: sigLineY }, thickness: 0.8, color: rgb(0.60, 0.65, 0.80) });

      const sigName = (sig.signerName ?? '').trim().toUpperCase().substring(0, 32);
      if (sigName) {
        const tw = fontBold.widthOfTextAtSize(sigName, 8.5);
        drawBold(reportPage, sigName, { x: blockX + Math.max(INNER_PAD, (COL_W - tw) / 2), y: textAreaTopY - 34, size: 8.5, color: rgb(0.07, 0.08, 0.14) });
      }
      const sigRole = (sig.signerRole ?? '').trim().toUpperCase().substring(0, 36);
      if (sigRole) {
        const tw = fontReg.widthOfTextAtSize(sigRole, 7);
        reportPage.drawText(sigRole, { x: blockX + Math.max(INNER_PAD, (COL_W - tw) / 2), y: textAreaTopY - 48, size: 7, font: fontReg, color: rgb(0.35, 0.41, 0.91) });
      }
      const tokenLabel = `Token: ${token}`;
      reportPage.drawText(tokenLabel, { x: blockX + Math.max(INNER_PAD, (COL_W - fontReg.widthOfTextAtSize(tokenLabel, 6)) / 2), y: textAreaTopY - 62, size: 6, font: fontReg, color: rgb(0.50, 0.55, 0.68) });
      reportPage.drawText(nowStr, { x: blockX + Math.max(INNER_PAD, (COL_W - fontReg.widthOfTextAtSize(nowStr, 6)) / 2), y: textAreaTopY - 74, size: 6, font: fontReg, color: rgb(0.55, 0.60, 0.72) });
    }

    // ── U.S. ELECTRONIC SIGNATURE LEGAL COMPLIANCE footer ─────────────────────
    const LX = MARGIN, LY = MARGIN + 4, LW = PAGE_W - 2 * MARGIN;

    reportPage.drawLine({ start: { x: LX, y: LY + LEGAL_H + 8 }, end: { x: LX + LW, y: LY + LEGAL_H + 8 }, thickness: 0.4, color: rgb(0.80, 0.83, 0.91) });
    reportPage.drawRectangle({ x: LX, y: LY, width: LW, height: LEGAL_H, color: rgb(0.974, 0.977, 0.996), borderColor: rgb(0.80, 0.83, 0.93), borderWidth: 0.4 });
    reportPage.drawRectangle({ x: LX, y: LY, width: 3, height: LEGAL_H, color: rgb(0.35, 0.41, 0.91) });

    const TX = LX + 12;

    // E-SIGN badge
    const badgeLabel = 'E-SIGN & UETA Compliant';
    const badgeSz    = 6;
    const BW = fontBold.widthOfTextAtSize(badgeLabel, badgeSz) + 14, BH = 14;
    const BX = LX + LW - BW - 6, BY = LY + LEGAL_H - BH - 6;
    reportPage.drawRectangle({ x: BX, y: BY, width: BW, height: BH, color: rgb(0.35, 0.41, 0.91) });
    drawBold(reportPage, badgeLabel, { x: BX + (BW - fontBold.widthOfTextAtSize(badgeLabel, badgeSz)) / 2, y: BY + 4.5, size: badgeSz, color: rgb(1, 1, 1) });
    const securedLabel = 'Secured by Codec Studio';
    reportPage.drawText(securedLabel, { x: BX + (BW - fontReg.widthOfTextAtSize(securedLabel, 5.5)) / 2, y: BY - 7, size: 5.5, font: fontReg, color: rgb(0.50, 0.54, 0.66) });

    // Compliance title
    const compTitle = 'U.S. ELECTRONIC SIGNATURE LEGAL COMPLIANCE';
    drawBold(reportPage, compTitle, { x: TX, y: LY + LEGAL_H - 14, size: 7.5, color: rgb(0.10, 0.14, 0.38) });

    // Legal body (word-wrapped)
    const legalBody  = 'This document is electronically signed and certified under the provisions of the Federal E-SIGN Act (15 U.S.C. Ch. 96) and the Uniform Electronic Transactions Act (UETA). The captured cryptographic signatures, timestamps, and network audit logs herein guarantee the authenticity, intent, and non-repudiation of the signing parties.';
    const lBodyMaxW  = LW - 24 - BW - 10;
    let lBodyLine = '', lBodyY = LY + LEGAL_H - 27;
    for (const w of legalBody.split(' ')) {
      const test = lBodyLine ? `${lBodyLine} ${w}` : w;
      if (fontReg.widthOfTextAtSize(test, 6) > lBodyMaxW) {
        reportPage.drawText(lBodyLine, { x: TX, y: lBodyY, size: 6, font: fontReg, color: rgb(0.30, 0.35, 0.52) });
        lBodyY -= 8; lBodyLine = w;
      } else { lBodyLine = test; }
    }
    if (lBodyLine) { reportPage.drawText(lBodyLine, { x: TX, y: lBodyY, size: 6, font: fontReg, color: rgb(0.30, 0.35, 0.52) }); lBodyY -= 14; }

    // DOCUMENT ID — documents.id from Supabase
    const auditIdStr = `DOCUMENT ID: ${params.documentId.toUpperCase()}`;
    const AIBOXW     = Math.min(LW - 20, fontBold.widthOfTextAtSize(auditIdStr, 7) + 14);
    const AIBY       = lBodyY + (lBodyY > LY + 80 ? 0 : -2);
    reportPage.drawRectangle({ x: TX - 4, y: AIBY - 4, width: AIBOXW, height: 14, color: rgb(0.91, 0.93, 1.00), borderColor: rgb(0.74, 0.79, 0.96), borderWidth: 0.3 });
    drawBold(reportPage, auditIdStr, { x: TX, y: AIBY, size: 7, color: rgb(0.10, 0.14, 0.45) });

    // Print the real SHA-256 of the source document — this is the actual
    // cryptographic evidence a reader (or a court) can independently verify
    // by hashing the original PDF, not decorative boilerplate.
    const hashLabel = params.fileHash
      ? `SHA-256: ${params.fileHash.toUpperCase()}`
      : 'Codec Document Security Services - Electronically signed document with full legal binding.';
    reportPage.drawText(
      hashLabel,
      { x: TX, y: LY + 7, size: 5.5, font: fontReg, color: rgb(0.55, 0.60, 0.72) },
    );
  }

  if (params.evidence && (params.evidence.selfieDataUrl || params.evidence.idDataUrl || params.evidence.idFrontDataUrl || params.evidence.idBackDataUrl)) {
    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const evidencePage = pdfDoc.addPage([PAGE_W, PAGE_H]);
    evidencePage.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: rgb(0.985, 0.987, 0.994) });
    evidencePage.drawRectangle({ x: 24, y: PAGE_H - 80, width: PAGE_W - 48, height: 56, color: rgb(0.07, 0.08, 0.16) });
    drawBold(evidencePage, 'EVIDENCIA DE FIRMA', { x: 40, y: PAGE_H - 44, size: 16, color: rgb(1, 1, 1) });
    evidencePage.drawText(`Documento: ${params.documentId.toUpperCase()}`, { x: 40, y: PAGE_H - 62, size: 8, font: fontReg, color: rgb(0.85, 0.88, 0.95) });

    const bodyY = PAGE_H - 120;
    drawBold(evidencePage, 'Datos del firmante', { x: 40, y: bodyY, size: 12, color: rgb(0.15, 0.18, 0.28) });
    if (params.evidence.signerName) evidencePage.drawText(`Nombre: ${params.evidence.signerName}`, { x: 40, y: bodyY - 18, size: 9, font: fontReg, color: rgb(0.3, 0.34, 0.45) });
    if (params.evidence.signerEmail) evidencePage.drawText(`Correo: ${params.evidence.signerEmail}`, { x: 40, y: bodyY - 34, size: 9, font: fontReg, color: rgb(0.3, 0.34, 0.45) });
    if (params.evidence.ip) evidencePage.drawText(`IP: ${params.evidence.ip}`, { x: 40, y: bodyY - 50, size: 9, font: fontReg, color: rgb(0.3, 0.34, 0.45) });
    if (params.evidence.signedAt) evidencePage.drawText(`Timestamp: ${params.evidence.signedAt}`, { x: 40, y: bodyY - 66, size: 9, font: fontReg, color: rgb(0.3, 0.34, 0.45) });
    if (params.evidence.userAgent) evidencePage.drawText(`Navegador: ${params.evidence.userAgent.substring(0, 120)}`, { x: 40, y: bodyY - 82, size: 7.5, font: fontReg, color: rgb(0.45, 0.5, 0.6) });

    const selfieSource = params.evidence.selfieDataUrl;
    const idFrontSource = params.evidence.idFrontDataUrl ?? params.evidence.idDataUrl;
    const idBackSource = params.evidence.idBackDataUrl;

    const photoTopY = 170;
    const leftW = 262;
    const rightW = 232;
    const leftX = 40;
    const rightX = PAGE_W - rightW - 40;
    const leftH = 320;
    const rightCardH = 148;
    const rightGap = 24;

    const drawEvidenceCard = async (title: string, subtitle: string, sourceUrl: string | undefined, x: number, y: number, width: number, height: number) => {
      evidencePage.drawRectangle({ x, y, width, height, color: rgb(1, 1, 1), borderColor: rgb(0.83, 0.86, 0.92), borderWidth: 0.8 });
      evidencePage.drawRectangle({ x, y: y + height - 3, width, height: 3, color: rgb(0.35, 0.41, 0.91) });
      drawBold(evidencePage, title, { x: x + 10, y: y + height + 8, size: 9, color: rgb(0.2, 0.24, 0.33) });
      evidencePage.drawText(subtitle, { x: x + 10, y: y - 12, size: 7, font: fontReg, color: rgb(0.45, 0.5, 0.6) });

      const renderFallback = (message: string) => {
        evidencePage.drawText(message, { x: x + 10, y: y + height / 2, size: 9, font: fontReg, color: rgb(0.45, 0.5, 0.6) });
      };

      if (!sourceUrl) {
        renderFallback('Evidencia en proceso de sincronización');
        return;
      }

      let bytes: Uint8Array | null = null;
      try {
        bytes = await resolveImageBytes({ imageUrl: sourceUrl });
      } catch (error) {
        console.error('Error al resolver imagen de evidencia:', error, { title, sourceUrl });
      }

      if (!bytes || bytes.length === 0) {
        renderFallback('Evidencia en proceso de sincronización');
        return;
      }

      let img: any = null;
      try {
        img = await embedImageSafely(pdfDoc, bytes);
      } catch (error) {
        console.error('Error al incrustar imagen de evidencia:', error, { title, sourceUrl });
      }

      if (!img) {
        renderFallback('Evidencia en proceso de sincronización');
        return;
      }

      const dims = img.size() as { width: number; height: number };
      const maxW = width - 16;
      const maxH = height - 24;
      const aspect = dims.width / dims.height;
      let drawW = maxW;
      let drawH = maxW / aspect;
      if (drawH > maxH) {
        drawH = maxH;
        drawW = drawH * aspect;
      }

      evidencePage.drawImage(img, {
        x: x + 8 + (maxW - drawW) / 2,
        y: y + 12 + (maxH - drawH) / 2,
        width: drawW,
        height: drawH,
      });
    };

    await drawEvidenceCard('Selfie biométrica', 'Captura de validación facial', selfieSource, leftX, photoTopY, leftW, leftH);
    await drawEvidenceCard('Documento de identidad (Frente)', 'Cara frontal del documento oficial', idFrontSource, rightX, photoTopY + rightCardH + rightGap, rightW, rightCardH);
    await drawEvidenceCard('Documento de identidad (Reverso)', 'Cara posterior con zona de lectura/código', idBackSource, rightX, photoTopY, rightW, rightCardH);
  }

  return pdfDoc.save();
}
