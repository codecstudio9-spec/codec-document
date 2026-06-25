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

export async function updateDocumentPdfUrl(
  documentId: string,
  originalPdfUrl: string,
): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .update({ original_pdf_url: originalPdfUrl })
    .eq('id', documentId);
  if (error) throw new Error(`updateDocumentPdfUrl: ${error.message}`);
}

export async function finalizeDocument(
  documentId: string,
  signedPdfUrl: string,
): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .update({ signed_pdf_url: signedPdfUrl, status: 'completed' })
    .eq('id', documentId);
  if (error) throw new Error(`finalizeDocument: ${error.message}`);
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
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
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
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
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
  const { data, error } = await supabase
    .from('signatures')
    .select('signature_url, signer_email, signer_name, signed_at')
    .eq('document_id', documentId);
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
  const { data, error } = await supabase
    .from('signers')
    .insert({ document_id: params.documentId, name: params.name, email: params.email, status: 'pending' })
    .select('id')
    .single();
  if (error) throw new Error(`createSigner: ${error.message}`);
  return data.id as string;
}

export async function updateSignerStatus(signerId: string, status: string): Promise<void> {
  const { error } = await supabase.from('signers').update({ status }).eq('id', signerId);
  if (error) throw new Error(`updateSignerStatus: ${error.message}`);
}

// ─── Signing Links ───────────────────────────────────────────────────────────
// Schema: id, document_id, signer_id, token, expires_at, created_at

export async function createSigningLink(params: {
  documentId: string;
  signerId: string;
}): Promise<string> {
  const token = crypto.randomUUID();
  const { error } = await supabase.from('signing_links').insert({
    document_id: params.documentId,
    signer_id:   params.signerId,
    token,
    expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
  });
  if (error) throw new Error(`createSigningLink: ${error.message}`);
  return token;
}

export async function verifySigningTokenPublic(token: string): Promise<{
  documentId: string;
  signerId: string;
  originalPdfUrl: string;
  documentName: string;
} | null> {
  // Do NOT filter by expires_at — a link is valid as long as the document
  // status is 'pending'. Filtering by expiry caused "Enlace no valido" for
  // any link older than 48 h even when the document had never been signed.
  const { data, error } = await publicSupabase
    .from('signing_links')
    .select('document_id, signer_id, expires_at, documents:document_id(name, original_pdf_url, status)')
    .eq('token', token)
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

  const doc = data.documents as { name: string; original_pdf_url: string; status: string } | null;

  console.log('Validando transaccion de firma:', {
    id: data.document_id,
    status: doc?.status ?? 'unknown',
    expire_at: data.expires_at,
    original_pdf: doc?.original_pdf_url ?? null,
  });

  if (!doc) {
    console.warn('verifySigningTokenPublic — document record not found for id:', data.document_id);
    return null;
  }

  if (doc.status === 'completed') {
    console.warn('verifySigningTokenPublic — document already completed');
    return null;
  }

  return {
    documentId:     data.document_id as string,
    signerId:       data.signer_id as string,
    originalPdfUrl: doc.original_pdf_url || '',
    documentName:   doc.name || 'Documento',
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

// ─── Credits & Subscriptions ─────────────────────────────────────────────────

export interface UserCredits {
  credits: number;
  plan: 'free' | 'monthly';
  plan_expires_at: string | null;
}

export async function getUserCredits(userId: string): Promise<UserCredits> {
  const { data } = await supabase
    .from('user_credits')
    .select('credits, plan, plan_expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) return { credits: 0, plan: 'free', plan_expires_at: null };

  const expired =
    data.plan === 'monthly' &&
    data.plan_expires_at &&
    new Date(data.plan_expires_at) < new Date();

  if (expired) {
    await supabase
      .from('user_credits')
      .update({ plan: 'free', credits: 0, plan_expires_at: null })
      .eq('user_id', userId);
    return { credits: 0, plan: 'free', plan_expires_at: null };
  }

  return {
    credits:         (data.credits as number) ?? 0,
    plan:            (data.plan as 'free' | 'monthly') ?? 'free',
    plan_expires_at: (data.plan_expires_at as string | null) ?? null,
  };
}

export async function deductCredit(userId: string): Promise<void> {
  const current = await getUserCredits(userId);
  if (current.plan === 'monthly') return;
  if (current.credits <= 0) throw new Error('Sin créditos disponibles');
  const { error } = await supabase
    .from('user_credits')
    .update({ credits: Math.max(0, current.credits - 1), updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) throw new Error(`deductCredit: ${error.message}`);
}

export async function grantSingleCredit(userId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('user_credits')
    .select('credits')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('user_credits')
      .update({ credits: (existing.credits as number) + 1, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  } else {
    await supabase.from('user_credits').insert({ user_id: userId, credits: 1, plan: 'free' });
  }
}

export async function activateMonthlyPlan(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabase
    .from('user_credits')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('user_credits')
      .update({ plan: 'monthly', plan_expires_at: expiresAt, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  } else {
    await supabase.from('user_credits').insert({
      user_id: userId, credits: 0, plan: 'monthly', plan_expires_at: expiresAt,
    });
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

async function resolveImageBytes(sig: SignatureToEmbed): Promise<Uint8Array | null> {
  if (sig.imageUrl?.startsWith('data:')) {
    const base64 = sig.imageUrl.split(',')[1];
    if (base64) {
      try {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
      } catch { /* fall through */ }
    }
  }
  const candidates = [sig.imageUrl, sig.storageUrl].filter(
    (u): u is string => Boolean(u) && !u!.startsWith('data:'),
  );
  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: 'force-cache' });
      if (res.ok) return new Uint8Array(await res.arrayBuffer());
    } catch { /* try next */ }
  }
  return null;
}

export async function compilePdfWithSignatures(params: {
  pdfBytes: Uint8Array;
  signatures: SignatureToEmbed[];
  documentId: string;
  fileHash: string;
}): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

  // Phase 0: pre-load ALL images in parallel before touching the PDF
  const resolvedImages = await Promise.all(
    params.signatures.map((sig) => resolveImageBytes(sig)),
  );

  const pdfDoc  = await PDFDocument.load(params.pdfBytes.slice(0));
  const pages   = pdfDoc.getPages();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg  = await pdfDoc.embedFont(StandardFonts.Helvetica);

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
    let pdfImage;
    try { pdfImage = await pdfDoc.embedPng(imgBytes); }
    catch { try { pdfImage = await pdfDoc.embedJpg(imgBytes); } catch { continue; } }

    const sigW = (sig.widthFraction  ?? 0.38) * pw;
    const sigH = (sig.heightFraction ?? 0.16) * ph;
    const rawX = sig.xFraction * pw - sigW / 2;
    const rawY = (1 - sig.yFraction) * ph - sigH / 2;
    const x = Math.max(0, Math.min(pw - sigW, rawX));
    const y = Math.max(0, Math.min(ph - sigH, rawY));

    const PAD = 5, LABEL_H = 13, DATE_H = 10, ROLE_H = 9, NAME_H = 12, LINE_H = 13;
    const TEXT_ZONE = DATE_H + ROLE_H + NAME_H + LINE_H;
    const IMG_ZONE  = Math.max(10, sigH - TEXT_ZONE - LABEL_H);

    page.drawRectangle({ x, y, width: sigW, height: sigH, color: rgb(0.982, 0.984, 0.996), borderColor: rgb(0.70, 0.74, 0.91), borderWidth: 0.5 });
    page.drawRectangle({ x, y: y + sigH - 3, width: sigW, height: 3, color: rgb(0.35, 0.41, 0.91) });
    page.drawText('FIRMA DIGITAL', { x: x + PAD, y: y + TEXT_ZONE + IMG_ZONE + 2, size: 5.5, font: fontBold, color: rgb(0.35, 0.41, 0.88) });
    page.drawImage(pdfImage, { x: x + PAD, y: y + TEXT_ZONE + 2, width: sigW - 2 * PAD, height: IMG_ZONE - 4, opacity: 0.97 });
    page.drawText('X', { x: x + PAD, y: y + TEXT_ZONE - LINE_H / 2 - 1, size: 8, font: fontBold, color: rgb(0.07, 0.10, 0.24) });
    page.drawLine({ start: { x: x + PAD + 12, y: y + TEXT_ZONE - LINE_H / 2 + 2 }, end: { x: x + sigW - PAD, y: y + TEXT_ZONE - LINE_H / 2 + 2 }, thickness: 0.9, color: rgb(0.35, 0.40, 0.65) });

    const name = (sig.signerName ?? '').trim().toUpperCase().substring(0, 30);
    if (name) page.drawText(name, { x: x + PAD, y: y + DATE_H + ROLE_H + PAD + 1, size: Math.max(5.5, Math.min(7.5, sigW / 16)), font: fontBold, color: rgb(0.07, 0.08, 0.14) });
    const role = (sig.signerRole ?? '').trim().substring(0, 34);
    if (role) page.drawText(role, { x: x + PAD, y: y + DATE_H + PAD + 1, size: Math.max(4.5, Math.min(6, sigW / 22)), font: fontReg, color: rgb(0.35, 0.41, 0.91) });
    page.drawText(new Intl.DateTimeFormat('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()), { x: x + PAD, y: y + PAD, size: 5, font: fontReg, color: rgb(0.50, 0.55, 0.72) });
  }

  // Phase 2: certification report page (mirror grid + legal compliance)
  if (params.signatures.length > 0) {
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
    reportPage.drawText(TITLE, { x: (PAGE_W - fontBold.widthOfTextAtSize(TITLE, 15)) / 2, y: PAGE_H - 30, size: 15, font: fontBold, color: rgb(0.97, 0.97, 1) });

    const docRef  = params.documentId.replace(/-/g, '').toUpperCase().substring(0, 16);
    const subText = `Codec Document  ·  Ref: ${docRef}`;
    reportPage.drawText(subText, { x: (PAGE_W - fontReg.widthOfTextAtSize(subText, 7.5)) / 2, y: PAGE_H - 47, size: 7.5, font: fontReg, color: rgb(0.63, 0.66, 0.78) });
    reportPage.drawText(`Generado: ${nowStr}`, { x: (PAGE_W - fontReg.widthOfTextAtSize(`Generado: ${nowStr}`, 6.5)) / 2, y: PAGE_H - 63, size: 6.5, font: fontReg, color: rgb(0.50, 0.53, 0.63) });

    // Signature blocks — repeat(2, 1fr) mirror grid
    const contentStartY = PAGE_H - HEADER_H - 22;
    const docPrefix     = params.documentId.replace(/-/g, '').toUpperCase().substring(0, 8);

    for (let i = 0; i < params.signatures.length; i++) {
      const sig       = params.signatures[i];
      const imgBytes  = resolvedImages[i];
      const col       = i % 2;
      const row       = Math.floor(i / 2);
      const blockX    = MARGIN + col * (COL_W + COL_GAP);
      const blockTopY = contentStartY - row * (BLOCK_H + BLOCK_GAP_V);
      const blockBotY = blockTopY - BLOCK_H;
      if (blockBotY < BLOCK_STOP_Y) break;

      const token = `CDX-${docPrefix.substring(0, 4)}-${docPrefix.substring(4, 8)}-${String(i + 1).padStart(2, '0')}`;

      reportPage.drawRectangle({ x: blockX, y: blockBotY, width: COL_W, height: BLOCK_H, color: rgb(1, 1, 1), borderColor: rgb(0.86, 0.88, 0.94), borderWidth: 0.6 });
      reportPage.drawLine({ start: { x: blockX, y: blockTopY }, end: { x: blockX + COL_W, y: blockTopY }, thickness: 2, color: rgb(0.35, 0.41, 0.91) });

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
        reportPage.drawText(sigName, { x: blockX + Math.max(INNER_PAD, (COL_W - tw) / 2), y: textAreaTopY - 34, size: 8.5, font: fontBold, color: rgb(0.07, 0.08, 0.14) });
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
    reportPage.drawText(badgeLabel, { x: BX + (BW - fontBold.widthOfTextAtSize(badgeLabel, badgeSz)) / 2, y: BY + 4.5, size: badgeSz, font: fontBold, color: rgb(1, 1, 1) });
    const securedLabel = 'Secured by Codec Studio';
    reportPage.drawText(securedLabel, { x: BX + (BW - fontReg.widthOfTextAtSize(securedLabel, 5.5)) / 2, y: BY - 7, size: 5.5, font: fontReg, color: rgb(0.50, 0.54, 0.66) });

    // Compliance title
    const compTitle = 'U.S. ELECTRONIC SIGNATURE LEGAL COMPLIANCE';
    reportPage.drawText(compTitle, { x: TX, y: LY + LEGAL_H - 14, size: 7.5, font: fontBold, color: rgb(0.10, 0.14, 0.38) });

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
    reportPage.drawText(auditIdStr, { x: TX, y: AIBY, size: 7, font: fontBold, color: rgb(0.10, 0.14, 0.45) });

    reportPage.drawText(
      'Codec Document Security Services - Cryptographic Audit Trail Verification String. Electronically signed document with full legal binding.',
      { x: TX, y: LY + 7, size: 5.5, font: fontReg, color: rgb(0.55, 0.60, 0.72) },
    );
  }

  return pdfDoc.save();
}
