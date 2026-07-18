/**
 * Public signing page — /sign/:transactionId
 *
 * Storage bucket: "tx-evidence" (optional but recommended)
 * If the bucket does not exist or is not public, image uploads fall back
 * to storing the base64 data URL directly in the sign_transactions columns.
 * The signature UPDATE always runs regardless of Storage availability.
 *
 * To enable Storage (Supabase Dashboard > Storage):
 *   1. Create bucket "tx-evidence"  →  Public bucket: ON
 *   2. Policies: SELECT + INSERT with USING (true)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router';
import {
  ShieldCheck, Camera, CreditCard, PenLine, CheckCircle2,
  Loader, AlertCircle, FileText, ChevronRight, X, Upload,
} from 'lucide-react';
import { SignatureModal } from '../components/signatures/SignatureModal';
import { useAuth } from '../contexts/auth-context';
import { publicSupabase } from '../../lib/supabase';
import { isActiveTxStatus, isTerminalTxStatus, subscribeToTransaction, type SignTransaction, type SecurityConfig } from '../services/sign-transaction-service';
import { normalizeIdEvidence, normalizeSelfieEvidence } from '../utils/evidence-image';
import { markVisitorActivity } from '../services/analytics-service';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 'loading' | 'esign' | 'selfie' | 'id' | 'sign' | 'done' | 'error' | 'already_signed';

// ─── Step builder ─────────────────────────────────────────────────────────────
function buildSteps(cfg: SecurityConfig): Step[] {
  const steps: Step[] = ['loading'];
  if (cfg.requireEsignConsent) steps.push('esign');
  if (cfg.requireSelfie)       steps.push('selfie');
  if (cfg.requireIdPhoto)      steps.push('id');
  steps.push('sign');
  // No manual "drag to place" step — the signature position for template-
  // based documents is dynamic by default (preview-page.tsx already falls
  // back to a sensible position, staggered by signer index, whenever no
  // explicit placement was recorded; document-generator-page.tsx's own
  // co-signer setup already relies on exactly that fallback and never had
  // a manual placement step at all). Dragging a signature by hand only
  // matters for the OTHER flow — the creator's own uploaded PDF in
  // electronic-signature-page.tsx — where there's no template layout to
  // already know where the signature line is.
  steps.push('done');
  return steps;
}

// ─── Supabase helpers ─────────────────────────────────────────────────────────
async function fetchTx(id: string): Promise<SignTransaction | null> {
  // Goes through a SECURITY DEFINER RPC (not a raw table SELECT) so that
  // RLS can deny public listing of `sign_transactions` — which stores
  // selfies and ID photos — while this by-id lookup still works for
  // guests who hold a valid signing link. See
  // supabase_lockdown_public_read_migration.sql.
  const { data, error } = await publicSupabase
    .rpc('get_sign_transaction_public', { p_id: id })
    .maybeSingle();

  if (error || !data) {
    console.error('Error fetching sign_transaction:', error);
    return null;
  }
  return data as SignTransaction;
}

/**
 * Tries to upload a base64 data URL to the "tx-evidence" Storage bucket.
 * NEVER throws — on any failure it logs a warning and returns the original
 * base64 data URL so the caller can store it inline in the DB column instead.
 * This guarantees the signature UPDATE always runs even without Storage.
 */
async function uploadEvidenceImage(
  txId: string,
  type: 'selfie' | 'id_front' | 'id_back',
  dataUrl: string,
): Promise<string> {
  try {
    const res  = await fetch(dataUrl);
    const blob = await res.blob();
    const ext  = blob.type.includes('png') ? 'png' : 'jpg';
    const filePath = `${txId}/${type}-${Date.now()}.${ext}`;

    const { error: uploadError } = await publicSupabase.storage
      .from('tx-evidence')
      .upload(filePath, blob, { contentType: blob.type, upsert: false });

    if (uploadError) {
      console.warn(
        `[tx-evidence] Storage upload failed for "${type}": ${uploadError.message}.`,
        'Bucket may not exist or not be public — falling back to inline base64 storage.',
      );
      return dataUrl;
    }

    const { data: urlData } = publicSupabase.storage
      .from('tx-evidence')
      .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) {
      console.warn(`[tx-evidence] Could not get public URL for ${type} — falling back to inline base64.`);
      return dataUrl;
    }

    console.log(`[tx-evidence] ${type} uploaded OK:`, publicUrl);
    return publicUrl;

  } catch (err) {
    console.warn(`[tx-evidence] Exception uploading ${type}:`, err, '— falling back to inline base64.');
    return dataUrl;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SignTransactionPage() {
  const { transactionId } = useParams<{ transactionId: string }>();

  const [tx, setTx]               = useState<SignTransaction | null>(null);
  const [steps, setSteps]         = useState<Step[]>(['loading']);
  const [stepIdx, setStepIdx]     = useState(0);
  const currentStep               = steps[stepIdx] ?? 'loading';

  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const [selfieDataUrl,    setSelfieDataUrl]     = useState('');
  const [idFrontDataUrl,   setIdFrontDataUrl]    = useState('');
  const [idBackDataUrl,    setIdBackDataUrl]     = useState('');
  const [idCaptureSide,    setIdCaptureSide]     = useState<'front' | 'back'>('front');
  const [esignAccepted,    setEsignAccepted]     = useState(false);

  const [sigModalOpen,  setSigModalOpen]  = useState(false);
  const [cameraActive,  setCameraActive]  = useState(false);
  const [cameraError,   setCameraError]   = useState('');
  const [submitting,    setSubmitting]    = useState(false);
  const [submitStatus,  setSubmitStatus]  = useState('');

  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Synchronous guard against double-submit (mobile touch+click double-fire,
  // or a second tap landing before React re-renders the disabled button) —
  // `disabled={submitting}` alone can't block a same-tick second invocation.
  const submittingRef = useRef(false);
  const { user, isAdmin } = useAuth();

  // ── Load transaction on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (!transactionId) return;
    fetchTx(transactionId).then(data => {
      if (!data) {
        setSteps(['loading', 'error']);
        setStepIdx(1);
        return;
      }
      if (data.status === 'completed') {
        setTx(data);
        setSteps(['loading', 'done']);
        setStepIdx(1);
        return;
      }
      if (isTerminalTxStatus(data.status)) {
        setSteps(['loading', 'already_signed']);
        setStepIdx(1);
        return;
      }
      if (!isActiveTxStatus(data.status)) {
        setSteps(['loading', 'error']);
        setStepIdx(1);
        return;
      }
      setTx(data);
      setSteps(buildSteps(data.security_config));
      setStepIdx(1);
    });
  }, [transactionId]);

  // ── Realtime transaction updates ──────────────────────────────────────────
  useEffect(() => {
    if (!transactionId) return;
    const unsubscribe = subscribeToTransaction(transactionId, (updated) => {
      setTx(updated);
      if (updated.status === 'completed') {
        setSteps(['loading', 'done']);
        setStepIdx(1);
        return;
      }
      if (isTerminalTxStatus(updated.status)) {
        setSteps(['loading', 'already_signed']);
        setStepIdx(1);
      }
    });
    return unsubscribe;
  }, [transactionId]);

  // ── Camera cleanup on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const advance = useCallback(() => setStepIdx(i => i + 1), []);

  // ── Assign stream to <video> AFTER the element mounts in the DOM ───────────
  // startCamera sets cameraActive=true which triggers a re-render that mounts
  // the <video> element; THEN this effect fires and srcObject is safely assigned.
  useEffect(() => {
    if (!cameraActive || !streamRef.current) return;
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = streamRef.current;
    void video.play().catch(e => console.warn('Video play():', e));
  }, [cameraActive, currentStep]);

  // ── Camera ─────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    setCameraError('');
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 },
        },
        audio: false,
      });
      streamRef.current = stream;
      try { console.log('USER', user); console.log('IS_ADMIN', isAdmin); console.log('PERMISSIONS', (user as any)?.permissions || null); } catch {}
      setCameraActive(true); // triggers re-render → video mounts → useEffect assigns srcObject
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('No se pudo acceder a la camara. Permite el acceso en tu navegador y recarga la pagina.');
    }
  }, []);

  const capturePhoto = useCallback(async (target: 'selfie' | 'id_front' | 'id_back') => {
    try { console.log('USER', user); console.log('IS_ADMIN', isAdmin); console.log('PERMISSIONS', (user as any)?.permissions || null); } catch {}
    if (!videoRef.current) return;
    const v = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width  = v.videoWidth  || 1920;
    canvas.height = v.videoHeight || 1080;
    const ctx = canvas.getContext('2d')!;
    if (target === 'selfie') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);

    const rawUrl = canvas.toDataURL('image/jpeg', 0.9);
    try {
      if (target === 'selfie') {
        setSelfieDataUrl(await normalizeSelfieEvidence(rawUrl));
      } else if (target === 'id_front') {
        setIdFrontDataUrl(await normalizeIdEvidence(rawUrl));
      } else {
        setIdBackDataUrl(await normalizeIdEvidence(rawUrl));
      }
    } catch {
      if (target === 'selfie') setSelfieDataUrl(rawUrl);
      else if (target === 'id_front') setIdFrontDataUrl(rawUrl);
      else setIdBackDataUrl(rawUrl);
    }

    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  // ── Final submit ───────────────────────────────────────────────────────────
  const handleFinalSubmit = async () => {
    if (!tx) return;
    if (submittingRef.current) return; // blocks a same-tick double-tap/double-fire
    submittingRef.current = true;

    // Guard: signature must exist and be a real data URL
    if (!signatureDataUrl || !signatureDataUrl.startsWith('data:')) {
      toast.error('La firma no es valida. Por favor dibuja tu firma antes de continuar.');
      submittingRef.current = false;
      return;
    }

    setSubmitting(true);
    setSubmitStatus('Preparando envio...');

    // ── Step 1: Collect IP (non-blocking, never fails the flow) ──────────────
    let recipientIp = '';
    if (tx.security_config.advancedAuditTrail) {
      try {
        setSubmitStatus('Obteniendo datos de auditoria...');
        const r = await fetch('https://api.ipify.org?format=json');
        const j = await r.json() as { ip?: string };
        recipientIp = j.ip ?? '';
      } catch {
        console.warn('IP lookup failed — audit trail will be partial.');
      }
    }

    // ── Step 2: Build exact UPDATE payload and complete the transaction first ─
    // Preserve captured identity evidence immediately, then let uploads resolve in background.
    const initialPayload: Record<string, unknown> = {
      status:              'completed',
      recipient_signature: signatureDataUrl,   // always present (validated above)
      // null, not a manually-dragged position — preview-page.tsx already
      // falls back to a sensible default (staggered by signer index) when
      // this is null, same as the sender's own signature already does.
      recipient_signature_placement: null,
      signed_at:           new Date().toISOString(),
    };
    if (selfieDataUrl) {
      initialPayload.recipient_selfie = selfieDataUrl;
    }
    if (idFrontDataUrl || idBackDataUrl) {
      initialPayload.recipient_id_photo = idBackDataUrl
        ? JSON.stringify({ front: idFrontDataUrl ?? '', back: idBackDataUrl })
        : (idFrontDataUrl ?? '');
    }
    if (esignAccepted)     initialPayload.esign_consent_accepted = true;
    if (recipientIp)       initialPayload.recipient_ip           = recipientIp;

    // ── Step 3: Complete the transaction via RPC — not waiting on storage.
    // Goes through a SECURITY DEFINER RPC (not a raw UPDATE...select()) so
    // the guard doesn't depend on the caller's SELECT permission: an
    // anonymous recipient has no RLS SELECT access on sign_transactions
    // (it stores selfies/ID photos), so `.update(...).select('id')` always
    // returned zero rows for them — even when the UPDATE itself succeeded —
    // which made this guard falsely report "already signed" on every
    // legitimate first-time completion. The RPC checks the expected status
    // and applies the update atomically server-side and returns a real
    // boolean, regardless of the caller's read permissions.
    setSubmitStatus('Guardando firma...');
    try {
      const { data: completed, error } = await publicSupabase.rpc('complete_sign_transaction', {
        p_id: tx.id,
        p_expected_status: tx.status,
        p_payload: initialPayload,
      });

      if (error) {
        console.error('Error al guardar firma en sign_transactions:', error);
        console.error('  code:', error.code, '| message:', error.message, '| details:', error.details);
        toast.error(
          `No se pudo guardar la firma: ${error.message}`,
          { description: `Code: ${error.code}`, duration: 8000 },
        );
        return;
      }

      if (!completed) {
        toast.error(
          'Este documento ya fue firmado o modificado en otra sesión. Actualiza la página.',
          { duration: 8000 },
        );
        setSteps(['loading', 'already_signed']);
        setStepIdx(1);
        return;
      }

      console.log('Firma guardada exitosamente. Transaction:', tx.id, '| payload keys:', Object.keys(initialPayload));
      markVisitorActivity('signature', 'template-signature');
      advance();

      void (async () => {
        try {
          const selfieValue = selfieDataUrl
            ? await uploadEvidenceImage(tx.id, 'selfie', selfieDataUrl)
            : undefined;
          const idFrontValue = idFrontDataUrl
            ? await uploadEvidenceImage(tx.id, 'id_front', idFrontDataUrl)
            : undefined;
          const idBackValue = idBackDataUrl
            ? await uploadEvidenceImage(tx.id, 'id_back', idBackDataUrl)
            : undefined;

          const patchPayload: Record<string, unknown> = {};
          if (selfieValue && selfieValue !== selfieDataUrl) {
            patchPayload.recipient_selfie = selfieValue;
          }
          if (idFrontValue || idBackValue) {
            patchPayload.recipient_id_photo = idBackValue
              ? JSON.stringify({ front: idFrontValue ?? '', back: idBackValue })
              : (idFrontValue ?? '');
          }

          if (Object.keys(patchPayload).length > 0) {
            await publicSupabase.rpc('patch_sign_transaction_evidence', {
              p_id: tx.id,
              p_payload: patchPayload,
            });
          }
        } catch (backgroundErr) {
          console.warn('Background evidence upload failed:', backgroundErr);
        }
      })();

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Error al guardar firma (excepcion de red):', msg);
      toast.error(`Error de red al guardar la firma: ${msg}`, { duration: 8000 });
    } finally {
      setSubmitting(false);
      setSubmitStatus('');
      submittingRef.current = false;
    }
  };

  // ── Early screens ──────────────────────────────────────────────────────────
  if (currentStep === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50">
        <Loader className="size-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Cargando documento...</p>
      </div>
    );
  }

  if (currentStep === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
        <div className="rounded-full bg-red-100 p-4">
          <AlertCircle className="size-10 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-800">Enlace no valido o expirado</h1>
        <p className="text-slate-500 max-w-sm text-sm">
          Este enlace de firma no existe o ya fue procesado. Contacta a quien te lo envio para que genere uno nuevo.
        </p>
      </div>
    );
  }

  if (currentStep === 'already_signed') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
        <div className="rounded-full bg-emerald-100 p-4">
          <CheckCircle2 className="size-10 text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-800">Documento ya firmado</h1>
        <p className="text-slate-500 max-w-sm text-sm">
          Este documento ya fue firmado y procesado correctamente. No se admiten cambios adicionales.
        </p>
      </div>
    );
  }

  if (currentStep === 'done') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-5 p-6 text-center"
        style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdf4 100%)' }}
      >
        <div className="rounded-full bg-emerald-100 p-5">
          <CheckCircle2 className="size-14 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-black text-slate-800">Documento firmado exitosamente</h1>
        <p className="text-slate-500 max-w-sm text-sm leading-relaxed">
          Tu firma ha sido registrada con validez legal y almacenada de forma segura.
          El creador del documento recibira una notificacion automatica.
        </p>
        {tx?.security_config?.advancedAuditTrail && (
          <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4 text-left text-xs text-slate-500 max-w-sm w-full shadow-sm space-y-1.5">
            <p className="font-semibold text-slate-700 text-sm mb-2">Registro de auditoria</p>
            <p>Documento: <span className="text-slate-800 font-medium">{tx.document_type?.replace(/-/g, ' ')}</span></p>
            <p>ID de transaccion: <span className="text-slate-800 font-mono font-medium">{tx.id.slice(0, 8)}...</span></p>
            <p>Firmado el: <span className="text-slate-800 font-medium">{new Date().toLocaleString('es-MX')}</span></p>
          </div>
        )}
      </div>
    );
  }

  // ── Main signing flow ──────────────────────────────────────────────────────
  const docName = tx?.document_type
    ? tx.document_type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Documento';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <div className="rounded-lg bg-blue-600 p-1.5">
          <ShieldCheck className="size-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 leading-tight">Codec Document</p>
          <p className="text-xs text-slate-500 leading-tight truncate">Firma electronica con validez legal</p>
        </div>
        {tx?.security_config?.requireEsignConsent && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
            ESIGN
          </span>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-10">

        {/* Doc info card */}
        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm flex gap-3 items-center">
          <div className="rounded-xl bg-blue-50 p-2.5 shrink-0">
            <FileText className="size-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm leading-snug">
              <span>{docName}</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Se requiere tu firma para completar este documento
            </p>
          </div>
        </div>

        {/* ── ESIGN Step ── */}
        {currentStep === 'esign' && (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
              <ShieldCheck className="size-5 text-blue-600 shrink-0" />
              Consentimiento de Firma Electronica (ESIGN Act)
            </h2>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 leading-relaxed max-h-44 overflow-y-auto">
              Conforme a la Ley de Firmas Electronicas en el Comercio Global y Nacional (ESIGN Act,
              15 U.S.C. SS 7001) y la Ley Uniforme de Transacciones Electronicas (UETA), usted da su
              consentimiento expreso para usar firmas electronicas en este documento legal. Su firma
              electronica tiene exactamente la misma validez juridica que una firma manuscrita en papel.
              Tiene derecho a solicitar una copia impresa de este documento en cualquier momento.
              Puede revocar este consentimiento antes de firmar sin ningun costo.
            </div>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="mt-0.5 size-4 rounded border-slate-300 accent-blue-600 cursor-pointer"
                checked={esignAccepted}
                onChange={e => setEsignAccepted(e.target.checked)}
              />
              <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                Acepto el consentimiento de firma electronica y comprendo que mi firma tiene plena validez legal.
              </span>
            </label>
            <button
              disabled={!esignAccepted}
              onClick={advance}
              className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:brightness-110 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 38%,#1d4ed8 68%,#1e3a8a 100%)', boxShadow: '0 3px 0 #1e3a8a' }}
            >
              Continuar <ChevronRight className="size-4" />
            </button>
          </div>
        )}

        {/* ── Selfie Step ── */}
        {currentStep === 'selfie' && (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
              <Camera className="size-5 text-blue-600 shrink-0" />
              Selfie de Verificacion de Identidad
            </h2>
            <p className="text-sm text-slate-500">
              Toma una foto clara de tu rostro mirando directamente a la camara.
            </p>
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              <p className="font-semibold">Center your face inside the circle</p>
              <p>✓ Look directly at camera</p>
              <p>✓ Remove sunglasses</p>
              <p>✓ Good lighting</p>
            </div>

            {selfieDataUrl ? (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <img src={selfieDataUrl} alt="selfie" className="w-full object-contain bg-white max-h-60" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelfieDataUrl(''); startCamera('user'); }}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Repetir foto
                  </button>
                  <button
                    onClick={advance}
                    className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white hover:brightness-110 transition-all"
                    style={{ background: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 68%,#1e3a8a 100%)', boxShadow: '0 3px 0 #1e3a8a' }}
                  >
                    Usar esta foto
                  </button>
                </div>
              </div>
            ) : cameraActive ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-black">
                  <video
                    ref={videoRef} autoPlay playsInline muted
                    className="w-full object-cover"
                    style={{ transform: 'scaleX(-1)', maxHeight: 280 }}
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="size-36 rounded-full border-[3px] border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setCameraActive(false); }}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 flex items-center justify-center gap-1.5"
                  >
                    <X className="size-4" /> Cancelar
                  </button>
                  <button
                    onClick={() => capturePhoto('selfie')}
                    className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white flex items-center justify-center gap-1.5"
                    style={{ background: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 68%,#1e3a8a 100%)', boxShadow: '0 3px 0 #1e3a8a' }}
                  >
                    <Camera className="size-4" /> Capturar
                  </button>
                </div>
                {cameraError && <p className="text-xs text-red-500 text-center">{cameraError}</p>}
              </div>
            ) : (
              <button
                onClick={() => startCamera('user')}
                className="w-full rounded-xl py-3 text-sm font-bold text-white flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                style={{ background: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 68%,#1e3a8a 100%)', boxShadow: '0 3px 0 #1e3a8a' }}
              >
                <Camera className="size-4" /> Abrir Camara Frontal
              </button>
            )}
          </div>
        )}

        {/* ── ID Photo Step ── */}
        {currentStep === 'id' && (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
              <CreditCard className="size-5 text-blue-600 shrink-0" />
              Documento de Identidad (Frente y Reverso)
            </h2>
            <p className="text-sm text-slate-500">
              Captura ambas caras de tu documento oficial en alta definición para completar la verificación legal.
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <p className="font-semibold">Captura requerida: frente y reverso</p>
              <p>✓ Entire document is visible</p>
              <p>✓ No glare</p>
              <p>✓ Good lighting</p>
              <p>✓ All corners visible</p>
            </div>

            {(idFrontDataUrl || idBackDataUrl) && !cameraActive ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                    {idFrontDataUrl ? (
                      <img src={idFrontDataUrl} alt="id-front" className="w-full object-contain bg-white max-h-52" />
                    ) : (
                      <div className="flex h-32 items-center justify-center text-xs text-slate-400">Frente pendiente</div>
                    )}
                    <p className="border-t border-slate-100 px-3 py-2 text-center text-xs font-semibold text-slate-600">Frente</p>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                    {idBackDataUrl ? (
                      <img src={idBackDataUrl} alt="id-back" className="w-full object-contain bg-white max-h-52" />
                    ) : (
                      <div className="flex h-32 items-center justify-center text-xs text-slate-400">Reverso pendiente</div>
                    )}
                    <p className="border-t border-slate-100 px-3 py-2 text-center text-xs font-semibold text-slate-600">Reverso</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setIdCaptureSide('front'); void startCamera('environment'); }}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {idFrontDataUrl ? 'Repetir frente' : 'Capturar frente'}
                  </button>
                  <button
                    onClick={() => { setIdCaptureSide('back'); void startCamera('environment'); }}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {idBackDataUrl ? 'Repetir reverso' : 'Capturar reverso'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={advance}
                    disabled={!idFrontDataUrl || !idBackDataUrl}
                    className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white hover:brightness-110 transition-all"
                    style={{ background: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 68%,#1e3a8a 100%)', boxShadow: '0 3px 0 #1e3a8a' }}
                  >
                    Continuar
                  </button>
                </div>
              </div>
            ) : cameraActive ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-black">
                  <video
                    ref={videoRef} autoPlay playsInline muted
                    className="w-full object-cover"
                    style={{ maxHeight: 280 }}
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="rounded-xl border-[3px] border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" style={{ width: '82%', height: '72%' }} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); setCameraActive(false); }}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 flex items-center justify-center gap-1.5"
                  >
                    <X className="size-4" /> Cancelar
                  </button>
                  <button
                    onClick={() => capturePhoto(idCaptureSide === 'front' ? 'id_front' : 'id_back')}
                    className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white flex items-center justify-center gap-1.5"
                    style={{ background: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 68%,#1e3a8a 100%)', boxShadow: '0 3px 0 #1e3a8a' }}
                  >
                    <Camera className="size-4" /> {idCaptureSide === 'front' ? 'Capturar frente' : 'Capturar reverso'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setIdCaptureSide('front'); void startCamera('environment'); }}
                className="w-full rounded-xl py-3 text-sm font-bold text-white flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                style={{ background: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 68%,#1e3a8a 100%)', boxShadow: '0 3px 0 #1e3a8a' }}
              >
                <CreditCard className="size-4" /> Fotografiar Frente del Documento
              </button>
            )}
          </div>
        )}

        {/* ── Signature Step ── */}
        {currentStep === 'sign' && (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
              <PenLine className="size-5 text-blue-600 shrink-0" />
              Firma el Documento
            </h2>
            <p className="text-sm text-slate-500">
              Dibuja tu firma o escribe tu nombre para crear tu firma electronica con validez legal.
            </p>

            {signatureDataUrl ? (
              <div className="space-y-4">
                {/* Signature preview */}
                <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4 flex items-center justify-center min-h-[80px]">
                  <img src={signatureDataUrl} alt="Tu firma" className="max-h-24 object-contain" />
                </div>

                {submitting && submitStatus && (
                  <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-4 py-2.5 text-sm text-blue-700">
                    <Loader className="size-4 animate-spin shrink-0" />
                    <span>{submitStatus}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => { setSignatureDataUrl(''); setSigModalOpen(true); }}
                    disabled={submitting}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    Cambiar firma
                  </button>
                  <button
                    onClick={handleFinalSubmit}
                    disabled={submitting}
                    className="flex-[2] rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2 active:translate-y-0.5 transition-all"
                    style={{
                      background: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 38%,#1d4ed8 68%,#1e3a8a 100%)',
                      boxShadow: '0 3px 0 #1e3a8a,0 5px 14px rgba(29,78,216,0.55)',
                    }}
                  >
                    {submitting
                      ? <><Loader className="size-4 animate-spin" /> Enviando...</>
                      : <><Upload className="size-4" /> Confirmar y Enviar Firma</>
                    }
                  </button>
                </div>
                <p className="text-center text-xs text-slate-400">
                  La firma quedará ubicada automáticamente en el lugar correcto del documento.
                </p>
              </div>
            ) : (
              <button
                onClick={() => setSigModalOpen(true)}
                className="w-full rounded-xl py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 hover:brightness-110 active:translate-y-0.5 transition-all"
                style={{
                  background: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 38%,#1d4ed8 68%,#1e3a8a 100%)',
                  boxShadow: '0 3px 0 #1e3a8a,0 5px 14px rgba(29,78,216,0.55)',
                }}
              >
                <PenLine className="size-4" /> Crear mi Firma
              </button>
            )}
          </div>
        )}

      </div>

      {/* Signature pad modal */}
      {sigModalOpen && (
        <SignatureModal
          open={sigModalOpen}
          onOpenChange={setSigModalOpen}
          onConfirm={(url) => { setSignatureDataUrl(url); setSigModalOpen(false); }}
        />
      )}
    </div>
  );
}
