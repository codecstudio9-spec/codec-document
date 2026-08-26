import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { getTemplateById } from '../data/templates';
import { DocumentBranding, DocumentData } from '../types/document';
import { DocumentPreview } from '../components/document-preview';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { ArrowLeft, Download, Edit, Lock, ShieldCheck, CreditCard, CheckCircle2, MapPin, FileText, X, GripHorizontal, ChevronLeft, ChevronRight, BookOpen, BadgeCheck, Mail, MessageCircle, RotateCcw, Link2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/language-context';
import { getDocumentTranslation } from '../data/document-translations';
import { spanishTemplates, spanishSignerNotes } from '../data/templates-es';
import { getStateSpecificTemplate, STATE_NAMES_ES } from '../data/state-variations';
import { getCountrySpecificResignation } from '../data/resignation-country-variations';
import { PDFGenerator } from '../services/pdf-generator';
import { detectSignerCountryCode } from '../../lib/geo';
import { resolveJurisdiction } from '../data/signature-jurisdictions';
import { enrichDocumentDataWithDates } from '../utils/document-dates';
import { getPurchaseUnlockStatus } from '../services/paypal-service';
import { getSignatureAuditByOrder, getSignatureAuditsByOrder } from '../services/paypal-service';
import { useAuth } from '../contexts/auth-context';
import { PremiumDownloadModal } from '../components/PremiumDownloadModal';
import { AiReviewPanel } from '../components/ai-review-panel';
import { SelectionAiBar } from '../components/SelectionAiBar';
import { consumeDocumentLimit72h } from '../services/user-limits-service';
import { saveDocumentRecord } from '../services/documents-service';
import { markVisitorActivity, markVisitorDocumentType, markVisitorFunnelStep } from '../services/analytics-service';
import { getDocumentPrice } from '../config/paypal';
import { triggerDownload, triggerDownloadFromUrl } from '../utils/download';
import { SITE_HOSTNAME, SITE_URL } from '../config/site';
import { Logo } from '../components/brand/Logo';
import { createDocumentRecord, uploadPdfToStorage, updateDocumentPdfUrl } from '../../lib/signatureService';

export function normalizeCorruptedText(input: string): string {
  if (!input) return input;
  return input
    .replace(/Ã¡/g, 'á').replace(/Ã©/g, 'é').replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ãº/g, 'ú')
    .replace(/Ã/g, 'Á').replace(/Ã‰/g, 'É').replace(/Ã/g, 'Í').replace(/Ã“/g, 'Ó').replace(/Ãš/g, 'Ú')
    .replace(/Ã±/g, 'ñ').replace(/Ã‘/g, 'Ñ').replace(/Â¿/g, '¿').replace(/Â¡/g, '¡')
    .replace(/â€”/g, '—').replace(/â€“/g, '–').replace(/â€œ|â€/g, '"').replace(/â€˜|â€™/g, "'")
    .replace(/â•/g, '═').replace(/Ã/g, 'í');
}

/**
 * Cómo se llama quien firma, en el informe de firmas.
 *
 * Estaba fijo a «Arrendador» y «Arrendatario» para todo. Una carta de renuncia
 * salía firmada por el ARRENDADOR, que no es un error de traducción sino de
 * significado: el informe de firmas es la parte del PDF que sirve como prueba
 * de quién firmó qué, y ahí un rol inventado desmiente al documento.
 *
 * Sólo se nombra el rol cuando la plantilla lo tiene claro. En los demás casos
 * «Firmante» es exacto y no afirma nada que el documento no diga.
 */
const ROLES_POR_PLANTILLA: Record<string, { propio: [string, string]; otro: [string, string] }> = {
  // [es, en]
  'residential-lease':   { propio: ['Arrendador', 'Landlord'], otro: ['Arrendatario', 'Tenant'] },
  'resignation-letter':  { propio: ['Trabajador', 'Employee'], otro: ['Empresa', 'Employer'] },
  'promissory-note':     { propio: ['Deudor', 'Borrower'],     otro: ['Acreedor', 'Lender'] },
  'bill-of-sale-vehicle':{ propio: ['Vendedor', 'Seller'],     otro: ['Comprador', 'Buyer'] },
};

export function rolDeFirmante(templateId: string, esElPropio: boolean, language: 'en' | 'es'): string {
  const roles = ROLES_POR_PLANTILLA[templateId];
  if (!roles) return language === 'es' ? 'Firmante' : 'Signatory';
  const par = esElPropio ? roles.propio : roles.otro;
  return language === 'es' ? par[0] : par[1];
}

export function normalizeLanguageSensitiveFields(data: DocumentData, language: 'en' | 'es'): DocumentData {
  const next: DocumentData = { ...data };
  const specialRaw = String(next.special_provisions ?? '').trim();
  const isSpanishNone = /^(ninguna|ninguno|ningun|n\/a|na|no aplica|sin disposiciones)$/i.test(specialRaw);
  const isEnglishNone = /^(none|no special provisions|n\/a|na)$/i.test(specialRaw);

  if (language === 'en') {
    if (specialRaw === '' || isSpanishNone || isEnglishNone) {
      next.special_provisions = 'NONE';
    }
  } else if (language === 'es') {
    if (specialRaw === '' || isSpanishNone || isEnglishNone) {
      next.special_provisions = 'NINGUNA';
    }
  }

  return next;
}

function safeParseJson<T>(value: string | null | undefined): T | null {
  if (!value || value === 'undefined' || value === 'null') return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('blobToDataUrl: FileReader error'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(blob);
  });
}

async function ensureImageDataUrl(url?: string | null, retries = 3, timeoutMs = 6000): Promise<string | undefined> {
  if (!url) return undefined;
  if (url.startsWith('data:')) return url;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      const resp = await fetch(url, { signal: controller.signal, credentials: 'omit' });
      clearTimeout(id);
      if (!resp.ok) throw new Error(`Status ${resp.status}`);
      const blob = await resp.blob();
      const dataUrl = await blobToDataUrl(blob);
      if (dataUrl && dataUrl.startsWith('data:')) return dataUrl;
    } catch (err) {
      // small backoff
      await new Promise(r => setTimeout(r, 250 + attempt * 200));
    }
  }
  return undefined;
}

interface PlacedSig {
  id: string;
  name: string;
  dataUrl: string;
  xPct: number;
  yPct: number;
}

// ─── DraggableSignatureChip ─────────────────────────────────────────────────
// Uses direct DOM mutation during pointermove (NO React state updates) so React's
// reconciler never runs during the drag.  Only after pointerup do we commit the
// final position back into React state via requestAnimationFrame — this eliminates
// the "Failed to execute 'insertBefore' on 'Node'" reconciliation crash.
function DraggableSignatureChip({
  sig,
  containerRef,
  onMove,
  onRemove,
}: {
  sig: PlacedSig;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onMove: (id: string, xPct: number, yPct: number) => void;
  onRemove: (id: string) => void;
}) {
  const chipRef  = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const livePos  = useRef({ xPct: sig.xPct, yPct: sig.yPct });

  // When parent changes the position externally (initial placement or reset),
  // update the DOM node directly — still no React state change.
  useEffect(() => {
    if (!isDragging.current && chipRef.current) {
      chipRef.current.style.left = `${sig.xPct}%`;
      chipRef.current.style.top  = `${sig.yPct}%`;
      livePos.current = { xPct: sig.xPct, yPct: sig.yPct };
    }
  }, [sig.xPct, sig.yPct]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !containerRef.current || !chipRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollParent = containerRef.current.closest(
      '[data-preview-scroll-container]',
    ) as HTMLElement | null;
    const scrollTop = scrollParent?.scrollTop ?? 0;
    const newX = Math.max(2, Math.min(98,
      ((e.clientX - rect.left) / rect.width) * 100,
    ));
    const rawY = e.clientY - rect.top + scrollTop;
    const newY = Math.max(0.5, Math.min(99.5,
      (rawY / (containerRef.current.scrollHeight || rect.height)) * 100,
    ));
    livePos.current = { xPct: newX, yPct: newY };
    // ← Direct DOM mutation only — React reconciler stays idle during drag
    chipRef.current.style.left = `${newX}%`;
    chipRef.current.style.top  = `${newY}%`;
  }, [containerRef]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    const { xPct, yPct } = livePos.current;
    // Defer the React state update to AFTER the browser's current paint cycle
    requestAnimationFrame(() => onMove(sig.id, xPct, yPct));
  }, [sig.id, onMove]);

  const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  return (
    <div
      ref={chipRef}
      className="signature-drag-chip"
      style={{
        position: 'absolute',
        left: `${sig.xPct}%`,
        top:  `${sig.yPct}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 50,
        touchAction: 'none',
        userSelect: 'none',
        willChange: 'left, top',
        pointerEvents: 'auto',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div className="group relative cursor-grab active:cursor-grabbing">
        {/* Name label */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
            <GripHorizontal className="mb-0.5 inline size-2.5" /> {sig.name}
          </span>
        </div>
        {/* Signature image */}
        <div className="rounded border-2 border-indigo-400 bg-white/90 p-1 shadow-lg backdrop-blur-sm">
          <img
            src={sig.dataUrl}
            alt={sig.name}
            data-sig="1"
            crossOrigin="anonymous"
            className="max-h-10 max-w-[140px] object-contain"
            draggable={false}
          />
        </div>
        {/* Professional signature block below the image */}
        <div
          className="mt-0.5 border-t border-slate-700 px-1 pt-0.5"
          style={{ fontFamily: '"Times New Roman", Times, serif' }}
        >
          <p className="text-[8px] font-bold text-slate-800 leading-tight truncate max-w-[140px]">
            {sig.name}
          </p>
          <p className="text-[7px] text-slate-500 leading-tight">
            Date: ___________
          </p>
        </div>
        {/* Remove button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(sig.id); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute -right-2 -top-2 z-10 flex size-4 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600"
        >
          <X className="size-2.5" />
        </button>
      </div>
    </div>
  );
}

async function computeDocumentHash(content: string): Promise<string> {
  try {
    const encoded = new TextEncoder().encode(content);
    const buffer = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return '';
  }
}

function safePdfSetFont(pdf: import('jspdf').jsPDF, family: string, style: string = 'normal') {
  const fontFamilies = [family, 'helvetica', 'times', 'courier'];
  for (const font of fontFamilies) {
    try {
      pdf.setFont(font, style);
      return;
    } catch {
      if (style !== 'normal') {
        try {
          pdf.setFont(font, 'normal');
          return;
        } catch {
          // continue fallback chain
        }
      }
      // try next font family
    }
  }
}

function safePdfSplitTextToSize(pdf: import('jspdf').jsPDF, text: string, width: number): string[] {
  try {
    return pdf.splitTextToSize(text, width);
  } catch {
    safePdfSetFont(pdf, 'helvetica', 'normal');
    try {
      return pdf.splitTextToSize(text, width);
    } catch {
      return [text];
    }
  }
}

function safePdfText(
  pdf: import('jspdf').jsPDF,
  text: string | string[],
  x: number,
  y: number,
  opts?: any,
) {
  try {
    pdf.text(text as any, x, y, opts);
  } catch {
    safePdfSetFont(pdf, 'helvetica', 'normal');
    try {
      pdf.text(text as any, x, y, opts);
    } catch {
      const lines = Array.isArray(text) ? text : String(text).split('\n');
      lines.forEach((line, index) => {
        try {
          pdf.text(line, x, y + index * 4);
        } catch {
          // swallow; best effort only
        }
      });
    }
  }
}

function renderPdfHeader(
  pdf: import('jspdf').jsPDF,
  branding: import('../types/document').DocumentBranding,
  _title: string,
  PW: number,
  M: number,
  HEADER_H: number,
) {
  // Only render header when user has supplied custom branding (logo or company name).
  // No Codec Document promotional content in the body of a paid legal document.
  const hasLogo = branding?.enableLogo && branding?.logoDataUrl;
  const hasCompany = branding?.companyLegalName?.trim();

  if (!hasLogo && !hasCompany) {
    // Minimal top margin line only — keeps top-of-page clean
    pdf.setDrawColor(220, 220, 230);
    pdf.setLineWidth(0.15);
    pdf.line(M, M + HEADER_H, PW - M, M + HEADER_H);
    return;
  }

  // Custom branding block
  pdf.setFillColor(250, 250, 252);
  pdf.rect(0, 0, PW, M + HEADER_H, 'F');

  if (hasLogo) {
    const fmt = branding.logoDataUrl!.includes('image/png') ? 'PNG' : 'JPEG';
    safePdfAddImage(pdf, branding.logoDataUrl!, fmt, M, 5, 14, 14);
  }

  if (hasCompany) {
    safePdfSetFont(pdf, 'helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(30, 30, 60);
    safePdfText(pdf, hasCompany, PW / 2, 12, { align: 'center' });
  }

  pdf.setDrawColor(210, 215, 230);
  pdf.setLineWidth(0.2);
  pdf.line(M, M + HEADER_H, PW - M, M + HEADER_H);
}

function safePdfAddImage(
  pdf: import('jspdf').jsPDF,
  imageData: string,
  format: 'PNG' | 'JPEG',
  x: number,
  y: number,
  w: number,
  h: number,
) {
  try {
    pdf.addImage(imageData, format, x, y, w, h, undefined, 'FAST');
  } catch (err) {
    console.warn('safePdfAddImage failed, skipping image', err, imageData?.slice?.(0, 40));
  }
}

function renderPdfFooter(
  pdf: import('jspdf').jsPDF,
  company: string,
  hashSnippet: string,
  pageNum: number,
  totalPages: number,
  PW: number,
  PH: number,
  M: number,
  FOOTER_H: number,
  lang: 'en' | 'es',
) {
  const footerY = PH - FOOTER_H;

  // Thin hairline separator only — no colored background box
  pdf.setDrawColor(210, 215, 230);
  pdf.setLineWidth(0.15);
  pdf.line(M, footerY, PW - M, footerY);

  safePdfSetFont(pdf, 'helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(160, 160, 175);

  // Left: company (only if custom; omit Codec Document branding)
  const companyLabel = company !== 'Codec Document' ? company : '';
  if (companyLabel) {
    safePdfSetFont(pdf, 'helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(160, 160, 175);
    safePdfText(pdf, companyLabel, M, footerY + 5.5);
  }

  // Center: SHA-256 snippet (audit trail, discrete gray)
  if (hashSnippet) {
    safePdfSetFont(pdf, 'helvetica', 'normal');
    pdf.setFontSize(5.5);
    pdf.setTextColor(170, 170, 185);
    safePdfText(pdf, hashSnippet, PW / 2, footerY + 5.5, { align: 'center' });
  }

  // Right: page number
  pdf.setFontSize(6);
  pdf.setTextColor(160, 160, 175);
  const lbl = lang === 'es' ? `${pageNum} / ${totalPages}` : `${pageNum} / ${totalPages}`;
  safePdfText(pdf, lbl, PW - M, footerY + 5.5, { align: 'right' });
}

function renderCertificationPage(
  pdf: import('jspdf').jsPDF,
  inlineSigs: Array<{ signerName: string; signedAt: string; signatureDataUrl: string }>,
  documentHash: string,
  lang: 'en' | 'es',
  PW: number,
  PH: number,
  M: number,
) {
  pdf.addPage();
  const cy = { v: M };
  const line = (text: string, sz = 10, bold = false, color: [number, number, number] = [30, 30, 60]) => {
    if (cy.v + 8 > PH - M) { pdf.addPage(); cy.v = M; }
    safePdfSetFont(pdf, 'helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(sz);
    pdf.setTextColor(...color);
    safePdfText(pdf, text, M, cy.v);
    cy.v += sz * 0.5 + 3;
  };
  const gap = (n = 4) => { cy.v += n; };

  // Header
  pdf.setFillColor(30, 30, 80);
  pdf.rect(0, 0, PW, 28, 'F');
  safePdfSetFont(pdf, 'helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  safePdfText(pdf, lang === 'es' ? 'CERTIFICADO DE FIRMA DIGITAL' : 'DIGITAL SIGNATURE CERTIFICATE', PW / 2, 13, { align: 'center' });
  safePdfSetFont(pdf, 'helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(200, 200, 255);
  safePdfText(pdf, 'Codec Document — E-SIGN Act / UETA Compliant', PW / 2, 22, { align: 'center' });
  cy.v = 36;

  gap(2);
  line(lang === 'es' ? 'HASH SHA-256 DEL DOCUMENTO:' : 'DOCUMENT SHA-256 HASH:', 9, true, [80, 30, 180]);
  gap(1);
  safePdfSetFont(pdf, 'courier', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(50, 50, 50);
  const halfLen = Math.floor(documentHash.length / 2);
  safePdfText(pdf, documentHash.slice(0, halfLen), M, cy.v);
  cy.v += 6;
  safePdfText(pdf, documentHash.slice(halfLen), M, cy.v);
  cy.v += 8;

  gap(4);
  line(lang === 'es' ? 'FIRMANTES:' : 'SIGNATORIES:', 10, true, [28, 28, 80]);
  gap(3);
  inlineSigs.forEach((sig, i) => {
    line(`${i + 1}. ${sig.signerName}`, 9, true);
    line(`   ${lang === 'es' ? 'Firmado el' : 'Signed at'}: ${new Date(sig.signedAt).toLocaleString()}`, 8, false, [80, 80, 110]);
    if (sig.signatureDataUrl) {
      const fmt = sig.signatureDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      safePdfAddImage(pdf, sig.signatureDataUrl, fmt, M + 4, cy.v, 50, 14);
      cy.v += 18;
    }
    gap(4);
  });

  gap(8);
  line(lang === 'es' ? 'INFORMACIÓN LEGAL:' : 'LEGAL INFORMATION:', 9, true, [80, 30, 180]);
  gap(2);
  const legal = lang === 'es'
    ? 'Este documento ha sido firmado electrónicamente de conformidad con la Ley ESIGN (Electronic Signatures in Global and National Commerce Act) y la UETA (Uniform Electronic Transactions Act). Las firmas digitales contenidas en este documento tienen la misma validez legal que las firmas manuscritas.'
    : 'This document was electronically signed in compliance with the Electronic Signatures in Global and National Commerce Act (E-SIGN Act) and the Uniform Electronic Transactions Act (UETA). Electronic signatures carry the same legal weight as handwritten signatures.';
  safePdfSetFont(pdf, 'helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(80, 80, 100);
  const wrapped = safePdfSplitTextToSize(pdf, legal, PW - 2 * M);
  wrapped.forEach((l: string) => { safePdfText(pdf, l, M, cy.v); cy.v += 5; });

  gap(10);
  line(`${lang === 'es' ? 'Generado' : 'Generated'}: ${new Date().toLocaleString()}`, 7.5, false, [120, 120, 140]);
  line(`Codec Document Platform — ${SITE_HOSTNAME}`, 7.5, false, [120, 120, 140]);
}

export function PreviewPage() {
  const { documentType } = useParams<{ documentType: string }>();
  const navigate = useNavigate();
  const template = getTemplateById(documentType || '');
  const previewRef = useRef<HTMLDivElement>(null);
  const documentCanvasRef = useRef<HTMLDivElement>(null);
  // Ref for the wrapper that contains both the document layer and the chip overlay layer.
  // html2canvas must capture this wrapper (not documentCanvasRef alone) so signatures appear in the PDF.
  const captureWrapperRef = useRef<HTMLDivElement>(null);
  const { t, language } = useLanguage();
  const { user, token, session, isAdmin, unlimitedActive, subscriptionActive, purchasedDocumentIds } = useAuth();
  const purchaserEmail = (sessionStorage.getItem('purchaserEmail') || localStorage.getItem('purchaserEmail') || '').toLowerCase();

  const [documentData, setDocumentData] = useState<DocumentData>({});
  const [documentBranding, setDocumentBranding] = useState<DocumentBranding>({});
  const [editedContent, setEditedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  /**
   * ¿El usuario reescribió el documento a mano?
   *
   * Sin esta bandera, editar no servía de nada: al salir del editor la vista
   * se reconstruía desde la plantilla y los datos del formulario, y lo escrito
   * desaparecía. El PDF hacía lo mismo. Y encima salía un aviso de «cambios
   * guardados» que no era cierto.
   *
   * Con ella, el texto editado manda: se muestra, se descarga y sobrevive a
   * recargar la página. Deja de mandar sólo si se pulsa «descartar cambios».
   */
  const [edicionManual, setEdicionManual] = useState(false);
  const CLAVE_EDICION = `codec_doc_editado_${documentType ?? 'desconocido'}`;
  const [isPurchased, setIsPurchased] = useState(false);
  const [exportLanguage, setExportLanguage] = useState<'en' | 'es'>('en');
  const [placedSignatures, setPlacedSignatures] = useState<PlacedSig[]>([]);
  const [identitySelfie, setIdentitySelfie] = useState<string | undefined>();
  const [identityIdDocFront, setIdentityIdDocFront] = useState<string | undefined>();
  const [identityIdDocBack, setIdentityIdDocBack] = useState<string | undefined>();
  const [identityBiometric, setIdentityBiometric] = useState<{ deviceLabel: string; verifiedAt: string; credentialIdHash: string } | undefined>();
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'download' | 'sign' | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedState, setSelectedState] = useState<string>('');
  const [estimatedPageCount, setEstimatedPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Business Intelligence funnel — reaching this page at all is the
    // "previsualizó" step, independent of whether they go on to pay.
    markVisitorFunnelStep('previewed');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const checkPersistentPurchase = async () => {
      const orderId = sessionStorage.getItem('paypalOrderId');
      if (!orderId) return;

      try {
        const status = await getPurchaseUnlockStatus(orderId);
        if (status?.unlocked) {
          setIsPurchased(true);
        }
      } catch (error) {
        console.warn('Could not verify persistent purchase status from backend:', error);
      }
    };

    const savedData = sessionStorage.getItem('documentData');
    const savedBranding = sessionStorage.getItem('documentBranding');
    const savedType = sessionStorage.getItem('documentType');
    const savedState = sessionStorage.getItem('selectedState');
    const purchaseStatus = sessionStorage.getItem('isPurchased');
    const localPurchaseStatus = documentType
      ? localStorage.getItem(`codec_purchase_${documentType}`)
      : null;

    // Check if returning from successful purchase
    if (purchaseStatus === 'true') {
      setIsPurchased(true);
      sessionStorage.removeItem('isPurchased'); // Clean up
    }

    if (localPurchaseStatus === 'true') {
      setIsPurchased(true);
    }

    if (documentType && purchasedDocumentIds.includes(documentType)) {
      setIsPurchased(true);
      localStorage.setItem(`codec_purchase_${documentType}`, 'true');
    }

    if (savedState) {
      setSelectedState(savedState);
    }

    if (savedData && savedType === documentType) {
      const parsed = safeParseJson<DocumentData>(savedData);
      if (parsed) {
        setDocumentData(parsed);
        if (savedBranding) {
          const branding = safeParseJson<DocumentBranding>(savedBranding);
          if (branding) setDocumentBranding(branding);
        }

        if (template) {
          updatePreviewContent(parsed, savedState || '');
        }

        // Pre-populate owner signature from Step 2 (sign step)
        const ownerSigUrl = sessionStorage.getItem('userSignatureDataUrl');
        const sigX = parseFloat(sessionStorage.getItem('sigPlacementX') || '0');
        const sigY = parseFloat(sessionStorage.getItem('sigPlacementY') || '0');

        const allSigs: PlacedSig[] = [];

        if (ownerSigUrl) {
          allSigs.push({
            id: 'owner',
            // Quién firma, buscado entre los campos con los que cada plantilla
            // llama a su parte principal.
            //
            // Antes sólo se miraban tres —landlord_name, owner_name,
            // party_one— y cualquier documento que no fuera un arriendo caía
            // en el literal 'Owner'. La carta de renuncia salía firmada por
            // «OWNER / Owner»: un rol interno del sistema impreso como si
            // fuera el nombre de una persona.
            name: String(
              parsed.employee_name || parsed.landlord_name || parsed.owner_name
              || parsed.seller_name || parsed.client_name || parsed.testator_name
              || parsed.planner_name || parsed.borrower_name || parsed.contractor_name
              || parsed.disclosing_party_name || parsed.party_one || '',
            ).trim(),
            dataUrl: ownerSigUrl,
            xPct: sigX > 0 ? sigX : 18,
            yPct: sigY > 0 ? sigY : 82,
          });
        }

        // Load co-signer signatures saved by document-generator-page Step 2
        const coSignersJson = sessionStorage.getItem('coSigners');
        if (coSignersJson) {
          const coSigners = safeParseJson<Array<{
            id: string;
            name: string;
            sigDataUrl: string;
            placement: { x: number; y: number } | null;
          }>>(coSignersJson);
          if (coSigners) {
            coSigners
              .filter((cs) => cs.sigDataUrl)
              .forEach((cs, i) => {
                allSigs.push({
                  id: `cs-${cs.id}`,
                  name: cs.name,
                  dataUrl: cs.sigDataUrl,
                  xPct: cs.placement ? cs.placement.x : Math.min(80, 30 + i * 22),
                  yPct: cs.placement ? cs.placement.y : 86,
                });
              });
          }
        }

        if (allSigs.length > 0) setPlacedSignatures(allSigs);

        // Identity verification photos from Step 3
        const identitySelfie = sessionStorage.getItem('identitySelfie') || undefined;
        const identityIdDocFront =
          sessionStorage.getItem('identityIdDocFront') ||
          sessionStorage.getItem('identityIdDoc') ||
          undefined;
        const identityIdDocBack = sessionStorage.getItem('identityIdDocBack') || undefined;
        if (identitySelfie) setIdentitySelfie(identitySelfie);
        if (identityIdDocFront) setIdentityIdDocFront(identityIdDocFront);
        if (identityIdDocBack) setIdentityIdDocBack(identityIdDocBack);

        const identityBiometricRaw = sessionStorage.getItem('identityBiometric');
        if (identityBiometricRaw) {
          const parsedBiometric = safeParseJson<{ deviceLabel: string; verifiedAt: string; credentialIdHash: string }>(identityBiometricRaw);
          if (parsedBiometric) setIdentityBiometric(parsedBiometric);
        }
      } else {
        navigate(`/generator/${documentType}`);
      }
    }

    checkPersistentPurchase();
  }, [documentType, navigate, template, purchasedDocumentIds]);

  // Restaurar una edición manual anterior. Va en su propio efecto y depende
  // sólo del documento: si se recupera después de que updatePreviewContent
  // haya escrito la versión generada, la pisa —que es lo correcto, porque la
  // edición del usuario manda sobre la plantilla.
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_EDICION);
      if (guardado && guardado.trim()) {
        setEditedContent(guardado);
        setEdicionManual(true);
      }
    } catch { /* sin localStorage: se sigue sin edición guardada */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentType]);

  // Update preview when language changes
  useEffect(() => {
    if (template && Object.keys(documentData).length > 0) {
      updatePreviewContent(documentData, selectedState);
    }
  }, [language]);

  // Estimate page count from rendered canvas height (1 letter page ≈ 1056px at 96 dpi)
  useEffect(() => {
    if (!documentCanvasRef.current || !editedContent) return;
    const PAGE_H_PX = 1056;
    const measure = () => {
      const h = documentCanvasRef.current?.scrollHeight ?? 0;
      setEstimatedPageCount(Math.max(1, Math.ceil(h / PAGE_H_PX)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(documentCanvasRef.current);
    return () => ro.disconnect();
  }, [editedContent]);

  // Track current visible page as user scrolls
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const onScroll = () => {
      const pct = el.scrollTop / (el.scrollHeight - el.clientHeight || 1);
      setCurrentPage(Math.min(estimatedPageCount, Math.max(1, Math.round(pct * estimatedPageCount) + 1)));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [estimatedPageCount]);

  // Keyboard and right-click copy protection — derived from primitive states to avoid TDZ
  // (canDownloadOriginal is declared after the early-return, so we cannot reference it here)
  useEffect(() => {
    const isRestricted = !isPurchased && !unlimitedActive && !subscriptionActive && !isAdmin;
    if (!isRestricted) return;

    const block = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'a', 'p', 's'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const blockContext = (e: MouseEvent) => e.preventDefault();

    document.addEventListener('keydown', block, true);
    document.addEventListener('contextmenu', blockContext, true);
    return () => {
      document.removeEventListener('keydown', block, true);
      document.removeEventListener('contextmenu', blockContext, true);
    };
  }, [isPurchased, unlimitedActive, subscriptionActive, isAdmin]);

  const updatePreviewContent = (data: DocumentData, state: string) => {
    // Recalcular desde la plantilla borraría lo que el usuario escribió a
    // mano. Cambiar de idioma o de estado ya no le pisa la edición; si quiere
    // volver a la versión generada, tiene el botón de descartar.
    if (edicionManual) return;
    updatePreviewContentForzado(data, state);
  };

  /** Reconstruye el documento desde la plantilla y los datos, sin mirar si
   *  hay una edición manual. La usa «descartar cambios», que es justo cuando
   *  hay que pisarla. */
  const updatePreviewContentForzado = (data: DocumentData, state: string) => {
    if (!template) return;

    try {
      // Use Spanish template for preview if interface is in Spanish
      let templateToUse = language === 'es' && spanishTemplates[template.id]
        ? spanishTemplates[template.id]
        : template.template;

      // Apply state-specific variations if state is selected
      if (state) {
        templateToUse = getStateSpecificTemplate(templateToUse, template.id, state, language);
      }

      // La carta de renuncia se adapta al pais elegido en el propio
      // formulario: cedula o DNI, liquidacion o finiquito. El pais nunca
      // aparece escrito en el documento, solo decide el vocabulario.
      if (template.id === 'resignation-letter') {
        templateToUse = getCountrySpecificResignation(
          templateToUse,
          String(data.country ?? ''),
          language,
        );
      }

      let content = templateToUse;
      
      const dataWithDate = normalizeLanguageSensitiveFields(enrichDocumentDataWithDates(data, language, template.id), language);
      
      // Process Handlebars-like conditionals {{#if field}}...{{/if}}
      // Use a safe regex that handles nested content
      content = content.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, fieldName, innerContent) => {
        const cleanFieldName = fieldName.trim();
        const fieldValue = dataWithDate[cleanFieldName];
        // Show content if field has a truthy value
        if (fieldValue && fieldValue !== '' && fieldValue !== 'No' && fieldValue !== 'false') {
          return innerContent;
        }
        return '';
      });
      
      // Replace all variables with data
      Object.entries(dataWithDate).forEach(([key, value]) => {
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g');
        const normalizedValue = typeof value === 'boolean' ? (value ? '(x)' : '( )') : value;
        content = content.replace(regex, String(normalizedValue || ''));
      });
      
      // Replace any remaining variables with clean empty content (no noisy placeholders)
      content = content.replace(/\{\{([^}]+)\}\}/g, '');
      
      setEditedContent(normalizeCorruptedText(content));
    } catch (error) {
      console.error('Error updating preview content:', error);
      setEditedContent(language === 'en' ? 'Error loading document preview. Please try again.' : 'Error al cargar la vista previa del documento. Inténtalo de nuevo.');
    }
  };

  if (!template) {
    return null;
  }

  const handlePremiumSuccess = (orderId: string) => {
    sessionStorage.setItem('isPurchased', 'true');
    sessionStorage.setItem('paypalOrderId', orderId);
    if (documentType) localStorage.setItem(`codec_purchase_${documentType}`, 'true');
    setIsPurchased(true);
    setPremiumModalOpen(false);
    toast.success(
      language === 'en'
        ? '✓ Payment successful — downloading clean PDF…'
        : '✓ Pago exitoso — descargando PDF limpio…',
    );
    // Execute the pending action after a brief delay so state can settle
    setTimeout(() => {
      if (pendingAction === 'download') void handleDownload();
      setPendingAction(null);
    }, 400);
  };

  const canDownloadFree = isPurchased || unlimitedActive || subscriptionActive || isAdmin;
  const canEditDocument = unlimitedActive || subscriptionActive || isAdmin;

  /** Same variable-interpolation logic handleDownload uses to build
   * `exportContent` for the PDF — pulled out so the AI review panel can
   * get real document text without duplicating a payment-relevant flow or
   * waiting on a download click. Pure/no side effects, safe to call as
   * often as the panel re-renders. */

  /**
   * La plantilla que ve la vista previa, con las variantes de país ya
   * aplicadas.
   *
   * Antes se le pasaba la plantilla en crudo, así que los marcadores
   * `{{__documento}}`, `{{__liquidacion}}` y `{{__certificado}}` no los
   * resolvía nadie y el componente los pintaba como campos vacíos: la carta
   * decía «identificado con ______ número 1022925002» y «se proceda con la
   * ______ y demás conceptos». En el PDF salían bien, porque ésa es otra ruta
   * que sí los procesa — la vista previa y el documento descargado no
   * coincidían.
   */
  const plantillaParaVista = (() => {
    let base = exportLanguage === 'es' && spanishTemplates[template.id]
      ? spanishTemplates[template.id]
      : template.template;
    if (selectedState) base = getStateSpecificTemplate(base, template.id, selectedState, exportLanguage);
    if (template.id === 'resignation-letter') {
      base = getCountrySpecificResignation(base, String(documentData.country ?? ''), exportLanguage);
    }
    return base;
  })();

  /** Nota de cierre para ambas partes, en el idioma de exportación — nunca
   *  editable a mano (no forma parte de plantillaParaVista/editedContent),
   *  ver signerNote en types/document.ts. */
  const signerNoteParaVista = exportLanguage === 'es'
    ? (spanishSignerNotes[template.id] || undefined)
    : template.signerNote;

  const computeExportContent = (): string => {
    // Lo que el usuario reescribió es el documento. Antes el PDF se rearmaba
    // desde la plantilla y descartaba la edición sin avisar, así que lo que se
    // veía en pantalla y lo que se descargaba eran dos documentos distintos.
    if (edicionManual && editedContent.trim()) return editedContent;

    let templateForExport = exportLanguage === 'es' && spanishTemplates[template.id]
      ? spanishTemplates[template.id]
      : template.template;

    if (selectedState) {
      templateForExport = getStateSpecificTemplate(templateForExport, template.id, selectedState, exportLanguage);
    }

    // Igual que en la vista previa: sin esto, el PDF exportado saldria con
    // los marcadores {{__documento}} en crudo.
    if (template.id === 'resignation-letter') {
      templateForExport = getCountrySpecificResignation(
        templateForExport,
        String(documentData.country ?? ''),
        exportLanguage,
      );
    }

    let content = templateForExport;
    const enrichedData = normalizeLanguageSensitiveFields(
      enrichDocumentDataWithDates(documentData, exportLanguage, template.id),
      exportLanguage,
    );

    content = content.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, fieldName, innerContent) => {
      const cleanFieldName = fieldName.trim();
      const fieldValue = enrichedData[cleanFieldName];
      if (fieldValue && fieldValue !== '' && fieldValue !== 'No' && fieldValue !== 'false') {
        return innerContent;
      }
      return '';
    });

    Object.entries(enrichedData).forEach(([key, value]) => {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g');
      const normalizedValue = typeof value === 'boolean' ? (value ? '(x)' : '( )') : value;
      content = content.replace(regex, String(normalizedValue || ''));
    });

    content = content.replace(/\{\{([^}]+)\}\}/g, '');
    return normalizeCorruptedText(content);
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    let fileName = '';

    try {
      if (!user || !token) {
        toast.error(language === 'en' ? 'Please sign in with Google before generating documents.' : 'Debes iniciar sesión con Google antes de generar documentos.');
        return;
      }

      // Gate: atomically check-and-consume the free document quota (2 / 72h,
      // measured from the action that hit the limit). Only fires here, right
      // before the real download — never earlier in the flow.
      if (!canDownloadFree) {
        const { allowed } = user.id
          ? await consumeDocumentLimit72h(user.id, false)
          : { allowed: false };
        if (!allowed) {
          setPendingAction('download');
          setPremiumModalOpen(true);
          return;
        }
      }

      // Generate content based on user's selected export language
      let templateForExport = exportLanguage === 'es' && spanishTemplates[template.id]
        ? spanishTemplates[template.id]
        : template.template;

    // Apply state-specific variations
    if (selectedState) {
      templateForExport = getStateSpecificTemplate(templateForExport, template.id, selectedState, exportLanguage);
    }

    // Igual que en la vista previa: sin esto, el PDF exportado saldria con
    // los marcadores {{__documento}} en crudo.
    if (template.id === 'resignation-letter') {
      templateForExport = getCountrySpecificResignation(
        templateForExport,
        String(documentData.country ?? ''),
        exportLanguage,
      );
    }

    let exportContent = templateForExport;
    
    const enrichedData = normalizeLanguageSensitiveFields(
      enrichDocumentDataWithDates(documentData, exportLanguage, template.id),
      exportLanguage,
    );
    
    // Process Handlebars-like conditionals {{#if field}}...{{/if}}
    exportContent = exportContent.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, fieldName, innerContent) => {
      const cleanFieldName = fieldName.trim();
      const fieldValue = enrichedData[cleanFieldName];
      if (fieldValue && fieldValue !== '' && fieldValue !== 'No' && fieldValue !== 'false') {
        return innerContent;
      }
      return '';
    });
    
    // Replace all variables with data
    Object.entries(enrichedData).forEach(([key, value]) => {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g');
      const normalizedValue = typeof value === 'boolean' ? (value ? '(x)' : '( )') : value;
      exportContent = exportContent.replace(regex, String(normalizedValue || ''));
    });
    
    // Replace any remaining variables with clean empty content
    exportContent = exportContent.replace(/\{\{([^}]+)\}\}/g, '');

    exportContent = normalizeCorruptedText(exportContent);

    // Generate professional PDF
    const stateSuffix = selectedState ? `_${selectedState.replace(/\s+/g, '_')}` : '';
    const fileName = `${template.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-\.]/g, '')}${stateSuffix}_${exportLanguage}.pdf`;

    // Resolve remote image URLs to data URLs (signatures, identity photos, branding)
    const allSrcs = new Set<string>();
    placedSignatures.forEach(s => { if (s.dataUrl) allSrcs.add(s.dataUrl); });
    if (identitySelfie) allSrcs.add(identitySelfie);
    if (identityIdDocFront) allSrcs.add(identityIdDocFront);
    if (identityIdDocBack) allSrcs.add(identityIdDocBack);
    if (documentBranding?.logoDataUrl) allSrcs.add(documentBranding.logoDataUrl as string);

    const resolvedEntries = await Promise.all(Array.from(allSrcs).map(async (src) => [src, await ensureImageDataUrl(src)] as const));
    const resolvedMap = Object.fromEntries(resolvedEntries) as Record<string, string | undefined>;

    const inlineSigs = placedSignatures.map((s) => ({
      signerName: s.name,
      signedAt: new Date().toISOString(),
      signatureDataUrl: resolvedMap[s.dataUrl] || s.dataUrl,
      xDocPct: s.xPct,
      yDocPct: s.yPct,
    }));

    const hiFiOk = await downloadHighFidelityPdf(inlineSigs, exportContent, fileName, resolvedMap);

    if (!hiFiOk) {
      const orderId = sessionStorage.getItem('paypalOrderId') || localStorage.getItem('paypalOrderId') || '';
      const auditResponse  = orderId ? await getSignatureAuditByOrder(orderId).catch(() => ({ found: false })) : { found: false };
      const auditsResponse = orderId ? await getSignatureAuditsByOrder(orderId).catch(() => ({ found: false, signatures: [] })) : { found: false, signatures: [] };

      const fallbackSigs = (auditsResponse as any)?.found && (auditsResponse as any).signatures?.length > 0
        ? (auditsResponse as any).signatures
        : placedSignatures.length > 0
          ? placedSignatures.map((sig) => ({
              signerName:       sig.name,
              signerRole:       rolDeFirmante(template.id, sig.id === 'owner', exportLanguage),
              signatureDataUrl: sig.dataUrl,
              guestSignedAt:    new Date().toISOString(),
              xDocPct:          sig.xPct,
              yDocPct:          sig.yPct,
            }))
          : undefined;

      const baseAudit = (auditResponse as any)?.found ? (auditResponse as any).audit : undefined;
      const locationState = String(
        (documentData as any)?.state ||
        (documentData as any)?.governing_state ||
        selectedState ||
        '',
      ).trim();
      const locationCity = String(
        (documentData as any)?.city ||
        (documentData as any)?.property_city ||
        (documentData as any)?.sale_location_city ||
        '',
      ).trim();
      const locationCountry = String(
        (documentData as any)?.country ||
        'United States',
      ).trim();

      const enrichedAudit = baseAudit
        ? {
            ...baseAudit,
            browser: baseAudit.browser || undefined,
            operatingSystem: baseAudit.operatingSystem || undefined,
            country: baseAudit.country || locationCountry || undefined,
            state: baseAudit.state || locationState || undefined,
            city: baseAudit.city || locationCity || undefined,
          }
        : undefined;

      try { console.log('USER', user); console.log('IS_ADMIN', isAdmin); console.log('PERMISSIONS', (user as any)?.permissions || null); } catch {}
      // Real-time detection of whoever is generating THIS export — covers
      // the common case (the document owner signing/downloading their own
      // document); enrichedAudit.country (a real recipient's geo, when a
      // paid-order audit record exists) is used as a secondary signal.
      const jurisdiction = resolveJurisdiction((await detectSignerCountryCode()) || enrichedAudit?.country || null);
      const blob = await PDFGenerator.generateBlob({
        content:      exportContent,
        // Para que el maquetador sepa qué renglones son datos de la persona y
        // no estructura del documento. Sin esto, un nombre de empresa escrito
        // en mayúsculas se imprimía centrado y en negrita como si fuera el
        // título del documento.
        userValues:   Object.values(documentData),
        title:        getDocumentTranslation(template.id, 'name', exportLanguage),
        fileName,
        language:     exportLanguage,
        state:        selectedState,
        showWatermark: false,
        branding:     documentBranding,
        auditLog:     enrichedAudit,
        jurisdiction,
        signatures:   fallbackSigs,
        leftSig:  placedSignatures.find(s => s.id === 'owner')
          ? { dataUrl: placedSignatures.find(s => s.id === 'owner')!.dataUrl, name: placedSignatures.find(s => s.id === 'owner')!.name }
          : undefined,
        rightSig: placedSignatures.find(s => s.id !== 'owner')
          ? { dataUrl: placedSignatures.find(s => s.id !== 'owner')!.dataUrl, name: placedSignatures.find(s => s.id !== 'owner')!.name }
          : undefined,
        mirrorLayout: true,
        mirrorLanguage: exportLanguage,
        identitySelfie,
        identityIdDocFront,
        identityIdDocBack,
        identityBiometric,
        signerNote: signerNoteParaVista,
      });

      ultimoPdf.current = { blob, fileName };
      await triggerDownload(blob, fileName);
    }

    // Save to the user's profile ("Mis documentos") now that the download
    // genuinely succeeded — saveDocumentRecord existed and was imported
    // but was never actually called anywhere, so nothing a logged-in user
    // generated ever showed up in /my-documents. Best-effort: a save
    // failure here shouldn't undo the successful download the user just got.
    if (user.id) {
      saveDocumentRecord(user.id, template.id, template.name || template.id).catch((err) => {
        console.error('saveDocumentRecord failed:', err);
      });
    }

    markVisitorActivity('document', 'document-generator');
    if (documentType) markVisitorDocumentType(documentType);
    toast.success(t('preview.documentDownloaded'));
  } catch (error) {
    console.error('Preview download failed:', error);
    console.error('Error detallado al generar PDF:', error);
    toast.error(
      language === 'en'
        ? 'Unable to generate the PDF. Please try again or refresh the page.'
        : 'No se pudo generar el PDF. Intenta de nuevo o actualiza la página.'
    );
  } finally {
    setIsDownloading(false);
  }
  };

  /**
   * El último PDF generado, para poder compartir EL DOCUMENTO y no una frase
   * que habla de él.
   *
   * Compartir construía un mensaje de WhatsApp que decía «te comparto este
   * documento» sin adjuntar nada y sin ningún enlace: quien lo recibía no tenía
   * forma de llegar al documento. Ahora se comparte el archivo de verdad.
   */
  const ultimoPdf = useRef<{ blob: Blob; fileName: string } | null>(null);
  const [compartiendo, setCompartiendo] = useState(false);

  const textoParaCompartir = () => {
    const nombre = getDocumentTranslation(template?.id ?? '', 'name', language) || template?.name || '';
    return language === 'es'
      ? `Te comparto el documento: ${nombre}.

Generado con Codec Document — ${SITE_URL}`
      : `Sharing this document with you: ${nombre}.

Generated with Codec Document — ${SITE_URL}`;
  };

  /** Enlace público al PDF, una vez subido. Se guarda para no volver a subir
   *  el mismo archivo si el usuario comparte por dos vías distintas. */
  const [enlaceCompartir, setEnlaceCompartir] = useState('');
  const [enlaceCopiado, setEnlaceCopiado] = useState(false);

  /**
   * Deja el PDF publicado y devuelve su enlace.
   *
   * Compartir «el documento» sin un enlace obliga a que el receptor tenga el
   * archivo, y por WhatsApp Web o por correo eso no siempre se puede. Con un
   * enlace, quien lo recibe abre el PDF desde cualquier dispositivo.
   *
   * Se genera el mismo PDF certificado de la descarga —no una versión aparte—
   * y se sube una sola vez: las tres formas de compartir usan el mismo enlace.
   */
  const obtenerEnlace = async (): Promise<string> => {
    if (enlaceCompartir) return enlaceCompartir;
    if (!ultimoPdf.current) await handleDownload();
    const guardado = ultimoPdf.current;
    if (!guardado) throw new Error('No se pudo generar el PDF');

    const documentId = await createDocumentRecord({
      name: guardado.fileName.replace(/\.pdf$/i, ''),
      userId: user?.id ?? null,
    });
    const url = await uploadPdfToStorage(documentId, guardado.blob, 'compartido.pdf');
    await updateDocumentPdfUrl(documentId, url).catch(() => { /* el enlace ya sirve */ });
    setEnlaceCompartir(url);
    return url;
  };

  const compartirPorWhatsApp = async () => {
    setCompartiendo(true);
    try {
      const url = await obtenerEnlace();
      window.open(`https://wa.me/?text=${encodeURIComponent(`${textoParaCompartir()}

${url}`)}`, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('compartirPorWhatsApp:', err);
      toast.error(language === 'es' ? 'No se pudo preparar el enlace.' : 'Could not prepare the link.');
    } finally { setCompartiendo(false); }
  };

  const compartirPorCorreo = async () => {
    setCompartiendo(true);
    try {
      const url = await obtenerEnlace();
      const nombre = getDocumentTranslation(template?.id ?? '', 'name', language) || template?.name || '';
      const asunto = encodeURIComponent(nombre);
      const cuerpo = encodeURIComponent(`${textoParaCompartir()}

${language === 'es' ? 'Descárgalo aquí' : 'Download it here'}: ${url}`);
      window.location.href = `mailto:?subject=${asunto}&body=${cuerpo}`;
    } catch (err) {
      console.error('compartirPorCorreo:', err);
      toast.error(language === 'es' ? 'No se pudo preparar el enlace.' : 'Could not prepare the link.');
    } finally { setCompartiendo(false); }
  };

  const copiarEnlace = async () => {
    setCompartiendo(true);
    try {
      const url = await obtenerEnlace();
      await navigator.clipboard.writeText(url);
      setEnlaceCopiado(true);
      setTimeout(() => setEnlaceCopiado(false), 2500);
      toast.success(language === 'es' ? 'Enlace copiado' : 'Link copied');
    } catch (err) {
      console.error('copiarEnlace:', err);
      toast.error(language === 'es' ? 'No se pudo copiar el enlace.' : 'Could not copy the link.');
    } finally { setCompartiendo(false); }
  };

  /**
   * Comparte el PDF por el menú del sistema (WhatsApp, correo, AirDrop…).
   *
   * Si el documento aún no se ha generado, se genera primero: compartir tiene
   * que producir el mismo archivo certificado que la descarga, no una versión
   * distinta armada aparte.
   *
   * `navigator.share` con archivos sólo existe en móvil y en algunos
   * escritorios. Donde no está, se descarga el PDF y se abre WhatsApp con el
   * texto: el archivo queda en el dispositivo listo para adjuntar, que es lo
   * máximo que un navegador permite hacer sin su ayuda.
   */
  const compartirDocumento = async () => {
    setCompartiendo(true);
    try {
      if (!ultimoPdf.current) await handleDownload();
      const guardado = ultimoPdf.current;

      if (guardado) {
        const archivo = new File([guardado.blob], guardado.fileName, { type: 'application/pdf' });
        const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
        if (nav.share && nav.canShare?.({ files: [archivo] })) {
          await nav.share({
            files: [archivo],
            title: guardado.fileName.replace(/\.pdf$/i, ''),
            text: textoParaCompartir(),
          });
          return;
        }
      }

      window.open(`https://wa.me/?text=${encodeURIComponent(textoParaCompartir())}`, '_blank', 'noopener,noreferrer');
      toast.info(language === 'es'
        ? 'El PDF quedó descargado en tu dispositivo: adjúntalo en el chat que se abrió.'
        : 'The PDF was downloaded to your device: attach it in the chat that just opened.');
    } catch (err) {
      // Cancelar el menú de compartir lanza AbortError, y eso no es un fallo.
      if ((err as Error)?.name !== 'AbortError') {
        console.error('compartirDocumento:', err);
        toast.error(language === 'es' ? 'No se pudo compartir el documento.' : 'Could not share the document.');
      }
    } finally {
      setCompartiendo(false);
    }
  };

  const handleEdit = () => {
    if (isEditing) {
      // Se sale del editor: lo escrito pasa a ser el documento.
      setEdicionManual(true);
      try { localStorage.setItem(CLAVE_EDICION, editedContent); } catch { /* sin espacio: se mantiene en memoria */ }
      setIsEditing(false);
      toast.success(t('preview.changesSaved'));
    } else {
      setIsEditing(true);
    }
  };

  /** Vuelve al documento generado desde el formulario. */
  const descartarEdicion = () => {
    setEdicionManual(false);
    try { localStorage.removeItem(CLAVE_EDICION); } catch { /* nada que borrar */ }
    updatePreviewContentForzado(documentData, selectedState);
    setIsEditing(false);
    toast.success(language === 'en' ? 'Back to the generated document.' : 'Se volvió al documento generado.');
  };

  const scrollToPage = (page: number) => {
    const el = previewRef.current;
    if (!el || estimatedPageCount < 2) return;
    const PAGE_H_PX = 1056;
    const targetTop = (page - 1) * PAGE_H_PX;
    el.scrollTo({ top: targetTop, behavior: 'smooth' });
    setCurrentPage(page);
  };

  const handleSigMove = useCallback((id: string, xPct: number, yPct: number) => {
    setPlacedSignatures(prev => prev.map(s => s.id === id ? { ...s, xPct, yPct } : s));
  }, []);

  const handleSigRemove = useCallback((id: string) => {
    setPlacedSignatures(prev => prev.filter(s => s.id !== id));
  }, []);


  const downloadHighFidelityPdf = async (
    inlineSigs: Array<{ signerName: string; signedAt: string; signatureDataUrl: string }>,
    exportContent: string,
    fileName: string,
    resolvedImageMap?: Record<string, string | undefined>,
  ): Promise<boolean> => {
    const sourceEl = captureWrapperRef.current ?? documentCanvasRef.current;
    if (!sourceEl) return false;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // ── 1. Ensure live sig images are loaded before cloning ───────────────
      await Promise.all(
        Array.from(sourceEl.querySelectorAll<HTMLImageElement>('img[data-sig]')).map(img => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise<void>(r => { img.onload = img.onerror = () => r(); });
        }),
      );

      // ── 2. Clone element into a hidden off-screen container ───────────────
      // Cloning avoids scroll-container clipping and timing issues with the live DOM.
      const clone = sourceEl.cloneNode(true) as HTMLElement;
      const sourceW = sourceEl.offsetWidth || 850;
      const targetWidth = Math.max(sourceW, 900);
      const html2canvasScale = sourceW > 0 ? Math.min(3, Math.max(2, targetWidth / sourceW)) : 2;
      clone.style.width = `${targetWidth}px`;
      const offscreen = document.createElement('div');
      offscreen.style.cssText =
        `position:fixed;top:0;left:-${targetWidth + 200}px;width:${targetWidth}px;` +
        'overflow:visible;background:#ffffff;z-index:-9999;';
      offscreen.appendChild(clone);
      document.body.appendChild(offscreen);

      // Two rAFs: first lets the clone paint, second ensures images decode
      await new Promise(r => requestAnimationFrame(r));
      await new Promise(r => requestAnimationFrame(r));

      // ── 3. Wait for sig images inside clone and record their positions ─────
      const cloneSigs = Array.from(clone.querySelectorAll<HTMLImageElement>('img[data-sig]'));
      // Replace clone image src with resolved data URLs when available (non-destructive to live DOM)
      if (resolvedImageMap && Object.keys(resolvedImageMap).length > 0) {
        cloneSigs.forEach(img => {
          const resolved = resolvedImageMap[img.src] || resolvedImageMap[decodeURIComponent(img.src)];
          if (resolved) img.src = resolved;
        });
      }
      await Promise.all(cloneSigs.map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise<void>(r => { img.onload = img.onerror = () => r(); });
      }));

      type SigPos = { x: number; y: number; w: number; h: number; src: string };
      const elementW = clone.offsetWidth || targetWidth;
      const sigPositions: SigPos[] = cloneSigs.map(img => {
        let top = 0, left = 0;
        let el: HTMLElement | null = img;
        while (el && el !== clone) {
          top  += el.offsetTop;
          left += el.offsetLeft;
          el    = el.offsetParent as HTMLElement | null;
        }
        return { x: left, y: top, w: img.offsetWidth, h: img.offsetHeight, src: img.src };
      });

      // ── 4. html2canvas capture of clone (no scroll constraints) ───────────
      let captured: HTMLCanvasElement;
      try {
        captured = await html2canvas(clone, {
          scale:           html2canvasScale,
          useCORS:         true,
          allowTaint:      true,
          backgroundColor: '#ffffff',
          logging:         false,
          scrollX:         0,
          scrollY:         0,
          windowWidth:     targetWidth,
          windowHeight:    clone.scrollHeight,
          width:           clone.scrollWidth,
          height:          clone.scrollHeight,
        });
      } finally {
        if (offscreen.parentNode) {
          offscreen.parentNode.removeChild(offscreen);
        }
      }

      if (!captured || captured.width === 0 || captured.height === 0) return false;

      // ── 5. Draw signature images directly onto canvas (bulletproof safety net)
      const renderScale = captured.width / elementW;
      const ctx = captured.getContext('2d')!;
      for (const sp of sigPositions) {
        if (!sp.src || sp.w === 0 || sp.h === 0) continue;
        await new Promise<void>(r => {
          const simg = new Image();
          simg.onload = () => {
            const cellW = sp.w * renderScale;
            const cellH = sp.h * renderScale;
            const aspect = simg.naturalWidth / simg.naturalHeight;
            let dw = cellW, dh = dw / aspect;
            if (dh > cellH) { dh = cellH; dw = dh * aspect; }
            const dx = sp.x * renderScale + (cellW - dw) / 2;
            const dy = sp.y * renderScale + (cellH - dh) / 2;
            ctx.drawImage(simg, dx, dy, dw, dh);
            r();
          };
          simg.onerror = () => r();
          simg.src = sp.src;
        });
      }

      // ── 6. Slice canvas into letter-size PDF pages ─────────────────────────
      const documentHash = await computeDocumentHash(exportContent);
      const hashSnippet  = documentHash
        ? `SHA-256: ${documentHash.slice(0, 16)}...${documentHash.slice(-8)}`
        : '';
      const company = (documentBranding?.companyLegalName || 'Codec Document').trim();

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
      const PW = pdf.internal.pageSize.getWidth();
      const PH = pdf.internal.pageSize.getHeight();
      const M  = 14;
      const HEADER_H = 20;
      const FOOTER_H = 13;
      const contentW = PW - 2 * M;
      const contentH = PH - HEADER_H - FOOTER_H - 2 * M;

      const pxPerMm   = captured.width / contentW;
      const pxPerPage = contentH * pxPerMm;
      const numPages  = Math.max(1, Math.ceil(captured.height / pxPerPage));
      const docTitle  = getDocumentTranslation(template.id, 'name', exportLanguage);

      for (let page = 0; page < numPages; page++) {
        if (page > 0) pdf.addPage();
        renderPdfHeader(pdf, documentBranding, docTitle, PW, M, HEADER_H);

        const sliceStartPx = Math.floor(page * pxPerPage);
        const sliceHPx     = Math.min(Math.ceil(pxPerPage), captured.height - sliceStartPx);
        if (sliceHPx > 0) {
          const slice = document.createElement('canvas');
          slice.width  = captured.width;
          slice.height = sliceHPx;
          const sCtx = slice.getContext('2d')!;
          sCtx.fillStyle = '#ffffff';
          sCtx.fillRect(0, 0, slice.width, slice.height);
          sCtx.drawImage(captured, 0, sliceStartPx, captured.width, sliceHPx, 0, 0, captured.width, sliceHPx);
          safePdfAddImage(pdf, slice.toDataURL('image/jpeg', 0.92), 'JPEG', M, M + HEADER_H, contentW, sliceHPx / pxPerMm);
        }

        renderPdfFooter(pdf, company, hashSnippet, page + 1, numPages, PW, PH, M, FOOTER_H, exportLanguage);
      }

      renderCertificationPage(pdf, inlineSigs, documentHash, exportLanguage, PW, PH, M);
      const blob = pdf.output('blob');
      await triggerDownload(blob, fileName);
      return true;
    } catch (err) {
      console.warn('High-fidelity PDF failed, falling back:', err);
      return false;
    }
  };


  const getCategoryTranslation = (category: string) => {
    const categoryMap: Record<string, string> = {
      'Estate Planning & Personal': 'category.estate',
      'Real Estate & Property': 'category.realestate',
      'Business Contracts': 'category.business',
      'Business Formation': 'category.formation',
      'Financial & Lending': 'category.financial',
      'Digital & Website': 'category.digital',
    };
    return t(categoryMap[category] || category);
  };

  // ── DOWNLOAD SCREEN ────────────────────────────────────────────────────────
  return (
    <>
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* ── Encabezado ────────────────────────────────────────────────
            Con la marca a la izquierda, como el resto del producto. Antes
            sólo tenía un «← Editar Contrato» sobre fondo blanco, y esta
            pantalla —la última del recorrido, donde el usuario descarga y
            comparte— se leía como una página suelta de otro sitio. Es
            justamente donde peor cae: es el momento en que decide si esto le
            parece serio. */}
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
          <div className="container mx-auto px-4 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-4">
                <Logo size="sm" href="/dashboard" />
                <Link
                  to={`/generator/${documentType}`}
                  className="hidden items-center gap-1.5 border-l border-slate-200 pl-4 text-sm text-slate-500 transition hover:text-slate-800 sm:flex"
                >
                  <ArrowLeft className="size-4" />
                  {language === 'es' ? 'Editar' : 'Edit'}
                </Link>
              </div>

              <div className="flex min-w-0 items-center gap-2">
                <span className="hidden truncate text-sm font-semibold text-slate-800 sm:block">
                  {getDocumentTranslation(template.id, 'name', language)}
                </span>
                <Badge variant="default" className="shrink-0 gap-1 bg-emerald-600 hover:bg-emerald-600">
                  <CheckCircle2 className="size-3" />
                  {language === 'es' ? 'Desbloqueado' : 'Unlocked'}
                </Badge>
              </div>
            </div>

            {/* En móvil el nombre del documento y el botón de editar no caben
                arriba sin apretar el logo, así que bajan a su propia línea. */}
            <div className="mt-1.5 flex items-center justify-between gap-3 sm:hidden">
              <Link
                to={`/generator/${documentType}`}
                className="flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-800"
              >
                <ArrowLeft className="size-3.5" />
                {language === 'es' ? 'Editar' : 'Edit'}
              </Link>
              <span className="truncate text-xs font-semibold text-slate-700">
                {getDocumentTranslation(template.id, 'name', language)}
              </span>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 space-y-6 max-w-5xl">

          {/* ── Bilingual download CTA ──────────────────────────────────────── */}
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-500/30">
                  <ShieldCheck className="size-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 leading-tight">
                    {language === 'es'
                      ? 'Documento Certificado — Listo para Descargar'
                      : 'Certified Document — Ready to Download'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    E-SIGN &amp; UETA Compliant · SHA-256 Audit Trail
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                {/* Language selector */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={exportLanguage}
                    onChange={(e) => setExportLanguage(e.target.value as 'en' | 'es')}
                    className="h-9 appearance-none cursor-pointer rounded-lg border border-slate-300 bg-white pl-3 pr-8 text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </div>

                {/* Primary download button */}
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 font-semibold"
                >
                  {isDownloading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                      <span>{language === 'es' ? 'Generando PDF…' : 'Generating PDF…'}</span>
                    </>
                  ) : (
                    <>
                      <Download className="size-4" />
                      <span>
                        {language === 'es'
                          ? 'Descargar Documento Certificado'
                          : 'Download Certified Document'}
                      </span>
                    </>
                  )}
                </Button>

                {/* Edit contract */}
                {canEditDocument && (
                  <Button
                    variant="outline"
                    onClick={handleEdit}
                    className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100"
                  >
                    <Edit className="size-4" />
                    {isEditing
                      ? (language === 'es' ? 'Guardar Edición' : 'Save Edits')
                      : (language === 'es' ? 'Editar Contrato' : 'Edit Contract')}
                  </Button>
                )}

                {/* Salida de la edición manual. Sin ella, quien edita queda
                    atrapado: cambiar un campo del formulario ya no actualiza
                    el documento, y sin forma de volver atrás eso parecería un
                    fallo en vez de una decisión suya. */}
                {canEditDocument && edicionManual && !isEditing && (
                  <Button
                    variant="ghost"
                    onClick={descartarEdicion}
                    className="gap-2 text-slate-500 hover:text-slate-800"
                  >
                    <RotateCcw className="size-4" />
                    {language === 'es' ? 'Descartar cambios' : 'Discard changes'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {edicionManual && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
              <Edit className="size-4 shrink-0 text-amber-500" />
              <span>
                {language === 'es'
                  ? 'Estás usando tu versión editada. El PDF se descargará con estos cambios y los campos del formulario ya no la modifican.'
                  : 'You are using your edited version. The PDF will download with these changes, and the form fields no longer alter it.'}
              </span>
            </div>
          )}

          {/* State banner */}
          {selectedState && (
            <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-800">
              <MapPin className="size-4 shrink-0 text-blue-500" />
              <span>
                {language === 'es'
                  ? `Variaciones legales de ${STATE_NAMES_ES[selectedState] || selectedState} aplicadas`
                  : `${selectedState} legal variations applied`}
              </span>
            </div>
          )}

          {/* AI risk / missing-clause review — real text resolved the same
              way the PDF export is, so what's analyzed matches what gets
              downloaded. Gated to paid/admin inside the panel itself. */}
          <AiReviewPanel content={computeExportContent()} />

          {/* ── Document preview ─────────────────────────────────────────────── */}
          <Card className="overflow-hidden shadow-sm">
            <CardHeader className="py-3 px-4 border-b bg-slate-50/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FileText className="size-4 text-slate-400" />
                  {t('preview.documentPreview')}
                </div>
                {estimatedPageCount > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => scrollToPage(currentPage - 1)}
                      className="flex size-6 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ChevronLeft className="size-3.5" />
                    </button>
                    <span className="flex items-center gap-1 text-xs text-slate-500 px-1">
                      <BookOpen className="size-3 text-indigo-400" />
                      {language === 'es' ? `Hoja ${currentPage}/${estimatedPageCount}` : `Page ${currentPage}/${estimatedPageCount}`}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= estimatedPageCount}
                      onClick={() => scrollToPage(currentPage + 1)}
                      className="flex size-6 items-center justify-center rounded border border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ChevronRight className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isEditing ? (
                <>
                  <SelectionAiBar
                    textareaRef={editTextareaRef}
                    content={editedContent}
                    onChange={setEditedContent}
                    language={language}
                    documentName={getDocumentTranslation(template.id, 'name', language)}
                  />
                  <Textarea
                    ref={editTextareaRef}
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="font-mono text-xs min-h-[800px] rounded-none border-0 focus-visible:ring-0"
                  />
                </>
              ) : (
                <div
                  ref={previewRef}
                  className="max-h-[820px] overflow-y-auto"
                  data-preview-scroll-container
                >
                  {/* Capture wrapper — html2canvas captures doc + injected sigs together */}
                  <div ref={captureWrapperRef} className="relative">
                    <div ref={documentCanvasRef}>
                      {/* Con edición manual el texto YA está sustituido: se
                          pasa como plantilla y sin datos, para que no se
                          vuelva a interpretar nada sobre él. */}
                      <DocumentPreview
                        template={edicionManual ? editedContent : plantillaParaVista}
                        templateId={template.id}
                        documentLanguage={exportLanguage}
                        data={edicionManual ? {} : documentData}
                        showWatermark={false}
                        leftSignatureUrl={placedSignatures.find(s => s.id === 'owner')?.dataUrl}
                        rightSignatureUrl={placedSignatures.find(s => s.id !== 'owner')?.dataUrl}
                        signerNote={signerNoteParaVista}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>


          {/* ── Bilingual download buttons (bottom) ──────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              size="lg"
              onClick={() => {
                setExportLanguage('es');
                requestAnimationFrame(() => requestAnimationFrame(handleDownload));
              }}
              disabled={isDownloading}
              className="w-full sm:w-auto gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-md font-semibold"
            >
              {isDownloading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                  <span>Generando PDF…</span>
                </>
              ) : (
                <>
                  <Download className="size-5" />
                  Descargar Documento Certificado (PDF)
                </>
              )}
            </Button>
            <Button
              size="lg"
              onClick={() => {
                setExportLanguage('en');
                requestAnimationFrame(() => requestAnimationFrame(handleDownload));
              }}
              variant="outline"
              disabled={isDownloading}
              className="w-full sm:w-auto gap-2 border-slate-400 text-slate-700 font-semibold hover:bg-slate-100"
            >
              {isDownloading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700/50 border-t-slate-700" />
                  <span>Generating PDF…</span>
                </>
              ) : (
                <>
                  <Download className="size-5" />
                  Download Certified Document (PDF)
                </>
              )}
            </Button>
          </div>

          {/* ── Compartir ────────────────────────────────────────────────
              Tres vías, sobre un mismo enlace público al PDF. Antes había un
              botón que abría WhatsApp con un texto que decía «te comparto este
              documento» sin adjuntar nada y sin enlace: quien lo recibía no
              tenía forma de llegar al documento. Con enlace, se abre desde
              cualquier dispositivo sin depender de que el archivo viaje. */}
          <div className="pb-8">
            <p className="mb-3 text-center text-xs font-semibold text-slate-500">
              {language === 'es' ? 'Compartir este documento' : 'Share this document'}
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void compartirPorWhatsApp()}
                disabled={compartiendo || isDownloading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-[#25D366] bg-[#25D366]/10 px-4 py-2.5 text-sm font-semibold text-[#128C7E] transition-colors hover:bg-[#25D366]/20 disabled:opacity-60"
              >
                <MessageCircle className="size-4" />
                WhatsApp
              </button>

              <button
                type="button"
                onClick={() => void compartirPorCorreo()}
                disabled={compartiendo || isDownloading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
              >
                <Mail className="size-4" />
                {language === 'es' ? 'Correo' : 'Email'}
              </button>

              <button
                type="button"
                onClick={() => void copiarEnlace()}
                disabled={compartiendo || isDownloading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
              >
                {enlaceCopiado ? <Check className="size-4 text-emerald-600" /> : <Link2 className="size-4" />}
                {enlaceCopiado
                  ? (language === 'es' ? 'Copiado' : 'Copied')
                  : (language === 'es' ? 'Copiar enlace' : 'Copy link')}
              </button>

              {/* Compartir el ARCHIVO por el menú del sistema. Sólo donde el
                  navegador lo permite —móvil, sobre todo—: en escritorio esa
                  API no existe y el botón sería una promesa vacía. */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={() => void compartirDocumento()}
                  disabled={compartiendo || isDownloading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
                >
                  <Download className="size-4" />
                  {language === 'es' ? 'Enviar archivo' : 'Send file'}
                </button>
              )}
            </div>

            {compartiendo && (
              <p className="mt-3 text-center text-xs text-slate-400">
                {language === 'es' ? 'Preparando el documento…' : 'Preparing the document…'}
              </p>
            )}
          </div>

        </div>

        {/* ── Pie de seguridad ──────────────────────────────────────────
            Cierra el recorrido diciendo qué respalda al documento que la
            persona acaba de descargar. Va aquí y no antes porque es donde
            surge la duda: ya lo tiene en la mano y se pregunta si esto vale
            legalmente. Antes la página simplemente se acababa. */}
        <footer className="mt-8 border-t border-slate-200 bg-slate-950">
          <div className="container mx-auto max-w-5xl px-4 py-10">
            <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
              <Logo size="sm" dark href="/" />

              <div className="grid w-full gap-4 sm:grid-cols-3">
                {[
                  {
                    icono: ShieldCheck,
                    t: language === 'es' ? 'Validez legal' : 'Legally valid',
                    d: language === 'es'
                      ? 'Firma electrónica con equivalencia funcional a la firma manuscrita, según la ley de tu país.'
                      : 'Electronic signature with the same legal standing as a handwritten one under your country’s law.',
                  },
                  {
                    icono: BadgeCheck,
                    t: language === 'es' ? 'Pista de auditoría' : 'Audit trail',
                    d: language === 'es'
                      ? 'Cada documento lleva su huella SHA-256, la fecha y hora, y los datos de quien firmó.'
                      : 'Every document carries its SHA-256 hash, timestamp, and the signer’s details.',
                  },
                  {
                    icono: Lock,
                    t: language === 'es' ? 'Tus datos son tuyos' : 'Your data is yours',
                    d: language === 'es'
                      ? 'El documento se arma en tu navegador y viaja cifrado. No se comparte con terceros.'
                      : 'The document is built in your browser and travels encrypted. Never shared with third parties.',
                  },
                ].map((g) => (
                  <div key={g.t} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
                    <g.icono className="size-4.5 text-emerald-400" />
                    <h3 className="mt-2 text-xs font-black text-white">{g.t}</h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{g.d}</p>
                  </div>
                ))}
              </div>

              <div className="flex w-full flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 text-[11px] text-slate-500 sm:flex-row">
                <span>
                  {language === 'es'
                    ? '© Codec Document · Plataforma de documentos legales y firma electrónica'
                    : '© Codec Document · Legal documents and electronic signature platform'}
                </span>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link to="/terms" className="transition hover:text-slate-300">
                    {language === 'es' ? 'Términos' : 'Terms'}
                  </Link>
                  <Link to="/privacy" className="transition hover:text-slate-300">
                    {language === 'es' ? 'Privacidad' : 'Privacy'}
                  </Link>
                  <Link to="/verificar" className="transition hover:text-slate-300">
                    {language === 'es' ? 'Verificar un documento' : 'Verify a document'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {template && (
        <PremiumDownloadModal
          open={premiumModalOpen}
          onOpenChange={setPremiumModalOpen}
          documentName={getDocumentTranslation(template.id, 'name', language)}
          documentId={template.id}
          onSuccess={handlePremiumSuccess}
          language={language}
          price={template.price ?? getDocumentPrice(template.id)}
          reason="72h_limit"
        />
      )}
      </>
    );
}

