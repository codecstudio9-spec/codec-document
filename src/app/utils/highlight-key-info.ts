/**
 * Finds the parts of a paragraph worth bolding in a formal document: money
 * amounts, ID/cédula numbers, phone numbers, dates, percentages, and runs
 * of consecutive ALL-CAPS words (the existing convention Spanish legal
 * text already uses for party names and spelled-out amounts — "LA PARTE
 * CONTRATANTE", "VEINTITRÉS MILLONES... PESOS"). Pure regex, no AI: this
 * only needs to recognize a handful of well-known shapes, not understand
 * the text.
 */
export interface TextSegment {
  text: string;
  bold: boolean;
}

const PATTERNS: RegExp[] = [
  // Money with a $ sign: $23.492.000, $1,000.00
  /\$\s?\d[\d.,]*/g,
  // Cédula / C.C. numbers
  /\b(?:c\.?c\.?|c[eé]dula(?:\s+de\s+ciudadan[ií]a)?)\.?\s*n?[°ºo.]?\s*:?\s*\d[\d.,]{4,}\b/gi,
  // Phone numbers introduced by Cel/Tel
  /\b(?:cel(?:ular)?|tel(?:[eé]fono)?)\.?\s*:?\s*\d[\d ]{5,14}\b/gi,
  // Spelled-out dates: "4 de diciembre de 2027", "4 al 6 de diciembre del 2027"
  /\b\d{1,2}(?:\s+al\s+\d{1,2})?\s+de\s+[a-záéíóúñ]+(?:\s+(?:de|del)\s+\d{4})?\b/gi,
  // Numeric dates: 30/06/2026
  /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
  // Percentages
  /\b\d{1,3}(?:[.,]\d+)?\s?%/g,
  // Two or more consecutive ALL-CAPS words
  /\b[A-ZÁÉÍÓÚÑÜ]{2,}(?:\s+[A-ZÁÉÍÓÚÑÜ]{1,})+\b/g,
];

export function splitKeyInfo(text: string): TextSegment[] {
  const ranges: Array<[number, number]> = [];
  for (const pattern of PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(text))) {
      if (match[0].length === 0) { re.lastIndex++; continue; }
      ranges.push([match.index, match.index + match[0].length]);
    }
  }

  if (ranges.length === 0) return [{ text, bold: false }];

  ranges.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const merged: Array<[number, number]> = [];
  for (const [start, end] of ranges) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }

  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) segments.push({ text: text.slice(cursor, start), bold: false });
    segments.push({ text: text.slice(start, end), bold: true });
    cursor = end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), bold: false });
  return segments;
}
