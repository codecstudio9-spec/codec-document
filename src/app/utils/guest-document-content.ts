/**
 * Builds the final document `content` string for a completed
 * sign_transactions row, for the GUEST signer's own "download my copy"
 * button on /sign/:transactionId — no login required, using only the
 * public data get_sign_transaction_public already exposes to anyone
 * holding that transaction's id.
 *
 * Two paths, mirroring how the creator-side flows already build content:
 * - Built-in document types: same {{placeholder}} interpolation preview-page.tsx
 *   uses (reuses its own exported helpers, not a re-implementation, so the
 *   two never drift apart).
 * - Custom Word templates (document_type === 'custom-template'): same
 *   docx merge + text extraction as custom-template-preview-page.tsx,
 *   just fetching the template via the public-by-id RPC instead of the
 *   owner-only one (this page has no logged-in owner to authenticate as).
 */
import { getTemplateById } from '../data/templates';
import { spanishTemplates } from '../data/templates-es';
import { getStateSpecificTemplate } from '../data/state-variations';
import { getDocumentTranslation } from '../data/document-translations';
import { enrichDocumentDataWithDates } from './document-dates';
import { normalizeCorruptedText, normalizeLanguageSensitiveFields } from '../pages/preview-page';
import { getDocxTemplateByIdPublic } from '../services/docx-template-service';
import { fetchDocxArrayBuffer, renderDocxTemplate, extractTextFromDocx } from '../../lib/docxTemplateEngine';
import type { SignTransaction } from '../services/sign-transaction-service';
import type { DocumentData } from '../types/document';

function interpolateBuiltInTemplate(documentType: string, rawDocumentData: Record<string, unknown>, language: 'en' | 'es'): { content: string; title: string } {
  const template = getTemplateById(documentType);
  if (!template) throw new Error('Unknown document type');
  const documentData = rawDocumentData as DocumentData;

  let templateToUse = language === 'es' && spanishTemplates[template.id] ? spanishTemplates[template.id] : template.template;
  const state = String((documentData as { state?: unknown }).state ?? '');
  if (state) templateToUse = getStateSpecificTemplate(templateToUse, template.id, state, language);

  const dataWithDate = normalizeLanguageSensitiveFields(enrichDocumentDataWithDates(documentData, language), language);

  let content = templateToUse;
  content = content.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_match, fieldName, innerContent) => {
    const value = dataWithDate[fieldName.trim() as keyof typeof dataWithDate];
    return value && value !== '' && value !== 'No' && value !== 'false' ? innerContent : '';
  });
  Object.entries(dataWithDate).forEach(([key, value]) => {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g');
    const normalizedValue = typeof value === 'boolean' ? (value ? '(x)' : '( )') : value;
    content = content.replace(regex, String(normalizedValue || ''));
  });
  content = content.replace(/\{\{([^}]+)\}\}/g, '');

  return {
    content: normalizeCorruptedText(content),
    title: getDocumentTranslation(template.id, 'name', language),
  };
}

async function interpolateCustomTemplate(documentData: { templateId?: string; values?: Record<string, string> }): Promise<{ content: string; title: string }> {
  if (!documentData.templateId) throw new Error('Missing templateId');
  const template = await getDocxTemplateByIdPublic(documentData.templateId);
  if (!template) throw new Error('Template not found');

  const docxBytes = await fetchDocxArrayBuffer(template.docxFileUrl);
  const mergedBytes = renderDocxTemplate(docxBytes, documentData.values ?? {});
  const content = await extractTextFromDocx(mergedBytes);
  return { content, title: template.name };
}

export async function buildGuestDocumentContent(tx: SignTransaction, language: 'en' | 'es'): Promise<{ content: string; title: string }> {
  if (tx.document_type === 'custom-template') {
    return interpolateCustomTemplate(tx.document_data as { templateId?: string; values?: Record<string, string> });
  }
  return interpolateBuiltInTemplate(tx.document_type, tx.document_data, language);
}
