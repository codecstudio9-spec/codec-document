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
import { ArrowLeft, Download, Edit, Lock, ShieldCheck, CreditCard, CheckCircle2, MapPin, FileText, X, GripHorizontal, ChevronLeft, ChevronRight, BookOpen, BadgeCheck, Mail, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/language-context';
import { getDocumentTranslation } from '../data/document-translations';
import { spanishTemplates } from '../data/templates-es';
import { getStateSpecificTemplate, STATE_NAMES_ES } from '../data/state-variations';
import { PDFGenerator } from '../services/pdf-generator';
import { enrichDocumentDataWithDates } from '../utils/document-dates';
import { getPurchaseUnlockStatus } from '../services/paypal-service';
import { getSignatureAuditByOrder, getSignatureAuditsByOrder } from '../services/paypal-service';
import { useAuth } from '../contexts/auth-context';
import { PremiumDownloadModal } from '../components/PremiumDownloadModal';
import { incrementGeneratedDoc } from '../services/user-limits-service';
import { saveDocumentRecord } from '../services/documents-service';
import { checkDownloadAllowed, recordDownloadEvent } from '../services/download-gate-service';
import { getDocumentPrice } from '../config/paypal';
import { triggerDownloadFromBytes, triggerDownloadFromUrl } from '../utils/download';

function normalizeCorruptedText(input: string): string {
  if (!input) return input;
  return input
    .replace(/Ã¡/g, 'á').replace(/Ã©/g, 'é').replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ãº/g, 'ú')
    .replace(/Ã/g, 'Á').replace(/Ã‰/g, 'É').replace(/Ã/g, 'Í').replace(/Ã“/g, 'Ó').replace(/Ãš/g, 'Ú')
    .replace(/Ã±/g, 'ñ').replace(/Ã‘/g, 'Ñ').replace(/Â¿/g, '¿').replace(/Â¡/g, '¡')
    .replace(/â€”/g, '—').replace(/â€“/g, '–').replace(/â€œ|â€/g, '"').replace(/â€˜|â€™/g, "'")
    .replace(/â•/g, '═').replace(/Ã/g, 'í');
}

function normalizeLanguageSensitiveFields(data: DocumentData, language: 'en' | 'es'): DocumentData {
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
    try {
      const fmt = branding.logoDataUrl!.includes('image/png') ? 'PNG' : 'JPEG';
      pdf.addImage(branding.logoDataUrl!, fmt, M, 5, 14, 14, undefined, 'FAST');
    } catch { /* skip */ }
  }

  if (hasCompany) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(30, 30, 60);
    pdf.text(hasCompany, PW / 2, 12, { align: 'center' });
  }

  pdf.setDrawColor(210, 215, 230);
  pdf.setLineWidth(0.2);
  pdf.line(M, M + HEADER_H, PW - M, M + HEADER_H);
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

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(160, 160, 175);

  // Left: company (only if custom; omit Codec Document branding)
  const companyLabel = company !== 'Codec Document' ? company : '';
  if (companyLabel) pdf.text(companyLabel, M, footerY + 5.5);

  // Center: SHA-256 snippet (audit trail, discrete gray)
  if (hashSnippet) {
    pdf.setFontSize(5.5);
    pdf.setTextColor(170, 170, 185);
    pdf.text(hashSnippet, PW / 2, footerY + 5.5, { align: 'center' });
  }

  // Right: page number
  pdf.setFontSize(6);
  pdf.setTextColor(160, 160, 175);
  const lbl = lang === 'es' ? `${pageNum} / ${totalPages}` : `${pageNum} / ${totalPages}`;
  pdf.text(lbl, PW - M, footerY + 5.5, { align: 'right' });
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
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(sz);
    pdf.setTextColor(...color);
    pdf.text(text, M, cy.v);
    cy.v += sz * 0.5 + 3;
  };
  const gap = (n = 4) => { cy.v += n; };

  // Header
  pdf.setFillColor(30, 30, 80);
  pdf.rect(0, 0, PW, 28, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text(lang === 'es' ? 'CERTIFICADO DE FIRMA DIGITAL' : 'DIGITAL SIGNATURE CERTIFICATE', PW / 2, 13, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(200, 200, 255);
  pdf.text('Codec Document — E-SIGN Act / UETA Compliant', PW / 2, 22, { align: 'center' });
  cy.v = 36;

  gap(2);
  line(lang === 'es' ? 'HASH SHA-256 DEL DOCUMENTO:' : 'DOCUMENT SHA-256 HASH:', 9, true, [80, 30, 180]);
  gap(1);
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(50, 50, 50);
  const halfLen = Math.floor(documentHash.length / 2);
  pdf.text(documentHash.slice(0, halfLen), M, cy.v);
  cy.v += 6;
  pdf.text(documentHash.slice(halfLen), M, cy.v);
  cy.v += 8;

  gap(4);
  line(lang === 'es' ? 'FIRMANTES:' : 'SIGNATORIES:', 10, true, [28, 28, 80]);
  gap(3);
  inlineSigs.forEach((sig, i) => {
    line(`${i + 1}. ${sig.signerName}`, 9, true);
    line(`   ${lang === 'es' ? 'Firmado el' : 'Signed at'}: ${new Date(sig.signedAt).toLocaleString()}`, 8, false, [80, 80, 110]);
    if (sig.signatureDataUrl) {
      try {
        const fmt = sig.signatureDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        pdf.addImage(sig.signatureDataUrl, fmt, M + 4, cy.v, 50, 14, undefined, 'FAST');
        cy.v += 18;
      } catch { cy.v += 4; }
    }
    gap(4);
  });

  gap(8);
  line(lang === 'es' ? 'INFORMACIÓN LEGAL:' : 'LEGAL INFORMATION:', 9, true, [80, 30, 180]);
  gap(2);
  const legal = lang === 'es'
    ? 'Este documento ha sido firmado electrónicamente de conformidad con la Ley ESIGN (Electronic Signatures in Global and National Commerce Act) y la UETA (Uniform Electronic Transactions Act). Las firmas digitales contenidas en este documento tienen la misma validez legal que las firmas manuscritas.'
    : 'This document was electronically signed in compliance with the Electronic Signatures in Global and National Commerce Act (E-SIGN Act) and the Uniform Electronic Transactions Act (UETA). Electronic signatures carry the same legal weight as handwritten signatures.';
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(80, 80, 100);
  const wrapped = pdf.splitTextToSize(legal, PW - 2 * M);
  wrapped.forEach((l: string) => { pdf.text(l, M, cy.v); cy.v += 5; });

  gap(10);
  line(`${lang === 'es' ? 'Generado' : 'Generated'}: ${new Date().toLocaleString()}`, 7.5, false, [120, 120, 140]);
  line('Codec Document Platform — codecdocument.com', 7.5, false, [120, 120, 140]);
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
  const [isPurchased, setIsPurchased] = useState(false);
  const [exportLanguage, setExportLanguage] = useState<'en' | 'es'>('en');
  const [placedSignatures, setPlacedSignatures] = useState<PlacedSig[]>([]);
  const [identitySelfie, setIdentitySelfie] = useState<string | undefined>();
  const [identityIdDocFront, setIdentityIdDocFront] = useState<string | undefined>();
  const [identityIdDocBack, setIdentityIdDocBack] = useState<string | undefined>();
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'download' | 'sign' | null>(null);
  const [selectedState, setSelectedState] = useState<string>('');
  const [estimatedPageCount, setEstimatedPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

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
            name: parsed.landlord_name || parsed.owner_name || parsed.party_one || 'Owner',
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
      } else {
        navigate(`/generator/${documentType}`);
      }

      // Pre-populate owner signature from Step 2 (sign step)
      const ownerSigUrl = sessionStorage.getItem('userSignatureDataUrl');
      const sigX = parseFloat(sessionStorage.getItem('sigPlacementX') || '0');
      const sigY = parseFloat(sessionStorage.getItem('sigPlacementY') || '0');

      const allSigs: PlacedSig[] = [];

      if (ownerSigUrl) {
        allSigs.push({
          id: 'owner',
          name: parsed.landlord_name || parsed.owner_name || parsed.party_one || 'Owner',
          dataUrl: ownerSigUrl,
          xPct: sigX > 0 ? sigX : 18,
          yPct: sigY > 0 ? sigY : 82,
        });
      }

      // Load co-signer signatures saved by document-generator-page Step 2
      const coSignersJson = sessionStorage.getItem('coSigners');
      if (coSignersJson) {
        try {
          const coSigners = JSON.parse(coSignersJson) as Array<{
            id: string;
            name: string;
            sigDataUrl: string;
            placement: { x: number; y: number } | null;
          }>;
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
        } catch { /* corrupted — skip */ }
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
    } else {
      navigate(`/generator/${documentType}`);
    }

    checkPersistentPurchase();
  }, [documentType, navigate, template, purchasedDocumentIds]);

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

      let content = templateToUse;
      
      const dataWithDate = normalizeLanguageSensitiveFields(enrichDocumentDataWithDates(data, language), language);
      
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

  const handleDownload = async () => {
    if (!user || !token) {
      toast.error(language === 'en' ? 'Please sign in with Google before generating documents.' : 'Debes iniciar sesión con Google antes de generar documentos.');
      return;
    }

    // Gate: check 72-hour rolling quota for free users
    if (!canDownloadFree) {
      const allowed = await checkDownloadAllowed(user?.id ?? null);
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

    let exportContent = templateForExport;
    
    const enrichedData = normalizeLanguageSensitiveFields(
      enrichDocumentDataWithDates(documentData, exportLanguage),
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
    const fileName = `${template.name.replace(/\s+/g, '_')}${stateSuffix}_${exportLanguage}.pdf`;
    
    // Build inline signatures from every chip the user has placed on the preview
    const inlineSigs = placedSignatures.map((s) => ({
      signerName: s.name,
      signedAt: new Date().toISOString(),
      signatureDataUrl: s.dataUrl,
      xDocPct: s.xPct,
      yDocPct: s.yPct,
    }));

    // Try html2canvas first — pixel-perfect capture of the visual preview (same page count as preview)
    const hiFiOk = await downloadHighFidelityPdf(inlineSigs, exportContent, fileName);

    if (!hiFiOk) {
      // Fallback: premium text-based PDF with embedded mirror signature block
      const orderId = sessionStorage.getItem('paypalOrderId') || localStorage.getItem('paypalOrderId') || '';
      const auditResponse  = orderId ? await getSignatureAuditByOrder(orderId).catch(() => ({ found: false })) : { found: false };
      const auditsResponse = orderId ? await getSignatureAuditsByOrder(orderId).catch(() => ({ found: false, signatures: [] })) : { found: false, signatures: [] };

      // Prefer audit-trail signatures; fall back to sessionStorage-loaded placedSignatures
      const fallbackSigs = (auditsResponse as any)?.found && (auditsResponse as any).signatures?.length > 0
        ? (auditsResponse as any).signatures
        : placedSignatures.length > 0
          ? placedSignatures.map((sig) => ({
              signerName:       sig.name,
              signerRole:       sig.id === 'owner'
                ? (exportLanguage === 'es' ? 'Arrendador' : 'Landlord')
                : (exportLanguage === 'es' ? 'Arrendatario' : 'Tenant'),
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

      await PDFGenerator.generate({
        content:      exportContent,
        title:        getDocumentTranslation(template.id, 'name', exportLanguage),
        fileName,
        language:     exportLanguage,
        state:        selectedState,
        showWatermark: false,
        branding:     documentBranding,
        auditLog:     enrichedAudit,
        signatures:   fallbackSigs,
        // Mirror layout sigs for side-by-side block at bottom of document
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
      });
    }

    toast.success(t('preview.documentDownloaded'));

    // Record 72-hour download event for free-tier users (used by check_user_limits RPC)
    if (!canDownloadFree && user?.id) {
      void recordDownloadEvent(user.id, 'doc');
    }

    // Legacy daily counter — kept for analytics
    if (user?.id && !unlimitedActive && !subscriptionActive && !isAdmin) {
      void incrementGeneratedDoc(user.id);
    }

    // Save document record to cloud workspace (all authenticated users)
    if (user?.id) {
      void saveDocumentRecord(user.id, template.id, fileName);
    }
  };

  const handleEdit = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      toast.success(t('preview.changesSaved'));
    }
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
      const srcW = sourceEl.offsetWidth || 850;
      const offscreen = document.createElement('div');
      offscreen.style.cssText =
        `position:fixed;top:0;left:-${srcW + 200}px;width:${srcW}px;` +
        'overflow:visible;background:#ffffff;z-index:-9999;';
      offscreen.appendChild(clone);
      document.body.appendChild(offscreen);

      // Two rAFs: first lets the clone paint, second ensures images decode
      await new Promise(r => requestAnimationFrame(r));
      await new Promise(r => requestAnimationFrame(r));

      // ── 3. Wait for sig images inside clone and record their positions ─────
      const cloneSigs = Array.from(clone.querySelectorAll<HTMLImageElement>('img[data-sig]'));
      await Promise.all(cloneSigs.map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise<void>(r => { img.onload = img.onerror = () => r(); });
      }));

      type SigPos = { x: number; y: number; w: number; h: number; src: string };
      const elementW = clone.offsetWidth || srcW;
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
          scale:           2,
          useCORS:         true,
          allowTaint:      true,
          backgroundColor: '#ffffff',
          logging:         false,
          scrollX:         0,
          scrollY:         0,
          width:           clone.scrollWidth,
          height:          clone.scrollHeight,
        });
      } finally {
        document.body.removeChild(offscreen);
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
          pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', M, M + HEADER_H, contentW, sliceHPx / pxPerMm);
        }

        renderPdfFooter(pdf, company, hashSnippet, page + 1, numPages, PW, PH, M, FOOTER_H, exportLanguage);
      }

      renderCertificationPage(pdf, inlineSigs, documentHash, exportLanguage, PW, PH, M);
      const blob = pdf.output('blob');
      const bytes = new Uint8Array(await blob.arrayBuffer());
      await triggerDownloadFromBytes(bytes, fileName);
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
        {/* Header */}
        <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Link
                to={`/generator/${documentType}`}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition"
              >
                <ArrowLeft className="size-4" />
                {language === 'es' ? 'Editar Contrato' : 'Edit Contract'}
              </Link>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                  <CheckCircle2 className="size-3" />
                  {language === 'es' ? 'Desbloqueado' : 'Unlocked'}
                </Badge>
                <span className="text-sm font-semibold text-slate-800">
                  {getDocumentTranslation(template.id, 'name', language)}
                </span>
              </div>
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
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 font-semibold"
                >
                  <Download className="size-4" />
                  <span>
                    {language === 'es'
                      ? 'Descargar Documento Certificado'
                      : 'Download Certified Document'}
                  </span>
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
              </div>
            </div>
          </div>

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
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="font-mono text-xs min-h-[800px] rounded-none border-0 focus-visible:ring-0"
                />
              ) : (
                <div
                  ref={previewRef}
                  className="max-h-[820px] overflow-y-auto"
                  data-preview-scroll-container
                >
                  {/* Capture wrapper — html2canvas captures doc + injected sigs together */}
                  <div ref={captureWrapperRef} className="relative">
                    <div ref={documentCanvasRef}>
                      <DocumentPreview
                        template={exportLanguage === 'es' && spanishTemplates[template.id] ? spanishTemplates[template.id] : template.template}
                        data={documentData}
                        showWatermark={false}
                        leftSignatureUrl={placedSignatures.find(s => s.id === 'owner')?.dataUrl}
                        rightSignatureUrl={placedSignatures.find(s => s.id !== 'owner')?.dataUrl}
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
              onClick={() => { setExportLanguage('es'); requestAnimationFrame(() => requestAnimationFrame(handleDownload)); }}
              className="w-full sm:w-auto gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-md font-semibold"
            >
              <Download className="size-5" />
              Descargar Documento Certificado (PDF)
            </Button>
            <Button
              size="lg"
              onClick={() => { setExportLanguage('en'); requestAnimationFrame(() => requestAnimationFrame(handleDownload)); }}
              variant="outline"
              className="w-full sm:w-auto gap-2 border-slate-400 text-slate-700 font-semibold hover:bg-slate-100"
            >
              <Download className="size-5" />
              Download Certified Document (PDF)
            </Button>
          </div>

          {/* ── Share / Send options ──────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pb-8">
            {/* WhatsApp */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                language === 'es'
                  ? `Hola, te comparto este documento legal: ${getDocumentTranslation(template.id, 'name', 'es')}. Descárgalo usando Codec Document.`
                  : `Hello, I'm sharing this legal document with you: ${getDocumentTranslation(template.id, 'name', 'en')}. Download it via Codec Document.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-[#25D366] bg-[#25D366]/10 px-4 py-2.5 text-sm font-semibold text-[#128C7E] hover:bg-[#25D366]/20 transition-colors shadow-sm"
            >
              <MessageCircle className="size-4" />
              {language === 'es' ? 'Enviar por WhatsApp' : 'Share via WhatsApp'}
            </a>

            {/* Email */}
            <a
              href={`mailto:?subject=${encodeURIComponent(
                getDocumentTranslation(template.id, 'name', language) || (language === 'es' ? 'Documento Legal Certificado' : 'Certified Legal Document')
              )}&body=${encodeURIComponent(
                language === 'es'
                  ? `Hola,\n\nAdjunto o comparto contigo el documento legal: ${getDocumentTranslation(template.id, 'name', 'es')}.\n\nDescárgalo y ábrelo con cualquier visor de PDF.\n\nGenerado con Codec Document.`
                  : `Hello,\n\nPlease find the legal document attached: ${getDocumentTranslation(template.id, 'name', 'en')}.\n\nOpen the attached PDF with any PDF viewer.\n\nGenerated with Codec Document.`
              )}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Mail className="size-4" />
              {language === 'es' ? 'Enviar por Correo' : 'Send via Email'}
            </a>
          </div>

        </div>
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

