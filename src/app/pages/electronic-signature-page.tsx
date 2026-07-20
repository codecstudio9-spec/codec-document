import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  Shield, Loader, RefreshCw, AlertCircle, X, CheckCircle2,
  ShieldCheck, IdCard, Camera, Send, MessageCircle, Mail,
  Copy, Check, Lock, FileText, Users, ChevronRight, Upload,
  PenLine,
} from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

import { PdfUploader } from '../components/signatures/PdfUploader';
import { PdfSignatureEditor, type EditorSigner } from '../components/signatures/PdfSignatureEditor';
import { SignatureModal } from '../components/signatures/SignatureModal';
import { QRShareModal } from '../components/signatures/QRShareModal';
import { SignatureTimeline, type TimelineStep } from '../components/signatures/SignatureTimeline';
import { SignedSuccessScreen } from '../components/signatures/SignedSuccessScreen';
import { PaypalSignatureCheckout } from '../components/signatures/PaypalSignatureCheckout';
import { PdfSignaturePreview } from '../components/signatures/PdfSignaturePreview';
import type { PlacedSignature } from '../components/signatures/types';

import { useAuth } from '../contexts/auth-context';
import { supabase } from '../../lib/supabase';
import {
  getPublicIp, sha256Hex, dataUrlToBlob,
  createDocumentRecord, updateDocumentPdfUrl, updateDocumentSignedPdfUrl, uploadPdfToStorage,
  uploadSignatureImage, insertSignature, createSigner, createSigningLink,
  insertSignaturePositions, finalizeDocument, insertAuditLog,
  getDocumentStatus, compilePdfWithSignatures,
} from '../../lib/signatureService';
import {
  consumeDocumentLimit72h,
  consumeSignatureRequest72h,
  consumeAnonUsage72h,
  getNextDocumentSlot,
  getNextSignatureRequestSlot,
  getNextAnonUsageSlot,
} from '../services/user-limits-service';
import { getSignerRoleLabel, inferDocumentTypeHint } from '../utils/signer-roles';
import { markVisitorActivity, markVisitorFunnelStep } from '../services/analytics-service';
import { detectSignerCountryCode } from '../../lib/geo';
import { resolveJurisdiction, DEFAULT_JURISDICTION } from '../data/signature-jurisdictions';

type Step = 'upload' | 'creator-sign' | 'position-creator' | 'invite-guest' | 'await-guest' | 'position' | 'compiling' | 'done';

// ── Computed wizard step ───────────────────────────────────────────────────────
function toWizardStep(step: Step): 1 | 2 | 3 | 4 {
  if (step === 'done') return 4;
  if (step === 'await-guest' || step === 'compiling' || step === 'position') return 3;
  if (step === 'invite-guest') return 2;
  return 1;
}

// ── Progress indicator ─────────────────────────────────────────────────────────
const STEPS = [
  { num: 1, label: 'Preparar',   Icon: FileText     },
  { num: 2, label: 'Enviar',     Icon: Send         },
  { num: 3, label: 'Esperando',  Icon: Users        },
  { num: 4, label: 'Listo',      Icon: CheckCircle2 },
];

function WizardProgress({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex items-center justify-center gap-0 py-5">
      {STEPS.map((s, i) => (
        <div key={s.num} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={[
                'flex size-8 items-center justify-center rounded-full text-[11px] font-bold transition-all',
                s.num < current  ? 'bg-emerald-500 text-white shadow-sm'
                : s.num === current ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-4 ring-indigo-100'
                : 'bg-slate-100 text-slate-400',
              ].join(' ')}
            >
              {s.num < current ? <Check className="size-3.5" /> : s.num}
            </div>
            <span
              className={[
                'text-[10px] font-semibold',
                s.num <= current ? 'text-slate-700' : 'text-slate-300',
              ].join(' ')}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={[
                'mb-5 mx-2 h-px w-10 transition-all',
                s.num < current ? 'bg-emerald-400' : 'bg-slate-200',
              ].join(' ')}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── iOS-style security toggle ─────────────────────────────────────────────────
function SecurityToggle({
  checked, onChange, label, sub, Icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sub: string;
  Icon: React.ElementType;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition hover:border-indigo-200 hover:bg-indigo-50/30">
      <div className="flex items-center gap-3">
        <div className={[
          'flex size-9 shrink-0 items-center justify-center rounded-xl transition',
          checked ? 'bg-indigo-100' : 'bg-slate-100',
        ].join(' ')}>
          <Icon className={`size-4.5 ${checked ? 'text-indigo-600' : 'text-slate-400'}`} />
        </div>
        <div>
          <p className={`text-sm font-semibold ${checked ? 'text-slate-900' : 'text-slate-600'}`}>{label}</p>
          <p className="text-[11px] text-slate-400">{sub}</p>
        </div>
      </div>
      {/* Toggle pill */}
      <div
        className={[
          'relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200',
          checked ? 'bg-indigo-600' : 'bg-slate-200',
        ].join(' ')}
        onClick={() => onChange(!checked)}
      >
        <div
          className={[
            'absolute top-0.5 size-5 rounded-full bg-white shadow-md transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          ].join(' ')}
        />
      </div>
    </label>
  );
}

// ── Sharing hub (Step 2 after link is generated) ──────────────────────────────
function ShareHub({
  link, guestName, guestEmail, docName, onContinue,
}: {
  link: string;
  guestName: string;
  guestEmail: string;
  docName: string;
  onContinue: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const waText = encodeURIComponent(
    `Estimado ${guestName || 'firmante'}, Codec Document le ha enviado el documento "${docName}" para su revisión y firma electrónica segura. Acceda aquí: ${link}`,
  );
  const waUrl = `https://wa.me/?text=${waText}`;

  const mailSubject = encodeURIComponent(`Firma requerida: ${docName}`);
  const mailBody    = encodeURIComponent(
    `Estimado ${guestName || 'firmante'},\n\nCodec Document le ha enviado el documento "${docName}" para su revisión y firma electrónica segura.\n\nAcceda al enlace para firmar:\n${link}\n\nEste enlace expirará en 48 horas.\n\nAtentamente,\nCodec Document`,
  );
  const mailtoUrl = `mailto:${guestEmail}?subject=${mailSubject}&body=${mailBody}`;

  if (!link?.trim()) return null;

  const handleCopy = () => {
    void navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
    toast.success('Enlace copiado al portapapeles.');
  };

  return (
    <div className="space-y-5">
      {/* QR + link row */}
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="overflow-hidden rounded-2xl border-2 border-indigo-100 bg-white p-2 shadow-md">
          <QRCodeSVG value={link} size={160} bgColor="#ffffff" fgColor="#1e1b4b" level="M" />
        </div>

        <div className="w-full">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Enlace único de firma</p>
          <div className="flex items-center gap-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="flex-1 truncate text-[11px] text-slate-500">{link}</p>
            <button
              type="button"
              onClick={handleCopy}
              className={[
                'shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition',
                copied
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
              ].join(' ')}
            >
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
      </div>

      {/* Share buttons */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center transition hover:bg-emerald-100"
        >
          <MessageCircle className="size-6 text-emerald-600" />
          <div>
            <p className="text-sm font-bold text-emerald-800">WhatsApp</p>
            <p className="text-[10px] text-emerald-600">Enviar mensaje profesional</p>
          </div>
        </a>

        <a
          href={mailtoUrl}
          className="flex flex-col items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-4 text-center transition hover:bg-indigo-100"
        >
          <Mail className="size-6 text-indigo-600" />
          <div>
            <p className="text-sm font-bold text-indigo-800">Correo</p>
            <p className="text-[10px] text-indigo-600">Notificación formal</p>
          </div>
        </a>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:scale-[1.01]"
      >
        Monitorear firma en tiempo real
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

/** Replaces whatever step the creator happens to be looking at (Enviar or
 * Esperando — the second signer can finish while either is on screen) the
 * moment the second signature is detected. One unmistakable state — a big
 * green check, plain language, one button — instead of a silent
 * auto-redirect a distracted or non-technical user could easily miss and
 * then wonder "did it actually work?". They stay in control: nothing
 * moves until they press Continuar. */
function GuestCompletedBanner({ guestName, onContinue }: { guestName: string; onContinue: () => void }) {
  return (
    <div className="mt-5 flex flex-col items-center gap-4 rounded-3xl border-2 border-emerald-300 bg-emerald-50 p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-200">
        <CheckCircle2 className="size-9 text-white" />
      </div>
      <div>
        <p className="text-lg font-black text-emerald-900">¡{guestName || 'El invitado'} ya firmó!</p>
        <p className="mt-1 text-sm text-emerald-700">El documento quedó certificado con ambas firmas. Ya puedes continuar.</p>
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-200/70 transition hover:scale-[1.01]"
      >
        Continuar
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function ElectronicSignaturePage() {
  const { session, isAdmin, signInWithGoogle } = useAuth();

  const [step, setStep] = useState<Step>('upload');
  // Resolved once on mount from the creator's real IP — reused for the
  // certification page (see handleSignAloneOnly/handleConfirmPositions)
  // and the small footer badge below, so both cite the same jurisdiction
  // instead of always defaulting to US E-SIGN Act / UETA.
  const [jurisdiction, setJurisdiction] = useState(DEFAULT_JURISDICTION);
  useEffect(() => {
    detectSignerCountryCode().then((code) => setJurisdiction(resolveJurisdiction(code))).catch(() => {});
  }, []);
  useEffect(() => {
    // Business Intelligence funnel — entering this flow at all counts as
    // "firma iniciada", independent of whether it's ever completed.
    markVisitorFunnelStep('signature_started');
  }, []);
  const [paywallContext, setPaywallContext] = useState<'upload' | 'doc' | null>(null);
  const [paywallNextSlotAt, setPaywallNextSlotAt] = useState<Date | null>(null);
  const [pendingPlacements, setPendingPlacements] = useState<PlacedSignature[] | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
  const resolvedDocumentType = inferDocumentTypeHint(documentType);

  // ── Document ───────────────────────────────────────────────────────────────
  const [documentId, setDocumentId] = useState('');
  const [pdfBytes, setPdfBytes]     = useState<Uint8Array | null>(null);
  const [fileName, setFileName]     = useState('');
  const [fileHash, setFileHash]     = useState('');

  // ── Creator ────────────────────────────────────────────────────────────────
  const [creatorName, setCreatorName]         = useState('');
  const [creatorEmail, setCreatorEmail]       = useState('');
  const [creatorSigDataUrl, setCreatorSigDataUrl] = useState('');
  const [creatorSigUrl, setCreatorSigUrl]     = useState('');
  const [creatorModalOpen, setCreatorModalOpen] = useState(false);
  // Kept so handleSignAloneOnly can re-compile WITH the certification page
  // (it was deliberately left out of the partial compile below — see the
  // includeCertificationPage comment) instead of just re-finalizing that
  // page-less partial blob as if it were the real final document.
  const [creatorPlacement, setCreatorPlacement] = useState<PlacedSignature | null>(null);

  // ── Guest ──────────────────────────────────────────────────────────────────
  const [guestName, setGuestName]           = useState('');
  const [guestEmail, setGuestEmail]         = useState('');
  const [guestSigDataUrl, setGuestSigDataUrl] = useState('');
  const [guestSigUrl, setGuestSigUrl]       = useState('');
  const [signingToken, setSigningToken]     = useState('');
  const [shareOpen, setShareOpen]           = useState(false);

  // ── Security requirements (saved to document_requirements table) ──────────
  const [requireIdPhoto, setRequireIdPhoto] = useState(false);
  const [requireSelfie, setRequireSelfie]   = useState(false);

  // ── UI ─────────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading]     = useState(false);
  const [loadingMsg, setLoadingMsg]   = useState('');
  const [error, setError]             = useState('');
  const [signedPdfUrl, setSignedPdfUrl] = useState('');
  const [signedAt, setSignedAt] = useState('');
  const [documentStatus, setDocumentStatus] = useState<string>('pending');
  const [linkCopied, setLinkCopied]   = useState(false);

  // Timestamps the moment the wizard first reaches "Listo" — the success
  // screen shows this so the creator knows exactly when they signed,
  // instead of having to guess from memory later.
  useEffect(() => {
    if (step === 'done' && !signedAt) setSignedAt(new Date().toISOString());
  }, [step, signedAt]);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Global cleanup ─────────────────────────────────────────────────────────
  useEffect(() => () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
  }, []);

  // ── Convert guest storage URL → data URL (CORS-safe for pdf-lib) ──────────
  useEffect(() => {
    if (!guestSigUrl) return;
    void (async () => {
      try {
        const res  = await fetch(guestSigUrl);
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onload = (e) => setGuestSigDataUrl(String(e.target?.result ?? ''));
        reader.readAsDataURL(blob);
      } catch {
        setGuestSigDataUrl(guestSigUrl);
      }
    })();
  }, [guestSigUrl]);

  // ── Realtime + polling fallback (await-guest) ──────────────────────────────
  // This used to ALSO re-compile the final PDF from scratch on the
  // creator's own browser the moment it saw the guest's `signatures` row
  // appear (a "PRIMARY" INSERT listener calling doAutoCompile below). That
  // was a real bug: guest-sign-page.tsx already compiles, uploads, and
  // calls finalizeDocument itself as one atomic sequence on the guest's
  // side. Having the creator's browser race to do the exact same job
  // independently — using the ORIGINAL pdfBytes, the old two-report-page
  // compile call (no reportSigners), and a fixed 'signed.pdf' path — meant
  // whichever attempt finished LAST silently overwrote the other's result,
  // and if the creator's tab happened to be open, it was pure wasted work
  // at best and a source of inconsistent/broken final PDFs at worst. This
  // now only ever WATCHES for the guest's own flow to reach status
  // 'completed' — it never tries to compile anything itself.
  useEffect(() => {
    // Starts watching as soon as a signing link exists — not only once the
    // creator has clicked through to the "Esperando" step. Otherwise a
    // creator who stays on "Enviar" (sharing the link/QR, the natural
    // place to linger right after generating it) never sees the automatic
    // update at all: they'd have to know to click "Monitorear firma en
    // tiempo real" or "Verificar" first, which isn't obvious.
    if (!documentId || !signingToken || step === 'done') return;

    const applyIfCompleted = (status?: string, signedUrl?: string | null) => {
      if (status !== 'completed') return;
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      if (signedUrl) setSignedPdfUrl(signedUrl);
      setDocumentStatus('completed');
    };

    const channel = supabase
      .channel(`doc-watch-${documentId}`)
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'documents',
        filter: `id=eq.${documentId}`,
      }, (payload) => {
        const updated = payload.new as { status?: string; signed_pdf_url?: string };
        applyIfCompleted(updated.status, updated.signed_pdf_url);
      })
      .subscribe();

    // FALLBACK: polling every 4 s in case Realtime is not enabled on the table
    const checkStatus = async () => {
      try {
        const doc = await getDocumentStatus(documentId);
        if (doc) applyIfCompleted(doc.status, doc.signedPdfUrl);
      } catch { /* silently ignore network errors */ }
    };

    void checkStatus(); // immediate check on mount
    pollingRef.current = setInterval(() => { void checkStatus(); }, 4000);

    return () => {
      void supabase.removeChannel(channel);
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    };
  }, [step, documentId, signingToken]);

  // ── Step handlers ─────────────────────────────────────────────────────────

  const handleUploadPdf = async (file?: File | null, bypassUsageCheck = false) => {
    if (!file) return;
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Solo se permiten archivos PDF.'); return;
    }
    if (!bypassUsageCheck && !isAdmin) {
      const userId = session?.user?.id;
      const { allowed } = userId
        ? await consumeDocumentLimit72h(userId, false)
        : await consumeAnonUsage72h('document');
      if (!allowed) {
        setPaywallNextSlotAt(userId ? await getNextDocumentSlot(userId) : await getNextAnonUsageSlot('document'));
        setPendingFile(file); setPaywallContext('upload'); return;
      }
    }
    setError(''); setIsLoading(true); setLoadingMsg('Procesando documento…');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      setPdfBytes(bytes); setFileName(file.name);
      setLoadingMsg('Calculando hash SHA-256…');
      const hash = await sha256Hex(arrayBuffer); setFileHash(hash);
      setLoadingMsg('Creando registro…');
      const docId = await createDocumentRecord({ name: file.name.replace(/\.pdf$/i, ''), userId: session?.user?.id ?? null });
      if (!docId) {
        setPendingFile(file);
        setPaywallContext('upload');
        return;
      }
      setDocumentId(docId);
      setDocumentType(file.name.replace(/\.pdf$/i, '').toLowerCase());
      setLoadingMsg('Subiendo al almacenamiento seguro…');
      const pdfBlob = new Blob([bytes], { type: 'application/pdf' });
      const pdfUrl = await uploadPdfToStorage(docId, pdfBlob);
      await updateDocumentPdfUrl(docId, pdfUrl);
      const ip = await getPublicIp();
      await insertAuditLog({ documentId: docId, action: 'document_uploaded', ipAddress: ip, userAgent: navigator.userAgent, hashSha256: hash });
      toast.success('Documento cargado correctamente.');
      markVisitorActivity('document', 'electronic-signature-upload');
      setStep('creator-sign');
    } catch (err) {
      setError(`Error al procesar el documento: ${err instanceof Error ? err.message : String(err)}`);
      toast.error('No se pudo subir el documento.');
    } finally {
      setIsLoading(false); setLoadingMsg('');
    }
  };

  // Only captures WHAT the signature looks like (SignatureModal) and saves
  // it — WHERE it goes on the document used to be hardcoded here
  // (xFraction 0.25/yFraction 0.84/44%×30%), which is exactly why the main
  // signer could never actually position their own signature: this
  // function stamped a fixed spot immediately and moved on. Placement now
  // happens in the 'position-creator' step right after this, using the
  // same interactive PdfSignatureEditor the (previously orphaned) manual
  // "position" step already had — see handleCreatorPlacementConfirm below.
  const handleCreatorSign = async (dataUrl: string) => {
    if (!dataUrl) return;
    setIsLoading(true); setLoadingMsg('Guardando tu firma…');
    try {
      setCreatorSigDataUrl(dataUrl);
      const blob   = await dataUrlToBlob(dataUrl);
      const sigUrl = await uploadSignatureImage(documentId, 'creator', blob);
      setCreatorSigUrl(sigUrl);
      const sigHash = await sha256Hex(await blob.arrayBuffer());
      const ip = await getPublicIp();
      await insertSignature({ documentId, signerName: creatorName || 'Firmante 1', signerEmail: creatorEmail || '', ip, userAgent: navigator.userAgent, signatureUrl: sigUrl });
      setStep('position-creator');
    } catch (err) {
      setError(`Error al guardar la firma: ${err instanceof Error ? err.message : String(err)}`);
      toast.error('No se pudo guardar la firma.');
    } finally {
      setIsLoading(false); setLoadingMsg('');
    }
  };

  // Compiles + uploads + saves the PDF with the creator's signature at
  // wherever they actually dragged/resized it in the editor — a partial
  // save (updateDocumentSignedPdfUrl, not finalizeDocument/status
  // 'completed'), since the second signer hasn't signed yet.
  const handleCreatorPlacementConfirm = async (placements: PlacedSignature[]) => {
    if (placements.length === 0) { setError('Coloca tu firma en el documento.'); return; }
    if (!pdfBytes || pdfBytes.length === 0) { setError('No hay PDF en memoria. Reinicia el flujo.'); return; }
    setIsLoading(true); setLoadingMsg('Compilando PDF…');
    try {
      const placement = placements[0];
      setCreatorPlacement(placement);
      await insertSignaturePositions(documentId, [{
        x: placement.xFraction, y: placement.yFraction,
        width: placement.widthFraction, height: placement.heightFraction, page: placement.page,
      }]);
      const partialBytes = await compilePdfWithSignatures({
        pdfBytes,
        signatures: [{
          imageUrl: placement.imageDataUrl, storageUrl: placement.storageUrl,
          signerName: creatorName || 'Firmante 1',
          signerRole: getSignerRoleLabel(resolvedDocumentType, 0, 'es'),
          page: placement.page,
          xFraction: placement.xFraction, yFraction: placement.yFraction,
          widthFraction: placement.widthFraction, heightFraction: placement.heightFraction,
        }],
        documentId,
        fileHash,
        // This is a PARTIAL save — the second signer hasn't signed yet —
        // so no certification report page here. Otherwise the guest's
        // later compile adds its own unified report page on top of this
        // one, and the final PDF ends up with two: an orphaned one
        // showing only the creator, then the real one with both signers.
        includeCertificationPage: false,
      });
      const partialBlob = new Blob([partialBytes], { type: 'application/pdf' });
      // Timestamped, not the fixed 'signed.pdf' — confirmed live that a
      // retry (or the manual "position" fallback re-uploading afterward)
      // hitting the SAME existing object 403s with "new row violates row-
      // level security policy": storage RLS here only reliably grants
      // INSERT, not UPDATE, even for the authenticated owner. A fresh path
      // is always a first-time INSERT. See guest-sign-page.tsx for the
      // same fix on the guest's side.
      const partialSignedUrl = await uploadPdfToStorage(documentId, partialBlob, `signed-${Date.now()}.pdf`);
      setSignedPdfUrl(partialSignedUrl);
      await updateDocumentSignedPdfUrl(documentId, partialSignedUrl);
      const ip = await getPublicIp();
      await insertAuditLog({ documentId, action: 'creator_signed', ipAddress: ip, userAgent: navigator.userAgent, hashSha256: fileHash });
      toast.success('Firma registrada correctamente.');
      setStep('invite-guest');
    } catch (err) {
      setError(`Error al guardar la firma: ${err instanceof Error ? err.message : String(err)}`);
      toast.error('No se pudo guardar la firma.');
    } finally {
      setIsLoading(false); setLoadingMsg('');
    }
  };

  // Not every document needs a second signer — the creator can certify it
  // solo. The earlier partial compile (handleCreatorPlacementConfirm)
  // deliberately skipped the certification page since a second signer was
  // still expected — going solo means that expectation changed, so this
  // re-compiles from the original pdfBytes with the certification page
  // included this time, instead of just finalizing the page-less partial
  // blob as if it were already the real final document.
  const handleSignAloneOnly = async () => {
    if (!creatorPlacement || !pdfBytes || pdfBytes.length === 0) {
      toast.error('No se pudo finalizar: falta la posición de tu firma. Reinicia el flujo.');
      return;
    }
    setIsLoading(true); setLoadingMsg('Finalizando documento…');
    try {
      const finalBytes = await compilePdfWithSignatures({
        pdfBytes,
        signatures: [{
          imageUrl: creatorPlacement.imageDataUrl, storageUrl: creatorPlacement.storageUrl,
          signerName: creatorName || 'Firmante 1',
          signerRole: getSignerRoleLabel(resolvedDocumentType, 0, 'es'),
          page: creatorPlacement.page,
          xFraction: creatorPlacement.xFraction, yFraction: creatorPlacement.yFraction,
          widthFraction: creatorPlacement.widthFraction, heightFraction: creatorPlacement.heightFraction,
        }],
        documentId,
        fileHash,
        jurisdiction,
      });
      const finalBlob = new Blob([finalBytes], { type: 'application/pdf' });
      const finalUrl = await uploadPdfToStorage(documentId, finalBlob, `signed-${Date.now()}.pdf`);
      setSignedPdfUrl(finalUrl);
      await finalizeDocument(documentId, finalUrl);
      const ip = await getPublicIp();
      await insertAuditLog({ documentId, action: 'document_completed_solo', ipAddress: ip, userAgent: navigator.userAgent });
      toast.success('¡Documento certificado! No necesitas ningún invitado.');
      markVisitorActivity('signature', 'creator-signature');
      setStep('done');
    } catch (err) {
      toast.error(`No se pudo finalizar el documento: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false); setLoadingMsg('');
    }
  };

  const handleGenerateLink = async () => {
    if (!guestName.trim() || !guestEmail.trim()) { setError('Ingresa el nombre y correo del invitado.'); return; }
    setError(''); setIsLoading(true); setLoadingMsg('Generando enlace seguro…');
    try {
      const signerId = await createSigner({ documentId, name: guestName, email: guestEmail });
      const token    = await createSigningLink({ documentId, signerId, guestName, guestEmail });
      setSigningToken(token);
      toast.success('Enlace generado. Compártelo con el firmante.');
    } catch (err) {
      setError(`Error al generar el enlace: ${err instanceof Error ? err.message : String(err)}`);
      toast.error('No se pudo crear el enlace de firma.');
    } finally {
      setIsLoading(false); setLoadingMsg('');
    }
  };

  // Just re-checks documents.status — the actual compile/upload/finalize
  // already happened (or is happening) on the guest's own browser via
  // guest-sign-page.tsx; this never re-compiles itself (see the effect
  // above for why that used to be a real bug).
  const handleManualCheck = async () => {
    if (!documentId) return;
    setIsLoading(true);
    try {
      const doc = await getDocumentStatus(documentId);
      if (doc?.status === 'completed') {
        if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
        if (doc.signedPdfUrl) setSignedPdfUrl(doc.signedPdfUrl);
        setDocumentStatus('completed');
        toast.success('¡El invitado ya firmó! Documento certificado.');
      } else {
        toast.info('El invitado aún no ha firmado.');
      }
    } catch { toast.error('Error al verificar.'); }
    finally { setIsLoading(false); }
  };

  const handleConfirmPositions = async (placements: PlacedSignature[], bypassUsageCheck = false) => {
    if (placements.length === 0) { setError('Coloca al menos una firma en el documento.'); return; }
    if (!pdfBytes || pdfBytes.length === 0) { setError('No hay PDF en memoria. Reinicia el flujo.'); return; }

    // This is the creator placing/confirming their own signature on the
    // document — a "Firma" action, not a "Documento" action. It used to
    // consume the document counter here, which meant signing quietly ate
    // into the wrong bucket instead of the two counters staying independent.
    if (!bypassUsageCheck && !isAdmin) {
      const userId = session?.user?.id;
      const docStatus = userId
        ? await consumeSignatureRequest72h(userId, false)
        : await consumeAnonUsage72h('signature');
      if (!docStatus.allowed) {
        setPaywallNextSlotAt(userId ? await getNextSignatureRequestSlot(userId) : await getNextAnonUsageSlot('signature'));
        setPendingPlacements(placements); setPaywallContext('doc'); return;
      }
    }
    setError(''); setIsLoading(true); setStep('compiling'); setLoadingMsg('Guardando posiciones…');
    try {
      await insertSignaturePositions(documentId, placements.map((p) => ({ x: p.xFraction, y: p.yFraction, width: p.widthFraction, height: p.heightFraction, page: p.page })));
      setLoadingMsg('Compilando PDF certificado…');
      const signatures = placements.map((p) => ({
        imageUrl: p.imageDataUrl, storageUrl: p.storageUrl,
        signerName: p.signerName, signerRole: p.signerRole,
        page: p.page, xFraction: p.xFraction, yFraction: p.yFraction,
        widthFraction: p.widthFraction, heightFraction: p.heightFraction,
      }));
      const finalBytes = await compilePdfWithSignatures({ pdfBytes: pdfBytes!, signatures, documentId, fileHash, jurisdiction });
      setLoadingMsg('Subiendo PDF certificado…');
      const finalBlob = new Blob([finalBytes], { type: 'application/pdf' });
      // Timestamped — see the identical fix (and the confirmed live RLS
      // error) a few lines up in handleCreatorPlacementConfirm.
      const signedUrl = await uploadPdfToStorage(documentId, finalBlob, `signed-${Date.now()}.pdf`);
      setSignedPdfUrl(signedUrl);
      await finalizeDocument(documentId, signedUrl);
      const ip = await getPublicIp();
      await insertAuditLog({ documentId, action: 'document_compiled_and_certified', ipAddress: ip, userAgent: navigator.userAgent, hashSha256: fileHash });
      toast.success('¡Documento certificado exitosamente!');
      markVisitorActivity('signature', 'creator-signature');
      setStep('done');
    } catch (err) {
      setError(`Error al compilar el PDF: ${err instanceof Error ? err.message : String(err)}`);
      toast.error('No se pudo compilar el PDF.');
      setStep('position');
    } finally {
      setIsLoading(false); setLoadingMsg('');
    }
  };

  const handleReset = () => {
    setStep('upload'); setPdfBytes(null); setFileName(''); setDocumentId(''); setFileHash('');
    setCreatorName(''); setCreatorEmail(''); setCreatorSigDataUrl(''); setCreatorSigUrl(''); setCreatorPlacement(null);
    setGuestName(''); setGuestEmail(''); setGuestSigDataUrl(''); setGuestSigUrl('');
    setSigningToken(''); setSignedPdfUrl(''); setSignedAt(''); setDocumentStatus('pending');
    setRequireIdPhoto(false); setRequireSelfie(false);
    setPendingFile(null); setError('');
  };

  // Requirements travel as URL query-params — no extra DB table needed
  const guestLink = signingToken ? (() => {
    const qp = new URLSearchParams();
    if (requireIdPhoto) qp.set('req_id',     '1');
    if (requireSelfie)  qp.set('req_selfie', '1');
    const qs = qp.toString();
    return `${window.location.origin}/guest-sign/${signingToken}${qs ? '?' + qs : ''}`;
  })() : '';
  const wizardStep    = toWizardStep(step);
  const isDone        = step === 'done';

  const editorSigners: EditorSigner[] = [
    { id: 'creator', name: creatorName || 'Firmante 1', role: getSignerRoleLabel(resolvedDocumentType, 0, 'es'), color: '#3B82F6', imageDataUrl: creatorSigDataUrl, storageUrl: creatorSigUrl },
    { id: 'guest',   name: guestName   || 'Invitado',   role: getSignerRoleLabel(resolvedDocumentType, 1, 'es'), color: '#F59E0B', imageDataUrl: guestSigDataUrl,   storageUrl: guestSigUrl   },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={isDone ? 'min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100' : 'min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50/60 text-slate-800'}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      {!isDone && (
        <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 shadow-sm backdrop-blur-lg">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-2 shadow-lg shadow-indigo-200">
                  <Shield className="size-6 text-white" />
                </div>
                <div>
                  <h1 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-xl font-bold text-transparent">
                    Firma Digital Mutua
                  </h1>
                  <p className="text-xs text-slate-500">Powered by Codec Studio · {jurisdiction.badgeEs}</p>
                </div>
              </div>
              <Link to="/" className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100">
                ← Inicio
              </Link>
            </div>
          </div>

          {/* Wizard progress indicator */}
          {step !== 'position' && step !== 'compiling' && (
            <div className="border-t border-slate-100 bg-slate-50/60 px-4">
              <WizardProgress current={wizardStep} />
            </div>
          )}
        </header>
      )}

      <main className="container mx-auto max-w-5xl space-y-6 px-4 py-8">

        {/* Loading overlay */}
        {isLoading && step !== 'position' && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-sm">
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-8 py-6 text-center shadow-xl">
              <Loader className="mx-auto mb-3 size-8 animate-spin text-indigo-400" />
              <p className="text-sm font-semibold text-white">{loadingMsg || 'Procesando…'}</p>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && !isDone && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p className="flex-1">{error}</p>
            <button type="button" onClick={() => setError('')} className="shrink-0 font-bold">✕</button>
          </div>
        )}

        <div key={step}>

          {/* ── DONE ── */}
          {isDone && (
            <SignedSuccessScreen
              onFinish={handleReset}
              downloadUrl={signedPdfUrl}
              documentName={fileName.replace(/\.pdf$/i, '')}
              documentId={documentId}
              signedAt={signedAt}
            />
          )}

          {/* ══════════════════════════════════════════════════════════════
              WIZARD STEP 1 — Sub-estado A: Subir PDF
              ══════════════════════════════════════════════════════════════ */}
          {step === 'upload' && (
            <div className="mx-auto max-w-xl">
              <div className="mb-6 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">Paso 1 · Preparar documento</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">Sube el documento a firmar</h2>
                <p className="mt-1 text-sm text-slate-500">Solo archivos PDF. Tamaño máximo recomendado: 10 MB.</p>
              </div>
              <PdfUploader fileName={fileName} loading={isLoading} error={error} onFileSelect={(f) => void handleUploadPdf(f)} />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              WIZARD STEP 1 — Sub-estado B: Datos del creador + seguridad
              ══════════════════════════════════════════════════════════════ */}
          {step === 'creator-sign' && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">

              {/* Left panel */}
              <div className="space-y-5">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">Paso 1 · Preparar</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">Tus datos y firma</h2>
                  <p className="mt-1 text-sm text-slate-500">Completa tu información y traza tu firma para certificar el documento.</p>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">Nombre completo</label>
                      <input value={creatorName} onChange={(e) => setCreatorName(e.target.value)} placeholder="Tu nombre legal"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">Correo electrónico</label>
                      <input value={creatorEmail} onChange={(e) => setCreatorEmail(e.target.value)} placeholder="tu@email.com" type="email"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCreatorModalOpen(true)}
                    disabled={!creatorName.trim()}
                    className="mt-5 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <PenLine className="mr-1.5 inline size-4" /> Trazar mi firma en el documento
                  </button>

                  {creatorSigDataUrl && (
                    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-emerald-800">Firma registrada correctamente</p>
                        <p className="text-xs text-emerald-600">Ahora configura los requisitos de validación del firmante.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Security requirements panel */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-50">
                      <Lock className="size-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Seguridad Avanzada</p>
                      <p className="text-[10px] text-slate-400">Requisitos de validación para el firmante</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <SecurityToggle
                      checked={requireIdPhoto}
                      onChange={setRequireIdPhoto}
                      label="Requiere Documento de Identidad"
                      sub="El firmante debe fotografiar su cédula o pasaporte"
                      Icon={IdCard}
                    />
                    <SecurityToggle
                      checked={requireSelfie}
                      onChange={setRequireSelfie}
                      label="Requiere Selfie Biométrica"
                      sub="Validación facial del firmante antes de estampar"
                      Icon={Camera}
                    />
                  </div>

                  {(requireIdPhoto || requireSelfie) && (
                    <p className="mt-3 text-[11px] text-indigo-600 bg-indigo-50 rounded-xl px-3 py-2">
                      ✓ Estos requisitos se enviarán al firmante y se guardarán en la base de datos del documento.
                    </p>
                  )}
                </div>
              </div>

              {/* Right panel — live preview */}
              <PdfSignaturePreview
                pdfBytes={pdfBytes}
                signers={[
                  {
                    name: creatorName || 'Firmante 1', color: '#3B82F6', role: getSignerRoleLabel(resolvedDocumentType, 0, 'es'),
                    signatureDataUrl: creatorSigDataUrl || undefined,
                    canSign: !creatorSigDataUrl,
                    onSign: () => {
                      if (!creatorName.trim()) { toast.error('Ingresa tu nombre primero.'); return; }
                      setCreatorModalOpen(true);
                    },
                  },
                  { name: 'Firmante 2', color: '#F59E0B', role: getSignerRoleLabel(resolvedDocumentType, 1, 'es'), signatureDataUrl: undefined, canSign: false },
                ]}
              />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              Coloca tu firma — el documento real, interactivo: arrastra,
              mueve y redimensiona, en vez del punto fijo que se estampaba
              antes sin dejar elegir dónde.
              ══════════════════════════════════════════════════════════════ */}
          {step === 'position-creator' && pdfBytes && pdfBytes.length > 0 && (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Paso 1 · Firma</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Coloca tu firma en el documento</h2>
                <p className="mt-1 text-sm text-slate-600">Arrastra, mueve y redimensiona tu firma hasta que quede donde corresponde.</p>
              </div>
              <PdfSignatureEditor
                pdfBytes={pdfBytes}
                signers={editorSigners.slice(0, 1)}
                onConfirm={(placements) => void handleCreatorPlacementConfirm(placements)}
                isLoading={isLoading}
              />
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════
              WIZARD STEP 2 — Envío: form + hub de distribución
              ══════════════════════════════════════════════════════════════ */}
          {step === 'invite-guest' && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">

              {/* Left panel */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">Paso 2 · Distribuir</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {signingToken ? 'Central de distribución' : 'Datos del segundo firmante'}
                </h2>

                {!signingToken ? (
                  /* Sub-estado: form */
                  <>
                    <p className="mt-1 text-sm text-slate-500">
                      Ingresa los datos del invitado para generar su enlace único de firma (válido 48 h).
                    </p>
                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700">Nombre del invitado</label>
                        <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Nombre del segundo firmante"
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-700">Correo del invitado</label>
                        <input value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="invitado@email.com" type="email"
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                      <p className="text-sm text-emerald-800">Tu firma fue registrada. Ahora invita al segundo firmante.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleGenerateLink()}
                      disabled={!guestName.trim() || !guestEmail.trim() || isLoading}
                      className="mt-5 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send className="mr-2 inline size-4" />
                      Generar enlace único de firma
                    </button>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-px flex-1 bg-slate-200" />
                      <span className="text-xs font-medium text-slate-400">o</span>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleSignAloneOnly()}
                      disabled={isLoading}
                      className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Solo yo firmo — sin invitar a nadie
                    </button>
                    <p className="mt-2 text-center text-xs text-slate-400">
                      El documento quedará certificado únicamente con tu firma.
                    </p>
                  </>
                ) : documentStatus === 'completed' ? (
                  <GuestCompletedBanner guestName={guestName} onContinue={() => setStep('done')} />
                ) : (
                  /* Sub-estado: hub de distribución */
                  <ShareHub
                    link={guestLink}
                    guestName={guestName}
                    guestEmail={guestEmail}
                    docName={fileName.replace(/\.pdf$/i, '')}
                    onContinue={() => setStep('await-guest')}
                  />
                )}
              </div>

              {/* Right panel */}
              <PdfSignaturePreview
                pdfBytes={pdfBytes}
                signers={[
                  { name: creatorName || 'Firmante 1', color: '#3B82F6', role: getSignerRoleLabel(resolvedDocumentType, 0, 'es'), signatureDataUrl: creatorSigDataUrl || undefined, canSign: false },
                  { name: guestName   || 'Firmante 2', color: '#F59E0B', role: getSignerRoleLabel(resolvedDocumentType, 1, 'es'), signatureDataUrl: undefined, canSign: false },
                ]}
              />
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              WIZARD STEP 3 — Esperando firma del invitado
              ══════════════════════════════════════════════════════════════ */}
          {step === 'await-guest' && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">Paso 3 · Esperando</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Monitoreando firma de {guestName || 'invitado'}</h2>

                {documentStatus === 'completed' ? (
                  <GuestCompletedBanner guestName={guestName} onContinue={() => setStep('done')} />
                ) : (
                  <div className="mt-5 space-y-4">
                    {/* Live status indicator */}
                    <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                      <Loader className="size-5 shrink-0 animate-spin text-amber-600" />
                      <div>
                        <p className="text-sm font-bold text-amber-800">Esperando a que {guestName || 'el invitado'} firme</p>
                        <p className="text-xs text-amber-700">Te avisaremos aquí mismo apenas firme — no necesitas hacer nada más.</p>
                      </div>
                    </div>

                    {/* Link preview */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500 break-all">
                      {guestLink}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard.writeText(guestLink);
                          setLinkCopied(true);
                          setTimeout(() => setLinkCopied(false), 2000);
                          toast.success('Enlace copiado.');
                        }}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                      >
                        {linkCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                        {linkCopied ? 'Copiado' : 'Copiar enlace'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleManualCheck()}
                        disabled={isLoading}
                        className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:opacity-50"
                      >
                        <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
                        ¿Ya firmó? Verificar
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep('position')}
                      className="w-full rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm text-slate-500 transition hover:border-slate-400 hover:text-slate-700"
                    >
                      Continuar sin esperar (modo demo / prueba)
                    </button>
                  </div>
                )}
              </div>

              <PdfSignaturePreview
                pdfBytes={pdfBytes}
                signers={[
                  { name: creatorName || 'Firmante 1', color: '#3B82F6', role: getSignerRoleLabel(resolvedDocumentType, 0, 'es'), signatureDataUrl: creatorSigDataUrl || undefined, canSign: false },
                  { name: guestName   || 'Firmante 2', color: '#F59E0B', role: getSignerRoleLabel(resolvedDocumentType, 1, 'es'), signatureDataUrl: guestSigDataUrl || undefined, canSign: false },
                ]}
              />
            </div>
          )}

          {/* ── POSITION (editor manual, hidden wizard step) ── */}
          {step === 'position' && pdfBytes && pdfBytes.length > 0 && (
            <>
              <div className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Posicionado manual</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">Posiciona las firmas en el documento</h2>
                  <p className="mt-1 text-sm text-slate-600">Arrastra, mueve y redimensiona cada bloque de firma.</p>
                </div>
                <div className="hidden shrink-0 lg:block">
                  <SignatureTimeline step={step as TimelineStep} />
                </div>
              </div>
              <PdfSignatureEditor
                pdfBytes={pdfBytes}
                signers={editorSigners}
                onConfirm={(placements) => void handleConfirmPositions(placements)}
                isLoading={isLoading}
              />
            </>
          )}

          {/* ── COMPILING ── */}
          {step === 'compiling' && (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
              <div className="relative">
                <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400/20" />
                <div className="relative flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/30 to-blue-600/20 ring-1 ring-indigo-400/20">
                  <Loader className="size-9 animate-spin text-indigo-400" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Compilando documento certificado</h2>
                <p className="mt-1 text-sm text-slate-500">{loadingMsg || 'Por favor espera unos segundos…'}</p>
              </div>
            </div>
          )}

        </div>
        {/* end key={step} */}
      </main>

      {/* ── Paywall overlay ────────────────────────────────────────────────────── */}
      {/* Renders regardless of auth state — it used to require
          session?.user?.id, so an anonymous visitor who genuinely exhausted
          their free 72h allowance (see consumeAnonUsage72h) would have
          paywallContext set but see nothing happen at all when blocked. */}
      {paywallContext !== null && !isDone && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-8 backdrop-blur-sm sm:items-center">
          <div className="relative my-auto max-h-[85vh] w-full max-w-md overflow-y-auto">
            <button
              type="button"
              onClick={() => { setPaywallContext(null); setPendingPlacements(null); setPendingFile(null); }}
              className="absolute -right-3 -top-3 z-10 flex size-9 items-center justify-center rounded-full bg-slate-800 text-white transition hover:bg-slate-700"
            >
              <X className="size-4" />
            </button>
            <div className="mb-3 rounded-2xl border border-amber-400/30 bg-amber-950/60 px-4 py-3 text-center">
              <p className="flex items-center justify-center gap-2 text-sm font-bold text-amber-300">
                {paywallContext === 'upload'
                  ? (<><Upload className="size-4 shrink-0" /> Límite gratuito de documentos alcanzado</>)
                  : (<><FileText className="size-4 shrink-0" /> Límite gratuito de firmas alcanzado</>)}
              </p>
              <p className="mt-1 text-xs text-amber-200/70">
                {(() => {
                  const ms = paywallNextSlotAt ? paywallNextSlotAt.getTime() - Date.now() : 0;
                  const hours = ms > 0 ? Math.ceil(ms / (60 * 60 * 1000)) : 0;
                  const waitText = hours > 0
                    ? `Vuelve a hacerlo gratis en ${hours <= 1 ? 'menos de 1 hora' : `${hours} horas`}, o`
                    : 'Vuelve a intentarlo gratis en un momento, o';
                  return `${waitText} paga solo por esta firma para continuar ahora.`;
                })()}
              </p>
            </div>
            {session?.user?.id ? (
              <PaypalSignatureCheckout
                userId={session.user.id}
                mode="signature"
                onSuccess={() => {
                  const ctx = paywallContext, pendingPos = pendingPlacements, pendingF = pendingFile;
                  setPaywallContext(null); setPendingPlacements(null); setPendingFile(null);
                  if (ctx === 'upload' && pendingF) void handleUploadPdf(pendingF, true);
                  if (ctx === 'doc'    && pendingPos) void handleConfirmPositions(pendingPos, true);
                }}
              />
            ) : (
              // Anonymous + quota exhausted: the paid unlock requires a real
              // account server-side (paypal-verify only grants credit when
              // it can resolve a userId from the JWT), so offer a free sign-in
              // instead of a payment flow that couldn't actually deliver.
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 text-center backdrop-blur-xl">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 ring-1 ring-indigo-400/20">
                  <ShieldCheck className="size-6 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Inicia sesión para continuar</h3>
                <p className="mt-1 text-sm text-white/50">
                  Ya usaste tus firmas gratuitas como invitado. Crea una cuenta gratis (o inicia sesión) para seguir firmando o desbloquear más con un pago.
                </p>
                <button
                  type="button"
                  onClick={() => void signInWithGoogle()}
                  className="mt-5 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:from-blue-500 hover:to-indigo-500"
                >
                  Continuar con Google
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      {!isDone && (
        <>
          <SignatureModal
            open={creatorModalOpen}
            onOpenChange={setCreatorModalOpen}
            signerName={creatorName}
            userId={session?.user?.id}
            title="Traza tu firma"
            subtitle="Tu firma biométrica quedará registrada con IP y timestamp legal"
            onConfirm={(dataUrl) => void handleCreatorSign(dataUrl)}
          />
          <QRShareModal
            open={shareOpen}
            onOpenChange={setShareOpen}
            link={guestLink}
            onCopy={() => { if (guestLink) void navigator.clipboard.writeText(guestLink); }}
          />
        </>
      )}
    </div>
  );
}
