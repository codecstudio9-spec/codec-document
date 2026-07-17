import { supabase } from '../../lib/supabase';
import { loadPdfFontBundle } from '../../lib/signatureService';

export type FieldType = 'text' | 'date' | 'signature' | 'initials';

export interface PlacedField {
  id: string;
  type: FieldType;
  label: string;
  page: number;           // 1-indexed
  xFraction: number;       // centre X as fraction of page width (0-1)
  yFraction: number;       // centre Y as fraction of page height (0-1)
  widthFraction: number;
  heightFraction: number;
  required: boolean;
}

export interface CustomTemplate {
  id: string;
  userId: string;
  name: string;
  fileUrl: string;
  fields: PlacedField[];
  createdAt: string;
}

// ─── CRUD — plain authenticated client calls are fine here (unlike the
// signature flow's documents/signatures tables), because this feature is
// always behind a login: RLS's "own" policy (auth.uid() = user_id) is a
// real, already-proven guard for an authenticated caller reading/writing
// their own rows — no anon/guest access path exists for templates at all.

export async function createTemplate(params: {
  userId: string; name: string; fileUrl: string; fields: PlacedField[];
}): Promise<string> {
  const { data, error } = await supabase
    .from('templates')
    .insert({ user_id: params.userId, name: params.name, file_url: params.fileUrl, fields_metadata: params.fields })
    .select('id')
    .single();
  if (error) throw new Error(`createTemplate: ${error.message}`);
  return data.id as string;
}

export async function updateTemplateFields(templateId: string, fields: PlacedField[]): Promise<void> {
  const { error } = await supabase.from('templates').update({ fields_metadata: fields, updated_at: new Date().toISOString() }).eq('id', templateId);
  if (error) throw new Error(`updateTemplateFields: ${error.message}`);
}

function rowToTemplate(row: {
  id: string; user_id: string; name: string; file_url: string; fields_metadata: unknown; created_at: string;
}): CustomTemplate {
  return {
    id: row.id, userId: row.user_id, name: row.name, fileUrl: row.file_url,
    fields: Array.isArray(row.fields_metadata) ? (row.fields_metadata as PlacedField[]) : [],
    createdAt: row.created_at,
  };
}

export async function listTemplates(userId: string): Promise<CustomTemplate[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('id, user_id, name, file_url, fields_metadata, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(rowToTemplate);
}

export async function getTemplate(templateId: string): Promise<CustomTemplate | null> {
  const { data, error } = await supabase
    .from('templates')
    .select('id, user_id, name, file_url, fields_metadata, created_at')
    .eq('id', templateId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToTemplate(data);
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const { error } = await supabase.from('templates').delete().eq('id', templateId);
  if (error) throw new Error(`deleteTemplate: ${error.message}`);
}

/** Timestamped path — see the identical reasoning in branding-service.ts
 * and signatureService.ts: this bucket's storage RLS only reliably
 * grants INSERT, so a fresh path avoids ever needing an UPDATE. */
export async function uploadTemplateFile(userId: string, blob: Blob): Promise<string> {
  const path = `templates/${userId}/template-${Date.now()}.pdf`;
  const { error } = await supabase.storage.from('documents-bucket').upload(path, blob, { contentType: 'application/pdf', upsert: false });
  if (error) throw new Error(`uploadTemplateFile: ${error.message}`);
  const { data } = supabase.storage.from('documents-bucket').getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('uploadTemplateFile: could not retrieve public URL');
  return data.publicUrl;
}

/**
 * Persists a filled-template result into the SAME `documents` table the
 * signature flow uses (id, user_id, name, status, original_pdf_url,
 * signed_pdf_url, created_at — see signatureService.ts), not a new table.
 * That's what makes it show up in the dashboard for free, via the
 * existing fetchAssociatedDocuments()/DesktopDocuments/MobileDocuments
 * code — including the already-built 30-day expiry chip — with zero
 * changes to any of that. Filled documents have nothing left to sign (the
 * template's own signature/initials fields are already baked in), so they
 * go straight in as `status: 'completed'`, exactly like a finished
 * signature-flow document would.
 */
export async function saveFilledDocument(params: {
  userId: string; templateName: string; templateFileUrl: string; pdfBytes: Uint8Array;
}): Promise<void> {
  const path = `documents/custom-templates/${params.userId}/filled-${Date.now()}.pdf`;
  const blob = new Blob([params.pdfBytes], { type: 'application/pdf' });
  const { error: uploadError } = await supabase.storage.from('documents-bucket').upload(path, blob, { contentType: 'application/pdf', upsert: false });
  if (uploadError) throw new Error(`saveFilledDocument: ${uploadError.message}`);
  const { data: urlData } = supabase.storage.from('documents-bucket').getPublicUrl(path);
  if (!urlData?.publicUrl) throw new Error('saveFilledDocument: could not retrieve public URL');

  const { error: insertError } = await supabase.from('documents').insert({
    user_id: params.userId,
    name: params.templateName,
    status: 'completed',
    original_pdf_url: params.templateFileUrl,
    signed_pdf_url: urlData.publicUrl,
  });
  if (insertError) throw new Error(`saveFilledDocument: ${insertError.message}`);
}

// ─── Fill-in generation ─────────────────────────────────────────────────────
// Deliberately separate from signatureService.ts's compilePdfWithSignatures
// — different shape entirely (arbitrary labeled fields, not a signer
// roster + certification report) — this stays fully self-contained so it
// can't affect the already-working signature flow.

/** fieldId -> the value the user typed (text/date fields) or a signature
 * data URL (signature/initials fields). */
export type TemplateFillValues = Record<string, string>;

export async function generateFilledDocument(params: {
  templateFileUrl: string;
  fields: PlacedField[];
  values: TemplateFillValues;
}): Promise<Uint8Array> {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
  const { default: fontkit } = await import('@pdf-lib/fontkit');

  const res = await fetch(params.templateFileUrl);
  if (!res.ok) throw new Error(`generateFilledDocument: could not fetch template (${res.status})`);
  const bytes = new Uint8Array(await res.arrayBuffer());

  const pdfDoc = await PDFDocument.load(bytes);
  pdfDoc.registerFontkit(fontkit);
  const fontBundle = await loadPdfFontBundle();
  const font = fontBundle?.regular ? await pdfDoc.embedFont(fontBundle.regular) : await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  for (const field of params.fields) {
    const value = params.values[field.id];
    if (!value) continue;
    const page = pages[field.page - 1];
    if (!page) continue;

    const { width: pw, height: ph } = page.getSize();
    const boxW = field.widthFraction * pw;
    const boxH = field.heightFraction * ph;
    const x = field.xFraction * pw - boxW / 2;
    const y = (1 - field.yFraction) * ph - boxH / 2;

    if (field.type === 'signature' || field.type === 'initials') {
      try {
        const base64 = value.split(',')[1];
        if (!base64) continue;
        const imgBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const isPng = value.startsWith('data:image/png');
        const img = isPng ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);
        const dims = img.size() as { width: number; height: number };
        const aspect = dims.width / dims.height;
        let drawW = boxW, drawH = boxW / aspect;
        if (drawH > boxH) { drawH = boxH; drawW = boxH * aspect; }
        page.drawImage(img, { x: x + (boxW - drawW) / 2, y: y + (boxH - drawH) / 2, width: drawW, height: drawH });
      } catch { /* skip an unembeddable image rather than fail the whole document */ }
    } else {
      const fontSize = Math.max(7, Math.min(13, boxH * 0.55));
      page.drawText(value, {
        x: x + 3,
        y: y + (boxH - fontSize) / 2,
        size: fontSize,
        font,
        color: rgb(0.07, 0.08, 0.14),
        maxWidth: boxW - 6,
      });
    }
  }

  return pdfDoc.save();
}
