import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ShieldCheck, Loader, AlertCircle, CheckCircle2,
  FileText, PenLine, Sparkles, ArrowRight, ArrowLeft, ExternalLink,
  IdCard, Camera, Upload, Lock,
} from 'lucide-react';
import { SignatureModal } from '../components/signatures/SignatureModal';
import { GuestSignaturePlacer } from '../components/signatures/GuestSignaturePlacer';
import type { PlacedSignature } from '../components/signatures/types';
import { PremiumDownloadModal } from '../components/PremiumDownloadModal';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';

import {
  verifySigningTokenPublic,
  uploadSignatureImage,
  insertSignature,
  tryCompleteSignerOnce,
  insertAuditLog,
  getPublicIp,
  dataUrlToBlob,
  compilePdfWithSignatures,
  getSignedUrlFallback,
  markDocumentInvitationSigned,
} from '../../lib/signatureService';
import { supabase, publicSupabase } from '../../lib/supabase';
import { normalizeIdEvidence, normalizeSelfieEvidence } from '../utils/evidence-image';
import { getSignerRoleLabel, inferDocumentTypeHint } from '../utils/signer-roles';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface TokenData {
  documentId: string;
  signerId: string;
  originalPdfUrl: string;
  signedPdfUrl: string;
  documentName: string;
  documentStatus: string;
}

type SigningRequirements = { requireIdPhoto: boolean; requireSelfie: boolean };

// ─── Single PDF page rendered to canvas via pdfjs ────────────────────────────
function PdfPage({
  pdfDoc,
  pageNumber,
  width,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdfDoc: any;
  pageNumber: number;
  width: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!width || !pdfDoc) return;
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let renderTask: any = null;

    const run = async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (cancelled) return;

        const baseVp = page.getViewport({ scale: 1 });
        const scale = width / baseVp.width;
        const vp = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;

        canvas.width = vp.width;
        canvas.height = vp.height;

        const ctx = canvas.getContext('2d')!;
        renderTask = page.render({ canvasContext: ctx, viewport: vp });
        await renderTask.promise;
        if (!cancelled) setRendered(true);
      } catch {
        /* cancelled or load error — ignore */
      }
    };

    void run();
    return () => {
      cancelled = true;
      try { renderTask?.cancel(); } catch { /* ignore */ }
    };
  }, [pdfDoc, pageNumber, width]);

  return (
    <div className="relative w-full bg-white">
      {!rendered && (
        <div className="flex h-40 items-center justify-center">
          <Loader className="size-5 animate-spin text-indigo-300" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ display: rendered ? 'block' : 'none' }}
      />
    </div>
  );
}

// ─── Utility ──────────────────────────────────────────────────────────────────
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(String(e.target?.result ?? ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Identity gate overlay ────────────────────────────────────────────────────
function IdentityGate({
  requirements,
  idFrontDataUrl, idBackDataUrl, selfieDataUrl,
  idFrontReady, idBackReady, selfieReady,
  uploadingIdFront, uploadingIdBack, uploadingSelfie,
  onIdFrontSelect, onIdBackSelect, onSelfieSelect, onContinue, onBack,
}: {
  documentId: string;
  requirements: SigningRequirements;
  idFrontDataUrl: string;
  idBackDataUrl: string;
  selfieDataUrl: string;
  idFrontReady: boolean;
  idBackReady: boolean;
  selfieReady: boolean;
  uploadingIdFront: boolean;
  uploadingIdBack: boolean;
  uploadingSelfie: boolean;
  onIdFrontSelect: (file: File) => Promise<void>;
  onIdBackSelect: (file: File) => Promise<void>;
  onSelfieSelect:  (file: File) => Promise<void>;
  onContinue: () => void;
  onBack: () => void;
}) {
  const canContinue =
    (!requirements.requireIdPhoto || (idFrontReady && idBackReady)) &&
    (!requirements.requireSelfie  || selfieReady);

  const idFrontInputRef = useRef<HTMLInputElement>(null);
  const idBackInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft className="size-4" />
          Atrás
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-900">Validación de identidad</p>
          <p className="text-[11px] text-slate-400">Requerida por el creador del documento</p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1">
          <Lock className="size-3 text-indigo-600" />
          <span className="text-[10px] font-bold text-indigo-700">Seguro</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-lg mx-auto w-full">

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3 items-start">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-800">
            El creador de este documento ha activado la verificación de identidad. Sube las imágenes requeridas para continuar.
            Estas imágenes se almacenan de forma cifrada solo como evidencia de auditoría legal.
          </p>
        </div>

        {/* ID Photo */}
        {requirements.requireIdPhoto && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex size-10 items-center justify-center rounded-xl ${(idFrontReady && idBackReady) ? 'bg-emerald-100' : 'bg-indigo-50'}`}>
                {(idFrontReady && idBackReady) ? <CheckCircle2 className="size-5 text-emerald-600" /> : <IdCard className="size-5 text-indigo-600" />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Documento de identidad (2 caras)</p>
                <p className="text-[11px] text-slate-400">Frente y reverso obligatorios para validación legal</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                {idFrontDataUrl ? (
                  <div className="relative overflow-hidden rounded-xl border border-slate-200">
                    <img src={idFrontDataUrl} alt="ID front" className="w-full max-h-48 object-contain bg-white" />
                    <button
                      type="button"
                      onClick={() => idFrontInputRef.current?.click()}
                      className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm"
                    >
                      Cambiar frente
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={uploadingIdFront}
                    onClick={() => idFrontInputRef.current?.click()}
                    className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 py-8 text-center transition hover:bg-indigo-50 disabled:opacity-50"
                  >
                    {uploadingIdFront ? (
                      <Loader className="size-6 animate-spin text-indigo-400" />
                    ) : (
                      <>
                        <Upload className="size-6 text-indigo-400" />
                        <span className="text-xs font-semibold text-indigo-600">Subir frente del documento</span>
                        <span className="text-[10px] text-slate-400">JPG, PNG, HEIC · Máx 10 MB</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div>
                {idBackDataUrl ? (
                  <div className="relative overflow-hidden rounded-xl border border-slate-200">
                    <img src={idBackDataUrl} alt="ID back" className="w-full max-h-48 object-contain bg-white" />
                    <button
                      type="button"
                      onClick={() => idBackInputRef.current?.click()}
                      className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm"
                    >
                      Cambiar reverso
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={uploadingIdBack}
                    onClick={() => idBackInputRef.current?.click()}
                    className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 py-8 text-center transition hover:bg-indigo-50 disabled:opacity-50"
                  >
                    {uploadingIdBack ? (
                      <Loader className="size-6 animate-spin text-indigo-400" />
                    ) : (
                      <>
                        <Upload className="size-6 text-indigo-400" />
                        <span className="text-xs font-semibold text-indigo-600">Subir reverso del documento</span>
                        <span className="text-[10px] text-slate-400">JPG, PNG, HEIC · Máx 10 MB</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <input
              ref={idFrontInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void onIdFrontSelect(f); e.target.value = ''; }}
            />
            <input
              ref={idBackInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void onIdBackSelect(f); e.target.value = ''; }}
            />
          </div>
        )}

        {/* Selfie */}
        {requirements.requireSelfie && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex size-10 items-center justify-center rounded-xl ${selfieReady ? 'bg-emerald-100' : 'bg-purple-50'}`}>
                {selfieReady ? <CheckCircle2 className="size-5 text-emerald-600" /> : <Camera className="size-5 text-purple-600" />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Selfie biométrica</p>
                <p className="text-[11px] text-slate-400">Foto tuya con cara visible y bien iluminada</p>
              </div>
            </div>

            {selfieDataUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-slate-200">
                <img src={selfieDataUrl} alt="Selfie" className="w-full max-h-48 object-contain bg-white" />
                <button
                  type="button"
                  onClick={() => selfieInputRef.current?.click()}
                  className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={uploadingSelfie}
                onClick={() => selfieInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/40 py-8 text-center transition hover:bg-purple-50 disabled:opacity-50"
              >
                {uploadingSelfie ? (
                  <Loader className="size-6 animate-spin text-purple-400" />
                ) : (
                  <>
                    <Camera className="size-6 text-purple-400" />
                    <span className="text-xs font-semibold text-purple-600">Toca para tomar selfie</span>
                    <span className="text-[10px] text-slate-400">Usa la cámara frontal · JPG, PNG</span>
                  </>
                )}
              </button>
            )}

            <input
              ref={selfieInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void onSelfieSelect(f); e.target.value = ''; }}
            />
          </div>
        )}

        {/* Privacy notice */}
        <div className="flex items-start gap-2.5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <Lock className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
          <p>
            Tus imágenes se almacenan en servidores cifrados exclusivamente como evidencia de auditoría.
            No se comparten con terceros. Consulta nuestra política de privacidad.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-slate-200 px-4 py-4">
        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-200/70 transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ShieldCheck className="size-5" />
          {canContinue
            ? 'Continuar a Firmar'
            : `Sube ${[
              requirements.requireIdPhoto && (!idFrontReady || !idBackReady) ? 'frente y reverso del ID' : '',
              requirements.requireSelfie && !selfieReady ? 'la selfie' : '',
            ].filter(Boolean).join(' y ')} para continuar`}
        </button>
      </div>
    </div>
  );
}

// ─── Main guest-sign page ─────────────────────────────────────────────────────
export function GuestSignPage() {
  // Accept both /sign/:token and /guest-sign/:token
  const { token, documentId: paramDocId } = useParams<{ token?: string; documentId?: string }>();
  const signToken = token ?? paramDocId;
  const navigate = useNavigate();

  // ── Token ────────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [tokenError, setTokenError] = useState('');

  // ── PDF ──────────────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [pdfError, setPdfError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // ── Guest info ────────────────────────────────────────────────────────────────
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  // ── UX flow ──────────────────────────────────────────────────────────────────
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [showSignPad, setShowSignPad] = useState(false);
  const bottomMarkerRef = useRef<HTMLDivElement>(null);

  // Adobe-style two-step signing: SignatureModal only captures WHAT the
  // signature looks like (draw/type/upload/QR); once confirmed, the guest
  // still has to choose WHERE it goes on the document — see
  // GuestSignaturePlacer below. guestSigDataUrl holds the drawn signature
  // between those two steps.
  const [guestSigDataUrl, setGuestSigDataUrl] = useState('');
  const [showPlacer, setShowPlacer] = useState(false);

  // ── Identity validation gate — requirements come from URL query params ────────
  // The creator embeds ?req_id=1&req_selfie=1 in the signing link.
  // No extra DB table needed; the signing_links token is the source of truth.
  const urlParams      = new URLSearchParams(window.location.search);
  const reqIdPhoto     = urlParams.get('req_id')     === '1';
  const reqSelfie      = urlParams.get('req_selfie') === '1';
  const requirements   = { requireIdPhoto: reqIdPhoto, requireSelfie: reqSelfie };
  const [showIdGate, setShowIdGate] = useState(false);
  const [idFrontDataUrl, setIdFrontDataUrl] = useState('');
  const [idBackDataUrl, setIdBackDataUrl] = useState('');
  const [selfieDataUrl, setSelfieDataUrl]   = useState('');
  const [idFrontReady, setIdFrontReady]     = useState(false);
  const [idBackReady, setIdBackReady]       = useState(false);
  const [selfieReady, setSelfieReady]       = useState(false);
  const [uploadingIdFront, setUploadingIdFront] = useState(false);
  const [uploadingIdBack, setUploadingIdBack] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);

  // ── Completion ────────────────────────────────────────────────────────────────
  const [isSigning, setIsSigning] = useState(false);
  const [done, setDone] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);

  const isPremiumLimitError = (err: unknown) => {
    const message = err instanceof Error ? err.message : String(err ?? '');
    return /freemium|premium|límite|limit|quota|usage/i.test(message);
  };

  // ─── Verify token on mount ────────────────────────────────────────────────────
  useEffect(() => {
    const run = async () => {
      if (!signToken) {
        setTokenError('Enlace de firma no válido o incompleto.');
        setLoading(false);
        return;
      }
      try {
        const data = await verifySigningTokenPublic(signToken);
        if (!data) {
          setTokenError('El enlace ha expirado o no existe. Solicita uno nuevo al firmante principal.');
          setLoading(false);
          return;
        }
        setTokenData(data);

        // Audit log is fire-and-forget
        getPublicIp()
          .then((ip) =>
            insertAuditLog({
              documentId: data.documentId,
              action: 'guest_link_opened',
              ipAddress: ip,
              userAgent: navigator.userAgent,
            }),
          )
          .catch(() => {});
      } catch {
        setTokenError('No se pudo verificar el enlace. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [signToken]);

  // ─── Load PDF with pdfjs when tokenData is ready ──────────────────────────────
  useEffect(() => {
    const url = tokenData?.originalPdfUrl;
    if (!url) return;
    let cancelled = false;
    setPdfLoading(true);
    setPdfError('');

    const load = async (src: string) => {
      const doc: any = await pdfjsLib.getDocument({ url: src, withCredentials: false }).promise;
      return doc;
    };

    (async () => {
      try {
        const doc = await load(url);
        if (cancelled) return;
        setPdfDoc(doc);
        setPdfPageCount(doc.numPages);
      } catch {
        // getPublicUrl() only actually works if the bucket is flagged
        // "Public" in Supabase — if it isn't, this "public" URL 400s for
        // the guest even though nothing about the document itself is
        // private to them. Retry via a signed URL, which works off the
        // storage RLS policy instead of that bucket-level flag.
        try {
          const signedUrl = await getSignedUrlFallback(url);
          if (!signedUrl) throw new Error('no signed url');
          const doc = await load(signedUrl);
          if (cancelled) return;
          setPdfDoc(doc);
          setPdfPageCount(doc.numPages);
        } catch {
          if (cancelled) return;
          setPdfError('No se pudo cargar la vista previa del documento.');
          // Enable signing after a short delay even when PDF fails to load
          setTimeout(() => setHasScrolledToEnd(true), 2000);
        }
      } finally {
        if (!cancelled) setPdfLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [tokenData?.originalPdfUrl]);

  // ─── Measure PDF container width (for pdfjs scale calculation) ────────────────
  useEffect(() => {
    const el = pdfContainerRef.current;
    if (!el) return;
    setContainerWidth(el.offsetWidth);
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ─── Scroll-to-end detection via IntersectionObserver ────────────────────────
  useEffect(() => {
    if (hasScrolledToEnd) return;
    const el = bottomMarkerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setHasScrolledToEnd(true); },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  // Re-run when pdfDoc loads so the DOM is settled
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasScrolledToEnd, pdfDoc]);

  // ─── Submit guest signature — dataUrl from SignatureModal, placement from
  // GuestSignaturePlacer (where the guest actually tapped/dragged it to). ──
  const handleSubmitSignature = async (dataUrl: string, placement?: PlacedSignature) => {
    if (!tokenData) return;
    setIsSigning(true);
    try {
      // 1. Upload signature image
      const blob = await dataUrlToBlob(dataUrl);
      let sigUrl = dataUrl;
      try {
        sigUrl = await uploadSignatureImage(tokenData.documentId, 'guest', blob);
      } catch { /* non-fatal — data URL fallback */ }

      // 2. Collect audit data
      const ip = await getPublicIp();

      const bogotaTimestamp = new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      }).format(new Date()) + ' COT';

      let sha256Hash = '';
      try {
        const encoded = new TextEncoder().encode(dataUrl);
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
        sha256Hash = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      } catch { /* non-fatal */ }

      const browserMeta = {
        userAgent:        navigator.userAgent,
        platform:         navigator.platform ?? 'unknown',
        language:         navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        colorDepth:       window.screen.colorDepth,
        timezone:         Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp_bogota: bogotaTimestamp,
        sha256_signature: sha256Hash,
      };

      // 3. Geolocation — permission-gated, non-blocking
      let geoMeta: { lat?: number; lng?: number; accuracy?: number } = {};
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000, maximumAge: 60000, enableHighAccuracy: false,
          });
        });
        geoMeta = {
          lat:      Math.round(pos.coords.latitude  * 10000) / 10000,
          lng:      Math.round(pos.coords.longitude * 10000) / 10000,
          accuracy: Math.round(pos.coords.accuracy),
        };
      } catch { /* denied or unavailable */ }

      const auditUserAgent = JSON.stringify({ ...browserMeta, geolocation: geoMeta });

      // 4. Claim the signer slot atomically — if another concurrent submission
      // (the same signing link opened twice) already completed it, stop here
      // instead of racing it to insert a duplicate signature / compiled PDF.
      const claimed = await tryCompleteSignerOnce(tokenData.signerId, 'pending');
      if (!claimed) {
        toast.error('Este documento ya fue firmado en otra sesión. Actualiza la página.');
        return;
      }

      // 5. Persist signature row and document evidence package
      await insertSignature({
        documentId:   tokenData.documentId,
        signerName:   guestName || 'Invitado',
        signerEmail:  guestEmail || '',
        ip,
        userAgent:    auditUserAgent,
        signatureUrl: sigUrl,
      });

      const currentPdfUrl = tokenData.signedPdfUrl || tokenData.originalPdfUrl;
      if (currentPdfUrl) {
        try {
          let pdfResponse = await fetch(currentPdfUrl);
          if (!pdfResponse.ok) {
            // Same "public" bucket-flag issue the read-only preview already
            // works around — see getSignedUrlFallback in signatureService.ts.
            const signedUrl = await getSignedUrlFallback(currentPdfUrl);
            if (signedUrl) pdfResponse = await fetch(signedUrl);
          }
          const pdfBlob = await pdfResponse.blob();
          const pdfBytes = new Uint8Array(await pdfBlob.arrayBuffer());
          const finalBytes = await compilePdfWithSignatures({
            pdfBytes,
            signatures: [{
              imageUrl: dataUrl,
              signerName: guestName || 'Invitado',
              signerRole: getSignerRoleLabel(inferDocumentTypeHint(tokenData.documentName), 1, 'es'),
              // Falls back to the old fixed spot only if this somehow got
              // called without a placement — GuestSignaturePlacer always
              // provides one in the real flow below.
              page: placement?.page ?? 1,
              xFraction: placement?.xFraction ?? 0.74,
              yFraction: placement?.yFraction ?? 0.84,
              widthFraction: placement?.widthFraction ?? 0.42,
              heightFraction: placement?.heightFraction ?? 0.24,
            }],
            documentId: tokenData.documentId,
            fileHash: sha256Hash,
            evidence: {
              signerName: guestName || 'Invitado',
              signerEmail: guestEmail || '',
              selfieDataUrl: selfieDataUrl || undefined,
              idDataUrl: idFrontDataUrl || undefined,
              idFrontDataUrl: idFrontDataUrl || undefined,
              idBackDataUrl: idBackDataUrl || undefined,
              ip,
              userAgent: auditUserAgent,
              signedAt: new Date().toISOString(),
            },
          });
          const finalBlob = new Blob([finalBytes], { type: 'application/pdf' });
          const storagePath = `documents/${tokenData.documentId}/signed.pdf`;
          const { error: uploadError } = await publicSupabase.storage
            .from('documents-bucket')
            .upload(storagePath, finalBlob, { contentType: 'application/pdf', upsert: true });
          if (uploadError) throw uploadError;
          const { data: urlData } = publicSupabase.storage.from('documents-bucket').getPublicUrl(storagePath);
          const signedPdfUrl = urlData?.publicUrl || '';
          if (signedPdfUrl) {
            const { error: dbError } = await publicSupabase
              .from('documents')
              .update({ signed_pdf_url: signedPdfUrl, status: 'completed' })
              .eq('id', tokenData.documentId);
            if (dbError) throw dbError;
          }
        } catch (compileErr) {
          if (isPremiumLimitError(compileErr)) {
            setPremiumModalOpen(true);
            throw new Error('PREMIUM_LIMIT');
          }
          console.error('No se pudo generar el PDF firmado final:', compileErr);
          // La firma cruda ya quedó persistida (insertSignature arriba), pero el
          // documento certificado NO se generó: no se debe reportar éxito al firmante.
          throw new Error('No se pudo generar el documento firmado. Tu firma quedó guardada; por favor vuelve a intentarlo o contacta soporte.');
        }
      }

      insertAuditLog({
        documentId:  tokenData.documentId,
        action:      'guest_signed',
        ipAddress:   ip,
        userAgent:   auditUserAgent,
        hashSha256:  sha256Hash,
      }).catch(() => {});

      if (signToken) void markDocumentInvitationSigned(signToken);

      // Requirement: if the guest signing this link also happens to be
      // logged in (in the SAME browser — publicSupabase never carries their
      // session, so we check the real `supabase` client explicitly), save
      // this document to their profile automatically. `documents` RLS grants
      // this because associated_read_documents checks profile_documents.
      try {
        const { data: { session: guestSession } } = await supabase.auth.getSession();
        const profileId = guestSession?.user?.id;
        if (profileId) {
          await supabase.from('profile_documents').insert({
            profile_id:  profileId,
            document_id: tokenData.documentId,
            role:        'signer',
          });
        }
      } catch { /* non-fatal — signing itself already succeeded */ }

      console.log('Firma registrada. Auditoria:', {
        ip,
        timestamp: bogotaTimestamp,
        sha256: sha256Hash.slice(0, 16) + '...',
        geo: Object.keys(geoMeta).length > 0 ? geoMeta : 'no disponible',
      });

      toast.success('Firma registrada y documento actualizado correctamente.');
      setDone(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isPremiumLimit = isPremiumLimitError(err) || /PREMIUM_LIMIT/i.test(message);
      if (isPremiumLimit) {
        setPremiumModalOpen(true);
      } else {
        toast.error(`Error: ${message}`);
      }
    } finally {
      setIsSigning(false);
    }
  };

  // ─── Loading screen ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-950 to-slate-900">
        <Loader className="size-10 animate-spin text-indigo-400" />
        <p className="text-sm font-semibold text-white/60">Verificando enlace de firma…</p>
      </div>
    );
  }

  // ─── Error screen ──────────────────────────────────────────────────────────────
  if (tokenError || !tokenData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-slate-950 to-slate-900 px-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-red-500/20 ring-1 ring-red-400/20">
          <AlertCircle className="size-8 text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Enlace no válido</h2>
          <p className="mt-2 max-w-sm text-sm text-white/50">{tokenError}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  // ─── Success screen ────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 px-4 py-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 size-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
        </div>

        <div className="relative w-full max-w-md">
          <div className="absolute inset-x-0 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="flex size-20 items-center justify-center rounded-3xl bg-emerald-500/15 ring-2 ring-emerald-400/25 shadow-[0_0_40px_rgba(52,211,153,0.2)]">
              <CheckCircle2 className="size-10 text-emerald-400" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-black text-white">¡Documento firmado!</h1>
              <p className="mt-1.5 text-sm text-white/50">
                {guestEmail
                  ? `Tu firma ha sido registrada. Copia enviada a ${guestEmail}.`
                  : 'Tu firma ha sido registrada con plena validez legal.'}
              </p>
            </div>
          </div>

          <div className="mb-8 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white/40">
            <ShieldCheck className="size-3.5 text-emerald-400" />
            <span>ESIGN Act · UETA · SHA-256 · {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="border-b border-white/8 px-6 pt-6 pb-5">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="size-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  Crea tus propios documentos — gratis
                </span>
              </div>
              <p className="text-base font-semibold leading-snug text-white">
                ¿Necesitas crear o firmar tus propios contratos?
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-white/50">
                Genera tu primer documento legal gratis con Codec Document. Sin tarjeta de crédito.
              </p>
            </div>

            <div className="space-y-2.5 px-6 py-4">
              {[
                { icon: FileText, text: 'Editor inteligente — NDAs, contratos, arrendamientos' },
                { icon: PenLine, text: '1 firma electrónica gratis por día (ESIGN / UETA)' },
                { icon: ShieldCheck, text: 'Auditoría SHA-256 con validez legal' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15">
                    <Icon className="size-3.5 text-indigo-400" />
                  </div>
                  <span className="text-sm text-white/60">{text}</span>
                </div>
              ))}
            </div>

            <div className="px-6 pb-6">
              <a
                href="/"
                className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:from-indigo-500 hover:to-blue-500"
              >
                Crear cuenta gratis
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <p className="mt-3 text-center text-[11px] text-white/25">
                Sin tarjeta de crédito · Plan gratuito disponible siempre
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-5 w-full text-center text-xs text-white/25 transition hover:text-white/40"
          >
            Quizás después — volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // ─── Main signing UI ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 pb-28 text-slate-900">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 shadow-sm backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-indigo-200">
              <ShieldCheck className="size-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900">Codec Document</span>
              <p className="text-[11px] text-slate-500">Firma digital certificada</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
            <span className="text-xs font-semibold text-amber-700">Firma pendiente</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl space-y-4 px-4 py-5">

        {/* ── Document title card ───────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-base font-bold text-slate-900">{tokenData.documentName}</h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Lee el documento completo y proporciona tu información antes de firmar.
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
              Solo lectura
            </span>
          </div>
        </div>

        {/* ── Guest info form ───────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-slate-800">Tu información de firmante</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Nombre completo</label>
              <input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Tu nombre legal"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Correo electrónico</label>
              <input
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="tu@email.com"
                type="email"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        </div>

        {/* ── PDF viewer (pdfjs canvas renderer, no iframe) ─────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <span className="text-xs font-semibold text-slate-700">📄 {tokenData.documentName}</span>
            {tokenData.originalPdfUrl && (
              <a
                href={tokenData.originalPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 transition hover:underline"
              >
                Abrir <ExternalLink className="size-3" />
              </a>
            )}
          </div>

          {/* Container — measured for pdfjs scale */}
          <div ref={pdfContainerRef} className="min-h-[120px]">
            {pdfLoading && (
              <div className="flex h-48 items-center justify-center gap-2 text-slate-400">
                <Loader className="size-5 animate-spin" />
                <span className="text-sm">Cargando documento…</span>
              </div>
            )}

            {!pdfLoading && pdfError && (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <AlertCircle className="size-7 text-amber-400" />
                <p className="text-sm text-slate-500">{pdfError}</p>
                {tokenData.originalPdfUrl && (
                  <a
                    href={tokenData.originalPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    <ExternalLink className="size-4" />
                    Ver documento en nueva pestaña
                  </a>
                )}
              </div>
            )}

            {!pdfLoading && !pdfError && pdfDoc && containerWidth > 0 && (
              <div className="divide-y divide-slate-100">
                {Array.from({ length: pdfPageCount }, (_, i) => (
                  <PdfPage
                    key={i + 1}
                    pdfDoc={pdfDoc}
                    pageNumber={i + 1}
                    width={containerWidth}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Legal audit notice ────────────────────────────────────────────── */}
        <div className="flex items-start gap-2.5 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-xs text-indigo-800">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-indigo-500" />
          <p>
            Al firmar se registrarán tu IP, navegador y timestamp como metadatos de auditoría
            legal inmutables (ESIGN Act · UETA · SHA-256).
          </p>
        </div>

        {/* Bottom sentinel — IntersectionObserver fires when user reaches this */}
        <div ref={bottomMarkerRef} className="h-2" />
      </main>

      {/* ── Fixed CTA bar ─────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 z-40 w-full border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm">
        <button
          type="button"
          disabled={!hasScrolledToEnd}
          onClick={() => {
            const needsGate = (requirements.requireIdPhoto && (!idFrontReady || !idBackReady)) || (requirements.requireSelfie && !selfieReady);
            if (needsGate) { setShowIdGate(true); } else { setShowSignPad(true); }
          }}
          className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-200/70 transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {hasScrolledToEnd ? '✍️ Continuar a Firmar' : '⬇️ Desliza para leer el documento'}
        </button>
      </div>

      {/* ── Identity validation gate overlay ──────────────────────────────────────── */}
      {showIdGate && (
        <IdentityGate
          documentId={tokenData.documentId}
          requirements={requirements}
          idFrontDataUrl={idFrontDataUrl}
          idBackDataUrl={idBackDataUrl}
          selfieDataUrl={selfieDataUrl}
          idFrontReady={idFrontReady}
          idBackReady={idBackReady}
          selfieReady={selfieReady}
          uploadingIdFront={uploadingIdFront}
          uploadingIdBack={uploadingIdBack}
          uploadingSelfie={uploadingSelfie}
          onIdFrontSelect={async (file) => {
            setUploadingIdFront(true);
            try {
              const dataUrl = await fileToDataUrl(file);
              const normalized = await normalizeIdEvidence(dataUrl);
              setIdFrontDataUrl(normalized);
              // Best-effort upload to storage
              try {
                const { error } = await publicSupabase.storage
                  .from('documents-bucket')
                  .upload(`validations/${tokenData.documentId}/id_front.jpg`, file, { upsert: true, contentType: file.type });
                if (error) throw error;
              } catch { /* non-fatal — data URL serves as proof */ }
              setIdFrontReady(true);
              toast.success('Frente del documento registrado.');
            } catch { toast.error('No se pudo procesar la imagen.'); }
            finally { setUploadingIdFront(false); }
          }}
          onIdBackSelect={async (file) => {
            setUploadingIdBack(true);
            try {
              const dataUrl = await fileToDataUrl(file);
              const normalized = await normalizeIdEvidence(dataUrl);
              setIdBackDataUrl(normalized);
              try {
                const { error } = await publicSupabase.storage
                  .from('documents-bucket')
                  .upload(`validations/${tokenData.documentId}/id_back.jpg`, file, { upsert: true, contentType: file.type });
                if (error) throw error;
              } catch { /* non-fatal */ }
              setIdBackReady(true);
              toast.success('Reverso del documento registrado.');
            } catch { toast.error('No se pudo procesar la imagen.'); }
            finally { setUploadingIdBack(false); }
          }}
          onSelfieSelect={async (file) => {
            setUploadingSelfie(true);
            try {
              const dataUrl = await fileToDataUrl(file);
              const normalized = await normalizeSelfieEvidence(dataUrl);
              setSelfieDataUrl(normalized);
              try {
                const { error } = await publicSupabase.storage
                  .from('documents-bucket')
                  .upload(`validations/${tokenData.documentId}/selfie.jpg`, file, { upsert: true, contentType: file.type });
                if (error) throw error;
              } catch { /* non-fatal */ }
              setSelfieReady(true);
              toast.success('Selfie biométrica registrada.');
            } catch { toast.error('No se pudo procesar la imagen.'); }
            finally { setUploadingSelfie(false); }
          }}
          onContinue={() => { setShowIdGate(false); setShowSignPad(true); }}
          onBack={() => setShowIdGate(false)}
        />
      )}

      {/* ── Signature modal — centered popup with backdrop blur, Draw/Texto/Imagen/QR tabs */}
      {/* Step 1: capture WHAT the signature looks like. Confirming opens the
          placer below instead of submitting immediately — the guest still
          has to choose WHERE it goes. */}
      <SignatureModal
        open={showSignPad}
        onOpenChange={setShowSignPad}
        onConfirm={(dataUrl) => {
          setShowSignPad(false);
          // If the PDF preview never loaded (network hiccup, unusual PDF),
          // there's no page to tap on — fall back to submitting directly
          // with the default spot rather than opening a placer with
          // nothing to show, which would strand the guest.
          if (!pdfDoc) { void handleSubmitSignature(dataUrl); return; }
          setGuestSigDataUrl(dataUrl);
          setShowPlacer(true);
        }}
        signerName={guestName}
        title="Firma el documento"
        subtitle={tokenData.documentName}
      />

      {/* Step 2: Adobe-style tap-to-place — choose WHERE on the document,
          drag to reposition, resize with the corner handle, browse every
          page. Whatever's on screen when confirmed is what gets baked in. */}
      {showPlacer && pdfDoc && (
        <div className="fixed inset-0 z-[9997] flex flex-col bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <button
              type="button"
              onClick={() => { setShowPlacer(false); setShowSignPad(true); }}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Atrás
            </button>
            <p className="text-sm font-bold text-slate-900">Coloca tu firma</p>
            <span className="w-16" />
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="mx-auto w-full max-w-2xl">
              <GuestSignaturePlacer
                pdfDoc={pdfDoc}
                pageCount={pdfPageCount}
                signatureDataUrl={guestSigDataUrl}
                signerName={guestName || 'Invitado'}
                isLoading={isSigning}
                onConfirm={(placement) => {
                  setShowPlacer(false);
                  void handleSubmitSignature(guestSigDataUrl, placement);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Signing progress overlay (shown after modal closes while upload runs) */}
      {isSigning && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-8 py-6 shadow-2xl">
            <Loader className="size-7 animate-spin text-indigo-500" />
            <p className="text-sm font-semibold text-slate-700">Registrando firma…</p>
          </div>
        </div>
      )}

      {tokenData && (
        <PremiumDownloadModal
          open={premiumModalOpen}
          onOpenChange={setPremiumModalOpen}
          documentName={tokenData.documentName}
          documentId={tokenData.documentId}
          onSuccess={() => {
            setPremiumModalOpen(false);
            toast.success('Acceso Premium activado. Puedes volver a intentarlo.');
          }}
          language="es"
          price={7.99}
          reason="72h_limit"
        />
      )}
    </div>
  );
}
