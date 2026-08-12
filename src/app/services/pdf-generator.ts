import { jsPDF } from 'jspdf';
import { DocumentBranding } from '../types/document';
import { DEFAULT_JURISDICTION, type SignatureJurisdiction } from '../data/signature-jurisdictions';
import type { DocxParagraph, DocxRun } from '../../lib/docxTemplateEngine';

interface PDFGeneratorOptions {
  content: string;
  /** Los valores que el usuario escribió en el formulario.
   *
   *  Sirven para una sola cosa, pero importante: distinguir el texto de la
   *  plantilla del texto de la persona. Un dato escrito por el usuario nunca
   *  es un encabezado ni un título, aunque venga en mayúsculas, y sin esta
   *  lista el maquetador no tiene forma de saberlo — para él todo es una
   *  cadena más. */
  userValues?: Array<string | number | boolean>;
  /** When set (custom Word-template documents only), rendered INSTEAD of
   * `content` via processFormattedParagraphs() — real per-run bold/size and
   * per-paragraph alignment straight from the source .docx XML, instead of
   * processContent()'s generic text-pattern heuristics (which are tuned
   * for Codec's own built-in templates.ts documents and get an arbitrary
   * user-authored Word doc's bolding/headers wrong). `content` is still
   * required as a fallback/for callers that don't have this. */
  formattedParagraphs?: DocxParagraph[];
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
  /** Result of a WebAuthn/FIDO2 biometric verification (Touch ID / Face ID /
   * Windows Hello / Android fingerprint) — never a real fingerprint image,
   * only the device's cryptographic proof that its own sensor verified the
   * signer. See addIdentityAuditPage / addSignatureMirrorBlock for how this
   * renders as a "Biometric Verification" badge. */
  identityBiometric?: { deviceLabel: string; verifiedAt: string; credentialIdHash: string };
  /** Which country's e-signature law to cite on the certification/identity
   * pages — defaults to the US (E-SIGN Act & UETA), the text that was
   * always hardcoded here before. Pass a detected jurisdiction (see
   * lib/geo.ts + data/signature-jurisdictions.ts) for a signer outside
   * the US. */
  jurisdiction?: SignatureJurisdiction;
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
  private language: 'en' | 'es' = 'en';
  /** Valores del formulario, en mayúsculas, para reconocerlos al maquetar. */
  private datosDelUsuario = new Set<string>();
  private jurisdiction: SignatureJurisdiction = DEFAULT_JURISDICTION;

  private static getAuditLocale(language: 'en' | 'es'): string {
    return language === 'es' ? 'es-ES' : 'en-US';
  }

  private hasUnicodeFont(): boolean {
    try {
      const anyDoc = this.doc as any;
      const fontList = typeof anyDoc.getFontList === 'function' ? anyDoc.getFontList() : null;
      return Boolean(fontList && (fontList['StandardUnicode'] || fontList['StandardUnicode'] === ''));
    } catch {
      return false;
    }
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

    this.unicodeFontReady = (async () => {
      try {
        // Try several common font paths (case-insensitive filenames and bold variants)
        const regularCandidates = [
          '/fonts/NotoSans-Regular.ttf', '/fonts/NotoSans-Regular.otf',
          '/fonts/DejaVuSans.ttf', '/fonts/Roboto-Regular.ttf',
          '/fonts/Arial.ttf', '/fonts/arial.ttf', '/fonts/Arial-Regular.ttf'
        ];
        const boldCandidates = [
          '/fonts/NotoSans-Bold.ttf', '/fonts/NotoSans-Bold.otf',
          '/fonts/DejaVuSans-Bold.ttf', '/fonts/Roboto-Bold.ttf',
          '/fonts/Arial-Bold.ttf', '/fonts/arialbd.ttf', '/fonts/Arial-BoldReg.ttf'
        ];

        let regularB64: string | null = null;
        for (const p of regularCandidates) {
          // loadFontBase64 returns base64 or null
          // eslint-disable-next-line no-await-in-loop
          regularB64 = await PDFGenerator.loadFontBase64(p);
          if (regularB64) break;
        }

        let boldB64: string | null = null;
        for (const p of boldCandidates) {
          // eslint-disable-next-line no-await-in-loop
          boldB64 = await PDFGenerator.loadFontBase64(p);
          if (boldB64) break;
        }

        const anyDoc = this.doc as any;
        // Register regular font for full Unicode (Identity-H) under the StandardArial alias
        if (regularB64 && typeof anyDoc.addFileToVFS === 'function') {
          try {
            anyDoc.addFileToVFS('StandardUnicode-Regular.ttf', regularB64);
            // addFont accepts (fileName, fontName, fontStyle, options) in some jspdf builds
            // include encoding explicitly to request Identity-H (Unicode) cmap
            if (typeof anyDoc.addFont === 'function') {
              try { anyDoc.addFont('StandardUnicode-Regular.ttf', 'StandardUnicode', 'normal', { encoding: 'Identity-H' }); } catch { anyDoc.addFont('StandardUnicode-Regular.ttf', 'StandardUnicode', 'normal'); }
            }
          } catch (err) {
            // non-fatal
            // console.warn('ensureUnicodeFont: regular font registration failed', err);
          }
        }

        if (boldB64 && typeof anyDoc.addFileToVFS === 'function') {
          try {
            anyDoc.addFileToVFS('StandardUnicode-Bold.ttf', boldB64);
            if (typeof anyDoc.addFont === 'function') {
              try { anyDoc.addFont('StandardUnicode-Bold.ttf', 'StandardUnicode', 'bold', { encoding: 'Identity-H' }); } catch { anyDoc.addFont('StandardUnicode-Bold.ttf', 'StandardUnicode', 'bold'); }
            }
          } catch (err) {
            // non-fatal
          }
        }
      } catch (err) {
        // Ignore font registration failures — fallback paths remain intact
      }
    })();

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
    if (!raw) return language === 'es' ? 'FIRMANTE' : 'Signatory';

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
    // Prefer Unicode-registered font for Spanish content when available
    if (this.language === 'es') {
      try { (this.doc as any).setFont('StandardArial', fontStyle); } catch { this.ensureFontMetadata('helvetica', fontStyle); }
    } else {
      this.ensureFontMetadata('helvetica', fontStyle);
    }

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

  // Process an image dataUrl to center-crop it to desired aspect and size.
  // Attempts a lightweight skin-tone centroid heuristic to center on the face.
  private async processImageCenterCrop(dataUrl: string, outW: number, outH: number): Promise<string> {
    return await new Promise<string>((resolve) => {
      if (!dataUrl || typeof document === 'undefined') return resolve(dataUrl);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const sw = img.width;
          const sh = img.height;
          const destAspect = outW / outH;

          // Simple skin-tone centroid estimation sampling every 4th pixel
          const sampleCanvas = document.createElement('canvas');
          sampleCanvas.width = Math.min(256, sw);
          sampleCanvas.height = Math.min(256, Math.round(sampleCanvas.width * (sh / sw)));
          const sctx = sampleCanvas.getContext('2d')!;
          sctx.drawImage(img, 0, 0, sampleCanvas.width, sampleCanvas.height);
          const imgData = sctx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
          let count = 0; let cx = 0; let cy = 0;
          for (let y = 0; y < sampleCanvas.height; y += 4) {
            for (let x = 0; x < sampleCanvas.width; x += 4) {
              const i = (y * sampleCanvas.width + x) * 4;
              const r = imgData[i] / 255; const g = imgData[i + 1] / 255; const b = imgData[i + 2] / 255;
              const max = Math.max(r, g, b); const min = Math.min(r, g, b);
              const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
              const chroma = max - min;
              // crude skin hue-ish heuristic in RGB space
              const isSkin = (r > 0.35 && g > 0.2 && b > 0.15 && chroma > 0.05 && luminance > 0.2 && luminance < 0.95);
              if (isSkin) { cx += x; cy += y; count++; }
            }
          }

          let srcCx = sw / 2;
          let srcCy = sh / 2;
          if (count > 8) {
            srcCx = (cx / count) * (sw / sampleCanvas.width);
            srcCy = (cy / count) * (sh / sampleCanvas.height);
          }

          let sWidth: number, sHeight: number;
          if (sw / sh > destAspect) {
            // source wider: crop left/right
            sHeight = sh;
            sWidth = Math.round(sh * destAspect);
          } else {
            sWidth = sw;
            sHeight = Math.round(sw / destAspect);
          }

          let sx = Math.max(0, Math.round(srcCx - sWidth / 2));
          let sy = Math.max(0, Math.round(srcCy - sHeight / 2));
          if (sx + sWidth > sw) sx = sw - sWidth;
          if (sy + sHeight > sh) sy = sh - sHeight;

          const canvas = document.createElement('canvas');
          canvas.width = outW;
          canvas.height = outH;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, outW, outH);
          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, outW, outH);
          resolve(canvas.toDataURL('image/jpeg', 0.92));
        } catch (e) {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
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
      const anyDoc = this.doc as any;
      // Prefer registered Unicode Arial (StandardArial) when available
      const fontList = typeof anyDoc.getFontList === 'function' ? anyDoc.getFontList() : null;
      if (fontList && (fontList['StandardUnicode'] || fontList['StandardUnicode'] === '')) {
        try {
          this.doc.setFont('StandardUnicode', fontStyle);
          return;
        } catch {
          // fallthrough
        }
      }

      this.doc.setFont(fontName, fontStyle);
      const currentFont = this.doc.getFont();
      const isCustomTTF = currentFont && typeof currentFont.postScriptName === 'string' && currentFont.postScriptName.toLowerCase().includes('.ttf');
      if (!currentFont || !currentFont.metadata || typeof currentFont.metadata.Unicode === 'undefined' || isCustomTTF) {
        throw new Error('Invalid or custom font metadata');
      }
    } catch {
      try { this.doc.setFont('helvetica', fontStyle); } catch { try { this.doc.setFont('times', fontStyle); } catch {} }
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

  private setFontForLang(style: 'normal' | 'bold' = 'normal') {
    try {
      if (this.language === 'es') {
        try { (this.doc as any).setFont('StandardArial', style); return; } catch {}
      }
    } catch {}
    try { this.doc.setFont('helvetica', style); } catch { try { this.doc.setFont('times', style); } catch {} }
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
  /**
   * ¿Es este renglón un encabezado de los que van en negrita entera?
   *
   * Antes bastaba con que la línea CONTUVIERA el término en cualquier parte,
   * comparando subcadenas. Con «TERM» en la lista, cualquier párrafo con la
   * palabra «terminada» salía entero en negrita: en la carta de renuncia eran
   * dos párrafos seguidos, y el documento parecía gritar sin motivo. «PAGO»
   * hacía lo mismo con «pagos», «FIRMA» con «confirmar», «NOTA» con
   * «anotación».
   *
   * Dos condiciones ahora. El término tiene que aparecer como palabra
   * completa, y el renglón tiene que ser corto: estas palabras marcan
   * encabezados como «EN TESTIMONIO DE LO CUAL», y un párrafo de doscientos
   * caracteres no es un encabezado por mucho que mencione un pago.
   */
  private containsLegalTerms(line: string): boolean {
    if (line.length > 70) return false;
    const texto = line.toUpperCase();
    const letra = 'A-ZÁÉÍÓÚÜÑ0-9';
    return this.legalTerms.some((term) => {
      const patron = term.toUpperCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(^|[^${letra}])${patron}($|[^${letra}])`).test(texto);
    });
  }

  /**
   * Render a line split into strong/legal fragments and normal fragments.
   * This implementation avoids Y rewinds/overprints and keeps output stable.
   */
  /**
   * Splits a line on **bold** markdown markers into DocxRun-shaped
   * fragments so it can go through the same real-justification renderer
   * (addMixedRuns) as custom Word templates, instead of stripping the
   * markers and rendering the whole line as one flat weight.
   */
  private parseInlineBold(text: string): DocxRun[] {
    const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
    const runs: DocxRun[] = parts.map((part) => {
      const m = part.match(/^\*\*([^*]+)\*\*$/);
      return m ? { text: m[1], bold: true } : { text: part, bold: false };
    });
    return runs.length ? runs : [{ text, bold: false }];
  }

  /**
   * Process document content with professional legal formatting.
   * Shares the same calibrated typography (real justification via
   * addMixedRuns, consistent title/section/body sizes) as
   * processFormattedParagraphs -- the two used to be very different
   * rendering engines (this one used addText, which silently treated
   * 'justify' the same as 'left'), producing a visibly lower-quality PDF
   * for every built-in document type (leases, NDAs, etc.) than for
   * uploaded Word templates.
   */
  private processContent(content: string) {
    const TITLE_SIZE = 12;
    const SECTION_SIZE = 10;
    const BODY_SIZE = 9.5;
    const lines = content.split('\n');
    let titleAssigned = false;
    // Renglones con texto vistos hasta ahora. Un título encabeza el documento
    // o no existe: una carta empieza por la ciudad y la fecha y no lleva
    // ninguno. Sin este corte, el primer renglón en mayúsculas que apareciera
    // —«CONSTANCIA DE RECIBIDO», al final de la carta— se ascendería a título
    // y se imprimiría centrado y en grande donde no toca.
    let renglonesConTexto = 0;
    // Líneas en blanco seguidas pendientes de convertir en espacio. Se
    // acumulan y se aplican de una vez sobre el renglón siguiente: dos saltos
    // en la plantilla tienen que separar más que uno, y antes cada uno sumaba
    // 0,12 de renglón —dos milímetros— así que el PDF salía como un bloque
    // continuo sin aire entre la fecha, el destinatario y los párrafos.
    let blancos = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = this.normalizeLegalLine(line);

      if (trimmedLine === '') {
        blancos++;
        continue;
      }

      if (blancos > 0) {
        // Se topa: una plantilla con cinco saltos seguidos quiere sitio para
        // firmar, no una página en blanco.
        this.addSpacing(Math.min(blancos, 3) * 0.62);
        blancos = 0;
      }

      renglonesConTexto++;

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

      // Detect main/section headers (all caps lines under 100 chars) --
      // first one is the document title (centered, bold), the rest are
      // section headers (left-aligned), mirroring classifyParagraphRole.
      // Un dato escrito por el usuario nunca es un encabezado, aunque est\u00E9 en
      // may\u00FAsculas. Quien escribi\u00F3 \u00ABCENTRO DE IDIOMAS UNIVERSAL\u00BB en el campo
      // del nombre de la empresa se encontraba con su empresa centrada, en
      // negrita y a tama\u00F1o de t\u00EDtulo en mitad de la carta, como si fuera el
      // encabezamiento del documento.
      if (this.datosDelUsuario.has(trimmedLine.toUpperCase())) {
        this.addMixedRuns(this.parseInlineBold(trimmedLine), BODY_SIZE, 'left', { leading: 1.05, spaceBefore: 0, spaceAfter: 0.4 });
        continue;
      }

      // Mismo criterio que la vista previa (document-preview.tsx): sin esto,
      // \u00ABPRIMERA \u2014 OBJETO\u00BB no encajaba aqu\u00ED \u2014la clase no admit\u00EDa la raya\u2014 y
      // las diecinueve cl\u00E1usulas del contrato de boda se imprim\u00EDan como texto
      // corriente en el PDF mientras en pantalla se ve\u00EDan como encabezados.
      //
      // Sin CIFRAS a prop\u00F3sito. \u00ABC.C. 1022925002\u00BB y \u00ABART\u00CDCULO 1 - VENTA\u00BB son
      // may\u00FAsculas con n\u00FAmeros: el primero es un dato bajo la firma y el
      // segundo lo recoge mejor la rama de art\u00EDculos que hay m\u00E1s abajo.
      if (/^[A-Z\u00C0-\u017F\s\-\u2013\u2014()&,.'"]+$/.test(trimmedLine) && trimmedLine.length > 3 && trimmedLine.length <= 80 && !/[:;]/.test(trimmedLine)) {
        if (!titleAssigned && renglonesConTexto <= 3) {
          titleAssigned = true;
          this.addMixedRuns([{ text: trimmedLine, bold: true }], TITLE_SIZE, 'center', { leading: 1.1, spaceBefore: 1.2, spaceAfter: 2.2 });
        } else {
          this.addMixedRuns([{ text: trimmedLine, bold: true }], SECTION_SIZE, 'left', { leading: 1.1, spaceBefore: 2, spaceAfter: 1 });
        }
        continue;
      }

      // Detect article headers (ARTICLE I, ARTICULO I, etc.)
      if (/^(ARTICLE|ART[ÍI]CULO)\s+[IVX\d]+/i.test(trimmedLine)) {
        this.addMixedRuns([{ text: trimmedLine, bold: true }], SECTION_SIZE, 'left', { leading: 1.1, spaceBefore: 2, spaceAfter: 1 });
        continue;
      }

      // Numbered legal sections -- bold heading inline with justified body
      if (this.isNumberedSection(trimmedLine)) {
        const { heading, body } = this.splitNumberedSection(trimmedLine);
        const runs: DocxRun[] = body ? [{ text: `${heading} `, bold: true }, ...this.parseInlineBold(body)] : [{ text: heading, bold: true }];
        this.addMixedRuns(runs, BODY_SIZE, 'justify', { leading: 1.05, spaceBefore: 0, spaceAfter: 0.6 });
        continue;
      }

      // Bulleted/list lines -- left-aligned, never justified
      if (this.isBulletLine(trimmedLine)) {
        this.addMixedRuns(this.parseInlineBold(trimmedLine), BODY_SIZE, 'left', { leading: 1.05, spaceBefore: 0, spaceAfter: 0.4 });
        continue;
      }

      // Lines with **bold** markdown -- real inline bold runs, justified
      if (trimmedLine.includes('**')) {
        this.addMixedRuns(this.parseInlineBold(trimmedLine), BODY_SIZE, 'justify', { leading: 1.05, spaceBefore: 0, spaceAfter: 0.6 });
        continue;
      }

      // Legal emphasis terms -- whole line bold, justified
      if (this.containsLegalTerms(trimmedLine)) {
        this.addMixedRuns([{ text: trimmedLine, bold: true }], BODY_SIZE, 'justify', { leading: 1.05, spaceBefore: 0, spaceAfter: 0.6 });
        continue;
      }

      // Clauses and definitions ("LABEL: content") -- bold label inline
      // with the normal-weight value on the same line, not stacked.
      if (this.isClauseHeader(trimmedLine)) {
        const parts = trimmedLine.split(':');
        const runs: DocxRun[] = parts.length > 1
          ? [{ text: `${parts[0].trim()}: `, bold: true }, ...this.parseInlineBold(parts.slice(1).join(':').trim())]
          : [{ text: trimmedLine, bold: true }];
        this.addMixedRuns(runs, SECTION_SIZE, 'left', { leading: 1.1, spaceBefore: 0, spaceAfter: 0.5 });
        continue;
      }

      // Regular lines
      const formattedLine = this.formatLineCapitalization(trimmedLine);
      this.addMixedRuns(this.parseInlineBold(formattedLine), BODY_SIZE, 'justify', { leading: 1.05, spaceBefore: 0, spaceAfter: 0.6 });
    }
  }

  /**
   * Reduces the page margin for the formatted-paragraphs (custom Word
   * template) rendering path only — must be called right after
   * construction, before any letterhead/content is drawn, so the header
   * and body share the same tighter margin. Never touches the default
   * (25.4mm) used by every other document type.
   */
  private setMargin(mm: number) {
    this.margin = mm;
    this.maxWidth = this.pageWidth - this.margin * 2;
  }

  /**
   * Classifies a docx paragraph by its editorial ROLE (title / section
   * header / numbered clause heading / body text) so a fixed, professional
   * typography rule applies per role — matching a real institutional
   * contract's layout — instead of literally copying whatever size/
   * alignment/bold the source .docx happened to have on that paragraph
   * (which is what processFormattedParagraphs did before this: correct
   * per-word bold, but titles/headers could still end up styled however
   * the original Word author happened to format them).
   */
  private classifyParagraphRole(
    text: string,
    titleAssigned: boolean,
  ): 'title' | 'section' | 'clauseHeading' | 'body' {
    const t = text.trim();
    const isAllCaps = t.length > 0 && t === t.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(t);
    const looksLikeFieldLine = (t.match(/:\s*\S/g) ?? []).length >= 2; // 2+ "Label: value" pairs on one line

    if (!titleAssigned && isAllCaps && t.length >= 15 && !looksLikeFieldLine) return 'title';
    if (isAllCaps && t.length < 70 && !looksLikeFieldLine) return 'section';
    // Spanish ordinal clause headings (PRIMERA-OBJETO:) and their English
    // equivalent (FIRST-PURPOSE:) — templates targeting the US market use
    // the same "ORDINAL-TITLE:" convention in English, and without this
    // the heading fell through to 'body', where its own colon made it get
    // misclassified as a short field-line instead of justified clause prose.
    if (/^(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|S[ÉE]PTIMA|OCTAVA|NOVENA|D[ÉE]CIMA(\s+\p{L}+)?|PAR[ÁA]GRAFO(\s+\p{L}+)?)\s*[\-:]/iu.test(t)) return 'clauseHeading';
    if (/^(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\s*[\-:]/i.test(t)) return 'clauseHeading';
    return 'body';
  }

  /**
   * Renders a custom Word template's real paragraph structure — see
   * DocxParagraph in lib/docxTemplateEngine.ts — through a fixed
   * institutional-contract typography system (Arial/Helvetica throughout,
   * centered ALL-CAPS title, left-aligned bold section headers, bolded
   * "PRIMERA-" style clause headings immediately followed by justified
   * body text, tight ~1.15 leading). Per-word bold from the source .docx
   * is still respected within a line (so "Label: **VALUE**" keeps only
   * the VALUE bold) — only the paragraph-level role (size/align/forced
   * bold) is decided here, not copied verbatim from the source.
   */
  private processFormattedParagraphs(paragraphs: DocxParagraph[]) {
    // Calibrated directly against the reference institutional PDF (same
    // contract, rendered by the org's own converter): the title is only
    // modestly bigger than body text (not a dramatic jump), and section
    // headers ("DATOS TITULAR DEL CONTRATO", "CLAUSULAS.", etc.) are PLAIN
    // regular weight at the SAME size as body text — left-aligned and
    // isolated by blank-line spacing, never bold, never a bigger font.
    // Only the title itself and the very next line (the "Fecha: ...
    // Número de Contrato: ..." subtitle) are centered.
    const FIELD_SIZE = 9.5;   // labels/values ("Apellidos: NOMBRE") + section headers
    const CLAUSE_SIZE = 8.5;  // clause headings + justified legal prose
    const TITLE_SIZE = 11;
    let titleAssigned = false;
    let centerNextFieldLine = false;

    for (const para of paragraphs) {
      if (para.runs.length === 0) {
        this.addSpacing(0.12); // a Word blank line ≠ a real paragraph gap
        continue;
      }
      const text = para.runs.map((r) => r.text).join('');
      const role = this.classifyParagraphRole(text, titleAssigned);

      if (role === 'title') {
        titleAssigned = true;
        centerNextFieldLine = true; // the "Fecha: ... Número de Contrato: ..." line right after the title is centered too
        this.addMixedRuns([{ text: text.toUpperCase(), bold: true, sizePt: TITLE_SIZE }], TITLE_SIZE, 'center', { leading: 1.1, spaceBefore: 0, spaceAfter: 2.2 });
        continue;
      }

      if (role === 'section') {
        // Plain — same weight/size as body, not a "heading" at all, just
        // its own isolated line (matches the reference exactly).
        this.addMixedRuns([{ text: text.toUpperCase(), bold: false, sizePt: FIELD_SIZE }], FIELD_SIZE, 'left', { leading: 1.1, spaceBefore: 2, spaceAfter: 1 });
        continue;
      }

      if (role === 'clauseHeading') {
        // Bold only up to (and including) the separator after the ordinal
        // word — "PRIMERA-NATURALEZA DEL CONTRATO:" — so the heading reads
        // as inline-bold immediately followed by regular justified body,
        // never a giant standalone heading. Forces the heading bold
        // regardless of the source run's own bold flag (an opinionated
        // design-system rule, not a source-fidelity one).
        const headingMatch = text.match(/^([^:]{0,90}:)/);
        const splitAt = headingMatch ? headingMatch[1].length : 0;
        const chars = this.expandParagraphChars(para);
        const runs = splitAt > 0
          ? this.collapseParagraphChars(chars.map((c, i) => (i < splitAt ? { ...c, bold: true } : c)))
          : para.runs;
        this.addMixedRuns(runs, CLAUSE_SIZE, 'justify', { leading: 1.05, spaceBefore: 0, spaceAfter: 0.6 });
        continue;
      }

      // Plain body / field-value line — keep the source's own per-word
      // bold (this is where "Label: **VALUE**" lives). Long prose
      // paragraphs (no colon at all) are legal-text density (9pt/1.0)
      // same as a clause body rather than form-field size. The line
      // immediately after the title (date/contract number) centers once.
      const isFieldLine = text.includes(':');
      const size = isFieldLine ? FIELD_SIZE : CLAUSE_SIZE;
      const align: 'left' | 'justify' | 'center' = isFieldLine ? (centerNextFieldLine ? 'center' : 'left') : 'justify';
      if (isFieldLine) centerNextFieldLine = false;
      this.addMixedRuns(para.runs, size, align, { leading: isFieldLine ? 1.1 : 1.05, spaceBefore: 0, spaceAfter: isFieldLine ? 0.5 : 0.6 });
    }
  }

  private expandParagraphChars(para: DocxParagraph): { ch: string; bold: boolean; size?: number }[] {
    const out: { ch: string; bold: boolean; size?: number }[] = [];
    for (const r of para.runs) {
      for (const ch of r.text) out.push({ ch, bold: r.bold, size: r.sizePt });
    }
    return out;
  }

  private collapseParagraphChars(chars: { ch: string; bold: boolean; size?: number }[]): DocxRun[] {
    const runs: DocxRun[] = [];
    for (const c of chars) {
      const last = runs[runs.length - 1];
      if (last && last.bold === c.bold && last.sizePt === c.size) last.text += c.ch;
      else runs.push({ text: c.ch, bold: c.bold, sizePt: c.size });
    }
    return runs;
  }

  /**
   * Renders a sequence of (text, bold, size) runs on the SAME logical
   * paragraph, word-wrapping across run boundaries — jsPDF's own
   * splitTextToSize only handles one string in one font style, so mixed
   * "Label: **VALUE**" content needs manual per-word measurement instead.
   * Always uses built-in Helvetica directly (bypassing the StandardArial/
   * Unicode font-registration cascade elsewhere in this class) for a
   * predictable, guaranteed sans-serif result — Spanish accented
   * characters (á é í ó ú ñ) are within Helvetica's Latin-1 coverage.
   *
   * `justify` distributes the leftover width of every line EXCEPT the
   * paragraph's last one across its inter-word gaps (real justification,
   * not jsPDF's `align:'justify'` — which this codebase never actually
   * implemented; it silently fell back to left).
   */
  private addMixedRuns(
    runs: DocxRun[],
    baseFontSize: number,
    align: 'left' | 'center' | 'right' | 'justify',
    layout?: { leading?: number; spaceBefore?: number; spaceAfter?: number; textColor?: [number, number, number] },
  ) {
    const [r, g, b] = layout?.textColor ?? [0, 0, 0];
    this.doc.setTextColor(r, g, b);
    const leading = layout?.leading ?? 1.05;

    type Word = { text: string; bold: boolean; size: number };
    const words: Word[] = [];
    for (const run of runs) {
      const size = run.sizePt && run.sizePt > 0 ? run.sizePt : baseFontSize;
      for (const part of run.text.split(/(\s+)/)) {
        if (part) words.push({ text: part, bold: run.bold, size });
      }
    }
    if (words.length === 0) return;

    const measure = (w: Word) => {
      try { this.doc.setFontSize(w.size); this.doc.setFont('helvetica', w.bold ? 'bold' : 'normal'); } catch {}
      const raw = this.safeGetTextWidth(w.text);
      return /^\s+$/.test(w.text) ? Math.max(raw, w.size * 0.3528 * 0.32) : raw;
    };

    const lines: Word[][] = [];
    let current: Word[] = [];
    let currentWidth = 0;
    for (const w of words) {
      if (current.length === 0 && /^\s+$/.test(w.text)) continue; // never start a line with whitespace
      const width = measure(w);
      if (currentWidth + width > this.maxWidth && current.length > 0) {
        lines.push(current);
        current = [];
        currentWidth = 0;
        if (/^\s+$/.test(w.text)) continue;
      }
      current.push(w);
      currentWidth += width;
    }
    if (current.length > 0) lines.push(current);

    if (layout?.spaceBefore) this.addSpacing(layout.spaceBefore / (this.lineHeight || 5.2));

    lines.forEach((lineWords, li) => {
      const lineHeightMm = Math.max(...lineWords.map((w) => w.size)) * 0.352 * leading;
      if (this.currentY + lineHeightMm > this.pageHeight - this.margin) {
        this.doc.addPage();
        this.currentY = this.margin + 6;
      }
      const naturalWidth = lineWords.reduce((sum, w) => sum + measure(w), 0);
      const isLastLine = li === lines.length - 1;

      let x = this.margin;
      if (align === 'center') x = (this.pageWidth - naturalWidth) / 2;
      else if (align === 'right') x = this.pageWidth - this.margin - naturalWidth;

      let extraPerSpace = 0;
      if (align === 'justify' && !isLastLine) {
        const spaceCount = lineWords.filter((w) => /^\s+$/.test(w.text)).length;
        if (spaceCount > 0) extraPerSpace = Math.max(0, (this.maxWidth - naturalWidth) / spaceCount);
      }

      for (const w of lineWords) {
        const wWidth = measure(w); // sets font/size as a side effect too
        this.safeText(w.text, x, this.currentY);
        x += wWidth + (/^\s+$/.test(w.text) ? extraPerSpace : 0);
      }
      this.currentY += lineHeightMm;
    });

    if (layout?.spaceAfter) this.addSpacing(layout.spaceAfter / (this.lineHeight || 5.2));
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
      this.safeText(`Legally Compliant ${this.jurisdiction.badgeEn}`, this.pageWidth / 2, footerY + 2, { align: 'center' });

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

  /** Stylized concentric-ring "fingerprint" glyph — drawn with vector
   * primitives, never a real scanned print (WebAuthn never gives this app
   * access to one). Used purely as a recognizable "biometric" visual
   * anchor next to the crypto-proof text. */
  private drawFingerprintGlyph(cx: number, cy: number, size: number, color: [number, number, number] = [219, 39, 119]) {
    this.doc.setDrawColor(color[0], color[1], color[2]);
    this.doc.setLineWidth(0.55);
    const rings = 4;
    for (let i = 1; i <= rings; i++) {
      this.doc.circle(cx, cy, (size / 2) * (i / rings) * 0.88, 'S');
    }
    this.doc.setFillColor(color[0], color[1], color[2]);
    this.doc.circle(cx, cy, size * 0.05, 'F');
  }

  private addBiometricVerificationBlock(
    x: number, y: number, width: number,
    biometric: NonNullable<PDFGeneratorOptions['identityBiometric']>,
    language: 'en' | 'es',
  ): number {
    const height = 26;
    this.doc.setFillColor(253, 242, 248);
    this.doc.setDrawColor(244, 114, 182);
    this.doc.setLineWidth(0.35);
    this.doc.roundedRect(x, y, width, height, 3, 3, 'FD');

    this.drawFingerprintGlyph(x + 14, y + height / 2, 15);

    const textX = x + 30;
    this.setFontForLang('bold');
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(157, 23, 77);
    this.safeText(language === 'es' ? 'AUTENTICACIÓN BIOMÉTRICA — VERIFICADA' : 'BIOMETRIC AUTHENTICATION — VERIFIED', textX, y + 6.5);

    this.setFontForLang('normal');
    this.doc.setFontSize(7);
    this.doc.setTextColor(80, 40, 60);
    const verifiedDate = new Date(biometric.verifiedAt).toLocaleString(language === 'es' ? 'es-MX' : 'en-US', {
      dateStyle: 'medium', timeStyle: 'short',
    });
    this.safeText(`${language === 'es' ? 'Método' : 'Method'}: ${biometric.deviceLabel}`, textX, y + 12);
    this.safeText(`${language === 'es' ? 'Verificado el' : 'Verified at'}: ${verifiedDate}`, textX, y + 17);
    this.safeText(
      `${language === 'es' ? 'Referencia de credencial' : 'Credential reference'}: ${biometric.credentialIdHash || '—'} · WebAuthn/FIDO2`,
      textX, y + 22,
    );

    return y + height;
  }

  private async addIdentityAuditPage(
    selfieDataUrl?: string,
    idDocFrontDataUrl?: string,
    idDocBackDataUrl?: string,
    language: 'en' | 'es' = 'en',
    biometric?: PDFGeneratorOptions['identityBiometric'],
  ) {
    if (!selfieDataUrl && !idDocFrontDataUrl && !idDocBackDataUrl && !biometric) return;

    this.doc.addPage();
    const PW = this.pageWidth;
    const M  = this.margin;

    // Title band
    this.doc.setFillColor(37, 99, 235);
    this.doc.rect(0, 0, PW, 16, 'F');
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(0, 16, PW, 2, 'F');

    this.setFontForLang('bold');
    this.doc.setFontSize(14);
    this.doc.setTextColor(255, 255, 255);
    this.safeText('IDENTITY VERIFICATION REPORT', PW / 2, 10.5, { align: 'center' });

    this.setFontForLang('normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(191, 219, 254);
    this.safeText(`Codec Document — ${this.jurisdiction.badgeEn} Compliant Digital Identity Record`, PW / 2, 15.2, { align: 'center' });

    this.currentY = 28;

    // Disclaimer
    const disclaimer = this.jurisdiction.identityDisclaimerEn;
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
      this.doc.setLineWidth(0.35);
      this.doc.roundedRect(x, y, w, h, 3, 3, 'FD');

      const titleHeight = 8;
      this.doc.setFillColor(37, 99, 235);
      this.doc.roundedRect(x, y, w, titleHeight, 2, 2, 'F');
      this.setFontForLang('bold');
      this.doc.setFontSize(8);
      this.doc.setTextColor(255, 255, 255);
      this.safeText(title, x + w / 2, y + 5.5, { align: 'center' });

      const imgY = y + titleHeight + 4;
      const imgH = h - titleHeight - 12;
      if (dataUrl) {
        try {
          this.addImageContain(dataUrl, x + 2, imgY, w - 4, imgH);
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

      this.setFontForLang('normal');
      this.doc.setFontSize(6.5);
      this.doc.setTextColor(100, 116, 139);
      this.safeText(note, x + w / 2, y + h - 4, { align: 'center' });
    };

    const availableWidth = PW - M * 2;
    const cards: Array<{ title: string; dataUrl?: string; note: string }> = [
      { title: 'VALIDATION SELFIE', dataUrl: selfieDataUrl, note: "Signer's face via front camera" },
      { title: 'ID FRONT', dataUrl: idDocFrontDataUrl, note: 'Government ID - front side' },
      { title: 'ID BACK', dataUrl: idDocBackDataUrl, note: 'Government ID - back side' },
    ].filter((card) => card.dataUrl);
    const cardCount = Math.max(1, cards.length);
    const cardGap = 8;
    const cardWidth = cardCount === 1 ? availableWidth : (availableWidth - cardGap * (cardCount - 1)) / cardCount;
    const cardHeight = 64;
    let cardX = M;

    cards.forEach((card, index) => {
      drawPhotoCard(card.title, card.dataUrl, cardX, photoSectionY, cardWidth, cardHeight, card.note);
      cardX += cardWidth + cardGap;
    });

    this.currentY = cards.length > 0 ? photoSectionY + cardHeight + 16 : photoSectionY;

    if (biometric) {
      // The biometric box is a fixed 26mm tall — without this check it
      // could land right up against (or past) the page's bottom margin,
      // and since the document-chrome footer is stamped on every page
      // AFTER all content is drawn (addDocumentChrome), a box placed too
      // low visually crowds/overlaps the footer line instead of leaving
      // it room, which is what made this page look "montado"/cramped.
      const BIOMETRIC_BOX_HEIGHT = 26;
      const FOOTER_RESERVE = 12;
      if (this.currentY + BIOMETRIC_BOX_HEIGHT + FOOTER_RESERVE > this.pageHeight - M) {
        this.doc.addPage();
        this.currentY = M;
      }
      this.currentY = this.addBiometricVerificationBlock(M, this.currentY, PW - M * 2, biometric, language) + 10;
    }

    // Audit data table
    const now = new Date();
    const methodParts = ['Digital Signature'];
    if (biometric) methodParts.unshift('WebAuthn/FIDO2 Biometric');
    if (selfieDataUrl) methodParts.push('Selfie Verification');
    if (idDocFrontDataUrl || idDocBackDataUrl) methodParts.push('Government ID Photo');
    const tableRows: Array<[string, string]> = [
      ['Document ID',          `CDX-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-6)}`],
      ['Verification Date',    now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
      ['Verification Time',    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' })],
      ['Verification Method',  methodParts.join(' + ')],
      ...(biometric ? [['Biometric Verification', `Passed — ${biometric.deviceLabel} (Platform Authenticator)`] as [string, string]] : []),
      ['Compliance Framework', this.jurisdiction.complianceFrameworkEn],
      ['Signature Algorithm',  'SHA-256 Cryptographic Hash'],
      ['Legal Status',         'VALID — Legally Binding Electronic Signature'],
    ];

    const minTableHeight = tableRows.length * 9 + 34;
    if (this.currentY + minTableHeight > this.pageHeight - M) {
      this.doc.addPage();
      this.currentY = M;
    }

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
      const valLines = this.splitTextToSize(value, valueW);
      const rowHeight = Math.max(8.5, 3 + valLines.length * 4.5);
      if (this.currentY + rowHeight > this.pageHeight - M) {
        this.doc.addPage();
        this.currentY = M;
      }
      if (idx % 2 === 0) {
        this.doc.setFillColor(248, 250, 252);
        this.doc.rect(M, this.currentY - 3, PW - M * 2, rowHeight + 1, 'F');
      }
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(8);
      this.doc.setTextColor(71, 85, 105);
      this.safeText(label, M + 2, this.currentY + 3);

      this.ensureFontMetadata('helvetica', 'normal');
      this.doc.setTextColor(15, 23, 42);
      valLines.forEach((line, lineIndex) => {
        this.safeText(line, valueX, this.currentY + 3 + lineIndex * 4.5);
      });
      this.currentY += rowHeight + 1;
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
    const legalNote = biometric
      ? 'This Identity Verification Report is an integral part of the executed agreement. Biometric authentication was performed locally on the signatory\'s own device (WebAuthn/FIDO2) — Codec Document never received or stored a fingerprint image, face scan, or any raw biometric data, only the device\'s cryptographic proof of a successful local verification. Any photo evidence and metadata herein were collected with the explicit consent of the signatory under applicable privacy laws. This record may be used as evidence of signer identity and intent in any legal proceeding.'
      : 'This Identity Verification Report is an integral part of the executed agreement. The biometric images and metadata herein were collected with the explicit consent of the signatory under applicable privacy laws. This record may be used as evidence of signer identity and intent in any legal proceeding.';
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
    // addMixedRuns (not addText) so this page shares the exact same font
    // (always real helvetica) and calibrated scale as the document body
    // instead of addText's separate StandardArial-cascade font path,
    // which visibly didn't match.
    // Dark slate gray instead of pure black — reads as a calmer, more
    // professional certificate page instead of a harsh black-on-white wall
    // of text.
    const AUDIT_TEXT_COLOR: [number, number, number] = [51, 65, 85];
    this.addMixedRuns([{ text: language === 'es' ? 'CERTIFICADO DE AUDITORÍA' : 'AUDIT CERTIFICATE', bold: true }], 11, 'center', { leading: 1.1, spaceBefore: 0, spaceAfter: 0.8, textColor: AUDIT_TEXT_COLOR });
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
      `Status: ${audit.legalStatus || `Documento Validado bajo ${this.jurisdiction.badgeEs}`}`,
    ];

    rows.forEach((r) => {
      const colonIdx = r.indexOf(':');
      const runs: DocxRun[] = colonIdx > -1
        ? [{ text: `${r.slice(0, colonIdx)}: `, bold: true }, { text: r.slice(colonIdx + 1).trim(), bold: false }]
        : [{ text: r, bold: false }];
      this.addMixedRuns(runs, 9, 'left', { leading: 1.15, spaceBefore: 0, spaceAfter: 0.7, textColor: AUDIT_TEXT_COLOR });
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
      this.addImageContain(signatureDataUrl, targetX, targetY, boxWidth, boxHeight);
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
    selfieDataUrl?: string,
  ) {
    if (!signatures.length) return;

    this.doc.addPage();

    const PW  = this.pageWidth;
    const PH  = this.pageHeight;
    const M   = this.margin;

    // ── Dark header band ───────────────────────────────────────────────────
    //
    // Empieza DEBAJO de los 10 mm que ocupa el encabezado de marca. Ese
    // encabezado lo pinta addDocumentChrome sobre todas las páginas, y lo hace
    // al final, cuando esta página ya está dibujada: la banda blanca caía
    // encima de la franja oscura y le cortaba la mitad de arriba al título,
    // que quedaba ilegible partido justo por el medio.
    const CHROME_H = 10;
    const HEADER_H = CHROME_H + 26;
    this.doc.setFillColor(18, 20, 33);
    this.doc.rect(0, CHROME_H, PW, HEADER_H - CHROME_H, 'F');
    this.doc.setFillColor(90, 105, 233);
    this.doc.rect(0, HEADER_H - 2, PW, 2, 'F');

    const reportTitle = language === 'es' ? 'INFORME DE FIRMAS' : 'SIGNATURE REPORT';
    this.setFontForLang('bold');
    this.doc.setFontSize(13);
    this.doc.setTextColor(255, 255, 255);
    this.safeText(reportTitle, PW / 2, CHROME_H + 11, { align: 'center' });

    const subtitle = language === 'es'
      ? `Documento: ${docTitle.slice(0, 60)}`
      : `Document: ${docTitle.slice(0, 60)}`;
    this.setFontForLang('normal');
    this.doc.setFontSize(7);
    this.doc.setTextColor(200, 210, 240);
    this.safeText(subtitle, PW / 2, CHROME_H + 18, { align: 'center' });

    // If a selfie is available, render a professional square thumbnail at top-right
    if (selfieDataUrl) {
      try {
        const thumbSize = 22; // mm
        const thumbX = PW - M - thumbSize;
        const thumbY = HEADER_H - thumbSize / 2 - 4;
        // Process a center-cropped square thumbnail at approx px size
        // Use the same processImageCenterCrop helper scaled to reasonable pixels
        // (best-effort; processImageCenterCrop is async but here we call sync fallback)
        // We'll attempt to draw directly; if broken, it's non-fatal.
        this.addImageContain(selfieDataUrl, thumbX, thumbY, thumbSize, thumbSize);
      } catch { /* ignore thumbnail errors */ }
    }

    // ── Two-column grid constants ─────────────────────────────────────────
    const COL_GAP   = 10;
    const COL_W     = (PW - 2 * M - COL_GAP) / 2;
      const BLOCK_H   = 84;
      const IMG_H     = 42;
      const CARD_PAD  = 6;
      const START_Y   = HEADER_H + 10;
      const LEGAL_H   = 52;
      const PAGE_STOP = PH - M - LEGAL_H - 14;
    const locale = PDFGenerator.getAuditLocale(language);
    const now = new Date();
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
      this.setFontForLang('bold');
      this.doc.setFontSize(8);
      this.doc.setTextColor(20, 24, 50);
      const name = PDFGenerator.normalizeSignerDisplayName(sig.signerName || 'Signer', language).toUpperCase().slice(0, 34);
      this.safeText(name, x + COL_W / 2, textY, { align: 'center' });
      textY += 5;

      // Role (blue-indigo, centered)
      this.setFontForLang('normal');
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
      textY += 4.5;

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
    const badgeLabel = language === 'es' ? this.jurisdiction.badgeEs : this.jurisdiction.badgeEn;
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
    this.safeText(language === 'es' ? this.jurisdiction.certTitleEs : this.jurisdiction.certTitleEn, LEGAL_X + 8, LEGAL_Y + 9);

    // Legal body (wrapped)
    const legalBody = language === 'es' ? this.jurisdiction.certBodyEs : this.jurisdiction.certBodyEn;
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
    identityBiometric?: PDFGeneratorOptions['identityBiometric'],
  ) {
    if (!leftSig && !rightSig) return;

    // Helper: set font but verify it's available; fallback to helvetica normal
    const setFontSafe = (family: string, style: string) => {
      try {
        this.doc.setFont(family, style);
      } catch (e) {
        this.doc.setFont('helvetica', 'normal');
        return;
      }
      try {
        const fl = this.doc.getFontList ? this.doc.getFontList() : null;
        if (fl && family && !Object.prototype.hasOwnProperty.call(fl, family)) {
          this.doc.setFont('helvetica', 'normal');
        }
      } catch {
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
    const hasIdentity = !!(identitySelfie || identityIdDoc || identityBiometric);
    // Space needed: sigs (~44) + optional compact identity strip (~32) + optional biometric badge (~30)
    const needed = hasIdentity ? 78 + (identityBiometric ? 30 : 0) : 58;
    if (this.currentY + needed > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin + 6;
    } else {
      this.currentY += 8;
    }

    // Una sola firma NO se maqueta en dos columnas.
    //
    // El bloque pintaba siempre dos renglones, así que un documento con un
    // único firmante —una carta de renuncia, por ejemplo— salía con una
    // segunda línea vacía rotulada «FIRMANTE», invitando a firmar a una
    // persona que no existe en ese documento. Con un solo firmante se pinta
    // una sola línea, del ancho de una columna y alineada al margen.
    const soloUno = !leftSig !== !rightSig;
    const unico   = leftSig ?? rightSig;

    const colW   = (this.maxWidth - 12) / 2;
    const leftX  = this.margin;
    const rightX = this.margin + colW + 12;
    const imgH   = 22;

    const columna = (
      sig: { dataUrl: string; name: string } | undefined,
      x: number,
      lineY: number,
    ) => {
      if (sig?.dataUrl) {
        try { this.addImageContain(sig.dataUrl, x, this.currentY, colW, imgH); }
        catch { /* imagen rota: la línea se pinta igual */ }
      }
      this.doc.setDrawColor(0, 0, 0);
      this.doc.setLineWidth(0.5);
      this.doc.line(x, lineY, x + colW, lineY);

      // El rótulo es el nombre de quien firma. Si no se conoce, se rotula la
      // línea por lo que es —«Firma»— en vez de inventar un nombre.
      const rotulo = sig?.name?.trim()
        ? sig.name.trim().toUpperCase()
        : (language === 'es' ? 'FIRMA' : 'SIGNATURE');

      setFontSafe('helvetica', 'bold');
      this.doc.setFontSize(8.5);
      this.doc.setTextColor(0, 0, 0);
      safeText(rotulo, x + colW / 2, lineY + 4, { align: 'center' });
    };

    const lineY = this.currentY + imgH + 1;

    if (soloUno) {
      columna(unico, leftX, lineY);
    } else {
      columna(leftSig, leftX, lineY);
      columna(rightSig, rightX, lineY);
    }

    this.currentY = lineY + 10;

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
    safeText(idLabel, leftX + 4.5, this.currentY + 4);
    // E-SIGN badge
    const badgeText = language === 'es' ? this.jurisdiction.badgeEs : this.jurisdiction.badgeEn;
    const badgeW = safeGetTextWidth(badgeText) + 5;
    this.doc.setFillColor(37, 99, 235);
    this.doc.roundedRect(leftX + this.maxWidth - badgeW, this.currentY, badgeW, 5.5, 0.8, 0.8, 'F');
    setFontSafe('helvetica', 'bold');
    this.doc.setFontSize(5);
    this.doc.setTextColor(255, 255, 255);
    safeText(badgeText, leftX + this.maxWidth - badgeW / 2, this.currentY + 3.8, { align: 'center' });
    this.currentY += 8;

    // Compact fixed dimensions — legible but small enough to share the signature page
    const identityImages: Array<{ label: string; dataUrl: string }> = [];
    if (identitySelfie) identityImages.push({ label: language === 'es' ? 'Selfie de validación' : 'Validation selfie', dataUrl: identitySelfie });
    if (identityIdDocFront) identityImages.push({ label: language === 'es' ? 'ID frontal' : 'ID front', dataUrl: identityIdDocFront });
    if (identityIdDocBack) identityImages.push({ label: language === 'es' ? 'ID posterior' : 'ID back', dataUrl: identityIdDocBack });

    if (identityImages.length > 0) {
      const cardGap = 6;
      const cardCount = Math.min(identityImages.length, 3);
      const maxCardWidth = 68;
      const cardWidth = Math.min(maxCardWidth, (this.maxWidth - cardGap * (cardCount - 1)) / cardCount);
      const cardHeight = 38;
      let photoX = leftX;
      const photoY = this.currentY;

      identityImages.forEach((item) => {
        this.doc.setFillColor(248, 250, 252);
        this.doc.setDrawColor(212, 220, 230);
        this.doc.setLineWidth(0.35);
        this.doc.roundedRect(photoX, photoY, cardWidth, cardHeight, 2.5, 2.5, 'FD');

        try {
          this.addImageContain(item.dataUrl, photoX + 1.5, photoY + 1.5, cardWidth - 3, cardHeight - 10);
        } catch {
          this.doc.setFont('helvetica', 'normal');
          this.doc.setFontSize(6);
          this.doc.setTextColor(148, 163, 184);
          this.safeText('[Image unavailable]', photoX + cardWidth / 2, photoY + cardHeight / 2 - 2, { align: 'center' });
        }

        this.setFontForLang('normal');
        this.doc.setFontSize(6);
        this.doc.setTextColor(80, 95, 120);
        this.safeText(item.label, photoX + cardWidth / 2, photoY + cardHeight - 2, { align: 'center' });
        photoX += cardWidth + cardGap;
      });

      this.currentY += cardHeight + 10;
      this.doc.setTextColor(0, 0, 0);
    }

    if (identityBiometric) {
      const BIOMETRIC_BOX_HEIGHT = 26;
      const FOOTER_RESERVE = 12;
      if (this.currentY + BIOMETRIC_BOX_HEIGHT + FOOTER_RESERVE > this.pageHeight - this.margin) {
        this.doc.addPage();
        this.currentY = this.margin;
      }
      this.currentY = this.addBiometricVerificationBlock(leftX, this.currentY, this.maxWidth, identityBiometric, language) + 6;
      this.doc.setTextColor(0, 0, 0);
    }
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
    generator.jurisdiction = opts.jurisdiction ?? DEFAULT_JURISDICTION;
    generator.language = opts.language ?? 'en';
    generator.datosDelUsuario = new Set(
      (opts.userValues ?? [])
        .map((v) => String(v ?? '').trim().toUpperCase())
        // Se descartan los valores muy cortos: un «SÍ» o un número suelto
        // coincidiría con demasiadas cosas y desactivaría el formato de
        // renglones que sí son estructura.
        .filter((v) => v.length >= 4),
    );
    if (opts.formattedParagraphs) generator.setMargin(18);
    await generator.ensureUnicodeFont();
    const cleanContent = generator.sanitizePremiumPlaceholders(opts.content);

    generator.addLetterhead(opts.letterhead, opts.language);
    generator.applyBrandingTopSpacing(opts.branding);
    generator.addPremiumFirstPageHeader(opts.title, opts.branding);

    // Custom Word-template documents: render the REAL per-run bold/size and
    // per-paragraph alignment from the source .docx instead of guessing
    // from generic text patterns. There's no "natural signature position"
    // to split at here (that split works on plain-text patterns
    // processContent() understands) — the signature block simply renders
    // after the full body, which matches where these documents' own
    // signature section already sits.
    if (opts.formattedParagraphs) {
      generator.processFormattedParagraphs(opts.formattedParagraphs);
      if (opts.mirrorLayout && (opts.leftSig || opts.rightSig)) {
        generator.addSignatureMirrorBlock(
          opts.leftSig,
          opts.rightSig,
          opts.mirrorLanguage ?? opts.language,
          opts.identitySelfie,
          opts.identityIdDocFront ?? opts.identityIdDoc,
          opts.identityIdDocBack,
          opts.identityBiometric,
        );
      } else if (opts.signatures?.length) {
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
    // Split content at natural signature position so PDF order matches preview:
    // [body] → [signature block] → [checklist / state compliance / addenda]
    else if (opts.mirrorLayout && (opts.leftSig || opts.rightSig)) {
      const { before, after } = generator.splitAtSignatureBlock(cleanContent);
      generator.processContent(before);
      generator.addSignatureMirrorBlock(
        opts.leftSig,
        opts.rightSig,
        opts.mirrorLanguage ?? opts.language,
        opts.identitySelfie,
        opts.identityIdDocFront ?? opts.identityIdDoc,
        opts.identityIdDocBack,
        opts.identityBiometric,
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

    // Identity verification page (separate page when photos or a biometric result exist)
    if (opts.identitySelfie || opts.identityIdDoc || opts.identityIdDocFront || opts.identityIdDocBack || opts.identityBiometric) {
      await generator.addIdentityAuditPage(
        opts.identitySelfie,
        opts.identityIdDocFront ?? opts.identityIdDoc,
        opts.identityIdDocBack,
        opts.language,
        opts.identityBiometric,
      );
    }

    // Optional audit certificate page
    generator.addAuditLogPage(opts.auditLog, opts.language);

    // Informe de Firmas — premium signature report (last content page)
    if (opts.signatures?.length) {
      generator.addSignatureReportPage(opts.signatures, opts.language, opts.title, opts.identitySelfie);
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
    generator.jurisdiction = opts.jurisdiction ?? DEFAULT_JURISDICTION;
    generator.language = opts.language ?? 'en';
    generator.datosDelUsuario = new Set(
      (opts.userValues ?? [])
        .map((v) => String(v ?? '').trim().toUpperCase())
        // Se descartan los valores muy cortos: un «SÍ» o un número suelto
        // coincidiría con demasiadas cosas y desactivaría el formato de
        // renglones que sí son estructura.
        .filter((v) => v.length >= 4),
    );
    if (opts.formattedParagraphs) generator.setMargin(18);
    await generator.ensureUnicodeFont();
    const cleanContent = generator.sanitizePremiumPlaceholders(opts.content);

    generator.addLetterhead(opts.letterhead, opts.language);
    generator.applyBrandingTopSpacing(opts.branding);
    generator.addPremiumFirstPageHeader(opts.title, opts.branding);

    if (opts.formattedParagraphs) {
      generator.processFormattedParagraphs(opts.formattedParagraphs);
      if (opts.mirrorLayout && (opts.leftSig || opts.rightSig)) {
        generator.addSignatureMirrorBlock(
          opts.leftSig,
          opts.rightSig,
          opts.mirrorLanguage ?? opts.language,
          opts.identitySelfie,
          opts.identityIdDocFront ?? opts.identityIdDoc,
          opts.identityIdDocBack,
          opts.identityBiometric,
        );
      } else if (opts.signatures?.length) {
        generator.addEmbeddedSignatures(opts.signatures, opts.language);
      } else {
        generator.addEmbeddedSignature(
          opts.auditLog?.signatureDataUrl,
          opts.auditLog?.signerName,
          opts.auditLog?.guestSignedAt,
          opts.language
        );
      }
    } else if (opts.mirrorLayout && (opts.leftSig || opts.rightSig)) {
      const { before, after } = generator.splitAtSignatureBlock(cleanContent);
      generator.processContent(before);
      generator.addSignatureMirrorBlock(
        opts.leftSig,
        opts.rightSig,
        opts.mirrorLanguage ?? opts.language,
        opts.identitySelfie,
        opts.identityIdDocFront ?? opts.identityIdDoc,
        opts.identityIdDocBack,
        opts.identityBiometric,
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

    // Identity verification page (separate page when photos or a biometric result exist)
    if (opts.identitySelfie || opts.identityIdDoc || opts.identityIdDocFront || opts.identityIdDocBack || opts.identityBiometric) {
      await generator.addIdentityAuditPage(
        opts.identitySelfie,
        opts.identityIdDocFront ?? opts.identityIdDoc,
        opts.identityIdDocBack,
        opts.language,
        opts.identityBiometric,
      );
    }

    // Optional audit certificate page
    generator.addAuditLogPage(opts.auditLog, opts.language);

    // Informe de Firmas — premium signature report (last content page)
    if (opts.signatures?.length) {
      generator.addSignatureReportPage(opts.signatures, opts.language, opts.title, opts.identitySelfie);
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