import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  Shield, Loader, RefreshCw, AlertCircle, X, CheckCircle2,
  ShieldCheck, IdCard, Camera, Send, MessageCircle, Mail,
  Copy, Check, Lock, FileText, Users, ChevronRight,
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
  getDocumentSignatures, compilePdfWithSignatures,
} from '../../lib/signatureService';
import {
  checkGeneratedDocLimit, incrementGeneratedDoc,
  checkUploadedDocLimit, incrementUploadedDoc,
} from '../services/user-limits-service';
import { getSignerRoleLabel, inferDocumentTypeHint } from '../utils/signer-roles';

type Step = 'upload' | 'creator-sign' | 'invite-guest' | 'await-guest' | 'position' | 'compiling' | 'done';

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

// ── Main page ─────────────────────────────────────────────────────────────────
export function ElectronicSignaturePage() {
  const { session, isAdmin } = useAuth();

  const [step, setStep] = useState<Step>('upload');
  const [paywallContext, setPaywallContext] = useState<'upload' | 'doc' | null>(null);
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

  // ── PDF page count ─────────────────────────────────────────────────────────
  const [pdfPageCount, setPdfPageCount] = useState(1);

  // ── UI ─────────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading]     = useState(false);
  const [loadingMsg, setLoadingMsg]   = useState('');
  const [error, setError]             = useState('');
  const [signedPdfUrl, setSignedPdfUrl] = useState('');
  const [documentStatus, setDocumentStatus] = useState<string>('pending');
  const [linkCopied, setLinkCopied]   = useState(false);

  const pollingRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const pdfPageCountRef  = useRef(1);
  const doAutoCompileRef = useRef<((guestDataUrl: string, guestStorageUrl: string) => Promise<void>) | null>(null);

  pdfPageCountRef.current = pdfPageCount;

  // ── Global cleanup ─────────────────────────────────────────────────────────
  useEffect(() => () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
  }, []);

  // ── Detect page count ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!pdfBytes || pdfBytes.length === 0) return;
    void (async () => {
      try {
        const { PDFDocument } = await import('pdf-lib');
        const doc = await PDFDocument.load(pdfBytes.slice(0));
        const count = doc.getPageCount();
        setPdfPageCount(count);
        pdfPageCountRef.current = count;
      } catch {
        setPdfPageCount(1);
      }
    })();
  }, [pdfBytes]);

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

  // ── Auto-transition to done on completed status ────────────────────────────
  useEffect(() => {
    if (documentStatus !== 'completed') return;
    const t = setTimeout(() => setStep('done'), 1200);
    return () => clearTimeout(t);
  }, [documentStatus]);

  // ── Realtime + polling fallback (await-guest) ──────────────────────────────
  useEffect(() => {
    if (step !== 'await-guest' || !documentId) return;

    let compiled = false; // guard: compile only once per session

    const compileGuest = async (storageUrl: string) => {
      if (compiled) return;
      compiled = true;
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }

      let dataUrl = storageUrl;
      try {
        const res  = await fetch(storageUrl);
        const blob = await res.blob();
        dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(String(e.target?.result ?? storageUrl));
          reader.readAsDataURL(blob);
        });
      } catch { /* use storage URL as-is */ }

      setGuestSigUrl(storageUrl);
      setGuestSigDataUrl(dataUrl);
      toast.success('¡El invitado ha firmado! Compilando documento…');
      if (doAutoCompileRef.current) void doAutoCompileRef.current(dataUrl, storageUrl);
    };

    // PRIMARY: listen for new signature rows (fires the moment guest signs)
    const channel = supabase
      .channel(`sig-watch-${documentId}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'signatures',
        filter: `document_id=eq.${documentId}`,
      }, (payload) => {
        const row = payload.new as { signer_email?: string; signature_url?: string };
        // Skip creator's own signature row
        if (!row.signature_url || row.signer_email === creatorEmail) return;
        void compileGuest(row.signature_url);
      })
      // SECONDARY: listen for document status → 'completed' (fires after compile)
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'documents',
        filter: `id=eq.${documentId}`,
      }, (payload) => {
        const updated = payload.new as { status?: string; signed_pdf_url?: string };
        if (updated.status === 'completed') {
          if (updated.signed_pdf_url) setSignedPdfUrl(updated.signed_pdf_url);
          setDocumentStatus('completed');
        }
      })
      .subscribe();

    // FALLBACK: polling every 4 s in case Realtime is not enabled on the table
    const checkGuestSig = async () => {
      if (compiled) return;
      try {
        const sigs = await getDocumentSignatures(documentId);
        const guestSig = sigs.find((s) => s.signer_email !== creatorEmail && s.signature_url);
        if (guestSig?.signature_url) void compileGuest(guestSig.signature_url);
      } catch { /* silently ignore network errors */ }
    };

    void checkGuestSig(); // immediate check on mount
    pollingRef.current = setInterval(() => { void checkGuestSig(); }, 4000);

    return () => {
      void supabase.removeChannel(channel);
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, documentId]);

  // ── Auto-compile (left=creator, right=guest) ───────────────────────────────
  const doAutoCompile = async (guestDataUrl: string, guestStorageUrl: string) => {
    const W = 0.44, H = 0.30, Y = 0.84;
    const creatorRole = getSignerRoleLabel(resolvedDocumentType, 0, 'es');
    const guestRole = getSignerRoleLabel(resolvedDocumentType, 1, 'es');
    const placements: PlacedSignature[] = [
      {
        id: `creator-auto-${Date.now()}`, signerId: 'creator',
        signerName: creatorName || 'Firmante 1', signerRole: creatorRole, color: '#3B82F6',
        imageDataUrl: creatorSigDataUrl, storageUrl: creatorSigUrl,
        page: pdfPageCountRef.current,
        xFraction: 0.25, yFraction: Y, widthFraction: W, heightFraction: H,
        labelText: creatorName || 'Firmante 1', showLabel: true,
      },
      {
        id: `guest-auto-${Date.now() + 1}`, signerId: 'guest',
        signerName: guestName || 'Firmante 2', signerRole: guestRole, color: '#F59E0B',
        imageDataUrl: guestDataUrl, storageUrl: guestStorageUrl,
        page: pdfPageCountRef.current,
        xFraction: 0.75, yFraction: Y, widthFraction: W, heightFraction: H,
        labelText: guestName || 'Firmante 2', showLabel: true,
      },
    ].filter(p => Boolean(p.imageDataUrl) || Boolean(p.storageUrl));

    await handleConfirmPositions(placements);
  };
  doAutoCompileRef.current = doAutoCompile;

  // ── Step handlers ─────────────────────────────────────────────────────────

  const handleUploadPdf = async (file?: File | null, bypassUsageCheck = false) => {
    if (!file) return;
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Solo se permiten archivos PDF.'); return;
    }
    if (!bypassUsageCheck && session?.user?.id && !isAdmin) {
      try {
        const s = await checkUploadedDocLimit(session.user.id, false);
        if (!s.allowed) { setPendingFile(file); setPaywallContext('upload'); return; }
      } catch { /* fail open */ }
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
      setDocumentId(docId);
      setDocumentType(file.name.replace(/\.pdf$/i, '').toLowerCase());
      setLoadingMsg('Subiendo al almacenamiento seguro…');
      const pdfBlob = new Blob([bytes], { type: 'application/pdf' });
      const pdfUrl = await uploadPdfToStorage(docId, pdfBlob);
      await updateDocumentPdfUrl(docId, pdfUrl);
      if (session?.user?.id) { try { await incrementUploadedDoc(session.user.id); } catch { /* non-fatal */ } }
      const ip = await getPublicIp();
      await insertAuditLog({ documentId: docId, action: 'document_uploaded', ipAddress: ip, userAgent: navigator.userAgent, hashSha256: hash });
      toast.success('Documento cargado correctamente.');
      setStep('creator-sign');
    } catch (err) {
      setError(`Error al procesar el documento: ${err instanceof Error ? err.message : String(err)}`);
      toast.error('No se pudo subir el documento.');
    } finally {
      setIsLoading(false); setLoadingMsg('');
    }
  };

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
      const partialBytes = await compilePdfWithSignatures({
        pdfBytes: pdfBytes!,
        signatures: [{
          imageUrl: dataUrl,
          signerName: creatorName || 'Firmante 1',
          signerRole: getSignerRoleLabel(resolvedDocumentType, 0, 'es'),
          page: pdfPageCountRef.current || 1,
          xFraction: 0.25,
          yFraction: 0.84,
          widthFraction: 0.44,
          heightFraction: 0.30,
        }],
        documentId,
        fileHash,
      });
      const partialBlob = new Blob([partialBytes], { type: 'application/pdf' });
      const partialSignedUrl = await uploadPdfToStorage(documentId, partialBlob, 'signed.pdf');
      setSignedPdfUrl(partialSignedUrl);
      await updateDocumentSignedPdfUrl(documentId, partialSignedUrl);
      await insertAuditLog({ documentId, action: 'creator_signed', ipAddress: ip, userAgent: navigator.userAgent, hashSha256: sigHash });
      toast.success('Firma registrada correctamente.');
      setStep('invite-guest');
    } catch (err) {
      setError(`Error al guardar la firma: ${err instanceof Error ? err.message : String(err)}`);
      toast.error('No se pudo guardar la firma.');
    } finally {
      setIsLoading(false); setLoadingMsg('');
    }
  };

  const handleGenerateLink = async () => {
    if (!guestName.trim() || !guestEmail.trim()) { setError('Ingresa el nombre y correo del invitado.'); return; }
    setError(''); setIsLoading(true); setLoadingMsg('Generando enlace seguro…');
    try {
      const signerId = await createSigner({ documentId, name: guestName, email: guestEmail });
      const token    = await createSigningLink({ documentId, signerId });
      setSigningToken(token);
      toast.success('Enlace generado. Compártelo con el firmante.');
    } catch (err) {
      setError(`Error al generar el enlace: ${err instanceof Error ? err.message : String(err)}`);
      toast.error('No se pudo crear el enlace de firma.');
    } finally {
      setIsLoading(false); setLoadingMsg('');
    }
  };

  const handleManualCheck = async () => {
    if (!documentId) return;
    setIsLoading(true);
    try {
      const sigs = await getDocumentSignatures(documentId);
      if (sigs.length >= 2) {
        const guestSig = sigs.find((s) => s.signer_email !== creatorEmail);
        if (guestSig?.signature_url) {
          if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
          let guestDataUrl = guestSig.signature_url;
          try {
            const res  = await fetch(guestSig.signature_url);
            const blob = await res.blob();
            guestDataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(String(e.target?.result ?? guestSig.signature_url));
              reader.readAsDataURL(blob);
            });
          } catch { /* use storage URL */ }
          setGuestSigUrl(guestSig.signature_url);
          setGuestSigDataUrl(guestDataUrl);
          toast.success('¡El invitado ha firmado! Compilando…');
          await doAutoCompile(guestDataUrl, guestSig.signature_url);
          return;
        }
      }
      toast.info('El invitado aún no ha firmado.');
    } catch { toast.error('Error al verificar.'); }
    finally { setIsLoading(false); }
  };

  const handleConfirmPositions = async (placements: PlacedSignature[], bypassUsageCheck = false) => {
    if (placements.length === 0) { setError('Coloca al menos una firma en el documento.'); return; }
    if (!pdfBytes || pdfBytes.length === 0) { setError('No hay PDF en memoria. Reinicia el flujo.'); return; }

    if (!bypassUsageCheck && session?.user?.id && !isAdmin) {
      try {
        const docStatus = await checkGeneratedDocLimit(session.user.id, false);
        if (!docStatus.allowed) { setPendingPlacements(placements); setPaywallContext('doc'); return; }
      } catch { /* fail open */ }
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
      const finalBytes = await compilePdfWithSignatures({ pdfBytes: pdfBytes!, signatures, documentId, fileHash });
      setLoadingMsg('Subiendo PDF certificado…');
      const finalBlob = new Blob([finalBytes], { type: 'application/pdf' });
      const signedUrl = await uploadPdfToStorage(documentId, finalBlob, 'signed.pdf');
      setSignedPdfUrl(signedUrl);
      await finalizeDocument(documentId, signedUrl);
      if (session?.user?.id) { try { await incrementGeneratedDoc(session.user.id); } catch { /* non-fatal */ } }
      const ip = await getPublicIp();
      await insertAuditLog({ documentId, action: 'document_compiled_and_certified', ipAddress: ip, userAgent: navigator.userAgent, hashSha256: fileHash });
      toast.success('¡Documento certificado exitosamente!');
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
    setCreatorName(''); setCreatorEmail(''); setCreatorSigDataUrl(''); setCreatorSigUrl('');
    setGuestName(''); setGuestEmail(''); setGuestSigDataUrl(''); setGuestSigUrl('');
    setSigningToken(''); setSignedPdfUrl(''); setDocumentStatus('pending');
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
                  <p className="text-xs text-slate-500">Powered by Codec Studio · E-SIGN &amp; UETA</p>
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
                    ✍️ Trazar mi firma en el documento
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
                      🔗 Generar enlace único de firma
                    </button>
                  </>
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
                  <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-emerald-800">¡Documento completado!</p>
                      <p className="text-xs text-emerald-700">Redirigiendo a descarga…</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {/* Live status indicator */}
                    <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                      <Loader className="size-5 shrink-0 animate-spin text-amber-600" />
                      <div>
                        <p className="text-sm font-bold text-amber-800">Sincronización en tiempo real activa</p>
                        <p className="text-xs text-amber-700">Respaldo automático cada 8 s · Realtime Supabase</p>
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
                        Verificar
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
      {paywallContext !== null && !isDone && session?.user?.id && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            <button
              type="button"
              onClick={() => { setPaywallContext(null); setPendingPlacements(null); setPendingFile(null); }}
              className="absolute -right-3 -top-3 z-10 flex size-9 items-center justify-center rounded-full bg-slate-800 text-white transition hover:bg-slate-700"
            >
              <X className="size-4" />
            </button>
            <div className="mb-3 rounded-2xl border border-amber-400/30 bg-amber-950/60 px-4 py-2.5 text-center text-sm font-medium text-amber-300">
              {paywallContext === 'upload'
                ? '📤 Límite diario alcanzado — 3 documentos gratuitos por día'
                : '📄 Límite diario alcanzado — 2 documentos firmados por día'}
            </div>
            <PaypalSignatureCheckout
              userId={session.user.id}
              onSuccess={() => {
                const ctx = paywallContext, pendingPos = pendingPlacements, pendingF = pendingFile;
                setPaywallContext(null); setPendingPlacements(null); setPendingFile(null);
                if (ctx === 'upload' && pendingF) void handleUploadPdf(pendingF, true);
                if (ctx === 'doc'    && pendingPos) void handleConfirmPositions(pendingPos, true);
              }}
            />
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
