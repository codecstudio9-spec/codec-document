/**
 * Word (.docx) template engine — {{double-brace}} variable detection and
 * rendering, ZapSign-style.
 *
 * A .docx is a zip; the visible text lives in word/document.xml split
 * across <w:r><w:t> "runs" that Word breaks up on its own (autocorrect,
 * spellcheck, formatting changes) — so a single {{nombre_cliente}} tag can
 * easily end up as "{{nombre" in one run and "_cliente}}" in the next.
 * Detection below flattens all <w:t> text WITHIN each paragraph before
 * scanning for {{...}}, so a split tag is still found. Rendering (the
 * actual substitution) is handled by docxtemplater, which does the same
 * kind of run-recombination internally — that's the whole reason to use
 * it instead of a naive string replace.
 *
 * Runs entirely in the browser (no server/edge function) — docxtemplater,
 * pizzip, and mammoth are pure JS with official browser support, matching
 * how the rest of this app's PDF generation (jsPDF) and the existing
 * PDF-overlay template engine (pdf-lib, see template-service.ts) already
 * work client-side.
 */

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export type DetectedFieldType = 'text' | 'date' | 'number' | 'choice';

export interface DetectedField {
  key: string;
  label: string;
  type: DetectedFieldType;
  options?: string[];
  required: boolean;
}

const TAG_RE = /\{\{\s*([^}]+?)\s*\}\}/g;

function humanizeLabel(key: string): string {
  const spaced = key.replace(/[_-]+/g, ' ').trim();
  return spaced.replace(/\b\w/g, (c) => c.toUpperCase()) || key;
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/** Splits document.xml into its <w:p> paragraph blocks. Detection never
 * scans across paragraphs — a {{ at the end of one paragraph and a }}
 * at the start of the next should never be treated as a pair. */
function extractParagraphs(xml: string): string[] {
  return xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) ?? [];
}

/** Concatenates every <w:t> text node inside one paragraph, ignoring
 * <w:r> run boundaries — this is what reconstructs a tag Word split
 * across runs. */
function flattenParagraphText(paragraphXml: string): string {
  const textRe = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
  let out = '';
  let m: RegExpExecArray | null;
  while ((m = textRe.exec(paragraphXml))) {
    out += m[1];
  }
  return decodeXmlEntities(out);
}

/**
 * Parses the DSL after the variable name (everything after the first
 * `:`), all optional — a bare {{name}} is always plain text:
 *   {{fecha_firma:fecha}} / {{fecha_firma:date}}      -> date
 *   {{monto:numero}} / {{monto:number}}               -> number
 *   {{metodo_pago:Efectivo;Tarjeta;Transferencia}}    -> choice, split on ';'
 * An unrecognized single-word hint (no ';', not date/number) is treated
 * as plain text rather than guessed — the admin can reclassify it in the
 * editor UI regardless.
 */
function parseTag(raw: string): { key: string; type: DetectedFieldType; options?: string[] } {
  const firstColon = raw.indexOf(':');
  const key = (firstColon === -1 ? raw : raw.slice(0, firstColon)).trim();
  const hint = (firstColon === -1 ? '' : raw.slice(firstColon + 1)).trim();

  if (!hint) return { key, type: 'text' };
  if (/^(fecha|date)$/i.test(hint)) return { key, type: 'date' };
  if (/^(numero|number|num)$/i.test(hint)) return { key, type: 'number' };
  if (hint.includes(';')) {
    const options = hint.split(';').map((o) => o.trim()).filter(Boolean);
    if (options.length > 0) return { key, type: 'choice', options };
  }
  return { key, type: 'text' };
}

const MAX_LABEL_CANDIDATE_LENGTH = 60;

/**
 * A form-style docx almost always writes its variables as
 * "Some Label: {{key}}" on their own line — if the text immediately
 * before a tag (within the same paragraph, after any earlier tag in that
 * same paragraph) ends in a colon/dash, that's a real human-written label
 * and is a much better form label than humanizing the variable's own key
 * (e.g. "Cédula de Ciudadanía" beats "Cedula"). Falls back to null (→
 * humanizeLabel(key)) whenever there's no such punctuation right before
 * the tag, so free-flowing prose with an inline {{tag}} is unaffected.
 */
function extractContextualLabel(precedingText: string): string | null {
  const trimmed = precedingText.trimEnd();
  if (!trimmed) return null;
  const lastChar = trimmed[trimmed.length - 1];
  if (!':：-–'.includes(lastChar)) return null;
  const withoutPunctuation = trimmed.slice(0, -1).trim();
  if (!withoutPunctuation || withoutPunctuation.length > MAX_LABEL_CANDIDATE_LENGTH) return null;
  return withoutPunctuation;
}

/**
 * Scans a .docx file's contents for every unique {{variable}} tag and
 * classifies its field type. Deduplicates by key — the same variable
 * commonly appears more than once in a document (e.g. the client's name
 * in the header and again in the signature line).
 */
export function detectFields(docxArrayBuffer: ArrayBuffer): DetectedField[] {
  const zip = new PizZip(docxArrayBuffer);
  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('Archivo .docx inválido: no se encontró word/document.xml (¿es realmente un archivo de Word?)');
  }
  const xml = docXmlFile.asText();
  const paragraphs = extractParagraphs(xml);

  const seen = new Map<string, DetectedField>();
  for (const paragraphXml of paragraphs) {
    const flat = flattenParagraphText(paragraphXml);
    const re = new RegExp(TAG_RE);
    let match: RegExpExecArray | null;
    let cursor = 0;
    while ((match = re.exec(flat))) {
      const { key, type, options } = parseTag(match[1]);
      const contextualLabel = extractContextualLabel(flat.slice(cursor, match.index));
      cursor = match.index + match[0].length;
      if (!key || seen.has(key)) continue;
      seen.set(key, { key, label: contextualLabel || humanizeLabel(key), type, options, required: true });
    }
  }
  return [...seen.values()];
}

/**
 * Substitutes every {{variable}} in the .docx with its value from `data`
 * (keyed by field key) and returns the merged .docx as bytes. Docxtemplater
 * handles the same run-fragmentation problem internally during
 * replacement, so this is robust to however Word split the original tags.
 */
export function renderDocxTemplate(docxArrayBuffer: ArrayBuffer, data: Record<string, string>): ArrayBuffer {
  const zip = new PizZip(docxArrayBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
    nullGetter: () => '',
    // The type-hint DSL (":fecha", ":Opcion1;Opcion2") is part of the tag
    // text itself (e.g. "{{fecha_firma:fecha}}") — docxtemplater otherwise
    // treats the WHOLE tag content as the lookup key, so without this it
    // would look for a data key literally named "fecha_firma:fecha" and
    // find nothing. This custom parser strips everything from the first
    // ':' onward before resolving against `data`, while still going
    // through docxtemplater's own tag-boundary detection (which is what
    // handles a tag split across XML runs) — only the final lookup key
    // changes, not the fragmentation-robust matching.
    parser: (tag: string) => ({
      get: (scope: Record<string, unknown>) => scope[tag.split(':')[0].trim()],
    }),
  });
  try {
    doc.render(data);
  } catch (err) {
    const properties = (err as { properties?: { errors?: Array<{ message?: string }> } })?.properties;
    const detail = properties?.errors?.map((e) => e.message).filter(Boolean).join('; ');
    throw new Error(detail ? `No se pudo generar el documento: ${detail}` : 'No se pudo generar el documento a partir de la plantilla.');
  }
  return doc.getZip().generate({ type: 'arraybuffer' }) as ArrayBuffer;
}

/** Plain-text extraction of a (typically already-merged) .docx, used as
 * the `content` fed into the existing PDFGenerator (src/app/services/
 * pdf-generator.ts) — reusing its letterhead/signature-block/audit-trail
 * rendering instead of building a second PDF renderer for docx files. */
export async function extractTextFromDocx(docxArrayBuffer: ArrayBuffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ arrayBuffer: docxArrayBuffer });
  return result.value;
}

export async function fetchDocxArrayBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar el archivo de plantilla (${res.status})`);
  return res.arrayBuffer();
}
