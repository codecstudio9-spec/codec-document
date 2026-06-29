import { jsPDF } from 'jspdf';
import { DocumentBranding } from '../types/document';

interface PDFGeneratorOptions {
  content: string;
  title: string;
  fileName: string;
  language: 'en' | 'es';
  state?: string;
  showWatermark?: boolean;
  branding?: (DocumentBranding & { documentRefId?: string });
  documentHash?: string;
  letterhead?: {
    companyName?: string;
    logoDataUrl?: string;
  };
  // Mirror signature block (side-by-side at bottom of document body)
  leftSig?: { dataUrl: string; name: string };
  rightSig?: { dataUrl: string; name: string };
  mirrorLayout?: boolean;
  mirrorLanguage?: 'en' | 'es';
  auditLog?: {
    documentId?: string;
    buyerEmail?: string;
    buyerName?: string;
    signerName?: string;
    buyerIp?: string;
    guestIp?: string;
    buyerSignedAt?: string;
    guestSignedAt?: string;
    guestUserAgent?: string;
    browser?: string;
    operatingSystem?: string;
    country?: string;
    state?: string;
    city?: string;
    signatureDataUrl?: string;
    signatureMethod?: string;
    legalStatus?: string;
  };
  signatures?: Array<{
    signerName?: string;
    signerRole?: string;
    token?: string;
    guestSignedAt?: string;
    signatureDataUrl?: string;
    signaturePage?: number;
    signatureX?: number;
    signatureY?: number;
    xDocPct?: number;
    yDocPct?: number;
  }>;
  identitySelfie?: string;
  identityIdDoc?: string;
  identityIdDocFront?: string;
  identityIdDocBack?: string;
}

/**
 * Professional PDF Generator for Legal Documents
 * Uses standard legal document formatting with Times New Roman-style font
 * Maintains proper margins and line spacing for legal documents
 */
export class PDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 25.4; // 1 inch = 25.4mm — US legal standard
  private lineHeight: number = 5.2; // 10pt × 1.35 line spacing
  private currentY: number;
  private maxWidth: number;
  private topReservedSpace: number = 0;
  private unicodeFontReady: Promise<void> | null = null;

  private static getAuditLocale(language: 'en' | 'es'): string {
    return language === 'es' ? 'es-ES' : 'en-US';
  }

  private static formatAuditDateTime(input: Date, language: 'en' | 'es'): string {
    const locale = PDFGenerator.getAuditLocale(language);
    const date = input.toLocaleDateString(locale, {
      year: 'numeric',
      month: language === 'es' ? '2-digit' : 'long',
      day: '2-digit',
    });
    const time = input.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    return `${date} ${time}`;
  }

  private static async loadFontBase64(fontPath: string): Promise<string | null> {
    try {
      const response = await fetch(fontPath);
      if (!response.ok) return null;
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    } catch {
      return null;
    }
  }

  private async ensureUnicodeFont(): Promise<void> {
    if (this.unicodeFontReady) return this.unicodeFontReady;

    this.unicodeFontReady = Promise.resolve();
    return this.unicodeFontReady;
  }

  // Safe font setter — falls back to built-in helvetica when custom fonts lack metrics
  private setFontSafe(family: string, style: string) {
    try {
      if (family !== 'helvetica' && family !== 'times' && family !== 'courier') {
        this.doc.setFont('helvetica', style);
        return;
      }
      this.doc.setFont(family, style);
    } catch (e) {
      try { this.doc.setFont('helvetica', style); } catch {}
      try { this.doc.setFont('times', style); } catch {}
    }
  }

  private safeGetTextWidth(txt: string): number {
    try {
      return this.doc.getTextWidth(txt);
    } catch (err) {
      try { this.doc.setFont('helvetica', 'normal'); } catch {}
      try { return this.doc.getTextWidth(txt); } catch (err2) {
        const size = (this.doc.getFontSize && typeof this.doc.getFontSize === 'function') ? this.doc.getFontSize() : 7;
        return txt.length * (size * 0.5);
      }
    }
  }

  private safeText(text: string | string[], x: number, y: number, opts?: any) {
    try {
      this.doc.text(text as any, x, y, opts);
    } catch (err) {
      try { this.doc.setFont('helvetica', 'normal'); } catch {}
      try { this.doc.text(text as any, x, y, opts); } catch (err2) {
        // last resort: if still failing, try splitting lines
        try {
          if (Array.isArray(text)) {
            (text as string[]).forEach((ln, i) => {
              try { this.doc.text(ln, x, y + i * 4); } catch {}
            });
          } else {
            const lines = String(text).split('\n');
            lines.forEach((ln, i) => { try { this.doc.text(ln, x, y + i * 4); } catch {} });
          }
        } catch {}
      }
    }
  }

  private static parseAgent(userAgent?: string): { browser: string; os: string } {
    const ua = String(userAgent || '').toLowerCase();
    let browser = 'Unknown';
    let os = 'Unknown';

    if (ua.includes('edg/')) browser = 'Microsoft Edge';
    else if (ua.includes('chrome/')) browser = 'Google Chrome';
    else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';
    else if (ua.includes('firefox/')) browser = 'Firefox';

    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac os')) os = 'macOS';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) os = 'iOS';
    else if (ua.includes('linux')) os = 'Linux';

    return { browser, os };
  }

  private static normalizeSignerDisplayName(name: string | undefined, language: 'en' | 'es'): string {
    const raw = String(name || '').trim();
    if (!raw) return language === 'es' ? 'ARRRENDATARIO' : 'TENANT';

    const mapEn: Record<string, string> = {
      DESTINATARIO: 'TENANT',
      RECIPIENTE: 'TENANT',
      RECEPTOR: 'TENANT',
    };
    const upper = raw.toUpperCase();
    if (language === 'en' && mapEn[upper]) return mapEn[upper];
    return raw;
  }

  private static normalizeSignerRole(role: string | undefined, language: 'en' | 'es'): string {
    const raw = String(role || '').trim();
    if (!raw) return language === 'es' ? 'Firmante' : 'Signatory';
    const upper = raw.toUpperCase();

    const toEn: Record<string, string> = {
      ARRENDADOR: 'LANDLORD',
      ARRENDATARIO: 'TENANT',
      DESTINATARIO: 'TENANT',
      RECIPIENTE: 'TENANT',
      FIRMANTE: 'SIGNATORY',
      RECEPTOR: 'RECIPIENT',
    };
    const toEs: Record<string, string> = {
      LANDLORD: 'ARRENDADOR',
      TENANT: 'ARRENDATARIO',
      RECIPIENT: 'RECEPTOR',
      SIGNATORY: 'FIRMANTE',
      SIGNER: 'FIRMANTE',
    };

    if (language === 'en' && toEn[upper]) return toEn[upper];
    if (language === 'es' && toEs[upper]) return toEs[upper];
    return raw;
  }

  // Defensive dictionaries for known OCR/template corruption fixes
  private readonly lexicalCorrections: Array<{ pattern: RegExp; replacement: string }> = [
    { pattern: /AGREEMENNTIAL/gi, replacement: 'RESIDENCIAL' },
    { pattern: /HARROPERTY/gi, replacement: 'PROPIEDAD' },
    { pattern: /TENANIT/gi, replacement: 'ARRENDATARIO' },
    { pattern: /LANDLORID/gi, replacement: 'ARRENDADOR' },
    { pattern: /3\.MeMONTHS/gi, replacement: '3. RENTA MENSUAL' },
  ];

  // Legal emphasis keywords (expanded list to improve professional rendering)
  private readonly legalTerms: string[] = [
    'WITNESSETH', 'WHEREAS', 'NOW THEREFORE', 'IN WITNESS WHEREOF',
    'CONSIDERANDO', 'POR LO TANTO', 'EN TESTIMONIO DE LO CUAL',
    'IMPORTANT', 'IMPORTANTE', 'WARNING', 'ADVERTENCIA',
    'NOTE', 'NOTA', 'LEGAL DISCLAIMER', 'AVISO LEGAL',
    'ATTESTATION', 'ATESTACIÓN', 'NOTARY', 'NOTARIO',
    'EXECUTION', 'EJECUCIÓN', 'SIGNATURE', 'FIRMA',
    'AGREEMENT', 'ACUERDO', 'CONTRACT', 'CONTRATO',
    'PARTIES', 'PARTES', 'TERM', 'PLAZO', 'PAYMENT', 'PAGO',
    'DEFAULT', 'INCUMPLIMIENTO', 'GOVERNING LAW', 'LEY APLICABLE'
  ];

  constructor(title: string) {
    // Create PDF in Letter size (8.5" x 11") - standard for US legal documents
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter', // 215.9 x 279.4 mm
    });

    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.maxWidth = this.pageWidth - (this.margin * 2);
    this.currentY = this.margin;

    this.doc.setFont('helvetica', 'normal');

    // Override jsPDF setFont to avoid custom TTF font aliases returned as helvetica.
    const anyDoc = this.doc as any;
    const originalSetFont = anyDoc.setFont?.bind(anyDoc);
    if (typeof originalSetFont === 'function') {
      anyDoc.setFont = (font: string, style?: string) => {
        try {
          originalSetFont(font, style);
          const currentFont = anyDoc.getFont?.();
          if (currentFont && typeof currentFont.postScriptName === 'string' && /arial|codecarial|\.ttf/i.test(currentFont.postScriptName)) {
            originalSetFont('times', style);
          }
        } catch {
          try { originalSetFont('times', style); } catch {}
        }
      };
    }

    this.currentY = this.margin + 6; // top header is 10mm; add 6mm safety gap
  }

  /**
   * Add text with automatic word wrapping and page breaks
   */
  private addText(text: string, fontSize: number = 11, fontStyle: 'normal' | 'bold' = 'normal', align: 'left' | 'center' | 'right' | 'justify' = 'justify') {
    // Ensure body/document text always renders in solid black regardless of previous style changes.
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(fontSize);
    this.ensureFontMetadata('helvetica', fontStyle);

    // Split text into lines that fit within the page width
    const lines = this.splitTextToSize(text, this.maxWidth);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check if we need a new page
      if (this.currentY + this.lineHeight > this.pageHeight - this.margin) {
        this.doc.addPage();
        this.currentY = this.margin + 6;
      }

      // Calculate X position based on alignment
      let xPosition = this.margin;
      if (align === 'center') {
        const textWidth = this.safeGetTextWidth(line);
        xPosition = (this.pageWidth - textWidth) / 2;
        this.safeText(line, xPosition, this.currentY);
      } else if (align === 'right') {
        const textWidth = this.safeGetTextWidth(line);
        xPosition = this.pageWidth - this.margin - textWidth;
        this.safeText(line, xPosition, this.currentY);
      } else if (align === 'justify') {
        this.safeText(line, this.margin, this.currentY);
      } else {
        this.safeText(line, this.margin, this.currentY);
      }

      const lh = Math.max(this.lineHeight, fontSize * 0.352 * 1.38);
      this.currentY += lh;
    }
  }

  /**
   * Add spacing between sections
   */
  private addSpacing(lines: number = 0.1) {
    this.currentY += this.lineHeight * lines;

    // Check if we need a new page
    if (this.currentY > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  /**
   * Ensure the current font is valid for jsPDF text measurement.
   * If font metadata is missing or invalid, fall back to built-in Helvetica.
   */
  private ensureFontMetadata(fontName: string, fontStyle: 'normal' | 'bold') {
    try {
      this.doc.setFont(fontName, fontStyle);
      const currentFont = this.doc.getFont();
      const isCustomTTF = currentFont && typeof currentFont.postScriptName === 'string' && currentFont.postScriptName.toLowerCase().includes('.ttf');
      if (!currentFont || !currentFont.metadata || typeof currentFont.metadata.Unicode === 'undefined' || isCustomTTF) {
        throw new Error('Invalid or custom font metadata');
      }
    } catch {
      try {
        this.doc.setFont('helvetica', fontStyle);
      } catch {
        this.doc.setFont('times', fontStyle);
      }
    }
  }

  private splitTextToSize(text: string, width: number): string[] {
    try {
      return this.doc.splitTextToSize(text, width);
    } catch (error) {
      console.warn('jsPDF splitTextToSize failed with current font, falling back to built-in helvetica', error);
      this.doc.setFont('helvetica', 'normal');
      try {
        return this.doc.splitTextToSize(text, width);
      } catch (fallbackError) {
        console.error('jsPDF splitTextToSize fallback also failed', fallbackError);
        return [text];
      }
    }
  }

  /**
   * Remove bracket placeholders like [____] or [   ] for premium legal final output
   */
  private sanitizePremiumPlaceholders(content: string): string {
    let normalized = content.normalize('NFC');

    for (const correction of this.lexicalCorrections) {
      normalized = normalized.replace(correction.pattern, correction.replacement);
    }

    // Normalize Unicode typographic characters to ASCII equivalents.
    // jsPDF Times font only covers Latin-1 (U+0000–U+00FF); anything above
    // that range renders as a tofu box or garbled glyph in the output PDF.
    normalized = normalized
      // Curly/smart quotes → straight quotes
      .replace(/[‘’ʼ′]/g, "'")
      .replace(/[“”„‟«»]/g, '"')
      // Dashes → ASCII hyphen / spaced hyphen
      .replace(/[–]/g, '-')
      .replace(/[—―]/g, ' - ')
      // Ellipsis, bullets, angle quotes
      .replace(/…/g, '...')
      .replace(/[•‣◦⁃⁌]/g, '-')
      .replace(/[‹›]/g, "'")
      // Non-breaking / zero-width / soft spaces
      .replace(/[   ]/g, ' ')
      .replace(/[­​‌‍﻿]/g, '')
      // Box-drawing characters that appear from template separators
      .replace(/[─-╿]/g, '-')
      // Preserve accented Latin characters and ñ so the PDF stays readable
      // with the bundled UTF-8-capable font instead of stripping them.
      .replace(/\u0000/g, '');

    // Normalize checkbox symbols to ASCII for reliable PDF rendering with standard fonts.
    // jsPDF built-in serif fonts may not support Unicode ballot symbols consistently.
    normalized = normalized
      .replace(/[☐◻□]/g, '( )')
      .replace(/[☑✅✔✓]/g, '(x)')
      .replace(/[☒✖✗]/g, '(x)');

    return normalized
      .replace(/\[\s*_{2,}\s*\]/g, ' ')
      .replace(/\[\s{2,}\]/g, ' ')
      .replace(/\[_{2,}\]/g, ' ')
      .replace(/[\[\]]/g, '')
      .replace(/_{2,}/g, ' ')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n');
  }

  /**
   * Normalize legal line while preserving intentional legal uppercase headers.
   */
  private normalizeLegalLine(line: string): string {
    let result = line.replace(/\s+/g, ' ').trim();

    for (const correction of this.lexicalCorrections) {
      result = result.replace(correction.pattern, correction.replacement);
    }

    return result;
  }

  /**
   * Detect if a line should be treated as numbered legal section.
   */
  private isNumberedSection(line: string): boolean {
    return /^\d+(\.\d+)+\s+/.test(line) || /^\d+\)\s+/.test(line);
  }

  /**
   * Split numbered legal section into heading and body.
   * Example: "3.4 PAYMENT METHOD. Rent shall..." =>
   * heading: "3.4 PAYMENT METHOD." | body: "Rent shall..."
   */
  private splitNumberedSection(line: string): { heading: string; body: string } {
    const match = line.match(/^(\d+(?:\.\d+)+)\s+(.+)$/);
    if (!match) {
      return { heading: line, body: '' };
    }

    const sectionNumber = match[1];
    const remainder = match[2];
    const sentenceBreak = remainder.match(/^(.+?\.)(\s+.+)$/);

    if (sentenceBreak) {
      const heading = `${sectionNumber} ${sentenceBreak[1].trim()}`;
      const body = sentenceBreak[2].trim();
      return { heading, body };
    }

    return {
      heading: `${sectionNumber} ${remainder.trim()}`,
      body: '',
    };
  }

  /**
   * Detect if line starts with bullet/list marker.
   */
  private isBulletLine(line: string): boolean {
    return /^([-•*]|\d+\.|\([a-zA-Z]\)|[a-zA-Z]\))\s+/.test(line);
  }

  /**
   * Detect label-like clause headers: TITLE: content
   */
  private isClauseHeader(line: string): boolean {
    return /^[A-Z\u00C0-\u017F][A-Z\u00C0-\u017F\s]+:/.test(line);
  }

  /**
   * Detect legal emphasis terms.
   */
  private containsLegalTerms(line: string): boolean {
    for (const term of this.legalTerms) {
      if (line.toUpperCase().includes(term.toUpperCase())) return true;
    }
    return false;
  }

  /**
   * Render a line split into strong/legal fragments and normal fragments.
   * This implementation avoids Y rewinds/overprints and keeps output stable.
   */
  private renderLegalEmphasisLine(line: string) {
    const clean = line.replace(/\*\*/g, '');
    console.log('TEXTO PROCESADO:', clean);
    console.log('FUENTE ACTUAL:', this.doc.getFont());
    this.addText(clean, 10, 'bold', 'left');
  }

  private addTextWithBoldMarkdown(line: string, fontSize: number = 10) {
    if (!line.includes('**')) {
      this.addText(line, fontSize, 'normal', 'left');
      return;
    }
    // If the line has bold markers, strip them and render the line bold
    this.addText(line.replace(/\*\*/g, ''), fontSize, 'bold', 'left');
  }

  /**
   * Process document content with professional legal formatting
   */
  private processContent(content: string) {
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = this.normalizeLegalLine(line);

      // Skip empty lines (but add minimal spacing)
      if (trimmedLine === '') {
        this.addSpacing(0.1); // Reduced spacing for cleaner look
        continue;
      }

      // Professional divider lines (hyphen-only lines from templates)
      if (/^-{5,}$/.test(trimmedLine)) {
        this.addTextDividerFromHyphens(trimmedLine);
        this.addSpacing(0.1);
        continue;
      }

      // Detect signature lines (lines with underscores like _________)
      if (/^_{5,}/.test(trimmedLine)) {
        this.addSignatureLine(trimmedLine);
        this.addSpacing(0.2);
        continue;
      }

      // Detect and format main headers (all caps lines under 100 chars)
      if (/^[A-Z\s\u00C0-\u017F]+$/.test(trimmedLine) && trimmedLine.length > 0 && trimmedLine.length < 100) {
        this.addSpacing(1.35);
        this.addText(trimmedLine, 14, 'bold', 'center');
        this.addSpacing(0.7);
        continue;
      }

      // Detect article headers (ARTICLE I, ARTÍCULO I, etc.)
      if (/^(ARTICLE|ARTÍCULO)\s+[IVX\d]+/i.test(trimmedLine)) {
        this.addSpacing(1.2);
        this.addText(trimmedLine, 12, 'bold', 'left');
        this.addSpacing(0.5);
        continue;
      }

      // Numbered legal sections
      if (this.isNumberedSection(trimmedLine)) {
        const { heading, body } = this.splitNumberedSection(trimmedLine);
        this.addText(heading, 11, 'bold', 'left');
        if (body) {
          this.addText(body, 10, 'normal', 'left');
        }
        this.addSpacing(0.15);
        continue;
      }

      // Bulleted/list lines
      if (this.isBulletLine(trimmedLine)) {
        this.addText(trimmedLine, 10, 'normal', 'left');
        this.addSpacing(0.1);
        continue;
      }

      // Lines with **bold** markdown — strip markers and render bold
      if (trimmedLine.includes('**')) {
        this.addTextWithBoldMarkdown(trimmedLine, 10);
        this.addSpacing(0.1);
        continue;
      }

      // Detect and bold important legal terms and phrases
      if (this.containsLegalTerms(trimmedLine)) {
        try {
          this.renderLegalEmphasisLine(trimmedLine);
        } catch (error) {
          console.error('Error al procesar renderLegalEmphasisLine para la línea:', trimmedLine, error);
          throw error;
        }
        this.addSpacing(0.15);
        continue;
      }

      // Detect clauses and definitions (lines starting with capital letters followed by colon)
      if (this.isClauseHeader(trimmedLine)) {
        const parts = trimmedLine.split(':');
        if (parts.length > 1) {
          const label = parts[0].trim() + ':';
          const content = parts.slice(1).join(':').trim();
          this.addText(label, 11, 'bold', 'left');
          if (content) {
            this.addText(content, 10, 'normal', 'left');
          }
        } else {
          this.addText(trimmedLine, 11, 'bold', 'left');
        }
        this.addSpacing(0.15);
        continue;
      }

      // Regular lines
      const formattedLine = this.formatLineCapitalization(trimmedLine);
      this.addText(formattedLine, 10, 'normal', 'left');
      this.addSpacing(0.1);
    }
  }

  /**
   * Format line capitalization for professional appearance
   */
  private formatLineCapitalization(line: string): string {
    // Don't modify lines that are already properly formatted
    if (line === line.toUpperCase() || line === line.toLowerCase()) {
      return line;
    }

    // Ensure proper sentence capitalization for regular text
    return line.replace(/([.!?]\s+)([a-z])/g, (match, punctuation, letter) => {
      return punctuation + letter.toUpperCase();
    });
  }

  /**
   * Add a signature line to the PDF
   */
  private addSignatureLine(line: string) {
    // Check if we need a new page
    if (this.currentY + this.lineHeight > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    // Draw the signature line
    const lineWidth = 100; // Width in mm
    const startX = this.margin;
    
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.3);
    this.doc.line(startX, this.currentY, startX + lineWidth, this.currentY);
    
    this.currentY += this.lineHeight;
  }

  /**
   * Add professional gray divider based on source line length.
   */
  private addTextDividerFromHyphens(line: string) {
    if (this.currentY + this.lineHeight > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    const safeLen = Math.max(12, Math.min(80, line.length));
    const ratio = safeLen / 80;
    const lineWidth = Math.max(35, this.maxWidth * ratio);

    this.doc.setDrawColor(160, 160, 160);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.currentY, this.margin + lineWidth, this.currentY);

    this.currentY += this.lineHeight;
  }

  /**
   * Add watermark to all pages
   */
  private addWatermark(text: string) {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      // Save current graphics state
      this.doc.saveGraphicsState();

      // Set watermark properties - true ghost watermark behind readable black text.
      this.doc.setTextColor(0, 0, 0);
      this.doc.setFont('helvetica', 'bold');

      // Use explicit graphics-state opacity when supported by jsPDF.
      const anyDoc = this.doc as any;
      if (typeof anyDoc.GState === 'function' && typeof anyDoc.setGState === 'function') {
        anyDoc.setGState(new anyDoc.GState({ opacity: 0.12 }));
      }

      // Add watermarks in a sparse grid pattern for readability
      const centerX = this.pageWidth / 2;
      const centerY = this.pageHeight / 2;

      // Single layer: Sparse grid pattern (3x5 grid = 15 watermarks)
      this.doc.setFontSize(45);
      const gridSpacingX = 90;
      const gridSpacingY = 80;

      for (let row = -2; row <= 2; row++) {
        for (let col = -1; col <= 1; col++) {
          this.safeText(
            text === 'PREVIEW ONLY' ? 'PREVIEW' : 'VISTA PREVIA',
            centerX + (col * gridSpacingX),
            centerY + (row * gridSpacingY),
            {
              angle: -45,
              align: 'center',
              baseline: 'middle',
            }
          );
        }
      }

      // Restore graphics state (returns to fully opaque for contract text)
      this.doc.restoreGraphicsState();

      // Add footer watermark bar (subtle gray)
      this.doc.setFillColor(158, 158, 158);
      this.doc.rect(0, this.pageHeight - 10, this.pageWidth, 10, 'F');
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'bold');
      this.safeText(
        text === 'PREVIEW ONLY'
          ? '🔒 PREVIEW - Purchase to unlock full document without watermarks'
          : '🔒 VISTA PREVIA - Compra para desbloquear el documento completo sin marcas de agua',
        this.pageWidth / 2,
        this.pageHeight - 4,
        { align: 'center' }
      );
    }
  }

  /**
   * Add brand logo watermark (subtle, centered) so branding keeps a premium look
   * without duplicating logos in the header area.
   */
  private addLogoWatermark(branding?: PDFGeneratorOptions['branding']) {
    if (!branding?.enableLogoWatermark || !branding?.logoDataUrl) return;

    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.saveGraphicsState();

      try {
        const format = branding.logoDataUrl.includes('image/png') ? 'PNG' : 'JPEG';
        const watermarkSize = 82;
        const x = (this.pageWidth - watermarkSize) / 2;
        const y = (this.pageHeight - watermarkSize) / 2;

        // Apply very low opacity so watermark stays in the visual background.
        const anyDoc = this.doc as any;
        if (typeof anyDoc.GState === 'function' && typeof anyDoc.setGState === 'function') {
          anyDoc.setGState(new anyDoc.GState({ opacity: 0.15 }));
        }

        this.doc.addImage(branding.logoDataUrl, format, x, y, watermarkSize, watermarkSize, undefined, 'FAST', 0);
      } catch {
        // If logo watermark fails, continue generating PDF without interrupting output.
      }

      this.doc.restoreGraphicsState();
    }
  }

  private applyBrandingTopSpacing(branding?: PDFGeneratorOptions['branding']) {
    const hasLogo = Boolean(branding?.enableLogo && branding?.logoDataUrl);
    const hasHeaderText = Boolean((branding?.headerText || '').trim());
    const hasBusinessIdentity = Boolean(
      (branding?.companyLegalName || '').trim() ||
      (branding?.companyAddressLine1 || '').trim() ||
      (branding?.companyAddressLine2 || '').trim() ||
      (branding?.companyCity || '').trim() ||
      (branding?.companyState || '').trim() ||
      (branding?.companyZip || '').trim() ||
      (branding?.companyCountry || '').trim() ||
      (branding?.companyEIN || '').trim() ||
      (branding?.companyPhone || '').trim() ||
      (branding?.companyEmail || '').trim() ||
      (branding?.companyWebsite || '').trim()
    );

    if (!hasLogo && !hasHeaderText && !hasBusinessIdentity) {
      this.topReservedSpace = 0;
      return;
    }

    // Reserve enough room for organic header integration and print safety
    this.topReservedSpace = hasLogo ? 24 : 10;
    if (hasHeaderText) this.topReservedSpace = Math.max(this.topReservedSpace, 12);
    if (hasBusinessIdentity) this.topReservedSpace = Math.max(this.topReservedSpace, 36);
    this.currentY += this.topReservedSpace;
  }

  /**
   * Add header/footer + page numbering across all pages
   */
  private addDocumentChrome(branding?: PDFGeneratorOptions['branding'], language: 'en' | 'es' = 'en', documentHash?: string) {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      // Top header band
      const headerH = 10;
      this.doc.setFillColor(37, 99, 235);
      this.doc.rect(0, 0, this.pageWidth, 2.5, 'F');

      this.doc.setFillColor(255, 255, 255);
      this.doc.rect(0, 2.5, this.pageWidth, headerH - 2.5, 'F');

      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(6.5);
      this.doc.setTextColor(37, 99, 235);
      this.safeText('CODEC DOCUMENT', this.margin, 8);

      const centerTitle = (branding?.headerText || '').trim();
      if (centerTitle) {
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(6);
        this.doc.setTextColor(71, 85, 105);
        this.safeText(centerTitle.slice(0, 55), this.pageWidth / 2, 8, { align: 'center' });
      }

      if (language === 'en' && branding?.companyState) {
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(6);
        this.doc.setTextColor(100, 116, 139);
        this.safeText(`State of ${branding.companyState}`, this.pageWidth - this.margin, 8, { align: 'right' });
      }

      this.doc.setDrawColor(226, 232, 240);
      this.doc.setLineWidth(0.3);
      this.doc.line(this.margin, headerH, this.pageWidth - this.margin, headerH);

      // Bottom footer
      const footerY = this.pageHeight - 8;

      this.doc.setDrawColor(226, 232, 240);
      this.doc.setLineWidth(0.3);
      this.doc.line(this.margin, footerY - 2, this.pageWidth - this.margin, footerY - 2);

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(6);
      this.doc.setTextColor(100, 116, 139);
      this.safeText('Generated by Codec Document', this.margin, footerY + 2);

      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(6);
      this.doc.setTextColor(37, 99, 235);
      this.safeText('Legally Compliant E-SIGN & UETA', this.pageWidth / 2, footerY + 2, { align: 'center' });

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(6);
      this.doc.setTextColor(100, 116, 139);
      const pageLabel = `Page ${i} of ${pageCount}`;
      this.safeText(pageLabel, this.pageWidth - this.margin, footerY + 2, { align: 'right' });

      if (documentHash) {
        this.doc.setFontSize(5);
        this.doc.setTextColor(148, 163, 184);
        const hashSnip = `SHA-256: ${documentHash.slice(0, 12)}...${documentHash.slice(-6)}`;
        this.safeText(hashSnip, this.pageWidth - this.margin, footerY + 5.5, { align: 'right' });
      }
    }
  }

  /**
   * Add document header with title and metadata
   */
  private addDocumentHeader(title: string, state?: string, language: 'en' | 'es' = 'en') {
    this.addText(title, 18, 'bold', 'center');
    this.addSpacing(0.5);

    // State info if provided
    if (state) {
      const stateText = language === 'es' 
        ? `Estado: ${state}`
        : `State: ${state}`;
      this.addText(stateText, 11, 'normal', 'center');
      this.addSpacing(0.5);
    }

    this.addSpacing(0.9);

    // Separator line
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.25);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.addSpacing(1.1);
  }

  /**
   * Premium first-page header inspired by modern legal forms.
   * Integrates logo + title with elegant spacing and divider.
   */
  private addPremiumFirstPageHeader(title: string, branding?: PDFGeneratorOptions['branding']) {
    const hasLogo = Boolean(branding?.enableLogo && branding?.logoDataUrl);
    const topY = 12;
    const companyLines: string[] = [];
    let businessBottomY = topY;
    let logoBottomY = topY;

    if (branding) {
      const legalName = (branding.companyLegalName || '').trim();
      const line1 = (branding.companyAddressLine1 || '').trim();
      const line2 = (branding.companyAddressLine2 || '').trim();
      const city = (branding.companyCity || '').trim();
      const state = (branding.companyState || '').trim();
      const zip = (branding.companyZip || '').trim();
      const country = (branding.companyCountry || '').trim();
      const ein = (branding.companyEIN || '').trim();
      const phone = (branding.companyPhone || '').trim();
      const email = (branding.companyEmail || '').trim();
      const website = (branding.companyWebsite || '').trim();

      if (legalName) companyLines.push(legalName);
      if (line1) companyLines.push(line1);
      if (line2) companyLines.push(line2);

      const cityLine = [city, state, zip].filter(Boolean).join(', ').replace(', ,', ',');
      if (cityLine) companyLines.push(cityLine);
      if (country) companyLines.push(country);

      const contactParts = [phone, email, website].filter(Boolean);
      if (contactParts.length) companyLines.push(contactParts.join('  |  '));

      if (ein) companyLines.push(`EIN/Tax ID: ${ein}`);
    }

    if (hasLogo && branding?.logoDataUrl) {
      try {
        const format = branding.logoDataUrl.includes('image/png') ? 'PNG' : 'JPEG';
        const logoWidth = 12;
        const logoHeight = 12;
        const logoX = this.pageWidth - this.margin - logoWidth;
        const logoY = topY - 4;
        // Force fully opaque, vibrant logo in premium header.
        this.doc.setTextColor(0, 0, 0);
        this.doc.addImage(branding.logoDataUrl, format, logoX, logoY, logoWidth, logoHeight, undefined, 'FAST');
        logoBottomY = logoY + logoHeight;
      } catch {
        // Continue with title-only premium header
      }
    }

    // Remove duplicated top title in premium header.
    // Keep only the main document title rendered later in the content flow.

    if (companyLines.length) {
      this.doc.setTextColor(90, 90, 90);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8.5);
      let businessY = topY + 12;
      for (const ln of companyLines) {
        this.safeText(ln, this.margin, businessY);
        businessY += 4;
      }
      businessBottomY = businessY;
    }

    // Subtle divider line
    this.doc.setDrawColor(170, 170, 170);
    this.doc.setLineWidth(0.22);
    // Keep divider safely below all header elements (company text/logo)
    // so it never overlays body/header text regardless of line count.
    const baselineDividerY = topY + 16;
    const dividerY = Math.max(
      baselineDividerY,
      companyLines.length ? businessBottomY + 4 : baselineDividerY,
      hasLogo ? logoBottomY + 4 : baselineDividerY
    );
    this.doc.line(this.margin, dividerY, this.pageWidth - this.margin, dividerY);

    this.currentY = Math.max(this.currentY, dividerY + 10);
    // Ensure content starts below the 10mm top header band
    this.currentY = Math.max(this.currentY, 16);
  }

  private addLetterhead(letterhead?: { companyName?: string; logoDataUrl?: string }, language: 'en' | 'es' = 'en') {
    if (!letterhead?.companyName && !letterhead?.logoDataUrl) return;

    const startY = this.currentY;

    if (letterhead.logoDataUrl) {
      try {
        const format = letterhead.logoDataUrl.includes('image/png') ? 'PNG' : 'JPEG';
        this.doc.addImage(letterhead.logoDataUrl, format, this.margin, startY, 24, 24, undefined, 'FAST');
      } catch {
        // If image fails, continue without breaking PDF generation.
      }
    }

    if (letterhead.companyName) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(12);
      this.safeText(letterhead.companyName || '', this.margin + 28, startY + 8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(9);
    }

    this.currentY += 28;
    this.doc.setDrawColor(180, 180, 180);
    this.doc.setLineWidth(0.2);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.addSpacing(0.8);
  }

  private addImageContain(dataUrl: string, x: number, y: number, width: number, height: number): void {
    const props = this.doc.getImageProperties(dataUrl);
    const imgW = Math.max(1, props.width);
    const imgH = Math.max(1, props.height);
    const scale = Math.min(width / imgW, height / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const drawX = x + (width - drawW) / 2;
    const drawY = y + (height - drawH) / 2;
    const fmt = dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';

    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(x, y, width, height, 'F');
    this.doc.addImage(dataUrl, fmt, drawX, drawY, drawW, drawH, undefined, 'FAST');
  }

  private addIdentityAuditPage(
    selfieDataUrl?: string,
    idDocFrontDataUrl?: string,
    idDocBackDataUrl?: string,
    _language: 'en' | 'es' = 'en',
  ) {
    if (!selfieDataUrl && !idDocFrontDataUrl && !idDocBackDataUrl) return;

    this.doc.addPage();
    const PW = this.pageWidth;
    const M  = this.margin;

    // Title band
    this.doc.setFillColor(37, 99, 235);
    this.doc.rect(0, 0, PW, 16, 'F');
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(0, 16, PW, 2, 'F');

    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(13);
    this.doc.setTextColor(255, 255, 255);
    this.safeText('IDENTITY VERIFICATION REPORT', PW / 2, 10, { align: 'center' });

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7);
    this.doc.setTextColor(191, 219, 254);
    this.safeText('Codec Document — E-SIGN Act & UETA Compliant Digital Identity Record', PW / 2, 14.5, { align: 'center' });

    this.currentY = 24;

    // Disclaimer
    const disclaimer = 'The following biometric images and metadata were captured by the signer at the exact moment of executing this electronic signature. This record constitutes legally admissible evidence of signer identity under the federal E-SIGN Act (15 U.S.C. § 7001) and UETA.';
    this.ensureFontMetadata('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(71, 85, 105);
    const discLines = this.splitTextToSize(disclaimer, PW - M * 2);
    discLines.forEach((line: string) => {
      this.safeText(line, M, this.currentY);
      this.currentY += 4;
    });
    this.currentY += 5;

    // Photo section: selfie on the left, ID front/back stacked on the right.
    const leftW = (PW - M * 2 - 10) * 0.52;
    const rightW = (PW - M * 2 - 10) - leftW;
    const leftX = M;
    const rightX = leftX + leftW + 10;
    const photoSectionY = this.currentY;
    const topCardH = 62;
    const bottomCardY = photoSectionY + topCardH + 8;

    const drawPhotoCard = (title: string, dataUrl: string | undefined, x: number, y: number, w: number, h: number, note: string) => {
      this.doc.setFillColor(248, 250, 252);
      this.doc.setDrawColor(226, 232, 240);
      this.doc.setLineWidth(0.3);
      this.doc.roundedRect(x, y, w, h, 2, 2, 'FD');

      this.doc.setFillColor(37, 99, 235);
      this.doc.roundedRect(x, y, w, 3, 2, 2, 'F');
      this.doc.rect(x, y + 1, w, 2, 'F');

      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(7);
      this.doc.setTextColor(37, 99, 235);
      this.safeText(title, x + w / 2, y + 8, { align: 'center' });

      const imgY = y + 11;
      const imgH = h - 20;
      if (dataUrl) {
        try {
          this.addImageContain(dataUrl, x + 1, imgY, w - 2, imgH);
        } catch {
          this.doc.setFontSize(7);
          this.doc.setTextColor(148, 163, 184);
          this.safeText('[Image unavailable]', x + w / 2, imgY + imgH / 2, { align: 'center' });
        }
      } else {
        this.doc.setFontSize(7);
        this.doc.setTextColor(148, 163, 184);
        this.safeText('[Not provided]', x + w / 2, imgY + imgH / 2, { align: 'center' });
      }

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(6.3);
      this.doc.setTextColor(100, 116, 139);
      this.safeText(note, x + w / 2, y + h - 3, { align: 'center' });
    };

    drawPhotoCard('VALIDATION SELFIE', selfieDataUrl, leftX, photoSectionY, leftW, topCardH * 2 + 8, "Signer's face via front camera");
    drawPhotoCard('ID FRONT', idDocFrontDataUrl, rightX, photoSectionY, rightW, topCardH, 'Government ID - front side');
    drawPhotoCard('ID BACK', idDocBackDataUrl, rightX, bottomCardY, rightW, topCardH, 'Government ID - back side');

    this.currentY = photoSectionY + topCardH * 2 + 18;

    // Audit data table
    const now = new Date();
    const tableRows: Array<[string, string]> = [
      ['Document ID',          `CDX-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-6)}`],
      ['Verification Date',    now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
      ['Verification Time',    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' })],
      ['Verification Method',  'Biometric + Government ID + Digital Signature'],
      ['Compliance Framework', 'E-SIGN Act (15 U.S.C. § 7001) · UETA · ISO/IEC 27001'],
      ['Signature Algorithm',  'SHA-256 Cryptographic Hash'],
      ['Legal Status',         'VALID — Legally Binding Electronic Signature'],
    ];

    this.currentY += 4;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(15, 23, 42);
    this.safeText('VERIFICATION AUDIT TRAIL', M, this.currentY);
    this.currentY += 3;

    this.doc.setDrawColor(37, 99, 235);
    this.doc.setLineWidth(1);
    this.doc.line(M, this.currentY, M + 30, this.currentY);
    this.doc.setLineWidth(0.2);
    this.doc.setDrawColor(226, 232, 240);
    this.doc.line(M + 30, this.currentY, PW - M, this.currentY);
    this.currentY += 5;

    const labelW = 55;
    const valueX = M + labelW + 3;
    const valueW = PW - M - labelW - 3 - M;

    tableRows.forEach(([label, value], idx) => {
      if (idx % 2 === 0) {
        this.doc.setFillColor(248, 250, 252);
        this.doc.rect(M, this.currentY - 3, PW - M * 2, 7.5, 'F');
      }
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(71, 85, 105);
      this.safeText(label, M + 2, this.currentY + 2);

      this.ensureFontMetadata('helvetica', 'normal');
      this.doc.setTextColor(15, 23, 42);
      const valLines = this.splitTextToSize(value, valueW);
      this.safeText(valLines[0], valueX, this.currentY + 2);
      this.currentY += 7.5;
    });

    // Legal footer
    this.currentY += 5;
    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(0.3);
    this.doc.line(M, this.currentY, PW - M, this.currentY);
    this.currentY += 5;

    this.ensureFontMetadata('helvetica', 'normal');
    this.doc.setFontSize(7);
    this.doc.setTextColor(100, 116, 139);
    const legalNote = 'This Identity Verification Report is an integral part of the executed agreement. The biometric images and metadata herein were collected with the explicit consent of the signatory under applicable privacy laws. This record may be used as evidence of signer identity and intent in any legal proceeding.';
    const legalLines = this.splitTextToSize(legalNote, PW - M * 2);
    legalLines.forEach((line: string) => {
      this.safeText(line, M, this.currentY);
      this.currentY += 4;
    });

    this.doc.setTextColor(0, 0, 0);
  }

  private addAuditLogPage(audit?: PDFGeneratorOptions['auditLog'], language: 'en' | 'es' = 'en') {
    if (!audit) return;

    const parsedAgent = PDFGenerator.parseAgent(audit.guestUserAgent);
    const browser = audit.browser || parsedAgent.browser;
    const operatingSystem = audit.operatingSystem || parsedAgent.os;
    const signerName = PDFGenerator.normalizeSignerDisplayName(audit.signerName, language);
    const guestSignedAt = audit.guestSignedAt
      ? PDFGenerator.formatAuditDateTime(new Date(audit.guestSignedAt), language)
      : '-';
    const buyerSignedAt = audit.buyerSignedAt
      ? PDFGenerator.formatAuditDateTime(new Date(audit.buyerSignedAt), language)
      : '-';

    this.doc.addPage();
    this.currentY = this.margin;
    this.addText(language === 'es' ? 'CERTIFICADO DE AUDITORÍA' : 'AUDIT CERTIFICATE', 16, 'bold', 'center');
    this.addSpacing(0.8);
    this.doc.setDrawColor(37, 99, 235);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.margin + 40, this.currentY);
    this.doc.setLineWidth(0.2);
    this.doc.setDrawColor(226, 232, 240);
    this.doc.line(this.margin + 40, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.addSpacing(0.5);

    const rows = [
      `${language === 'es' ? 'ID del Documento' : 'Document ID'}: ${audit.documentId || '-'}`,
      `${language === 'es' ? 'Nombre del Comprador' : 'Buyer Name'}: ${audit.buyerName || '-'}`,
      `${language === 'es' ? 'Nombre del Firmante' : 'Signer Name'}: ${signerName || '-'}`,
      `${language === 'es' ? 'IP del Comprador' : 'Buyer IP'}: ${audit.buyerIp || '-'}`,
      `${language === 'es' ? 'IP del Firmante Invitado' : 'Guest Signer IP'}: ${audit.guestIp || '-'}`,
      `${language === 'es' ? 'Fecha y Hora del Comprador' : 'Buyer Timestamp'}: ${buyerSignedAt}`,
      `${language === 'es' ? 'Fecha y Hora del Firmante Invitado' : 'Guest Timestamp'}: ${guestSignedAt}`,
      `${language === 'es' ? 'Navegador' : 'Browser'}: ${browser || '-'}`,
      `${language === 'es' ? 'Sistema Operativo' : 'Operating System'}: ${operatingSystem || '-'}`,
      `${language === 'es' ? 'País' : 'Country'}: ${audit.country || '-'}`,
      `${language === 'es' ? 'Estado' : 'State'}: ${audit.state || '-'}`,
      `${language === 'es' ? 'Ciudad' : 'City'}: ${audit.city || '-'}`,
      `${language === 'es' ? 'Dispositivo del Firmante Invitado' : 'Guest User Agent'}: ${audit.guestUserAgent || '-'}`,
      `${language === 'es' ? 'Método de Firma' : 'Signature Method'}: ${audit.signatureMethod || (language === 'es' ? 'Dispositivo Móvil' : 'Mobile Device')}`,
      `Status: ${audit.legalStatus || 'Documento Validado bajo E-SIGN Act'}`,
    ];

    rows.forEach((r) => {
      this.addText(r, 9, 'normal', 'left');
      this.addSpacing(0.1);
    });

    // Compact legal security footer requested for signed documents
    const securityLine = language === 'es'
      ? `Firmado electrónicamente por ${audit.buyerEmail || signerName || '-'} el ${guestSignedAt} desde la IP ${audit.guestIp || '-'}`
      : `Electronically signed by ${audit.buyerEmail || signerName || '-'} on ${guestSignedAt} from IP ${audit.guestIp || '-'}`;

    this.addSpacing(0.8);
    this.doc.setTextColor(130, 130, 130);
    this.ensureFontMetadata('helvetica', 'normal');
    this.doc.setFontSize(8);
    const footerLines = this.splitTextToSize(securityLine, this.maxWidth);
    footerLines.forEach((line: string) => {
      if (this.currentY + 4 > this.pageHeight - this.margin) {
        this.doc.addPage();
        this.currentY = this.margin;
      }
      this.safeText(line, this.margin, this.currentY);
      this.currentY += 4;
    });
  }

  private addEmbeddedSignature(signatureDataUrl?: string, signerName?: string, guestSignedAt?: string, language: 'en' | 'es' = 'en') {
    if (!signatureDataUrl) return;

    if (this.currentY + 40 > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    this.addSpacing(0.5);
    this.addText(language === 'es' ? 'BLOQUE DE FIRMA' : 'SIGNATURE BLOCK', 12, 'bold', 'left');
    this.addSpacing(0.2);

    try {
      const format = signatureDataUrl.includes('image/png') ? 'PNG' : 'JPEG';
      // ~170px visual width equivalent, proportional and elegant for legal signature blocks
      this.doc.addImage(signatureDataUrl, format, this.margin, this.currentY, 60, 20, undefined, 'FAST');
    } catch {
      this.addText(language === 'es' ? 'No se pudo renderizar la imagen de la firma.' : 'Signature image could not be rendered.', 10, 'normal', 'left');
    }

    this.currentY += 24;
    const normalizedSigner = PDFGenerator.normalizeSignerDisplayName(signerName, language);
    const normalizedSignedAt = guestSignedAt
      ? PDFGenerator.formatAuditDateTime(new Date(guestSignedAt), language)
      : '-';
    this.addText(`${language === 'es' ? 'Firmante' : 'Signer'}: ${normalizedSigner || '-'}`, 10, 'normal', 'left');
    this.addText(`${language === 'es' ? 'Firmado en' : 'Signed at'}: ${normalizedSignedAt}`, 10, 'normal', 'left');
    this.addSpacing(0.3);
  }

  private addEmbeddedSignatures(signatures?: Array<{ signerName?: string; guestSignedAt?: string; signatureDataUrl?: string; signaturePage?: number; signatureX?: number; signatureY?: number; xDocPct?: number; yDocPct?: number }>, language: 'en' | 'es' = 'en') {
    if (!signatures || signatures.length === 0) return;

    // First pass: place signatures with doc-relative coordinates
    const appendQueue: typeof signatures = [];
    const totalPages = this.doc.getNumberOfPages();
    const effectiveH = this.pageHeight - this.margin * 2;

    signatures.forEach((sig) => {
      if (sig.yDocPct !== undefined && sig.signatureDataUrl) {
        // Convert doc-percentage to page + normalized coords
        const totalDocH = totalPages * effectiveH;
        const sigYMm = (sig.yDocPct / 100) * totalDocH;
        const page = Math.min(totalPages, Math.max(1, Math.floor(sigYMm / effectiveH) + 1));
        const localYNorm = ((sigYMm % effectiveH) / effectiveH);
        const xNorm = Math.max(0, Math.min(1, (sig.xDocPct ?? 50) / 100));
        const stamped = this.addSignatureAtCoordinates(sig.signatureDataUrl, page, xNorm, localYNorm);
        if (!stamped) appendQueue.push(sig);
        return;
      }
      // Legacy: absolute page coords
      const stamped = this.addSignatureAtCoordinates(sig.signatureDataUrl, sig.signaturePage, sig.signatureX, sig.signatureY);
      if (!stamped) appendQueue.push(sig);
    });

    // Second pass: append any signatures that couldn't be placed at coordinates
    appendQueue.forEach((sig, idx) => {
      this.addText(`${language === 'es' ? 'Firma' : 'Signature'} ${idx + 1}`, 10, 'bold', 'left');
      this.addEmbeddedSignature(sig.signatureDataUrl, sig.signerName, sig.guestSignedAt, language);
    });
  }

  private addSignatureAtCoordinates(signatureDataUrl?: string, page?: number, x?: number, y?: number) {
    if (!signatureDataUrl || !page || !Number.isFinite(page)) return false;
    const pageCount = this.doc.getNumberOfPages();
    if (page < 1 || page > pageCount) return false;
    const nx = Math.max(0, Math.min(1, Number(x ?? 0)));
    const ny = Math.max(0, Math.min(1, Number(y ?? 0)));

    const boxWidth = 60;
    const boxHeight = 20;
    const drawableWidth = this.pageWidth - this.margin * 2;
    const drawableHeight = this.pageHeight - this.margin * 2;
    const targetX = this.margin + nx * drawableWidth - boxWidth / 2;
    const targetY = this.margin + ny * drawableHeight - boxHeight / 2;

    this.doc.setPage(page);
    try {
      const format = signatureDataUrl.includes('image/png') ? 'PNG' : 'JPEG';
      this.doc.addImage(signatureDataUrl, format, targetX, targetY, boxWidth, boxHeight, undefined, 'FAST');
      return true;
    } catch {
      return false;
    }
  }

  // ── Informe de Firmas (signature report page) ─────────────────────────────

  private addSignatureReportPage(
    signatures: NonNullable<PDFGeneratorOptions['signatures']>,
    language: 'en' | 'es',
    docTitle: string,
  ) {
    if (!signatures.length) return;

    this.doc.addPage();

    const PW  = this.pageWidth;
    const PH  = this.pageHeight;
    const M   = this.margin;

    // ── Dark header band ───────────────────────────────────────────────────
    const HEADER_H = 26;
    this.doc.setFillColor(18, 20, 33);
    this.doc.rect(0, 0, PW, HEADER_H, 'F');
    this.doc.setFillColor(90, 105, 233);
    this.doc.rect(0, HEADER_H - 2, PW, 2, 'F');

    const reportTitle = language === 'es' ? 'INFORME DE FIRMAS' : 'SIGNATURE REPORT';
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(13);
    this.doc.setTextColor(255, 255, 255);
    this.safeText(reportTitle, PW / 2, 11, { align: 'center' });

    const subtitle = language === 'es'
      ? `Documento: ${docTitle.slice(0, 60)}`
      : `Document: ${docTitle.slice(0, 60)}`;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7);
    this.doc.setTextColor(200, 210, 240);
    this.safeText(subtitle, PW / 2, 18, { align: 'center' });

    // ── Two-column grid constants ─────────────────────────────────────────
    const COL_GAP   = 10;
    const COL_W     = (PW - 2 * M - COL_GAP) / 2;
    const BLOCK_H   = 78;
    const IMG_H     = 44;
    const CARD_PAD  = 5;
    const START_Y   = HEADER_H + 8;
    const LEGAL_H   = 52;
    const PAGE_STOP = PH - M - LEGAL_H - 12;

    const now = new Date();
    const locale = PDFGenerator.getAuditLocale(language);
    const tzLabel = Intl.DateTimeFormat(locale, { timeZoneName: 'short' })
      .formatToParts(now).find(p => p.type === 'timeZoneName')?.value ?? 'UTC';
    const dateStr = `${PDFGenerator.formatAuditDateTime(now, language)} ${tzLabel}`;

    let pageY = START_Y;

    signatures.forEach((sig, i) => {
      const col  = i % 2;
      const row  = Math.floor(i / 2);
      const x    = M + col * (COL_W + COL_GAP);
      let   y    = pageY + row * (BLOCK_H + 6);

      if (y + BLOCK_H > PAGE_STOP) {
        this.doc.addPage();
        this.doc.setFillColor(18, 20, 33);
        this.doc.rect(0, 0, PW, HEADER_H, 'F');
        this.doc.setFillColor(90, 105, 233);
        this.doc.rect(0, HEADER_H - 2, PW, 2, 'F');
        pageY = HEADER_H + 8;
        y = pageY;
      }

      // Card
      this.doc.setFillColor(255, 255, 255);
      this.doc.setDrawColor(215, 220, 235);
      this.doc.setLineWidth(0.4);
      this.doc.roundedRect(x, y, COL_W, BLOCK_H, 2, 2, 'FD');

      // Blue dotted top accent
      this.doc.setDrawColor(90, 105, 233);
      this.doc.setLineWidth(1.2);
      this.doc.setLineDashPattern([2, 2], 0);
      this.doc.line(x + 2, y + 1, x + COL_W - 2, y + 1);
      this.doc.setLineDashPattern([], 0);
      this.doc.setLineWidth(0.4);

      // ── Signature image ─────────────────────────────────────────────────
      const imgX = x + CARD_PAD;
      const imgY = y + CARD_PAD;
      const imgAreaW = COL_W - 2 * CARD_PAD;

      if (sig.signatureDataUrl) {
        try {
          this.addImageContain(sig.signatureDataUrl, imgX, imgY, imgAreaW, IMG_H);
        } catch { /* skip broken image */ }
      }

      // Separator line
      const sepY = y + CARD_PAD + IMG_H + 2;
      this.doc.setDrawColor(215, 220, 235);
      this.doc.line(x + CARD_PAD, sepY, x + COL_W - CARD_PAD, sepY);

      // "Signing line" — clean horizontal line above the signer name
      const sigLineY = sepY + 6;
      this.doc.setDrawColor(150, 160, 185);
      this.doc.setLineWidth(0.7);
      this.doc.line(x + CARD_PAD, sigLineY, x + COL_W - CARD_PAD, sigLineY);
      this.doc.setLineWidth(0.4);

      let textY = sigLineY + 5;

      // Name (bold, centered)
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(8);
      this.doc.setTextColor(20, 24, 50);
      const name = PDFGenerator.normalizeSignerDisplayName(sig.signerName || 'Signer', language).toUpperCase().slice(0, 34);
      this.safeText(name, x + COL_W / 2, textY, { align: 'center' });
      textY += 5;

      // Role (blue-indigo, centered)
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(7);
      this.doc.setTextColor(90, 105, 233);
      const role = PDFGenerator.normalizeSignerRole(sig.signerRole || (language === 'es' ? 'Firmante' : 'Signatory'), language).toUpperCase().slice(0, 36);
      this.safeText(role, x + COL_W / 2, textY, { align: 'center' });
      textY += 4.5;

      // Token (centered)
      this.doc.setTextColor(130, 140, 165);
      this.doc.setFontSize(6.5);
      const token = sig.token || `CDX-${String(Date.now()).slice(-8, -4)}-${String(Date.now()).slice(-4)}-${String(i + 1).padStart(2, '0')}`;
      this.safeText(token, x + COL_W / 2, textY, { align: 'center' });
      textY += 4;

      // Datetime (centered)
      this.doc.setFontSize(6);
      const sigDate = sig.guestSignedAt
        ? `${PDFGenerator.formatAuditDateTime(new Date(sig.guestSignedAt), language)} ${tzLabel}`
        : dateStr;
      this.safeText(sigDate, x + COL_W / 2, textY, { align: 'center' });
    });

    // ── Legal Compliance Section (bottom of page) ─────────────────────────
    const LEGAL_Y = PH - M - LEGAL_H;
    const LEGAL_X = M;
    const LEGAL_W = PW - 2 * M;

    // Separator above legal box
    this.doc.setDrawColor(200, 205, 220);
    this.doc.setLineWidth(0.3);
    this.doc.line(LEGAL_X, LEGAL_Y - 4, LEGAL_X + LEGAL_W, LEGAL_Y - 4);

    // Legal box
    this.doc.setFillColor(248, 249, 254);
    this.doc.setDrawColor(200, 207, 230);
    this.doc.setLineWidth(0.35);
    this.doc.roundedRect(LEGAL_X, LEGAL_Y, LEGAL_W, LEGAL_H, 2, 2, 'FD');

    // Blue left accent
    this.doc.setFillColor(90, 105, 233);
    this.doc.rect(LEGAL_X, LEGAL_Y, 2.5, LEGAL_H, 'F');

    // E-SIGN badge (top-right corner)
    const badgeLabel = 'E-SIGN & UETA';
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(5.5);
    const badgeLW = this.safeGetTextWidth(badgeLabel) + 8;
    const badgeH  = 9;
    const badgeX  = LEGAL_X + LEGAL_W - badgeLW - 4;
    const badgeY  = LEGAL_Y + 4;
    this.doc.setFillColor(90, 105, 233);
    this.doc.roundedRect(badgeX, badgeY, badgeLW, badgeH, 1, 1, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.safeText(badgeLabel, badgeX + badgeLW / 2, badgeY + 6, { align: 'center' });

    const securedLabel = 'Secured by Codec Studio';
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(5);
    this.doc.setTextColor(130, 140, 165);
    this.safeText(securedLabel, badgeX + badgeLW / 2, badgeY + badgeH + 4, { align: 'center' });

    // Compliance title
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7);
    this.doc.setTextColor(18, 24, 70);
    this.safeText('U.S. ELECTRONIC SIGNATURE LEGAL COMPLIANCE', LEGAL_X + 8, LEGAL_Y + 9);

    // Legal body (wrapped)
    const legalBody = language === 'es'
      ? 'Este documento fue firmado y certificado electronicamente segun la Ley Federal E-SIGN (15 U.S.C. Ch. 96) y la UETA. Las firmas criptograficas, marcas de tiempo y registros de auditoria de red garantizan la autenticidad e irrefutabilidad de las partes firmantes.'
      : 'This document is electronically signed and certified under the Federal E-SIGN Act (15 U.S.C. Ch. 96) and the UETA. The cryptographic signatures, timestamps, and network audit logs herein guarantee the authenticity, intent, and non-repudiation of the signing parties.';
    this.ensureFontMetadata('helvetica', 'normal');
    this.doc.setFontSize(5.5);
    this.doc.setTextColor(60, 70, 110);
    const legalLines = this.splitTextToSize(legalBody, LEGAL_W - badgeLW - 20);
    this.safeText(legalLines, LEGAL_X + 8, LEGAL_Y + 16);

    // Attribution
    this.doc.setFontSize(5);
    this.doc.setTextColor(140, 150, 175);
    this.safeText(
      'Codec Document Security Services - Cryptographic Audit Trail Verification String. Electronically signed document with full legal binding.',
      LEGAL_X + 8,
      LEGAL_Y + LEGAL_H - 5,
    );
  }

  // ── Mirror signature block (side-by-side, matches web preview layout) ────────

  private addSignatureMirrorBlock(
    leftSig?: { dataUrl: string; name: string },
    rightSig?: { dataUrl: string; name: string },
    language: 'en' | 'es' = 'en',
    identitySelfie?: string,
    identityIdDocFront?: string,
    identityIdDocBack?: string,
  ) {
    if (!leftSig && !rightSig) return;

    // Helper: set font but verify it's available; fallback to helvetica normal
    const setFontSafe = (family: string, style: string) => {
      try {
        this.doc.setFont(family, style);
      } catch (e) {
        console.log('setFont error', family, style, e);
        this.doc.setFont('helvetica', 'normal');
        return;
      }
      try {
        console.log('FONT ACTUAL', this.doc.getFont());
        console.log('FONT LIST', this.doc.getFontList());
      } catch (e) {
        console.log('font introspect error', e);
      }
      try {
        const fl = this.doc.getFontList ? this.doc.getFontList() : null;
        if (fl && family && !Object.prototype.hasOwnProperty.call(fl, family)) {
          console.log('Font not found in list:', family, '; falling back to helvetica normal');
          this.doc.setFont('helvetica', 'normal');
        }
      } catch (e) {
        // ignore
      }
    };

    // Helper: call text() but retry with built-in helvetica if jsPDF throws
    const safeText = (text: string | string[], x: number, y: number, opts?: any) => {
      try {
        this.doc.text(text as any, x, y, opts);
      } catch (err) {
        console.error('jsPDF.text failed with current font, retrying with helvetica', err, text);
        try {
          this.doc.setFont('helvetica', 'normal');
        } catch (e) {
          // ignore
        }
        try {
          this.doc.text(text as any, x, y, opts);
        } catch (err2) {
          console.error('jsPDF.text retry also failed', err2, text);
        }
      }
    };

    // Helper: getTextWidth but fallback to helvetica or estimate when jsPDF font metrics are missing
    const safeGetTextWidth = (txt: string) => {
      try {
        return this.doc.getTextWidth(txt);
      } catch (err) {
        console.warn('getTextWidth failed with current font, retrying with helvetica', err, txt);
        try {
          this.doc.setFont('helvetica', 'normal');
          return this.doc.getTextWidth(txt);
        } catch (err2) {
          console.error('getTextWidth retry also failed, estimating width', err2, txt);
          const size = (this.doc.getFontSize && typeof this.doc.getFontSize === 'function') ? this.doc.getFontSize() : 7;
          return txt.length * (size * 0.5);
        }
      }
    };

    const identityIdDoc = identityIdDocFront || identityIdDocBack;
    const hasIdentity = !!(identitySelfie || identityIdDoc);
    // Space needed: sigs (~44) + optional compact identity strip (~32)
    const needed = hasIdentity ? 78 : 58;
    if (this.currentY + needed > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin + 6;
    } else {
      this.currentY += 8;
    }

    const colW   = (this.maxWidth - 12) / 2;
    const leftX  = this.margin;
    const rightX = this.margin + colW + 12;
    const imgH   = 22;

    // ── Signature images ──────────────────────────────────────────────────
    if (leftSig?.dataUrl) {
      try {
        this.addImageContain(leftSig.dataUrl, leftX, this.currentY, colW, imgH);
      } catch { /* skip broken image */ }
    }
    if (rightSig?.dataUrl) {
      try {
        this.addImageContain(rightSig.dataUrl, rightX, this.currentY, colW, imgH);
      } catch { /* skip broken image */ }
    }

    const lineY = this.currentY + imgH + 1;

    // ── Signature lines ───────────────────────────────────────────────────
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.5);
    this.doc.line(leftX,  lineY, leftX  + colW, lineY);
    this.doc.line(rightX, lineY, rightX + colW, lineY);

    // ── Role labels ───────────────────────────────────────────────────────
    const leftRole  = language === 'es' ? 'ARRENDADOR' : 'LANDLORD';
    const rightRole = language === 'es' ? 'ARRENDATARIO' : 'TENANT';

    setFontSafe('helvetica', 'bold');
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(0, 0, 0);
    console.log('FONT ACTUAL', this.doc.getFont());
    console.log('FONT LIST', this.doc.getFontList());
    console.log('TEXT TO WRITE', leftRole);
    safeText(leftRole, leftX + colW / 2, lineY + 4, { align: 'center' });
    console.log('FONT ACTUAL', this.doc.getFont());
    console.log('FONT LIST', this.doc.getFontList());
    console.log('TEXT TO WRITE', rightRole);
    safeText(rightRole, rightX + colW / 2, lineY + 4, { align: 'center' });

    // ── Signer names ──────────────────────────────────────────────────────
    setFontSafe('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(60, 60, 60);
    if (leftSig?.name)  {
      console.log('FONT ACTUAL', this.doc.getFont());
      console.log('FONT LIST', this.doc.getFontList());
      console.log('TEXT TO WRITE', leftSig.name);
      safeText(leftSig.name, leftX + colW / 2, lineY + 9, { align: 'center' });
    }
    if (rightSig?.name) {
      console.log('FONT ACTUAL', this.doc.getFont());
      console.log('FONT LIST', this.doc.getFontList());
      console.log('TEXT TO WRITE', rightSig.name);
      safeText(rightSig.name, rightX + colW / 2, lineY + 9, { align: 'center' });
    }

    this.currentY = lineY + 14;

    // ── Identity Verification Strip (inline, no new page) ─────────────────
    if (!hasIdentity) return;

    // Thin separator
    this.doc.setDrawColor(200, 210, 230);
    this.doc.setLineWidth(0.25);
    this.doc.line(leftX, this.currentY, leftX + this.maxWidth, this.currentY);
    this.currentY += 3.5;

    // Section label with blue left accent
    this.doc.setFillColor(37, 99, 235);
    this.doc.rect(leftX, this.currentY - 1, 2, 6, 'F');
    setFontSafe('helvetica', 'bold');
    this.doc.setFontSize(6.5);
    this.doc.setTextColor(18, 24, 70);
    const idLabel = language === 'es' ? 'VERIFICACIÓN DE IDENTIDAD' : 'IDENTITY VERIFICATION';
    console.log('FONT ACTUAL', this.doc.getFont());
    console.log('FONT LIST', this.doc.getFontList());
    console.log('TEXT TO WRITE', idLabel);
    safeText(idLabel, leftX + 4.5, this.currentY + 4);
    // E-SIGN badge
    const badgeText = 'E-SIGN · UETA';
    const badgeW = safeGetTextWidth(badgeText) + 5;
    this.doc.setFillColor(37, 99, 235);
    this.doc.roundedRect(leftX + this.maxWidth - badgeW, this.currentY, badgeW, 5.5, 0.8, 0.8, 'F');
    setFontSafe('helvetica', 'bold');
    this.doc.setFontSize(5);
    this.doc.setTextColor(255, 255, 255);
    console.log('FONT ACTUAL', this.doc.getFont());
    console.log('FONT LIST', this.doc.getFontList());
    console.log('TEXT TO WRITE', badgeText);
    safeText(badgeText, leftX + this.maxWidth - badgeW / 2, this.currentY + 3.8, { align: 'center' });
    this.currentY += 8;

    // Compact fixed dimensions — legible but small enough to share the signature page
    const photoColW = identitySelfie && identityIdDoc ? 34 : 48;
    const selfieH   = photoColW;                       // square crop
    const idDocH    = Math.round(photoColW * 0.67);   // landscape proportions
    const photoH    = Math.max(selfieH, idDocH);

    if (identitySelfie) {
      const px = leftX;
      const py = this.currentY;
      const pw = photoColW;
      const ph = selfieH;
      // Light gray background placeholder
      this.doc.setFillColor(245, 247, 251);
      this.doc.setDrawColor(210, 218, 235);
      this.doc.setLineWidth(0.3);
      this.doc.roundedRect(px, py, pw, ph, 1.5, 1.5, 'FD');
      try {
        const fmt = identitySelfie.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        this.doc.addImage(identitySelfie, fmt, px + 0.5, py + 0.5, pw - 1, ph - 1, undefined, 'FAST');
      } catch { /* skip */ }
      setFontSafe('helvetica', 'normal');
      this.doc.setFontSize(5.5);
      this.doc.setTextColor(100, 110, 140);
      const selfieLabel = language === 'es' ? 'Selfie de validación' : 'Validation selfie';
      console.log('FONT ACTUAL', this.doc.getFont());
      console.log('FONT LIST', this.doc.getFontList());
      console.log('TEXT TO WRITE', selfieLabel);
      safeText(selfieLabel, px + pw / 2, py + ph + 4, { align: 'center' });
    }

    if (identityIdDoc) {
      const px = identitySelfie ? leftX + photoColW + 8 : leftX;
      const py = this.currentY;
      const pw = photoColW;
      const ph = idDocH;
      // Center vertically if selfie is taller
      const adjustY = identitySelfie ? (selfieH - idDocH) / 2 : 0;
      this.doc.setFillColor(245, 247, 251);
      this.doc.setDrawColor(210, 218, 235);
      this.doc.setLineWidth(0.3);
      this.doc.roundedRect(px, py + adjustY, pw, ph, 1.5, 1.5, 'FD');
      try {
        const fmt = identityIdDoc.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        this.doc.addImage(identityIdDoc, fmt, px + 0.5, py + adjustY + 0.5, pw - 1, ph - 1, undefined, 'FAST');
      } catch { /* skip */ }
      setFontSafe('helvetica', 'normal');
      this.doc.setFontSize(5.5);
      this.doc.setTextColor(100, 110, 140);
      const idDocLabel = language === 'es' ? 'Documento de identidad' : 'Identity document';
      console.log('FONT ACTUAL', this.doc.getFont());
      console.log('FONT LIST', this.doc.getFontList());
      console.log('TEXT TO WRITE', idDocLabel);
      safeText(idDocLabel, px + pw / 2, py + photoH + 4, { align: 'center' });
    }

    this.currentY += photoH + 8;
    this.doc.setTextColor(0, 0, 0);
  }

  // ── Split document content at the natural signature block ────────────────────
  // Returns { before } = body text, { after } = post-signature content (checklists,
  // state compliance notices, addenda) so the signature image block can be inserted
  // at the correct position — matching the on-screen document preview exactly.
  private splitAtSignatureBlock(content: string): { before: string; after: string } {
    // Primary markers: "IN WITNESS WHEREOF" or "EN TESTIMONIO DE LO CUAL"
    const witnessRe = /\n*(IN WITNESS WHEREOF|EN TESTIMONIO DE LO CUAL)[^\n]*/i;
    const witnessMatch = witnessRe.exec(content);

    if (witnessMatch && witnessMatch.index !== undefined) {
      const before = content.slice(0, witnessMatch.index).trimEnd();
      const rest   = content.slice(witnessMatch.index); // includes the witness line

      // Find first paragraph that looks like a new content section after the sig lines
      // (not another signer label). Look for 2+ blank lines followed by ALL-CAPS heading
      // or a line that is NOT a signature-area line.
      const afterSigRe = /\n{2,}(MOVE-IN|STATE-SPECIFIC|EXHIBIT|APPENDIX|ADDENDUM|DISCLOSURES|ADDITIONAL|NOTE:|NOTAS?:|AVISO|CHECKLIST)/i;
      const postMatch  = afterSigRe.exec(rest);
      if (postMatch && postMatch.index !== undefined) {
        return { before, after: rest.slice(postMatch.index).trimStart() };
      }

      // Fallback: skip sig lines until 3 blank lines appear then resume
      const tripleBlankRe = /\n{3,}/;
      const skipSigLines = rest.replace(/\n(_{5,}|Landlord.*|Tenant.*|Arrendador.*|Arrendatario.*|Name:|Firma:|Date:|Signature:)[^\n]*/gi, '');
      const tripleBlank  = tripleBlankRe.exec(skipSigLines);
      if (tripleBlank && tripleBlank.index !== undefined) {
        return { before, after: skipSigLines.slice(tripleBlank.index).trimStart() };
      }

      return { before, after: '' };
    }

    // Fallback: look for the first signature underline past 60% of content
    const lines    = content.split('\n');
    const midpoint = Math.floor(lines.length * 0.60);
    for (let i = midpoint; i < lines.length; i++) {
      if (/_{5,}/.test(lines[i])) {
        const sectionStart = Math.max(0, i - 4);
        // skip ahead past sig lines to find post-sig content
        let j = i + 1;
        while (j < lines.length && /_{5,}|^(Landlord|Tenant|Arrendador|Arrendatario|Name:|Date:|Firma:|Signature:|\s*)$/i.test(lines[j])) j++;
        return {
          before: lines.slice(0, sectionStart).join('\n').trimEnd(),
          after:  lines.slice(j).join('\n').trimStart(),
        };
      }
    }

    return { before: content, after: '' };
  }

  // ── Static image preloader (URL → base64 data URL) ─────────────────────────

  private static preloadImageAsBase64(url: string): Promise<string> {
    if (!url || url.startsWith('data:')) return Promise.resolve(url);
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width  = img.naturalWidth  || 400;
          canvas.height = img.naturalHeight || 200;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(url);
        }
      };
      img.onerror = () => resolve(url);
      img.src = url;
    });
  }

  private static async resolveSignatureDataUrls(
    signatures: PDFGeneratorOptions['signatures'],
  ): Promise<PDFGeneratorOptions['signatures']> {
    if (!signatures?.length) return signatures;
    return Promise.all(
      signatures.map(async (sig) => ({
        ...sig,
        signatureDataUrl: sig.signatureDataUrl
          ? await PDFGenerator.preloadImageAsBase64(sig.signatureDataUrl)
          : sig.signatureDataUrl,
      })),
    );
  }

  /**
   * Generate and download PDF
   */
  public static async generate(options: PDFGeneratorOptions): Promise<void> {
    const resolvedSigs = await PDFGenerator.resolveSignatureDataUrls(options.signatures);
    const opts = { ...options, signatures: resolvedSigs };

    const generator = new PDFGenerator(opts.title);
    await generator.ensureUnicodeFont();
    const cleanContent = generator.sanitizePremiumPlaceholders(opts.content);

    generator.addLetterhead(opts.letterhead, opts.language);
    generator.applyBrandingTopSpacing(opts.branding);
    generator.addPremiumFirstPageHeader(opts.title, opts.branding);

    // Split content at natural signature position so PDF order matches preview:
    // [body] → [signature block] → [checklist / state compliance / addenda]
    if (opts.mirrorLayout && (opts.leftSig || opts.rightSig)) {
      const { before, after } = generator.splitAtSignatureBlock(cleanContent);
      generator.processContent(before);
      generator.addSignatureMirrorBlock(
        opts.leftSig,
        opts.rightSig,
        opts.mirrorLanguage ?? opts.language,
        opts.identitySelfie,
        opts.identityIdDocFront ?? opts.identityIdDoc,
        opts.identityIdDocBack,
      );
      if (after) generator.processContent(after);
    } else {
      generator.processContent(cleanContent);
      if (opts.signatures?.length) {
        generator.addEmbeddedSignatures(opts.signatures, opts.language);
      } else {
        generator.addEmbeddedSignature(
          opts.auditLog?.signatureDataUrl,
          opts.auditLog?.signerName,
          opts.auditLog?.guestSignedAt,
          opts.language
        );
      }
    }

    // Identity verification page (separate page when photos exist)
    if (opts.identitySelfie || opts.identityIdDoc || opts.identityIdDocFront || opts.identityIdDocBack) {
      generator.addIdentityAuditPage(
        opts.identitySelfie,
        opts.identityIdDocFront ?? opts.identityIdDoc,
        opts.identityIdDocBack,
        opts.language,
      );
    }

    // Optional audit certificate page
    generator.addAuditLogPage(opts.auditLog, opts.language);

    // Informe de Firmas — premium signature report (last content page)
    if (opts.signatures?.length) {
      generator.addSignatureReportPage(opts.signatures, opts.language, opts.title);
    }

    // Add header/footer/page numbering (with SHA-256 hash in footer)
    generator.addDocumentChrome(opts.branding, opts.language, opts.documentHash);

    // Add brand logo as watermark to avoid dual-logo header rendering.
    generator.addLogoWatermark(opts.branding);

    // Add watermark if in preview mode
    if (opts.showWatermark) {
      generator.addWatermark(
        opts.language === 'es' ? 'SOLO VISTA PREVIA' : 'PREVIEW ONLY'
      );
    }

    // Save the PDF
    generator.doc.save(opts.fileName);
  }

  /**
   * Generate PDF as Blob (for preview or upload)
   */
  public static async generateBlob(options: PDFGeneratorOptions): Promise<Blob> {
    const resolvedSigs = await PDFGenerator.resolveSignatureDataUrls(options.signatures);
    const opts = { ...options, signatures: resolvedSigs };

    const generator = new PDFGenerator(opts.title);
    await generator.ensureUnicodeFont();
    const cleanContent = generator.sanitizePremiumPlaceholders(opts.content);

    generator.addLetterhead(opts.letterhead, opts.language);
    generator.applyBrandingTopSpacing(opts.branding);
    generator.addPremiumFirstPageHeader(opts.title, opts.branding);

    if (opts.mirrorLayout && (opts.leftSig || opts.rightSig)) {
      const { before, after } = generator.splitAtSignatureBlock(cleanContent);
      generator.processContent(before);
      generator.addSignatureMirrorBlock(
        opts.leftSig,
        opts.rightSig,
        opts.mirrorLanguage ?? opts.language,
        opts.identitySelfie,
        opts.identityIdDocFront ?? opts.identityIdDoc,
        opts.identityIdDocBack,
      );
      if (after) generator.processContent(after);
    } else {
      generator.processContent(cleanContent);
      if (opts.signatures?.length) {
        generator.addEmbeddedSignatures(opts.signatures, opts.language);
      } else {
        generator.addEmbeddedSignature(
          opts.auditLog?.signatureDataUrl,
          opts.auditLog?.signerName,
          opts.auditLog?.guestSignedAt,
          opts.language
        );
      }
    }

    // Identity verification page (separate page when photos exist)
    if (opts.identitySelfie || opts.identityIdDoc || opts.identityIdDocFront || opts.identityIdDocBack) {
      generator.addIdentityAuditPage(
        opts.identitySelfie,
        opts.identityIdDocFront ?? opts.identityIdDoc,
        opts.identityIdDocBack,
        opts.language,
      );
    }

    // Optional audit certificate page
    generator.addAuditLogPage(opts.auditLog, opts.language);

    // Informe de Firmas — premium signature report (last content page)
    if (opts.signatures?.length) {
      generator.addSignatureReportPage(opts.signatures, opts.language, opts.title);
    }

    // Add header/footer/page numbering (with SHA-256 hash in footer)
    generator.addDocumentChrome(opts.branding, opts.language, opts.documentHash);

    // Add brand logo as watermark to avoid dual-logo header rendering.
    generator.addLogoWatermark(opts.branding);

    // Add watermark if in preview mode
    if (opts.showWatermark) {
      generator.addWatermark(
        opts.language === 'es' ? 'SOLO VISTA PREVIA' : 'PREVIEW ONLY'
      );
    }

    // Return as Blob
    return generator.doc.output('blob');
  }
}