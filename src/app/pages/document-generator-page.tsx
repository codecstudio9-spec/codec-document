import { useState, useEffect, useMemo, useDeferredValue, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { getTemplateById } from '../data/templates';
import { DocumentBranding, DocumentData } from '../types/document';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
// Select/Tooltip Radix components removed — replaced with native elements to avoid portal removeChild errors
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, FileText, Info, X, ShieldCheck, MapPin, ChevronDown, PenLine, CreditCard, Lock, UserPlus, Copy, Check, Download, Camera, User, RefreshCw, ScanLine, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/language-context';
import { getDocumentTranslation } from '../data/document-translations';
import { getFieldTranslation, getFieldOptionTranslation } from '../data/field-translations';
import { US_STATES, stateNotes, STATE_DEPENDENT_DOCUMENTS } from '../data/state-variations';
import { DocumentPreview } from '../components/document-preview';
import { spanishTemplates } from '../data/templates-es';
import { useAuth } from '../contexts/auth-context';
import { SignaturePad } from '../components/signatures/SignaturePad';
import { SignatureModal } from '../components/signatures/SignatureModal';
import { QRCodeSVG } from 'qrcode.react';
import { createMobileSignToken, pollMobileSignature, deleteMobileSignToken } from '../services/signature-storage-service';
import { normalizeIdEvidence, normalizeSelfieEvidence } from '../utils/evidence-image';

import { consumeSignatureRequest72h, getNextSignatureRequestSlot } from '../services/user-limits-service';
import { SignatureLimitDialog } from '../components/signatures/SignatureLimitDialog';
import { IntentModal } from '../components/IntentModal';
import { SecurityConfigModal } from '../components/SecurityConfigModal';
import { createSignTransaction, subscribeToTransaction, getSignTransaction, type SigningIntent, type SecurityConfig, type SignTransaction } from '../services/sign-transaction-service';

type FlowStep = 'form' | 'sign' | 'verify';

function parseIdEvidencePayload(value?: string): { front?: string; back?: string } {
  if (!value) return {};
  const trimmed = value.trim();
  if (!trimmed.startsWith('{')) return { front: value };
  try {
    const parsed = JSON.parse(trimmed) as { front?: string; back?: string; idFront?: string; idBack?: string };
    return {
      front: parsed.front || parsed.idFront || undefined,
      back: parsed.back || parsed.idBack || undefined,
    };
  } catch {
    return { front: value };
  }
}

interface CoSigner {
  id: string;
  name: string;
  role: string;
  token: string;
  sigDataUrl: string;
  placement: { x: number; y: number } | null;
}


// â"€â"€ Co-signer invite card â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
function CoSignerCard({ index, signer, onRemove, language }: {
  index: number;
  signer: CoSigner;
  onRemove: () => void;
  language: string;
}) {
  const [copied, setCopied] = useState(false);
  const signingUrl = `${window.location.origin}/quick-sign/${signer.token}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(signingUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${signer.sigDataUrl ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
            {signer.sigDataUrl ? <ShieldCheck className="size-4" /> : String(index)}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 leading-tight">{signer.name}</p>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{signer.role}</p>
          </div>
        </div>
        {!signer.sigDataUrl && (
          <button type="button" onClick={onRemove}
            className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-500 transition hover:bg-red-100">
            <X className="size-3" />
          </button>
        )}
      </div>

      <div className="p-4">
        {signer.sigDataUrl ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center rounded-xl border border-emerald-100 bg-gradient-to-b from-white to-emerald-50/40 p-3 min-h-[60px]">
              <img src={signer.sigDataUrl} alt="Firma" className="max-h-12 max-w-full object-contain" />
            </div>
            <p className="text-center text-[11px] text-emerald-600 font-semibold">
              {language === 'en' ? 'Signature received ✓' : 'Firma recibida ✓'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="overflow-hidden rounded-xl border-2 border-indigo-100 bg-white p-2 shadow-sm">
                <QRCodeSVG value={signingUrl} size={130} bgColor="#ffffff" fgColor="#1e1b4b" level="M" />
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
              <p className="flex-1 truncate text-[10px] text-slate-400">{signingUrl}</p>
              <button type="button" onClick={handleCopy}
                className="shrink-0 flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100">
                {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                {copied ? (language === 'en' ? 'Copied!' : '¡Copiado!') : (language === 'en' ? 'Copy' : 'Copiar')}
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-[11px] text-amber-700 font-medium">
              <span className="size-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              {language === 'en' ? 'Waiting for them to sign…' : 'Esperando que firme…'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// â"€â"€ Draggable signature chip for placement phase â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
interface SigPlacementChipProps {
  dataUrl: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  containerRef: React.RefObject<HTMLDivElement | null>;
  onChange: (pos: { x: number; y: number }) => void;
  onRemove: () => void;
}

function SigPlacementChip({ dataUrl, x, y, containerRef, onChange, onRemove }: SigPlacementChipProps) {
  const chipRef  = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const livePos  = useRef({ x, y });
  const startRef = useRef({ px: 0, py: 0, ox: 0, oy: 0 });

  // Sync DOM position when parent commits a new position (after drag ends)
  useEffect(() => {
    if (!dragging.current && chipRef.current) {
      chipRef.current.style.left = `${x}%`;
      chipRef.current.style.top  = `${y}%`;
      livePos.current = { x, y };
    }
  }, [x, y]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dragging.current = true;
    startRef.current = { px: e.clientX, py: e.clientY, ox: livePos.current.x, oy: livePos.current.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !containerRef.current || !chipRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // dx uses width (no horizontal scroll); dy uses scrollHeight to match y-coordinate units
    const dx   = ((e.clientX - startRef.current.px) / rect.width) * 100;
    const dy   = ((e.clientY - startRef.current.py) / (containerRef.current.scrollHeight || rect.height)) * 100;
    const newX = Math.max(2, Math.min(88, startRef.current.ox + dx));
    const newY = Math.max(1, Math.min(93, startRef.current.oy + dy));
    livePos.current = { x: newX, y: newY };
    // Direct DOM — no React state update while dragging, no re-renders
    chipRef.current.style.left = `${newX}%`;
    chipRef.current.style.top  = `${newY}%`;
  }, [containerRef]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    const pos = livePos.current;
    // Defer the React state commit until after the browser paint
    requestAnimationFrame(() => onChange(pos));
  }, [onChange]);

  return (
    <div
      ref={chipRef}
      style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)', zIndex: 50, touchAction: 'none', cursor: 'grab', willChange: 'left, top', pointerEvents: 'auto' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative group rounded-lg border-2 border-blue-500 bg-white shadow-xl px-2 py-1">
        <img src={dataUrl} alt="firma" className="h-14 w-[160px] object-contain" draggable={false} crossOrigin="anonymous" />
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute -top-2.5 -right-2.5 hidden group-hover:flex size-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
        >
          <X className="size-3" />
        </button>
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-blue-500 font-medium whitespace-nowrap select-none">
          ⠿ arrastrar
        </div>
      </div>
    </div>
  );
}

export function DocumentGeneratorPage() {
  const { documentType } = useParams<{ documentType: string }>();
  const navigate = useNavigate();
  const template = getTemplateById(documentType || '');
  const { t, language } = useLanguage();
  const { user, session, isAdmin, unlimitedActive, subscriptionActive } = useAuth();
  const [searchParams] = useSearchParams();
  const resumeTxId = searchParams.get('tx');

  // â"€â"€ Draft persistence â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  // Key is per-document-type so different templates don't overwrite each other.
  const DRAFT_KEY = `codec_form_draft_${documentType || 'unknown'}`;

  const [formData, setFormData] = useState<DocumentData>(() => {
    try {
      const saved = localStorage.getItem(`codec_form_draft_${documentType || 'unknown'}`);
      return saved ? (JSON.parse(saved) as DocumentData) : {};
    } catch {
      return {};
    }
  });
  const [activeFieldId, setActiveFieldId] = useState<string>('');

  // Defer preview updates so form interactions (selects, inputs) always respond instantly.
  const deferredFormData = useDeferredValue(formData);
  const [missingRequiredFields, setMissingRequiredFields] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');
  const [flowStep, setFlowStep] = useState<FlowStep>('form');
  const [userSigDataUrl, setUserSigDataUrl] = useState<string>('');
  // Signing modal
  const [signingPanelOpen, setSigningPanelOpen] = useState(false);

  // Identity verification (Step 3)
  const [selfieEnabled, setSelfieEnabled]         = useState(false);
  const [idDocEnabled, setIdDocEnabled]           = useState(false);
  const [selfieDataUrl, setSelfieDataUrl]         = useState('');
  const [idDocDataUrl, setIdDocDataUrl]           = useState('');
  const [activeCameraType, setActiveCameraType]   = useState<'selfie' | 'id' | null>(null);
  const [cameraError, setCameraError]             = useState('');
  const videoRef  = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Co-signers
  const [coSigners, setCoSigners] = useState<CoSigner[]>([]);
  const [addingCoSigner, setAddingCoSigner] = useState(false);
  const [newCoSignerName, setNewCoSignerName] = useState('');
  const [newCoSignerRole, setNewCoSignerRole] = useState('');
  const [addingCoSignerLoading, setAddingCoSignerLoading] = useState(false);
  const coSignerPollingRefs = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // ── Intent / Security modal flow ──────────────────────────────────────────
  // Skip the intent picker on load if we're resuming a previously-sent
  // transaction (?tx=<id>) — there is otherwise no way to get back to the
  // "waiting for signature" / download screen once this component unmounts
  // (its state lives only in memory), e.g. after closing the tab.
  const [intentModalOpen,  setIntentModalOpen]  = useState(!resumeTxId);
  const [intent,           setIntent]           = useState<SigningIntent | null>(null);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [txShareData, setTxShareData]           = useState<{ txId: string; shareUrl: string; config: SecurityConfig } | null>(null);
  const [txLinkCopied, setTxLinkCopied]         = useState(false);
  // 72h signature-request limit dialog — replaces the old plain toast.error
  const [limitDialogOpen, setLimitDialogOpen]   = useState(false);
  const [limitNextSlotAt, setLimitNextSlotAt]   = useState<Date | null>(null);
  const [pendingLimitRetry, setPendingLimitRetry] = useState<(() => void) | null>(null);
  const [activeTx, setActiveTx]                 = useState<SignTransaction | null>(null);
  const [pendingSecConfig, setPendingSecConfig] = useState<SecurityConfig | null>(null);
  const [senderSignModalOpen, setSenderSignModalOpen] = useState(false);

  // ── Resume a previously-sent transaction from its id (?tx=<id>) ──────────
  useEffect(() => {
    if (!resumeTxId) return;
    let cancelled = false;
    getSignTransaction(resumeTxId).then((tx) => {
      if (cancelled || !tx) return;
      setActiveTx(tx);
      setTxShareData({
        txId: tx.id,
        shareUrl: `${window.location.origin}/sign/${tx.id}`,
        config: tx.security_config,
      });
    });
    return () => { cancelled = true; };
  }, [resumeTxId]);
  // ──────────────────────────────────────────────────────────────────────────

  const [branding, setBranding] = useState<DocumentBranding>({
    enableLogo: false,
    enableLogoWatermark: false,
    logoDataUrl: '',
    logoPosition: 'left',
    headerText: '',
    footerText: '',
  });

  // Stop all co-signer polling on unmount
  useEffect(() => {
    const refs = coSignerPollingRefs.current;
    return () => { refs.forEach((interval) => clearInterval(interval)); };
  }, []);

  const startPollingCoSigner = useCallback((signerId: string, token: string) => {
    const interval = setInterval(async () => {
      try {
        const sig = await pollMobileSignature(token);
        if (sig) {
          clearInterval(interval);
          coSignerPollingRefs.current.delete(signerId);
          setCoSigners((prev) => prev.map((s) => s.id === signerId ? { ...s, sigDataUrl: sig } : s));
        }
      } catch { /* network error — keep polling */ }
    }, 3000);
    coSignerPollingRefs.current.set(signerId, interval);
  }, []);

  const handleAddCoSigner = async () => {
    if (!newCoSignerName.trim()) return;
    setAddingCoSignerLoading(true);
    try {
      const token = await createMobileSignToken();
      const id = crypto.randomUUID();
      const newSigner: CoSigner = {
        id,
        name: newCoSignerName.trim(),
        role: newCoSignerRole.trim() || (language === 'en' ? 'Co-Signer' : 'Co-Firmante'),
        token,
        sigDataUrl: '',
        placement: null,
      };
      setCoSigners((prev) => [...prev, newSigner]);
      startPollingCoSigner(id, token);
      setAddingCoSigner(false);
      setNewCoSignerName('');
      setNewCoSignerRole('');
    } catch {
      toast.error(language === 'en' ? 'Error generating invite link' : 'Error al generar enlace de invitación');
    } finally {
      setAddingCoSignerLoading(false);
    }
  };

  const handleRemoveCoSigner = useCallback((id: string, token: string) => {
    const interval = coSignerPollingRefs.current.get(id);
    if (interval) { clearInterval(interval); coSignerPollingRefs.current.delete(id); }
    void deleteMobileSignToken(token);
    setCoSigners((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Restore full body interactivity on every page visit AND whenever flow step changes.
  // PayPal SDK and Radix modals lock overflow, pointer-events, and aria-hidden;
  // if the payment overlay closes without cleaning up, all selects/dropdowns freeze.
  useEffect(() => {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    document.body.style.pointerEvents = '';
    document.body.removeAttribute('data-scroll-locked');
    document.body.removeAttribute('aria-hidden');
    document.querySelectorAll(
      'iframe[name*="paypal"], iframe[src*="paypal.com"], [id^="paypal-overlay"], [id^="paypal-checkout"]'
    ).forEach((el) => { try { el.remove(); } catch (_) {} });
  }, [flowStep]);

  // â"€â"€ Auto-save draft to localStorage on every form change â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    }
  }, [formData, DRAFT_KEY]);

  // â"€â"€ Restore selectedState (sessionStorage → localStorage draft → nothing) â"€
  useEffect(() => {
    const fromSession = sessionStorage.getItem('selectedState');
    const fromDraft   = formData.state ? String(formData.state) : '';
    const stateToUse  = fromSession || fromDraft;
    if (stateToUse) {
      setSelectedState(stateToUse);
      sessionStorage.setItem('selectedState', stateToUse);
      setFormData((prev) => (prev.state ? prev : { ...prev, state: stateToUse }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-open signing modal when entering sign step without a signature
  useEffect(() => {
    if (flowStep === 'sign' && !userSigDataUrl) {
      const timer = setTimeout(() => setSigningPanelOpen(true), 180);
      return () => clearTimeout(timer);
    }
  }, [flowStep, userSigDataUrl]);

  // Attach camera stream to <video> after it mounts
  useEffect(() => {
    if (!activeCameraType || !streamRef.current) return;
    requestAnimationFrame(() => {
      if (videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    });
  }, [activeCameraType]);

  // Stop camera on unmount
  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  // â"€â"€ Derived fields — ALL before the early return to satisfy Rules of Hooks â"€â"€
  // Use optional chaining so these are safe when template is null (early-return case).
  const visibleFields = useMemo(
    () =>
      (template?.fields ?? []).filter(
        (field) =>
          field.id !== 'effective_date' &&
          field.id !== 'start_date' &&
          field.id !== 'effective_date_of_agreement',
      ),
    [template],
  );

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    sessionStorage.setItem('selectedState', state);
    setFormData((prev) => ({ ...prev, state }));
    const governingField = visibleFields.find((f) => f.id === 'governing_state' || f.id === 'jurisdiction');
    if (governingField) {
      setFormData((prev) => ({ ...prev, [governingField.id]: state }));
    }
  };

  const getSection = (fieldId: string) => {
    const id = fieldId.toLowerCase();
    if (id.includes('party') || id.includes('client') || id.includes('contractor') || id.includes('seller') || id.includes('buyer') || id.includes('email') || id.includes('phone') || id.includes('address') || id.includes('state')) {
      return 'parties';
    }
    if (id.includes('date') || id.includes('term') || id.includes('governing') || id.includes('jurisdiction') || id.includes('contract_type')) {
      return 'agreement';
    }
    return 'variables';
  };

  const groupedFields = useMemo(() => {
    return {
      parties: visibleFields.filter((f) => getSection(f.id) === 'parties'),
      agreement: visibleFields.filter((f) => getSection(f.id) === 'agreement'),
      variables: visibleFields.filter((f) => getSection(f.id) === 'variables'),
    };
  }, [visibleFields]);

  const handleInputChange = (fieldId: string, value: string | number | boolean) => {
    setActiveFieldId(fieldId);
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    // Bidirectional sync: if user edits the inline 'state' field, keep Step 1 selector in sync
    if (fieldId === 'state') {
      const str = String(value);
      setSelectedState(str);
      sessionStorage.setItem('selectedState', str);
    }
  };

  const requiredFields = useMemo(
    () => visibleFields.filter((f) => f.required),
    [visibleFields],
  );

  const filledRequiredCount = useMemo(
    () => requiredFields.filter((f) => {
      const v = formData[f.id];
      return v !== undefined && v !== '' && v !== false;
    }).length,
    [requiredFields, formData],
  );

  const formProgress = requiredFields.length > 0
    ? Math.round((filledRequiredCount / requiredFields.length) * 100)
    : 100;

  const getMissingRequiredFields = () =>
    requiredFields.filter((f) => {
      const v = formData[f.id];
      return v === undefined || v === '';
    }).map((f) => f.id);

  // Saves session data and transitions to the signing step
  const handleFormNext = () => {
    const missing = getMissingRequiredFields();
    setMissingRequiredFields(missing);
    if (missing.length > 0) {
      toast.error(t('generator.fillAllFields'));
      return;
    }
    try {
      sessionStorage.setItem('documentData', JSON.stringify(formData));
      sessionStorage.setItem('documentBranding', JSON.stringify(branding));
      sessionStorage.setItem('documentType', documentType || '');
    } catch { /* sessionStorage quota exceeded — proceed anyway */ }
    setFlowStep('sign');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 80);
  };

  // ── Intent modal handlers ──────────────────────────────────────────────────
  const handleIntentSelect = (selected: SigningIntent) => {
    setIntent(selected);
    setIntentModalOpen(false);
    if (selected === 'blank_send') setSecurityModalOpen(true);
  };

  const handleFormNextIntent = () => {
    if (intent === 'fill_send' || intent === 'fill_approve') {
      const missing = getMissingRequiredFields();
      setMissingRequiredFields(missing);
      if (missing.length > 0) { toast.error(t('generator.fillAllFields')); return; }
      try {
        sessionStorage.setItem('documentData', JSON.stringify(formData));
        sessionStorage.setItem('documentBranding', JSON.stringify(branding));
        sessionStorage.setItem('documentType', documentType || '');
      } catch { /* quota */ }
      setSecurityModalOpen(true);
    } else {
      handleFormNext();
    }
  };

  const handleSecurityConfirm = async (config: SecurityConfig) => {
    setSecurityModalOpen(false);

    // Guard: NOT NULL fields must have real values before INSERT
    if (!documentType) {
      toast.error(language === 'en' ? 'Document type is missing.' : 'Tipo de documento no identificado.');
      return;
    }
    if (!intent) {
      toast.error(language === 'en' ? 'Signing intent is not set.' : 'La intencion de firma no fue seleccionada.');
      return;
    }

    // Bilateral flows: sender must sign first before the link is released
    if (intent === 'fill_send' || intent === 'fill_approve') {
      setPendingSecConfig(config);
      setSenderSignModalOpen(true);
      return;
    }

    // Unilateral flows (fill_self, blank_send): insert immediately
    const doCreateUnilateral = async () => {
      try {
        const txId = await createSignTransaction({
          creator_id:      session?.user?.id ?? null,
          document_type:   documentType,
          document_data:   intent === 'blank_send' ? { _blank: true } : (formData as Record<string, unknown>),
          intent:          intent,
          security_config: config,
          status:          'pending_recipient',
        });
        const shareUrl = `${window.location.origin}/sign/${txId}`;
        setTxShareData({ txId, shareUrl, config });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('Error creating sign_transaction INSERT:', msg);
        toast.error(
          language === 'en' ? `Error creating transaction: ${msg}` : `Error al crear la transaccion: ${msg}`,
          { duration: 7000 },
        );
      }
    };

    if (!isAdmin && !unlimitedActive && !subscriptionActive) {
      const userId = session?.user?.id;
      const { allowed } = userId
        ? await consumeSignatureRequest72h(userId, false)
        : { allowed: false };
      if (!allowed) {
        setLimitNextSlotAt(userId ? await getNextSignatureRequestSlot(userId) : null);
        setPendingLimitRetry(() => doCreateUnilateral);
        setLimitDialogOpen(true);
        return;
      }
    }
    await doCreateUnilateral();
  };

  const handleSenderSignatureAndCreate = async (senderSigDataUrl: string) => {
    setSenderSignModalOpen(false);
    if (!pendingSecConfig || !documentType || !intent) return;

    const doCreateBilateral = async () => {
      try {
        const txId = await createSignTransaction({
          creator_id:       session?.user?.id ?? null,
          document_type:    documentType,
          document_data:    intent === 'blank_send' ? { _blank: true } : (formData as Record<string, unknown>),
          intent:           intent,
          security_config:  pendingSecConfig,
          status:           'sender_signed',
          sender_signature: senderSigDataUrl,
        });
        const shareUrl = `${window.location.origin}/sign/${txId}`;
        setTxShareData({ txId, shareUrl, config: pendingSecConfig });
        setPendingSecConfig(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('Error creating sign_transaction with sender signature:', msg);
        toast.error(
          language === 'en' ? `Error creating transaction: ${msg}` : `Error al crear la transaccion: ${msg}`,
          { duration: 7000 },
        );
      }
    };

    if (!isAdmin && !unlimitedActive && !subscriptionActive) {
      const userId = session?.user?.id;
      const { allowed } = userId
        ? await consumeSignatureRequest72h(userId, false)
        : { allowed: false };
      if (!allowed) {
        setLimitNextSlotAt(userId ? await getNextSignatureRequestSlot(userId) : null);
        setPendingLimitRetry(() => doCreateBilateral);
        setLimitDialogOpen(true);
        return;
      }
    }
    await doCreateBilateral();
  };

  const handleCopyTxLink = () => {
    if (!txShareData) return;
    navigator.clipboard.writeText(txShareData.shareUrl).then(() => {
      setTxLinkCopied(true);
      setTimeout(() => setTxLinkCopied(false), 2200);
    });
  };

  const handleDownloadSignedDoc = () => {
    if (!activeTx) return;
    try {
      sessionStorage.setItem('documentData', JSON.stringify(activeTx.document_data));
      sessionStorage.setItem('documentBranding', JSON.stringify(branding));
      sessionStorage.setItem('documentType', activeTx.document_type);

      // Recipient signature → coSigners slot
      if (activeTx.recipient_signature) {
        const recipientAsSigner = [{
          id: 'recipient',
          name: language === 'en' ? 'Recipient' : 'Destinatario',
          role: language === 'en' ? 'Signer' : 'Firmante',
          token: '',
          sigDataUrl: activeTx.recipient_signature,
          placement: null,
        }];
        sessionStorage.setItem('coSigners', JSON.stringify(recipientAsSigner));
      }

      // Sender's own pre-signature → owner slot in preview-page
      if (activeTx.sender_signature) {
        sessionStorage.setItem('userSignatureDataUrl', activeTx.sender_signature);
      } else {
        sessionStorage.removeItem('userSignatureDataUrl');
      }

      // Evidence photos → passed to PDF generator for the audit page
      if (activeTx.recipient_selfie) {
        sessionStorage.setItem('identitySelfie', activeTx.recipient_selfie);
      } else {
        sessionStorage.removeItem('identitySelfie');
      }
      if (activeTx.recipient_id_photo) {
        const parsedId = parseIdEvidencePayload(activeTx.recipient_id_photo);
        if (parsedId.front) {
          sessionStorage.setItem('identityIdDocFront', parsedId.front);
          sessionStorage.setItem('identityIdDoc', parsedId.front);
        } else {
          sessionStorage.removeItem('identityIdDocFront');
          sessionStorage.removeItem('identityIdDoc');
        }
        if (parsedId.back) sessionStorage.setItem('identityIdDocBack', parsedId.back);
        else sessionStorage.removeItem('identityIdDocBack');
      } else {
        sessionStorage.removeItem('identityIdDocFront');
        sessionStorage.removeItem('identityIdDocBack');
        sessionStorage.removeItem('identityIdDoc');
      }

      sessionStorage.setItem('isPurchased', 'true');
    } catch { /* sessionStorage quota */ }
    navigate(`/preview/${activeTx.document_type}`);
  };
  // ─────────────────────────────────────────────────────────────────────────

  const navigateToPreview = () => navigate(`/preview/${documentType}`);

  const handleClearForm = () => {
    localStorage.removeItem(DRAFT_KEY);
    sessionStorage.removeItem('selectedState');
    sessionStorage.removeItem('documentData');
    setFormData({});
    setSelectedState('');
    setMissingRequiredFields([]);
    setActiveFieldId('');
  };

  const handleSignatureConfirm = (dataUrl: string) => {
    setUserSigDataUrl(dataUrl);
    sessionStorage.setItem('userSignatureDataUrl', dataUrl);
    setSigningPanelOpen(false);
  };

  const handleSignToVerify = () => {
    setFlowStep('verify');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 80);
  };

  const startCamera = useCallback(async (type: 'selfie' | 'id') => {
    setCameraError('');
    // Stop any existing stream first
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'selfie'
          ? { facingMode: 'user', width: { ideal: 1920, max: 3840 }, height: { ideal: 1080, max: 2160 } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1920, max: 3840 }, height: { ideal: 1080, max: 2160 } },
      });
      streamRef.current = stream;
      try { console.log('USER', user); console.log('IS_ADMIN', isAdmin); console.log('PERMISSIONS', (user as any)?.permissions || null); } catch {}
      setActiveCameraType(type);
    } catch {
      setCameraError(language === 'en'
        ? 'Camera access denied. Please allow camera access in your browser.'
        : 'Acceso a la cámara denegado. Por favor permite el acceso en tu navegador.');
    }
  }, [language, user, isAdmin]);

  const capturePhoto = useCallback(async () => {
    try { console.log('USER', user); console.log('IS_ADMIN', isAdmin); console.log('PERMISSIONS', (user as any)?.permissions || null); } catch {}
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth  || 1920;
    canvas.height = video.videoHeight || 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (activeCameraType === 'selfie') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.9);

    try {
      if (activeCameraType === 'selfie') {
        const normalized = await normalizeSelfieEvidence(rawDataUrl);
        setSelfieDataUrl(normalized);
      } else {
        const normalized = await normalizeIdEvidence(rawDataUrl);
        setIdDocDataUrl(normalized);
      }
    } catch {
      if (activeCameraType === 'selfie') setSelfieDataUrl(rawDataUrl);
      else setIdDocDataUrl(rawDataUrl);
    }

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActiveCameraType(null);
  }, [activeCameraType]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActiveCameraType(null);
    setCameraError('');
  }, []);

  const handleReadyToDownload = async () => {
    // Persist identity images for PDF audit page
    if (selfieDataUrl) sessionStorage.setItem('identitySelfie', selfieDataUrl);
    else sessionStorage.removeItem('identitySelfie');
    if (idDocDataUrl) {
      sessionStorage.setItem('identityIdDocFront', idDocDataUrl);
      sessionStorage.setItem('identityIdDoc', idDocDataUrl);
    } else {
      sessionStorage.removeItem('identityIdDocFront');
      sessionStorage.removeItem('identityIdDoc');
    }
    sessionStorage.removeItem('identityIdDocBack');

    sessionStorage.setItem('isPurchased', 'true');
    if (coSigners.length > 0) {
      try { sessionStorage.setItem('coSigners', JSON.stringify(coSigners)); } catch { /* quota */ }
    }
    navigateToPreview();
  };

  const handleLogoUpload = (file?: File | null) => {
    if (!file) {
      setBranding((prev) => ({ ...prev, logoDataUrl: '', enableLogo: false }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBranding((prev) => ({
        ...prev,
        logoDataUrl: String(reader.result || ''),
        enableLogo: true,
      }));
    };
    reader.readAsDataURL(file);
  };

  const getDynamicOptions = (fieldId: string, fallback?: string[]) => {
    if (fieldId.includes('state') || fieldId.includes('governing_state')) {
      return US_STATES;
    }
    if (fieldId.includes('jurisdiction')) {
      return selectedState ? [selectedState] : US_STATES;
    }
    if (fieldId.includes('role')) {
      return ['Receptora', 'Divulgadora', 'Vendedor', 'Comprador'];
    }
    return fallback || [];
  };

  useEffect(() => {
    if (!selectedState || !template) return;
    const governingField = template.fields.find((f) => f.id === 'governing_state' || f.id === 'jurisdiction');
    if (!governingField) return;
    setFormData((prev) => {
      if (prev[governingField.id]) return prev;
      return { ...prev, [governingField.id]: selectedState };
    });
  }, [selectedState, template]); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime listener for sign transaction — activates when share screen is open
  useEffect(() => {
    if (!txShareData?.txId) return;

    const unsub = subscribeToTransaction(txShareData.txId, (updated) => setActiveTx(updated));

    const pollTx = async () => {
      try {
        const current = await getSignTransaction(txShareData.txId);
        if (current) setActiveTx(current);
      } catch {
        // ignore transient errors and rely on realtime when available
      }
    };

    pollTx();
    const intervalId = window.setInterval(pollTx, 4000);

    return () => {
      unsub();
      window.clearInterval(intervalId);
    };
  }, [txShareData?.txId]); // eslint-disable-line react-hooks/exhaustive-deps

  // â"€â"€ All hooks are above this line â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t('generator.templateNotFound')}</h2>
          <Link to="/">
            <Button>{t('common.backHome')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const glowBase = 'transition-all duration-150 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none';
  const glowError = 'border-red-500 focus:border-red-500 focus:ring-red-500/20';

  const renderField = (field: typeof visibleFields[number]) => {
    const dynamicOptions = getDynamicOptions(field.id, field.options);
    const isSelect = field.type === 'select' || field.id.includes('state') || field.id.includes('jurisdiction') || field.id.includes('role');
    const hasError = missingRequiredFields.includes(field.id);
    const inputCls = `${glowBase} ${hasError ? glowError : ''}`;
    // Year-like number fields: 4-char limit, no spinners
    const isYearField = field.id.includes('year') || field.id.includes('built');
    const placeholder = getFieldTranslation(template.id, field.id, 'placeholder', language) || field.placeholder;

    return (
      <div key={field.id} className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={field.id} className={hasError ? 'text-red-600' : ''}>
            {getFieldTranslation(template.id, field.id, 'label', language) || field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {field.helpText && (
            <div className="relative group/tip">
              <button type="button" className="text-slate-400 hover:text-slate-600 transition-colors">
                <Info className="size-4" />
              </button>
              {/* CSS-only tooltip — no portal, no React unmount issue */}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 hidden group-hover/tip:block">
                <div className="w-max max-w-[220px] rounded-lg bg-slate-800 px-3 py-2 text-xs leading-relaxed text-white shadow-xl">
                  {getFieldTranslation(template.id, field.id, 'help', language) || field.helpText}
                  <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                </div>
              </div>
            </div>
          )}
        </div>

        {field.type === 'text' && !isSelect && (
          <Input id={field.id} placeholder={placeholder} value={String(formData[field.id] ?? '')} onChange={(e) => handleInputChange(field.id, e.target.value)} onFocus={() => setActiveFieldId(field.id)} required={field.required} className={inputCls} />
        )}
        {field.type === 'email' && (
          <Input id={field.id} type="email" placeholder={placeholder} value={String(formData[field.id] ?? '')} onChange={(e) => handleInputChange(field.id, e.target.value)} onFocus={() => setActiveFieldId(field.id)} required={field.required} className={inputCls} />
        )}
        {field.type === 'tel' && (
          <Input id={field.id} type="tel" placeholder={placeholder || t('generator.phonePlaceholder')} value={String(formData[field.id] ?? '')} onChange={(e) => handleInputChange(field.id, e.target.value)} onFocus={() => setActiveFieldId(field.id)} required={field.required} className={inputCls} />
        )}
        {field.type === 'date' && (
          <Input id={field.id} type="date" value={String(formData[field.id] ?? '')} onChange={(e) => handleInputChange(field.id, e.target.value)} onFocus={() => setActiveFieldId(field.id)} required={field.required} className={inputCls} />
        )}
        {/* number fields — use type="tel" to suppress native spin arrows */}
        {field.type === 'number' && !isSelect && (
          <Input
            id={field.id}
            type="tel"
            inputMode="numeric"
            placeholder={placeholder}
            value={String(formData[field.id] ?? '')}
            onChange={(e) => {
              const clean = e.target.value.replace(/[^0-9]/g, '');
              handleInputChange(field.id, isYearField ? clean.slice(0, 4) : clean);
            }}
            onFocus={() => setActiveFieldId(field.id)}
            required={field.required}
            maxLength={isYearField ? 4 : undefined}
            className={inputCls}
          />
        )}
        {field.type === 'currency' && (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none select-none">$</span>
            <Input
              id={field.id}
              type="tel"
              inputMode="decimal"
              placeholder={placeholder}
              value={String(formData[field.id] ?? '')}
              onChange={(e) => {
                const clean = e.target.value.replace(/[^0-9.]/g, '');
                handleInputChange(field.id, clean);
              }}
              onFocus={() => setActiveFieldId(field.id)}
              required={field.required}
              className={`pl-7 ${inputCls}`}
            />
          </div>
        )}
        {field.type === 'textarea' && (
          <Textarea id={field.id} placeholder={placeholder} value={String(formData[field.id] ?? '')} onChange={(e) => handleInputChange(field.id, e.target.value)} onFocus={() => setActiveFieldId(field.id)} required={field.required} rows={4} className={inputCls} />
        )}
        {field.type === 'checkbox' && (
          <Label className="flex items-center gap-2">
            <input id={field.id} type="checkbox" checked={Boolean(formData[field.id])} onChange={(e) => handleInputChange(field.id, e.target.checked)} onFocus={() => setActiveFieldId(field.id)} className="size-4 rounded accent-blue-600" />
            <span>{getFieldTranslation(template.id, field.id, 'label', language) || field.label}</span>
          </Label>
        )}
        {/* Native <select> — bypasses all portal/z-index/pointer-events issues */}
        {isSelect && (
          <div className="relative">
            <select
              id={field.id}
              value={String(formData[field.id] || '')}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              onFocus={() => setActiveFieldId(field.id)}
              required={field.required}
              className={`w-full h-9 appearance-none cursor-pointer rounded-md border bg-white pl-3 pr-9 py-0 text-sm text-slate-800 transition-all duration-150 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 ${
                hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              <option value="">{t('generator.selectOption')}</option>
              {dynamicOptions.map((option) => (
                <option key={option} value={option}>
                  {getFieldOptionTranslation(template.id, field.id, option, language)}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
              <ChevronDown className="size-4 text-slate-400" />
            </span>
          </div>
        )}
      </div>
    );
  };

  const previewTemplate = language === 'es' && spanishTemplates[template.id]
    ? spanishTemplates[template.id]
    : template.template;

  const PreviewPanel = () => (
    <div key="document-preview-live-root">
      <Card className="lg:sticky lg:top-4 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t('preview.documentPreview')}</CardTitle>
          <CardDescription className="text-xs">
            {language === 'en' ? 'Live preview' : 'Vista previa en vivo'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[calc(100vh-180px)] overflow-y-auto px-4 pb-4" data-preview-scroll-container>
            <DocumentPreview
              template={previewTemplate}
              data={deferredFormData}
              activeFieldId={activeFieldId}
              showWatermark
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">

      {/* ── Intent Modal (shown once at start) ──────────────────────────── */}
      <IntentModal
        open={intentModalOpen}
        language={language}
        onSelect={handleIntentSelect}
      />

      {/* ── Security Config Modal ────────────────────────────────────────── */}
      <SecurityConfigModal
        open={securityModalOpen}
        language={language}
        onConfirm={handleSecurityConfirm}
        onCancel={() => setSecurityModalOpen(false)}
      />

      {/* ── Free signature-request limit (72h rolling window) ────────────── */}
      <SignatureLimitDialog
        open={limitDialogOpen}
        onOpenChange={setLimitDialogOpen}
        userId={session?.user?.id ?? ''}
        nextSlotAt={limitNextSlotAt}
        onUnlocked={() => pendingLimitRetry?.()}
      />

      {/* ── Transaction Share Screen ──────────────────────────────────── */}
      {txShareData && (() => {
        const isSigned = activeTx?.status === 'completed';
        return (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.80)', backdropFilter: 'blur(10px)' }}>
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">

              {/* Header */}
              <div className={`px-6 py-5 ${isSigned ? 'bg-gradient-to-r from-emerald-700 to-emerald-600' : 'bg-gradient-to-r from-slate-900 to-slate-800'}`}>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  {isSigned
                    ? <><CheckCircle2 className="size-5" /> {language === 'en' ? 'Document Signed!' : '¡Documento Firmado!'}</>
                    : <><ShieldCheck className="size-5 text-emerald-400" /> {language === 'en' ? 'Secure Link Ready' : 'Enlace Seguro Listo'}</>
                  }
                </h2>
                <p className="mt-0.5 text-xs text-white/60">
                  {isSigned
                    ? (language === 'en' ? 'The recipient has completed all required steps.' : 'El destinatario completó todos los pasos requeridos.')
                    : (language === 'en' ? 'Share this link — we will notify you when signed.' : 'Comparte este enlace. Te avisaremos cuando firme.')
                  }
                </p>
              </div>

              <div className="p-6 space-y-4">

                {/* Waiting pulse indicator */}
                {!isSigned && (
                  <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                    <span className="relative flex size-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full size-2.5 bg-amber-500" />
                    </span>
                    <span className="text-sm font-semibold text-amber-700">
                      {language === 'en' ? 'Awaiting recipient signature…' : 'Esperando firma del destinatario…'}
                    </span>
                  </div>
                )}

                {/* Signed: Download 3D button */}
                {isSigned && (
                  <button
                    onClick={handleDownloadSignedDoc}
                    className="w-full rounded-xl py-4 text-base font-bold text-white flex items-center justify-center gap-2.5 active:translate-y-0.5 transition-all"
                    style={{
                      background: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 38%, #1d4ed8 68%, #1e3a8a 100%)',
                      boxShadow: '0 3px 0 #1e3a8a, 0 5px 20px rgba(29,78,216,0.55), inset 0 1px 0 rgba(255,255,255,0.25)',
                    }}
                  >
                    <Download className="size-5" />
                    {language === 'en' ? 'Download Signed Document' : 'Descargar Documento Firmado'}
                  </button>
                )}

                {/* Link box — only while pending */}
                {!isSigned && (
                  <>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2 px-3 py-2.5">
                      <span className="flex-1 text-xs text-slate-500 truncate font-mono">{txShareData.shareUrl}</span>
                      <button onClick={handleCopyTxLink}
                        className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 flex items-center gap-1.5 transition-colors">
                        {txLinkCopied
                          ? <><Check className="size-3" /> {language === 'en' ? 'Copied!' : 'Copiado!'}</>
                          : <><Copy className="size-3" /> {language === 'en' ? 'Copy' : 'Copiar'}</>
                        }
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent((language === 'en' ? 'Please sign this document: ' : 'Por favor firma este documento: ') + txShareData.shareUrl)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100 transition-colors">
                        <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.117 1.532 5.84L0 24l6.354-1.498A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.003-1.366l-.357-.212-3.773.889.937-3.676-.232-.373A9.818 9.818 0 1112 21.818z"/></svg>
                        WhatsApp
                      </a>
                      <a
                        href={`mailto:?subject=${encodeURIComponent(language === 'en' ? 'Document signature request' : 'Solicitud de firma de documento')}&body=${encodeURIComponent((language === 'en' ? 'Please sign this document: ' : 'Por favor firma este documento: ') + txShareData.shareUrl)}`}
                        className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
                        <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        {language === 'en' ? 'Email' : 'Correo'}
                      </a>
                    </div>

                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2.5">
                      <p className="text-[11px] font-semibold text-indigo-700">
                        {language === 'en'
                          ? 'Bookmark this page (or copy the link below) to check back later — closing this tab loses this screen.'
                          : 'Guarda esta página (o copia el link de abajo) para revisar más tarde — si cierras esta pestaña, se pierde esta pantalla.'}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="flex-1 truncate text-[11px] font-mono text-indigo-600">
                          {`${window.location.origin}/generator/${documentType}?tx=${txShareData.txId}`}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/generator/${documentType}?tx=${txShareData.txId}`);
                            toast.success(language === 'en' ? 'Link copied!' : '¡Link copiado!');
                          }}
                          className="shrink-0 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-indigo-700 transition-colors"
                        >
                          {language === 'en' ? 'Copy' : 'Copiar'}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <button
                  onClick={() => { setTxShareData(null); setActiveTx(null); }}
                  className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
                  {isSigned
                    ? (language === 'en' ? 'Close' : 'Cerrar')
                    : (language === 'en' ? 'Close (keep waiting)' : 'Cerrar (seguir esperando)')
                  }
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 3D FIXED PROGRESS BAR ────────────────────────────────────────── */}
      {flowStep === 'form' && requiredFields.length > 0 && (
        <div
          className="fixed top-0 left-0 z-[60] w-full h-[4px] pointer-events-none"
          style={{ background: 'rgba(226,232,240,0.85)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.10)' }}
        >
          <div
            className={`h-full transition-all duration-500 ease-out relative overflow-hidden ${
              formProgress === 100
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                : 'bg-gradient-to-r from-sky-400 to-cyan-500'
            }`}
            style={{ width: `${formProgress}%` }}
          >
            {/* Top sheen for 3D relief */}
            <div className="absolute inset-x-0 top-0 h-px bg-white/50" />
            {/* Animated shimmer sweep */}
            {formProgress > 0 && formProgress < 100 && (
              <div className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.8s_infinite]" />
            )}
          </div>
        </div>
      )}

      {/* payment overlays removed — gate moved to preview-page download step */}
      {false && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-slate-900 p-8 shadow-[0_0_80px_rgba(99,102,241,0.5)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/70 to-transparent" />

            <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/30 to-indigo-600/20 ring-1 ring-white/10">
              <Lock className="size-7 text-blue-300" />
            </div>

            <h2 className="text-2xl font-extrabold text-white">
              {language === 'en' ? 'Download Your Document' : 'Descarga tu Documento'}
            </h2>
            <p className="mt-2 text-sm text-white/60">
              {language === 'en'
                ? 'You have used your 2 free daily documents. Complete the payment to download your signed document.'
                : 'Ya usaste tus 2 documentos gratuitos del dia. Completa el pago para descargar tu documento firmado.'}
            </p>

            <ul className="my-5 space-y-2 text-sm">
              {[
                { icon: <CreditCard className="size-4 text-blue-400" />, en: 'Pay with PayPal or any debit / credit card', es: 'Paga con PayPal o tarjeta de debito / credito' },
                { icon: <ShieldCheck className="size-4 text-emerald-400" />, en: 'Clean PDF — no watermarks', es: 'PDF limpio — sin marcas de agua' },
                { icon: <PenLine className="size-4 text-indigo-400" />, en: 'Signed document ready to download', es: 'Documento firmado listo para descargar' },
              ].map((b) => (
                <li key={b.en} className="flex items-center gap-2.5 text-white/80">{b.icon}{language === 'en' ? b.en : b.es}</li>
              ))}
            </ul>

            <PayPalCheckoutBackend
              amount={7}
              documentName={getDocumentTranslation(template.id, 'name', language) || template.id}
              documentId={`${documentType}-${session?.user?.id || 'anon'}-${Date.now()}`}
              customerEmail={user?.email || ''}
              isEmailValid={!!user?.email}
              onSuccess={handlePaymentSuccess}
              onError={() => toast.error(language === 'en' ? 'Payment failed. Please try again.' : 'Pago fallido. Intenta de nuevo.')}
              language={language}
            />

            <button
              type="button"
              onClick={() => setFlowStep('sign')}
              className="mt-4 w-full rounded-xl border border-white/10 py-2.5 text-sm text-white/40 transition hover:text-white/70"
            >
              {language === 'en' ? '← Back to signature' : '← Volver a la firma'}
            </button>
          </div>
        </div>
      )}

      {false && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-slate-900 p-8 shadow-[0_0_80px_rgba(99,102,241,0.5)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent" />

            <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-600/20 ring-1 ring-white/10">
              <PenLine className="size-7 text-indigo-300" />
            </div>

            <h2 className="text-2xl font-extrabold text-white">
              {language === 'en' ? 'Signing Limit Reached' : 'Limite de firmas alcanzado'}
            </h2>
            <p className="mt-2 text-sm text-white/60">
              {language === 'en'
                ? 'You have used your 2 free daily signing requests. Pay $3 for this signature or upgrade to a plan.'
                : 'Ya usaste tus 2 envios de firma gratuitos del dia. Paga $3 por esta firma o adquiere un plan.'}
            </p>

            <div className="my-5 rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-3">
              <p className="text-xs text-indigo-300 font-medium">
                {language === 'en' ? 'What you get:' : 'Que incluye:'}
              </p>
              <ul className="mt-2 space-y-1.5 text-xs text-indigo-200/70">
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 shrink-0 text-indigo-400" />{language === 'en' ? 'Send this document for signature now' : 'Envia este documento para firma ahora'}</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 shrink-0 text-indigo-400" />{language === 'en' ? 'Selfie + ID photo verification options' : 'Opciones de selfie + foto de ID'}</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 shrink-0 text-indigo-400" />{language === 'en' ? 'Real-time signing status updates' : 'Actualizaciones en tiempo real del estado de firma'}</li>
              </ul>
            </div>

            <PayPalCheckoutBackend
              amount={3}
              documentName={language === 'en' ? 'Single Signature' : 'Firma Individual'}
              documentId={`sig-${documentType}-${session?.user?.id || 'anon'}-${Date.now()}`}
              customerEmail={user?.email || ''}
              isEmailValid={!!user?.email}
              onSuccess={handleSigPaymentSuccess}
              onError={() => toast.error(language === 'en' ? 'Payment failed. Please try again.' : 'Pago fallido. Intenta de nuevo.')}
              language={language}
            />

            <button
              type="button"
              onClick={() => { setFlowStep('form'); setPayReason(null); }}
              className="mt-4 w-full rounded-xl border border-white/10 py-2.5 text-sm text-white/40 transition hover:text-white/70"
            >
              {language === 'en' ? '← Back to form' : '← Volver al formulario'}
            </button>
          </div>
        </div>
      )}

      {/* â"€â"€ HEADER â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex shrink-0 items-center gap-2 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="size-5" />
              <span className="hidden sm:inline">{t('generator.backToTemplates')}</span>
            </Link>
            {/* Step indicators */}
            <div className="flex items-center gap-1 text-xs font-semibold">
              {[
                { key: 'form',   label: language === 'en' ? '1 · Form'    : '1 · Formulario' },
                { key: 'sign',   label: language === 'en' ? '2 · Sign'    : '2 · Firma'      },
                { key: 'verify', label: language === 'en' ? '3 · Verify'  : '3 · Verificar'  },
              ].map((s, i, arr) => (
                <span key={s.key} className="flex items-center gap-1">
                  <span className={`rounded-full px-2.5 py-0.5 ${flowStep === s.key ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                    {s.label}
                  </span>
                  {i < arr.length - 1 && <span className="text-slate-300">›</span>}
                </span>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {/* Compact progress pill in navbar */}
              {flowStep === 'form' && requiredFields.length > 0 && (
                <span className={`hidden sm:inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                  formProgress === 100
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}>
                  {formProgress === 100
                    ? (language === 'en' ? '✓ Ready' : '✓ Listo')
                    : `${filledRequiredCount}/${requiredFields.length}`}
                </span>
              )}
              <FileText className="size-5 text-slate-400" />
              <span className="hidden sm:inline font-semibold text-sm text-slate-700">{getDocumentTranslation(template.id, 'name', language)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* â"€â"€ STABLE STEP CONTAINER â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      {/* Wrapping both steps in a permanent host <div> guarantees React uses     */}
      {/* appendChild (not insertBefore) when swapping between them.              */}
      {/* getHostSibling stops at this HOST boundary and returns null every time. */}
      <div>

      {/* ── PASO 2: FIRMA ────────────────────────────────────────────────────────── */}
      {flowStep === 'sign' && (
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 items-start">

            {/* ═══ PANEL IZQUIERDO ═══ */}
            <div className="space-y-4">

              {/* Encabezado del paso */}
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-950 shadow-lg shadow-slate-900/30">
                  <PenLine className="size-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {language === 'en' ? 'Sign the Document' : 'Firmar el Documento'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {language === 'en'
                      ? 'Your signature is placed automatically in the designated area'
                      : 'Tu firma se coloca automáticamente en el área designada'}
                  </p>
                </div>
              </div>

              {/* Tarjeta: Firma del propietario */}
              <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${userSigDataUrl ? 'bg-emerald-500' : 'bg-blue-600'}`}>
                      {userSigDataUrl ? <ShieldCheck className="size-4" /> : '1'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 leading-tight">
                        {user?.user_metadata?.full_name || user?.email || (language === 'en' ? 'You' : 'Tú')}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                        {language === 'en' ? 'Document Owner · Primary Signer' : 'Propietario · Firmante Principal'}
                      </p>
                    </div>
                  </div>
                  {userSigDataUrl && (
                    <button
                      type="button"
                      onClick={() => { setUserSigDataUrl(''); setSigningPanelOpen(false); }}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 transition hover:border-red-200 hover:text-red-500"
                    >
                      {language === 'en' ? '↺ Change' : '↺ Cambiar'}
                    </button>
                  )}
                </div>

                <div className="p-4">
                  {!userSigDataUrl ? (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-center">
                        <PenLine className="mx-auto mb-1.5 size-5 text-blue-500" />
                        <p className="text-sm font-semibold text-slate-800">
                          {language === 'en' ? 'Draw your signature' : 'Dibuja tu firma'}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {language === 'en'
                            ? 'Click the button below to open the signature pad'
                            : 'Haz clic abajo para abrir el pad de firma'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSigningPanelOpen(true)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/35 transition"
                      >
                        <PenLine className="size-4" />
                        {language === 'en' ? 'Open Signature Pad' : 'Abrir Pad de Firma'}
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-end rounded-xl border border-emerald-100 bg-gradient-to-b from-white to-emerald-50/40 px-4 pt-3 pb-2"
                      style={{ minHeight: 130 }}
                    >
                      <img
                        src={userSigDataUrl}
                        alt="Tu firma"
                        crossOrigin="anonymous"
                        style={{ width: '100%', maxHeight: 90, objectFit: 'contain', display: 'block', margin: '0 auto', minHeight: 50 }}
                      />
                      <div style={{ width: '100%', height: 1, background: '#94a3b8', margin: '8px 0 2px' }} />
                      <p className="text-[10px] text-slate-400 font-medium">
                        {user?.user_metadata?.full_name || user?.email || ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Co-signers */}
              {coSigners.map((cs, i) => (
                <CoSignerCard key={cs.id} index={i + 2} signer={cs} onRemove={() => handleRemoveCoSigner(cs.id, cs.token)} language={language} />
              ))}

              {addingCoSigner ? (
                <div className="overflow-hidden rounded-2xl border-2 border-indigo-200 bg-white shadow-sm">
                  <div className="flex items-center gap-2 border-b border-slate-100 bg-indigo-50/80 px-4 py-3">
                    <UserPlus className="size-4 text-indigo-600" />
                    <p className="text-sm font-bold text-slate-800">{language === 'en' ? 'New Co-Signer' : 'Nuevo Co-Firmante'}</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <input type="text" placeholder={language === 'en' ? 'Full name *' : 'Nombre completo *'} value={newCoSignerName} onChange={(e) => setNewCoSignerName(e.target.value)} autoFocus className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20" />
                    <input type="text" placeholder={language === 'en' ? 'Role (e.g. Tenant, Witness…)' : 'Rol (ej: Arrendatario, Fiador…)'} value={newCoSignerRole} onChange={(e) => setNewCoSignerRole(e.target.value)} className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20" />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setAddingCoSigner(false); setNewCoSignerName(''); setNewCoSignerRole(''); }} className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50">{language === 'en' ? 'Cancel' : 'Cancelar'}</button>
                      <button type="button" onClick={handleAddCoSigner} disabled={!newCoSignerName.trim() || addingCoSignerLoading} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2 text-sm font-bold text-white shadow transition hover:bg-indigo-700 disabled:opacity-50">
                        {addingCoSignerLoading ? <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <QRCodeSVG value="x" size={14} className="opacity-90" />}
                        {language === 'en' ? 'Generate Link' : 'Generar Enlace'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setAddingCoSigner(true)} className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-200/70 bg-blue-50/20 py-3 text-sm font-semibold text-slate-500 transition hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/60">
                  <UserPlus className="size-4" />
                  {language === 'en' ? 'Add Co-Signer' : 'Agregar Co-Firmante'}
                </button>
              )}

              <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2 text-[11px] text-blue-700 font-medium">
                <ShieldCheck className="size-3.5 shrink-0 text-blue-500" />
                {language === 'en' ? 'E-SIGN & UETA Compliant · Each signer gets a unique link — no account needed' : 'Cumple E-SIGN y UETA · Enlace único por firmante — sin cuenta requerida'}
              </div>

              {/* CTA principal */}
              {userSigDataUrl && (
                <div className="space-y-2">
                  {coSigners.some((cs) => !cs.sigDataUrl) ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
                      <p className="text-sm font-semibold text-amber-700">{language === 'en' ? 'Waiting for co-signers…' : 'Esperando co-firmantes…'}</p>
                      <p className="text-[11px] text-amber-600 mt-0.5">{coSigners.filter((cs) => !cs.sigDataUrl).length} {language === 'en' ? 'pending signature(s)' : 'firma(s) pendiente(s)'}</p>
                    </div>
                  ) : (
                    <Button
                      className="w-full gap-2 bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white py-5 text-sm font-bold shadow-xl shadow-blue-600/35 rounded-xl"
                      onClick={handleSignToVerify}
                    >
                      <ShieldCheck className="size-4" />
                      {language === 'en' ? 'Continue to Step 3 — Verify →' : 'Continuar al Paso 3 — Verificar →'}
                    </Button>
                  )}
                </div>
              )}

              {!userSigDataUrl && (
                <button type="button" onClick={() => setFlowStep('form')} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm text-slate-500 transition hover:bg-slate-50">
                  {language === 'en' ? '← Back to Form' : '← Volver al Formulario'}
                </button>
              )}

              <div className="pt-1 text-center">
                <button type="button" onClick={handleSignToVerify} className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 transition hover:text-slate-600 underline-offset-2 hover:underline">
                  <Download className="size-3" />
                  {language === 'en' ? 'Skip signature — go to next step' : 'Omitir firma — ir al siguiente paso'}
                </button>
              </div>
            </div>

            {/* ═══ PANEL DERECHO: PREVIEW DEL DOCUMENTO ═══ */}
            <div>
              {coSigners.some((cs) => cs.sigDataUrl) && (
                <div className="mb-2 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700 font-medium">
                  <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                  {coSigners.filter((cs) => cs.sigDataUrl).length === 1
                    ? (language === 'en' ? 'Co-signer signed — signature added to document' : 'Co-firmante firmó — firma añadida al documento')
                    : (language === 'en' ? `${coSigners.filter((cs) => cs.sigDataUrl).length} co-signers signed` : `${coSigners.filter((cs) => cs.sigDataUrl).length} co-firmantes firmaron`)}
                </div>
              )}
              <Card className="overflow-hidden shadow-lg shadow-slate-200/60 ring-1 ring-slate-200/80">
                <CardContent className="p-0">
                  <div className="max-h-[calc(100vh-200px)] overflow-y-auto" data-preview-scroll-container>
                    <DocumentPreview
                      template={previewTemplate}
                      data={deferredFormData}
                      activeFieldId={activeFieldId}
                      showWatermark
                      leftSignatureUrl={userSigDataUrl || undefined}
                      rightSignatureUrl={coSigners.find((cs) => cs.sigDataUrl)?.sigDataUrl}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>

          {/* SignatureModal — popup centrado flotante */}
          <SignatureModal
            open={signingPanelOpen}
            onOpenChange={setSigningPanelOpen}
            onConfirm={handleSignatureConfirm}
            signerName={user?.user_metadata?.full_name || user?.email || ''}
            userId={session?.user?.id}
            title={language === 'en' ? 'Electronic Signature' : 'Firma Electrónica'}
          />
        </div>
      )}

      {/* Sender pre-sign modal — bilateral flows only (fill_send, fill_approve) */}
      <SignatureModal
        open={senderSignModalOpen}
        onOpenChange={(open) => {
          setSenderSignModalOpen(open);
          if (!open) setPendingSecConfig(null);
        }}
        onConfirm={handleSenderSignatureAndCreate}
        signerName={user?.user_metadata?.full_name || user?.email || ''}
        title={language === 'en' ? 'Sign as Sender' : 'Firma como Remitente'}
        subtitle={language === 'en'
          ? 'Your signature will be embedded in the contract before sharing the link.'
          : 'Tu firma quedara en el contrato antes de compartir el enlace.'}
      />

      {/* ── PASO 3: VERIFICACIÓN DE IDENTIDAD ───────────────────────────────────── */}
      {flowStep === 'verify' && (
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">

            {/* ═══ PANEL IZQUIERDO ═══ */}
            <div className="space-y-4">

              {/* Encabezado */}
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-950 shadow-lg shadow-slate-900/30">
                  <ShieldCheck className="size-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {language === 'en' ? 'Identity Verification' : 'Verificación de Identidad'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {language === 'en'
                      ? 'Optional — strengthens legal enforceability of your e-signature'
                      : 'Opcional — refuerza la validez legal de tu firma electrónica'}
                  </p>
                </div>
              </div>

              {/* Compliance badge */}
              <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5 text-[11px] text-blue-700 font-medium">
                <ShieldCheck className="size-3.5 shrink-0 text-blue-500" />
                {language === 'en'
                  ? 'E-SIGN Act · UETA · Identity audit trail — industry standard compliance'
                  : 'E-SIGN Act · UETA · Registro de auditoría de identidad — cumplimiento estándar'}
              </div>

              {/* Toggle 1: Selfie */}
              <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm transition-all">
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors ${selfieEnabled ? 'bg-blue-600' : 'bg-slate-100'}`}>
                      <User className={`size-4 ${selfieEnabled ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {language === 'en' ? 'Validation Selfie' : 'Selfie de Validación'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {language === 'en' ? "Signer's face via front camera" : 'Rostro del firmante, cámara frontal'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selfieDataUrl && <CheckCircle2 className="size-5 text-emerald-500" />}
                    <button
                      type="button"
                      aria-label={selfieEnabled ? 'Disable selfie' : 'Enable selfie'}
                      onClick={() => {
                        const next = !selfieEnabled;
                        setSelfieEnabled(next);
                        if (!next) { setSelfieDataUrl(''); if (activeCameraType === 'selfie') stopCamera(); }
                        else if (!selfieDataUrl) void startCamera('selfie');
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${selfieEnabled ? '' : 'bg-slate-200'}`}
                      style={selfieEnabled ? { background: 'linear-gradient(135deg, #3b82f6, #4f46e5)' } : {}}
                    >
                      <span className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${selfieEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                {selfieEnabled && !selfieDataUrl && (
                  <div className="border-t border-slate-100 p-4 space-y-3">
                    <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] text-blue-800">
                      <p className="font-semibold">Center your face inside the circle</p>
                      <p>✓ Look directly at camera</p>
                      <p>✓ Remove sunglasses</p>
                      <p>✓ Good lighting</p>
                    </div>
                    {activeCameraType === 'selfie' ? (
                      <>
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 shadow-inner" style={{ aspectRatio: '4/3' }}>
                          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover [transform:scaleX(-1)]" />
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="size-36 rounded-full border-[3px] border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.40)]" />
                          </div>
                          <p className="absolute bottom-3 inset-x-0 text-center text-[10px] text-white/70 font-medium">
                            {language === 'en' ? 'Center your face in the circle' : 'Centra tu rostro en el círculo'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={capturePhoto} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/30 transition">
                            <Camera className="size-4" />
                            {language === 'en' ? 'Capture Selfie' : 'Capturar Selfie'}
                          </button>
                          <button type="button" onClick={stopCamera} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 transition hover:bg-slate-50"><X className="size-4" /></button>
                        </div>
                      </>
                    ) : (
                      <button type="button" onClick={() => void startCamera('selfie')} className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 py-4 text-sm font-semibold text-blue-600 transition hover:border-blue-400">
                        <Camera className="size-4" />
                        {language === 'en' ? 'Start Camera' : 'Activar Cámara'}
                      </button>
                    )}
                    {cameraError && <p className="text-xs text-red-500">{cameraError}</p>}
                  </div>
                )}

                {selfieDataUrl && (
                  <div className="border-t border-slate-100 p-4 space-y-2">
                    <div className="flex justify-center">
                      <div className="relative">
                        <img src={selfieDataUrl} alt="Selfie" className="size-24 rounded-full object-contain bg-white border-4 border-emerald-400 shadow-lg" />
                        <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-emerald-500 shadow">
                          <Check className="size-3.5 text-white" />
                        </div>
                      </div>
                    </div>
                    <p className="text-center text-[11px] text-emerald-600 font-semibold">{language === 'en' ? 'Selfie captured ✓' : 'Selfie capturada ✓'}</p>
                    <button type="button" onClick={() => { setSelfieDataUrl(''); void startCamera('selfie'); }} className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-[11px] text-slate-500 transition hover:bg-slate-50">
                      <RefreshCw className="size-3" />
                      {language === 'en' ? 'Retake' : 'Repetir'}
                    </button>
                  </div>
                )}
              </div>

              {/* Toggle 2: Documento de Identidad */}
              <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm transition-all">
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors ${idDocEnabled ? 'bg-slate-900' : 'bg-slate-100'}`}>
                      <ScanLine className={`size-4 ${idDocEnabled ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {language === 'en' ? 'Identity Document' : 'Documento de Identidad'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {language === 'en' ? "ID, Driver's License or Passport" : 'Identificación, Licencia de Conducir o Pasaporte'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {idDocDataUrl && <CheckCircle2 className="size-5 text-emerald-500" />}
                    <button
                      type="button"
                      aria-label={idDocEnabled ? 'Disable ID scan' : 'Enable ID scan'}
                      onClick={() => {
                        const next = !idDocEnabled;
                        setIdDocEnabled(next);
                        if (!next) { setIdDocDataUrl(''); if (activeCameraType === 'id') stopCamera(); }
                        else if (!idDocDataUrl) void startCamera('id');
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500/30 ${idDocEnabled ? '' : 'bg-slate-200'}`}
                      style={idDocEnabled ? { background: 'linear-gradient(135deg, #1e293b, #0f172a)' } : {}}
                    >
                      <span className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${idDocEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                {idDocEnabled && !idDocDataUrl && (
                  <div className="border-t border-slate-100 p-4 space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-700">
                      <p className="font-semibold">Place your ID inside the frame</p>
                      <p>✓ Entire document is visible</p>
                      <p>✓ No glare</p>
                      <p>✓ Good lighting</p>
                      <p>✓ All corners visible</p>
                    </div>
                    {activeCameraType === 'id' ? (
                      <>
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 shadow-inner" style={{ aspectRatio: '16/9' }}>
                          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="rounded-xl border-[3px] border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.40)] relative" style={{ width: '82%', height: '72%' }}>
                              <p className="absolute top-2 left-3 text-[9px] text-white/60 font-semibold uppercase tracking-wider">ID / License / Passport</p>
                            </div>
                          </div>
                          <p className="absolute bottom-3 inset-x-0 text-center text-[10px] text-white/70 font-medium">
                            {language === 'en' ? 'Place your ID inside the frame' : 'Coloca tu identificación dentro del marco'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={capturePhoto} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-slate-700 to-slate-950 hover:from-slate-600 hover:to-slate-900 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/30 transition">
                            <Camera className="size-4" />
                            {language === 'en' ? 'Capture Document' : 'Capturar Documento'}
                          </button>
                          <button type="button" onClick={stopCamera} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500 transition hover:bg-slate-50"><X className="size-4" /></button>
                        </div>
                      </>
                    ) : (
                      <button type="button" onClick={() => void startCamera('id')} className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 py-4 text-sm font-semibold text-slate-600 transition hover:border-slate-400">
                        <Camera className="size-4" />
                        {language === 'en' ? 'Start Camera' : 'Activar Cámara'}
                      </button>
                    )}
                    {cameraError && <p className="text-xs text-red-500">{cameraError}</p>}
                  </div>
                )}

                {idDocDataUrl && (
                  <div className="border-t border-slate-100 p-4 space-y-2">
                    <div className="overflow-hidden rounded-xl border border-emerald-200 shadow-sm">
                      <img src={idDocDataUrl} alt="Identity Document" className="w-full object-contain bg-white max-h-36" />
                    </div>
                    <p className="text-center text-[11px] text-emerald-600 font-semibold">{language === 'en' ? 'Document captured ✓' : 'Documento capturado ✓'}</p>
                    <button type="button" onClick={() => { setIdDocDataUrl(''); void startCamera('id'); }} className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-[11px] text-slate-500 transition hover:bg-slate-50">
                      <RefreshCw className="size-3" />
                      {language === 'en' ? 'Retake' : 'Repetir'}
                    </button>
                  </div>
                )}
              </div>

              {/* CTA */}
              <Button
                className="w-full gap-2 bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white py-5 text-sm font-bold shadow-xl shadow-blue-600/35 rounded-xl"
                onClick={handleReadyToDownload}
              >
                <Download className="size-4" />
                {language === 'en' ? 'Continue to Download →' : 'Continuar a la Descarga →'}
              </Button>

              <button
                type="button"
                onClick={() => { stopCamera(); setFlowStep('sign'); }}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm text-slate-500 transition hover:bg-slate-50"
              >
                {language === 'en' ? '← Back to Signature' : '← Volver a la Firma'}
              </button>

              <p className="text-center text-[10px] text-slate-400 leading-relaxed">
                {language === 'en'
                  ? 'Identity photos are embedded only in your PDF audit trail and never shared.'
                  : 'Las fotos de identidad se incluyen solo en el rastro de auditoría del PDF y nunca se comparten.'}
              </p>
            </div>

            {/* ═══ PANEL DERECHO: VISTA PREVIA CON FIRMAS ═══ */}
            <div>
              <Card className="overflow-hidden shadow-sm ring-1 ring-slate-200 lg:sticky lg:top-24">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500" />
                    {language === 'en' ? 'Signed Document Preview' : 'Vista Previa del Documento Firmado'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[calc(100vh-240px)] overflow-y-auto" data-preview-scroll-container>
                    <DocumentPreview
                      template={previewTemplate}
                      data={deferredFormData}
                      activeFieldId={activeFieldId}
                      showWatermark
                      leftSignatureUrl={userSigDataUrl || undefined}
                      rightSignatureUrl={coSigners.find((cs) => cs.sigDataUrl)?.sigDataUrl}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      )}



      {/* â"€â"€ FORM STEP â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
      {flowStep === 'form' && (
      <div className="container mx-auto px-4 py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-[calc(100vh-73px)]">
          {/* Form column — independently scrollable */}
          <div className="space-y-6 py-8 lg:h-full lg:overflow-y-auto lg:pr-2 pb-24">

            <Card>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>{t('generator.documentInfo')}</CardTitle>
                  <CardDescription>{t('generator.fillRequired')}</CardDescription>
                </div>
                {Object.keys(formData).length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearForm}
                    className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-600 transition hover:bg-red-100 hover:border-red-300"
                  >
                    {language === 'en' ? '✕ Clear form' : '✕ Borrar formulario'}
                  </button>
                )}
              </CardHeader>
            </Card>

            {/* â"€â"€ State selector — STEP 1 for residential-lease â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ */}
            {STATE_DEPENDENT_DOCUMENTS.includes(documentType || '') && (
              <div className={`relative overflow-hidden rounded-2xl border-2 p-5 transition-all ${selectedState ? 'border-emerald-400 bg-emerald-50/60' : 'border-indigo-300 bg-indigo-50/70 shadow-md shadow-indigo-100'}`}>
                {/* Step badge */}
                <div className="absolute right-4 top-4 rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
                  {language === 'en' ? 'Step 1' : 'Paso 1'}
                </div>

                <div className="mb-3 flex items-center gap-2.5">
                  <div className={`flex size-9 items-center justify-center rounded-xl ${selectedState ? 'bg-emerald-500' : 'bg-indigo-600'}`}>
                    <MapPin className="size-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      {language === 'en' ? 'Select the Property State' : 'Selecciona el Estado de la Propiedad'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {language === 'en'
                        ? 'State-specific laws will be injected automatically into the contract'
                        : 'Las leyes estatales se inyectarán automáticamente en el contrato'}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <select
                    value={selectedState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className={`w-full h-12 appearance-none cursor-pointer rounded-xl border-2 bg-white pl-4 pr-10 text-base font-medium transition-all focus:outline-none focus:ring-4 ${
                      selectedState
                        ? 'border-emerald-400 text-emerald-800 focus:border-emerald-500 focus:ring-emerald-400/20'
                        : 'border-indigo-300 text-slate-500 focus:border-indigo-500 focus:ring-indigo-400/20'
                    }`}
                  >
                    <option value="">{language === 'en' ? '— Choose a state —' : '— Elige un estado —'}</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <ChevronDown className={`size-5 ${selectedState ? 'text-emerald-500' : 'text-indigo-400'}`} />
                  </span>
                </div>

                {/* Inline state-specific note */}
                {selectedState && stateNotes['residential-lease']?.[selectedState] && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-300 bg-white px-3 py-2.5">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <p className="text-xs leading-relaxed text-slate-600">
                      {stateNotes['residential-lease'][selectedState]}
                    </p>
                  </div>
                )}

                {!selectedState && (
                  <p className="mt-2 text-xs font-medium text-indigo-600">
                    {language === 'en'
                      ? 'âš  Required — without a state, generic clauses will be used'
                      : 'âš  Requerido — sin estado se usarán cláusulas genéricas'}
                  </p>
                )}
              </div>
            )}


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">{language === 'en' ? 'Party Information' : 'Información de las Partes'}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedFields.parties.map(renderField)}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">{language === 'en' ? 'Agreement Details' : 'Detalles del Acuerdo'}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedFields.agreement.map(renderField)}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">{language === 'en' ? 'Specific Variables' : 'Variables Específicas'}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedFields.variables.map(renderField)}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">{language === 'en' ? 'Customize Design' : 'Personalizar Diseño'}</CardTitle>
                  <CardDescription>
                    {language === 'en'
                      ? 'Set logo, header and footer for premium export'
                      : 'Configura logo, encabezado y pie para exportación premium'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(branding.enableLogo)}
                        onChange={(e) => setBranding((prev) => ({ ...prev, enableLogo: e.target.checked }))}
                      />
                      {language === 'en' ? 'Include logo in PDF' : 'Incluir logo en PDF'}
                    </Label>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(branding.enableLogoWatermark)}
                        onChange={(e) => setBranding((prev) => ({ ...prev, enableLogoWatermark: e.target.checked }))}
                      />
                      {language === 'en' ? 'Include logo as watermark' : 'Incluir logo como marca de agua'}
                    </Label>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="logo-upload">{language === 'en' ? 'Upload Logo (PNG/JPG)' : 'Subir Logo (PNG/JPG)'}</Label>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Logo Position' : 'Posición del Logo'}</Label>
                    <div className="relative">
                      <select
                        value={branding.logoPosition || 'left'}
                        onChange={(e) => setBranding((prev) => ({ ...prev, logoPosition: e.target.value as 'left' | 'right' }))}
                        className="w-full h-9 appearance-none cursor-pointer rounded-md border border-slate-300 bg-white pl-3 pr-8 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="left">{language === 'en' ? 'Left' : 'Izquierda'}</option>
                        <option value="right">{language === 'en' ? 'Right' : 'Derecha'}</option>
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                        <ChevronDown className="size-4 text-slate-400" />
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="headerText">{language === 'en' ? 'Custom Header' : 'Encabezado personalizado'}</Label>
                    <Input
                      id="headerText"
                      placeholder={language === 'en' ? 'e.g. Taborda Sánchez Legal Group' : 'Ej: Taborda Sánchez Legal Group'}
                      value={branding.headerText || ''}
                      onChange={(e) => setBranding((prev) => ({ ...prev, headerText: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="footerText">{language === 'en' ? 'Custom Footer' : 'Pie de página personalizado'}</Label>
                    <Input
                      id="footerText"
                      placeholder={language === 'en' ? 'Leave empty to show only page numbers' : 'Déjalo vacío para mostrar solo numeración'}
                      value={branding.footerText || ''}
                      onChange={(e) => setBranding((prev) => ({ ...prev, footerText: e.target.value }))}
                    />
                  </div>

                  <div className="md:col-span-2 border-t pt-4 mt-2">
                    <h4 className="font-semibold text-sm mb-3">
                      {language === 'en' ? 'Business Identity (USA-ready)' : 'Identidad Empresarial (estilo USA)'}
                    </h4>
                    <p className="text-xs text-slate-500 mb-4">
                      {language === 'en'
                        ? 'These fields appear in the PDF header block for a premium legal look.'
                        : 'Estos campos aparecerán en el bloque superior del PDF con estilo legal premium.'}
                    </p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="companyLegalName">{language === 'en' ? 'Legal Business Name' : 'Nombre legal de la empresa'}</Label>
                    <Input id="companyLegalName" value={branding.companyLegalName || ''} onChange={(e) => setBranding((prev) => ({ ...prev, companyLegalName: e.target.value }))} placeholder={language === 'en' ? 'e.g. Taborda Sanchez Legal Group LLC' : 'Ej: Taborda Sanchez Legal Group LLC'} />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="companyAddressLine1">{language === 'en' ? 'Address Line 1' : 'Dirección línea 1'}</Label>
                    <Input id="companyAddressLine1" value={branding.companyAddressLine1 || ''} onChange={(e) => setBranding((prev) => ({ ...prev, companyAddressLine1: e.target.value }))} placeholder={language === 'en' ? 'Street and number' : 'Calle y número'} />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="companyAddressLine2">{language === 'en' ? 'Address Line 2 (optional)' : 'Dirección línea 2 (opcional)'}</Label>
                    <Input id="companyAddressLine2" value={branding.companyAddressLine2 || ''} onChange={(e) => setBranding((prev) => ({ ...prev, companyAddressLine2: e.target.value }))} placeholder={language === 'en' ? 'Suite, Floor, Unit, etc.' : 'Suite, piso, oficina, etc.'} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyCity">{language === 'en' ? 'City' : 'Ciudad'}</Label>
                    <Input id="companyCity" value={branding.companyCity || ''} onChange={(e) => setBranding((prev) => ({ ...prev, companyCity: e.target.value }))} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyState">{language === 'en' ? 'State' : 'Estado'}</Label>
                    <Input id="companyState" value={branding.companyState || ''} onChange={(e) => setBranding((prev) => ({ ...prev, companyState: e.target.value }))} placeholder={language === 'en' ? 'e.g. FL' : 'Ej: FL'} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyZip">{language === 'en' ? 'ZIP Code' : 'Código ZIP'}</Label>
                    <Input id="companyZip" value={branding.companyZip || ''} onChange={(e) => setBranding((prev) => ({ ...prev, companyZip: e.target.value }))} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyCountry">{language === 'en' ? 'Country' : 'País'}</Label>
                    <Input id="companyCountry" value={branding.companyCountry || ''} onChange={(e) => setBranding((prev) => ({ ...prev, companyCountry: e.target.value }))} placeholder={language === 'en' ? 'United States' : 'Estados Unidos'} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyEIN">{language === 'en' ? 'EIN / Tax ID' : 'EIN / Identificación fiscal'}</Label>
                    <Input id="companyEIN" value={branding.companyEIN || ''} onChange={(e) => setBranding((prev) => ({ ...prev, companyEIN: e.target.value }))} placeholder="XX-XXXXXXX" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">{language === 'en' ? 'Business Phone' : 'Teléfono empresarial'}</Label>
                    <Input id="companyPhone" value={branding.companyPhone || ''} onChange={(e) => setBranding((prev) => ({ ...prev, companyPhone: e.target.value }))} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">{language === 'en' ? 'Business Email' : 'Correo empresarial'}</Label>
                    <Input id="companyEmail" value={branding.companyEmail || ''} onChange={(e) => setBranding((prev) => ({ ...prev, companyEmail: e.target.value }))} type="email" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyWebsite">{language === 'en' ? 'Website' : 'Sitio web'}</Label>
                    <Input id="companyWebsite" value={branding.companyWebsite || ''} onChange={(e) => setBranding((prev) => ({ ...prev, companyWebsite: e.target.value }))} placeholder="https://" />
                  </div>
                </CardContent>
              </Card>
            </div>


            <div className="flex items-center justify-between pb-8">
              <button
                type="button"
                onClick={handleClearForm}
                className="text-[11px] text-slate-400 underline-offset-2 hover:text-red-500 hover:underline transition-colors"
              >
                {language === 'en' ? 'Clear & start over' : 'Borrar y empezar de nuevo'}
              </button>
              <Button
                onClick={intent === 'fill_send' || intent === 'fill_approve' ? handleFormNextIntent : handleFormNext}
                size="lg"
                disabled={formProgress < 100}
                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white shadow-lg shadow-blue-500/20"
              >
                {intent === 'fill_send' || intent === 'fill_approve'
                  ? (language === 'en' ? 'Continue to Send' : 'Continuar al Envio')
                  : (language === 'en' ? 'Next — Sign Document' : 'Siguiente — Firmar Documento')}
                <PenLine className="size-4" />
              </Button>
            </div>
          </div>

          {/* Preview column — fills height, preview sticky inside */}
          <div className="hidden lg:block lg:h-full lg:overflow-y-auto py-8">
            <PreviewPanel />
          </div>
        </div>
      </div>
      )}

      </div>{/* /stable step container */}
    </div>
  );
}
