/**
 * "Descargar PDF" straight from a filled-in Word template, with no signature
 * round trip — the same merge pipeline custom-template-preview-page.tsx uses
 * for signed copies (renderDocxTemplate → formatted paragraphs → clause
 * overrides → PDFGenerator with the account's branding), minus the
 * signature blocks. Also leaves the document in «Mis documentos».
 */
import type { DocxTemplate } from './docx-template-service';
import {
  fetchDocxArrayBuffer, renderDocxTemplate, extractFormattedParagraphs,
  applyClauseOverrides, applyExtraClauses,
} from '../../lib/docxTemplateEngine';
import { PDFGenerator } from './pdf-generator';
import { loadDocumentBrandingForUser } from './branding-service';
import { saveDocumentRecord } from './documents-service';
import { nombrePersonaDeValores, tituloDeDocumento, nombreDeArchivo } from '../utils/nombre-del-documento';
import { triggerDownload } from '../utils/download';

export async function downloadFilledTemplatePdf(
  template: DocxTemplate,
  values: Record<string, string>,
  language: 'en' | 'es',
  userId: string | undefined,
): Promise<void> {
  const docxBytes = await fetchDocxArrayBuffer(template.docxFileUrl);
  const merged = renderDocxTemplate(docxBytes, values);
  const paragraphs = applyExtraClauses(
    applyClauseOverrides(extractFormattedParagraphs(merged), template.clauseOverrides),
    template.extraClauses,
  );
  const content = paragraphs.map((p) => p.runs.map((r) => r.text).join('')).join('\n');

  const titulo = tituloDeDocumento(template.name, nombrePersonaDeValores(values, template.detectedFields), language);
  const fileName = nombreDeArchivo(titulo);
  const branding = userId ? await loadDocumentBrandingForUser(userId) : undefined;

  const blob = await PDFGenerator.generateBlob({
    content,
    formattedParagraphs: paragraphs,
    title: titulo,
    fileName,
    language,
    showWatermark: false,
    branding,
  });
  await triggerDownload(blob, fileName);

  if (userId) {
    saveDocumentRecord(userId, template.id, titulo).catch((err) => {
      console.error('saveDocumentRecord (descarga de plantilla):', err);
    });
  }
}
