/**
 * Turns raw pasted text (from Word, an email, any external AI chat...) into
 * {title, sections} for PastedDocumentPreview — pure string parsing, no
 * network call and no AI. "Crear nuevo" only needs to reformat text into a
 * branded, printable document; it never rewrites or invents content, so an
 * LLM call was pure cost/latency/failure-surface for zero benefit over a
 * few paragraph/heading heuristics.
 */
export interface FormattedSection {
  heading: string | null;
  body: string;
}

export interface FormattedDocument {
  title: string;
  sections: FormattedSection[];
}

const HEADING_PATTERNS: RegExp[] = [
  // Markdown-style headers, in case the pasted text came from a Markdown source.
  /^#{1,6}\s+\S.*/,
  // Common legal/contract heading prefixes (Spanish + English).
  /^(cl[aá]usula|art[ií]culo|cap[ií]tulo|secci[oó]n|anexo|t[ií]tulo|par[aá]grafo|article|clause|chapter|section|appendix)\s+\S/i,
  // A short line that's ENTIRELY caps/digits/punctuation (no lowercase letters at all).
  /^[A-ZÁÉÍÓÚÑÜ0-9][A-ZÁÉÍÓÚÑÜ0-9 .,:;()°ª/-]{2,89}$/,
];

function stripMarkdownHeading(line: string): string {
  return line.replace(/^#{1,6}\s+/, '').trim();
}

function looksLikeHeadingLine(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 110) return false;
  if (HEADING_PATTERNS.some((p) => p.test(t))) return true;
  // Short line ending in ":" that isn't itself a full sentence (no period
  // before the colon) — e.g. "Objeto del contrato:".
  return t.length <= 90 && /:$/.test(t) && !t.slice(0, -1).includes('. ');
}

export function parsePastedDocument(rawText: string, language: 'en' | 'es' = 'es'): FormattedDocument {
  const normalized = rawText.replace(/\r\n?/g, '\n').trim();
  const blocks = normalized.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  let title = language === 'en' ? 'Document' : 'Documento';
  let bodyBlocks = blocks;
  // The first paragraph counts as the title only if it's a single short
  // line — a real title, not the start of running prose that happens not
  // to have a blank line under it yet, and not a salutation ("Estimado
  // señor Pérez," / "Dear Mr. Smith,") — those always end in a comma,
  // titles never do.
  if (blocks.length > 0 && !blocks[0].includes('\n') && blocks[0].length <= 140 && !/,\s*$/.test(blocks[0])) {
    title = stripMarkdownHeading(blocks[0]) || title;
    bodyBlocks = blocks.slice(1);
  }

  const sections: FormattedSection[] = [];
  let pendingHeading: string | null = null;
  let paras: string[] = [];

  const flush = () => {
    if (pendingHeading !== null || paras.length > 0) {
      sections.push({ heading: pendingHeading, body: paras.join('\n\n') });
    }
    pendingHeading = null;
    paras = [];
  };

  for (const block of bodyBlocks) {
    if (!block.includes('\n') && looksLikeHeadingLine(block)) {
      flush();
      pendingHeading = stripMarkdownHeading(block);
    } else {
      paras.push(block);
    }
  }
  flush();

  return { title, sections };
}
