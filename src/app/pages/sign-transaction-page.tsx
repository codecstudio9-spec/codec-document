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
  Loader, AlertCircle, FileText, ChevronRight, X, Upload, Fingerprint, Download,
} from 'lucide-react';
import { SignatureModal } from '../components/signatures/SignatureModal';
import { useAuth } from '../contexts/auth-context';
import { publicSupabase } from '../../lib/supabase';
import { isActiveTxStatus, isTerminalTxStatus, subscribeToTransaction, parseIdEvidencePayload, type SignTransaction, type SecurityConfig } from '../services/sign-transaction-service';
import { PDFGenerator } from '../services/pdf-generator';
import { triggerDownload } from '../utils/download';
import { buildGuestDocumentContent } from '../utils/guest-document-content';
import { normalizeIdEvidence, normalizeSelfieEvidence } from '../utils/evidence-image';
import { markVisitorActivity } from '../services/analytics-service';
import { detectSignerCountryCode } from '../../lib/geo';
import { resolveJurisdiction, DEFAULT_JURISDICTION } from '../data/signature-jurisdictions';
import { toast } from 'sonner';
import { isBiometricAvailable, runBiometricVerification, BiometricError } from '../../lib/webauthnClient';
import { useVoiceSpeak } from '../hooks/useVoiceGuide';
import { useVoiceStepGuide } from '../hooks/useVoiceStepGuide';
import { VoiceGuideToggle } from '../components/voice/VoiceGuideToggle';
import { VoiceReplayButton } from '../components/voice/VoiceReplayButton';
import { LanguageToggle } from '../components/language-toggle';
import { useLanguage } from '../contexts/language-context';

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 'loading' | 'esign' | 'biometric' | 'identity_consent' | 'selfie' | 'id' | 'sign' | 'done' | 'error' | 'already_signed';

// ─── Step builder ─────────────────────────────────────────────────────────────
function buildSteps(cfg: SecurityConfig): Step[] {
  const steps: Step[] = ['loading'];
  if (cfg.requireEsignConsent) steps.push('esign');
  // Biometric before the photo steps: it's a quick device-level check
  // (no camera permission dance) that proves possession of the signer's
  // own device before asking them to also hand over selfie/ID photos.
  if (cfg.requireBiometric)    steps.push('biometric');
  // Explicit, separate consent BEFORE any photo of the signer's face/ID is
  // actually captured — deliberately distinct from the biometric step's
  // "this stays on your device" promise, so the two claims never blur
  // together: the fingerprint/Face ID check truly never leaves the
  // device, but a selfie/ID photo IS captured and stored as evidence, and
  // the signer must explicitly acknowledge that before either camera
  // step opens. This also gives us an explicit-consent record for
  // jurisdictions (GDPR/LGPD/Colombia's Ley 1581, etc.) that treat a
  // face photo used for identity verification as sensitive/biometric
  // data requiring express consent, not just implied consent from
  // clicking a camera button.
  if (cfg.requireSelfie || cfg.requireIdPhoto) steps.push('identity_consent');
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
  const [recipientEmail,   setRecipientEmail]     = useState('');
  const [identityConsentAccepted, setIdentityConsentAccepted] = useState(false);
  const [biometricStatus,  setBiometricStatus]   = useState<'idle' | 'checking' | 'unavailable' | 'prompting' | 'verified' | 'error'>('idle');
  const [biometricDeviceLabel, setBiometricDeviceLabel] = useState('');
  const [biometricError,   setBiometricError]    = useState('');
  // Resolved once on mount from the signer's real IP, so the consent
  // screen cites the law that actually governs THIS signer instead of
  // always showing the US E-SIGN Act regardless of where they are.
  const [jurisdiction,     setJurisdiction]      = useState(DEFAULT_JURISDICTION);
  useEffect(() => {
    detectSignerCountryCode().then((code) => setJurisdiction(resolveJurisdiction(code))).catch(() => {});
  }, []);

  // ── Biometric device-capability check ──────────────────────────────────────
  // Runs once, the moment the biometric step becomes active — checks
  // whether THIS signer's device even has a platform authenticator before
  // showing the "Verify" button, so we can show the fallback message
  // instead of a button that would just fail.
  const currentStepForBiometric = steps[stepIdx];
  useEffect(() => {
    if (currentStepForBiometric !== 'biometric' || biometricStatus !== 'idle') return;
    setBiometricStatus('checking');
    isBiometricAvailable().then((available) => {
      setBiometricStatus(available ? 'idle' : 'unavailable');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepForBiometric]);

  const handleBiometricVerify = useCallback(async () => {
    if (!tx) return;
    setBiometricStatus('prompting');
    setBiometricError('');
    try {
      const result = await runBiometricVerification(tx.id);
      setBiometricDeviceLabel(result.deviceLabel);
      setBiometricStatus('verified');
    } catch (err) {
      const message = err instanceof BiometricError
        ? err.message
        : (err instanceof Error ? err.message : 'No se pudo completar la verificacion biometrica.');
      setBiometricError(message);
      setBiometricStatus('error');
    }
  }, [tx]);

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
  const { language } = useLanguage();
  const tr = (en: string, es: string) => (language === 'en' ? en : es);

  // ── Voice guidance ──────────────────────────────────────────────────────────
  const { speak } = useVoiceSpeak();
  const voiceSessionId = useRef(crypto.randomUUID()).current;
  const voiceBase = { sessionId: voiceSessionId, role: 'guest' as const, flow: 'sign-transaction', documentId: transactionId };

  // Fires exactly once, the moment the transaction loads successfully —
  // independent of which security steps this particular document requires,
  // so it always plays first regardless of the step order below.
  const spokenWelcomeRef = useRef(false);
  useEffect(() => {
    if (!tx || spokenWelcomeRef.current) return;
    spokenWelcomeRef.current = true;
    speak({
      es: 'Bienvenido a Codec Document. Has sido invitado a firmar un documento. Si prefieres escucharlo en inglés, toca el botón ES / EN en la parte superior.',
      en: 'Welcome to Codec Document. You’ve been invited to sign a document. If you’d rather hear this in Spanish, tap the ES / EN button at the top.',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tx]);

  useVoiceStepGuide({
    ...voiceBase, active: currentStep === 'esign', step: 'esign', stepIndex: 1,
    message: {
      es: 'Lee el consentimiento de firma electrónica, marca la casilla para aceptarlo, y toca Continuar. Al aceptar, confirmas que entiendes que tu firma electrónica tiene la misma validez legal que una firma en papel.',
      en: 'Read the electronic signature consent, check the box to accept it, and tap Continue. By accepting, you confirm you understand your electronic signature carries the same legal validity as a signature on paper.',
    },
  });
  useVoiceStepGuide({
    ...voiceBase, active: currentStep === 'biometric', step: 'biometric', stepIndex: 2,
    message: {
      es: 'Quien te envió este documento pidió confirmar tu identidad con la huella o el reconocimiento facial de tu propio dispositivo. Toca el botón y sigue el mensaje que te muestre tu teléfono o computadora. Esto ocurre localmente en tu dispositivo — Codec Document nunca recibe tu huella ni tu rostro.',
      en: 'Whoever sent you this document asked you to confirm your identity using your own device\'s fingerprint or face recognition. Tap the button and follow the prompt shown by your phone or computer. This happens locally on your device — Codec Document never receives your fingerprint or face data.',
    },
  });
  useVoiceStepGuide({
    ...voiceBase, active: currentStep === 'identity_consent', step: 'identity_consent', stepIndex: 2,
    message: {
      es: 'Antes de tomarte una foto, lee este aviso: a diferencia de la huella o Face ID, la foto de tu rostro o documento sí queda guardada como evidencia de tu identidad. Marca la casilla si estás de acuerdo y toca Continuar.',
      en: 'Before taking a photo, read this notice: unlike the fingerprint or Face ID check, a photo of your face or ID IS stored as evidence of your identity. Check the box if you agree, and tap Continue.',
    },
  });
  useVoiceStepGuide({
    ...voiceBase, active: currentStep === 'selfie', step: 'selfie', stepIndex: 2,
    message: {
      es: 'Quien te envió este documento pidió verificar tu identidad: tómate una selfie con tu cara bien visible e iluminada. Si tu cámara no funciona, puedes subir un archivo en su lugar.',
      en: 'Whoever sent you this document asked to verify your identity: take a selfie with your face clearly visible and well lit. If your camera doesn’t work, you can upload a file instead.',
    },
  });
  useVoiceStepGuide({
    ...voiceBase, active: currentStep === 'id', step: 'id', stepIndex: 3,
    message: {
      es: 'Toma una foto del frente de tu documento de identidad, y luego del reverso. Puede ser tu cédula, licencia de conducir o pasaporte. Si tu cámara no funciona, puedes subir un archivo en su lugar.',
      en: 'Take a photo of the front of your ID, then the back. This can be a national ID card, driver’s license, or passport. If your camera doesn’t work, you can upload a file instead.',
    },
  });
  useVoiceStepGuide({
    ...voiceBase, active: currentStep === 'sign', step: 'sign', stepIndex: 4,
    message: {
      es: 'Dibuja tu firma con el dedo o el mouse para terminar de firmar el documento. Si prefieres, arriba puedes cambiar a Texto para escribir tu nombre con letra de firma, o a Imagen para subir una firma que ya tengas guardada.',
      en: 'Draw your signature with your finger or mouse to finish signing the document. If you’d rather not draw, you can switch to Text above to type your name in a signature font, or to Image to upload a signature you already have saved.',
    },
  });
  useVoiceStepGuide({
    ...voiceBase, active: currentStep === 'done', step: 'done', stepIndex: 5, isTerminal: true,
    message: {
      es: '¡Listo! Tu firma se registró correctamente. Gracias por usar Codec Document.',
      en: 'Done! Your signature was registered successfully. Thank you for using Codec Document.',
    },
  });

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
      setCameraError(tr('Could not access the camera. Allow access in your browser and reload the page.', 'No se pudo acceder a la camara. Permite el acceso en tu navegador y recarga la pagina.'));
    }
  }, [tr]);

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
  // Lets the guest signer (no account at all) get their own copy right from
  // this page — same content-resolution used by preview-page.tsx (built-in
  // documents) and custom-template-preview-page.tsx (Word templates), just
  // callable without a login since it only needs what get_sign_transaction_public
  // already exposes to anyone holding this transaction's id.
  const [downloadingCopy, setDownloadingCopy] = useState(false);
  const handleDownloadCopy = async () => {
    if (!tx) return;
    setDownloadingCopy(true);
    try {
      const { content, title } = await buildGuestDocumentContent(tx, language);
      const jurisdiction = resolveJurisdiction((await detectSignerCountryCode()) || null);
      const parsedId = parseIdEvidencePayload(tx.recipient_id_photo);
      const fileName = `${title.replace(/[^a-z0-9]+/gi, '-')}.pdf`;

      const blob = await PDFGenerator.generateBlob({
        content,
        title,
        fileName,
        language,
        showWatermark: false,
        jurisdiction,
        leftSig: tx.sender_signature ? { dataUrl: tx.sender_signature, name: language === 'en' ? 'Sender' : 'Remitente' } : undefined,
        rightSig: tx.recipient_signature ? { dataUrl: tx.recipient_signature, name: language === 'en' ? 'Signer' : 'Firmante' } : undefined,
        mirrorLayout: true,
        mirrorLanguage: language,
        identitySelfie: tx.recipient_selfie,
        identityIdDocFront: parsedId.front,
        identityIdDocBack: parsedId.back,
        identityBiometric: tx.recipient_biometric_verified_at && tx.recipient_biometric_device_label
          ? {
              deviceLabel: tx.recipient_biometric_device_label,
              verifiedAt: tx.recipient_biometric_verified_at,
              credentialIdHash: (tx.recipient_biometric_credential_id ?? '').slice(0, 16),
            }
          : undefined,
        auditLog: {
          documentId: tx.id,
          guestIp: tx.recipient_ip,
          guestSignedAt: tx.signed_at,
        },
      });

      await triggerDownload(blob, fileName);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not generate your document.' : 'No se pudo generar tu documento.'));
    } finally {
      setDownloadingCopy(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!tx) return;
    if (submittingRef.current) return; // blocks a same-tick double-tap/double-fire
    submittingRef.current = true;

    // Guard: signature must exist and be a real data URL
    if (!signatureDataUrl || !signatureDataUrl.startsWith('data:')) {
      toast.error(tr('Your signature isn\'t valid. Please draw your signature before continuing.', 'La firma no es valida. Por favor dibuja tu firma antes de continuar.'));
      submittingRef.current = false;
      return;
    }

    setSubmitting(true);
    setSubmitStatus(tr('Preparing submission...', 'Preparando envio...'));

    // ── Step 1: Collect IP (non-blocking, never fails the flow) ──────────────
    let recipientIp = '';
    if (tx.security_config.advancedAuditTrail) {
      try {
        setSubmitStatus(tr('Gathering audit data...', 'Obteniendo datos de auditoria...'));
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
    if (recipientEmail.trim()) initialPayload.recipient_email    = recipientEmail.trim();

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
    setSubmitStatus(tr('Saving signature...', 'Guardando firma...'));
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
          tr(`Could not save the signature: ${error.message}`, `No se pudo guardar la firma: ${error.message}`),
          { description: `Code: ${error.code}`, duration: 8000 },
        );
        return;
      }

      if (!completed) {
        toast.error(
          tr('This document was already signed or modified in another session. Refresh the page.', 'Este documento ya fue firmado o modificado en otra sesión. Actualiza la página.'),
          { duration: 8000 },
        );
        setSteps(['loading', 'already_signed']);
        setStepIdx(1);
        return;
      }

      console.log('Firma guardada exitosamente. Transaction:', tx.id, '| payload keys:', Object.keys(initialPayload));
      markVisitorActivity('signature', 'template-signature');
      advance();

      // Fire-and-forget — a failed/slow email must never block or error out
      // a signature that's already saved. See supabase/functions/notify-completion.
      void publicSupabase.functions.invoke('notify-completion', { body: { txId: tx.id } }).catch(() => {});

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
      toast.error(tr(`Network error while saving the signature: ${msg}`, `Error de red al guardar la firma: ${msg}`), { duration: 8000 });
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
        <p className="text-sm text-slate-500">{tr('Loading document...', 'Cargando documento...')}</p>
      </div>
    );
  }

  if (currentStep === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
        <div className="rounded-full bg-red-100 p-4">
          <AlertCircle className="size-10 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-800">{tr('Invalid or expired link', 'Enlace no valido o expirado')}</h1>
        <p className="text-slate-500 max-w-sm text-sm">
          {tr(
            'This signing link doesn\'t exist or was already processed. Contact whoever sent it to you to generate a new one.',
            'Este enlace de firma no existe o ya fue procesado. Contacta a quien te lo envio para que genere uno nuevo.',
          )}
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
        <h1 className="text-xl font-bold text-slate-800">{tr('Document already signed', 'Documento ya firmado')}</h1>
        <p className="text-slate-500 max-w-sm text-sm">
          {tr(
            'This document was already signed and processed successfully. No further changes are accepted.',
            'Este documento ya fue firmado y procesado correctamente. No se admiten cambios adicionales.',
          )}
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
        <h1 className="text-2xl font-black text-slate-800">{tr('Document signed successfully', 'Documento firmado exitosamente')}</h1>
        <p className="text-slate-500 max-w-sm text-sm leading-relaxed">
          {tr(
            'Your signature has been legally recorded and securely stored. The document creator will receive an automatic notification.',
            'Tu firma ha sido registrada con validez legal y almacenada de forma segura. El creador del documento recibira una notificacion automatica.',
          )}
        </p>
        {tx?.security_config?.advancedAuditTrail && (
          <div className="rounded-2xl bg-white border border-slate-200 px-5 py-4 text-left text-xs text-slate-500 max-w-sm w-full shadow-sm space-y-1.5">
            <p className="font-semibold text-slate-700 text-sm mb-2">{tr('Audit record', 'Registro de auditoria')}</p>
            <p>{tr('Document', 'Documento')}: <span className="text-slate-800 font-medium">{tx.document_type?.replace(/-/g, ' ')}</span></p>
            <p>{tr('Transaction ID', 'ID de transaccion')}: <span className="text-slate-800 font-mono font-medium">{tx.id.slice(0, 8)}...</span></p>
            <p>{tr('Signed at', 'Firmado el')}: <span className="text-slate-800 font-medium">{new Date().toLocaleString(language === 'en' ? 'en-US' : 'es-MX')}</span></p>
          </div>
        )}
        <button
          type="button"
          disabled={downloadingCopy}
          onClick={() => void handleDownloadCopy()}
          className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-60"
          style={{ background: 'linear-gradient(180deg,#34d399 0%,#059669 68%,#065f46 100%)', boxShadow: '0 3px 0 #065f46' }}
        >
          {downloadingCopy
            ? <><Loader className="size-4 animate-spin" /> {tr('Preparing...', 'Preparando...')}</>
            : <><Download className="size-4" /> {tr('Download my copy', 'Descargar mi copia')}</>
          }
        </button>
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
          <p className="text-xs text-slate-500 leading-tight truncate">{tr('Legally valid electronic signature', 'Firma electronica con validez legal')}</p>
        </div>
        <LanguageToggle />
        <VoiceGuideToggle />
        {tx?.security_config?.requireEsignConsent && (
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
            {tr(jurisdiction.badgeEn, jurisdiction.badgeEs)}
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
              {tr('Your signature is required to complete this document', 'Se requiere tu firma para completar este documento')}
            </p>
          </div>
        </div>

        {/* ── ESIGN Step ── */}
        {currentStep === 'esign' && (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
              <ShieldCheck className="size-5 text-blue-600 shrink-0" />
              {tr(jurisdiction.consentTitleEn, jurisdiction.consentTitleEs)}
            </h2>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 leading-relaxed max-h-44 overflow-y-auto">
              {tr(jurisdiction.consentBodyEn, jurisdiction.consentBodyEs)}
            </div>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="mt-0.5 size-4 rounded border-slate-300 accent-blue-600 cursor-pointer"
                checked={esignAccepted}
                onChange={e => setEsignAccepted(e.target.checked)}
              />
              <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                {tr(
                  'I accept the electronic signature consent and understand my signature carries full legal validity.',
                  'Acepto el consentimiento de firma electronica y comprendo que mi firma tiene plena validez legal.',
                )}
              </span>
            </label>
            <button
              disabled={!esignAccepted}
              onClick={advance}
              className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:brightness-110 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 38%,#1d4ed8 68%,#1e3a8a 100%)', boxShadow: '0 3px 0 #1e3a8a' }}
            >
              {tr('Continue', 'Continuar')} <ChevronRight className="size-4" />
            </button>
          </div>
        )}

        {/* ── Biometric Step ── */}
        {currentStep === 'biometric' && (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
              <Fingerprint className="size-5 text-pink-600 shrink-0" />
              {tr('Biometric Authentication', 'Autenticacion Biometrica')}
            </h2>
            <p className="text-sm text-slate-500">
              {tr(
                'This step confirms your identity using your own device\'s fingerprint or Face ID sensor. It happens locally — the fingerprint or face scan itself is never sent to our servers, only a cryptographic confirmation that your device verified you.',
                'Este paso confirma tu identidad usando el sensor de huella o Face ID de tu propio dispositivo. Ocurre localmente — la huella o el escaneo facial en si nunca se envian a nuestros servidores, solo una confirmacion criptografica de que tu dispositivo te verifico.',
              )}
            </p>
            {(tx?.security_config?.requireSelfie || tx?.security_config?.requireIdPhoto) && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-500">
                {tr(
                  'Note: this document separately also asks for a selfie/ID photo in a later step — that photo IS captured and stored as evidence, unlike this fingerprint/Face ID check.',
                  'Nota: este documento tambien pide por separado una selfie o foto de identificacion en un paso posterior — esa foto SI se captura y almacena como evidencia, a diferencia de esta verificacion por huella/Face ID.',
                )}
              </div>
            )}

            {biometricStatus === 'checking' && (
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-500">
                <Loader className="size-4 animate-spin shrink-0" /> {tr('Checking device compatibility...', 'Verificando compatibilidad del dispositivo...')}
              </div>
            )}

            {biometricStatus === 'unavailable' && (
              <div className="space-y-3">
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 leading-relaxed">
                  {tr(
                    'This device doesn\'t have a compatible fingerprint/Face ID sensor (or the browser doesn\'t support it). Use a phone with fingerprint/Face ID, or a computer with Windows Hello, to continue. If that\'s not possible, contact whoever sent you the document.',
                    'Este dispositivo no tiene un sensor de huella o Face ID compatible (o el navegador no lo soporta). Usa un telefono con huella/Face ID, o una computadora con Windows Hello, para continuar. Si no es posible, contacta a quien te envio el documento.',
                  )}
                </div>
                <button
                  onClick={() => setBiometricStatus('idle')}
                  className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {tr('Try again', 'Reintentar')}
                </button>
              </div>
            )}

            {biometricStatus === 'error' && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700 leading-relaxed">
                {biometricError || tr('Biometric verification could not be completed.', 'No se pudo completar la verificacion biometrica.')}
              </div>
            )}

            {biometricStatus === 'verified' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                  <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-emerald-800">{tr('Identity verified', 'Identidad verificada')}</p>
                    <p className="text-xs text-emerald-700">{biometricDeviceLabel}</p>
                  </div>
                </div>
                <button
                  onClick={advance}
                  className="w-full rounded-xl py-3 text-sm font-bold text-white hover:brightness-110 transition-all"
                  style={{ background: 'linear-gradient(180deg,#f472b6 0%,#db2777 68%,#9d174d 100%)', boxShadow: '0 3px 0 #831843' }}
                >
                  {tr('Continue', 'Continuar')}
                </button>
              </div>
            ) : (biometricStatus === 'idle' || biometricStatus === 'error') && (
              <button
                onClick={handleBiometricVerify}
                className="w-full rounded-xl py-3 text-sm font-bold text-white flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                style={{ background: 'linear-gradient(180deg,#f472b6 0%,#db2777 68%,#9d174d 100%)', boxShadow: '0 3px 0 #831843' }}
              >
                <Fingerprint className="size-4" /> {tr('Verify with fingerprint / Face ID', 'Verificar con huella / Face ID')}
              </button>
            )}

            {biometricStatus === 'prompting' && (
              <div className="flex items-center gap-2 rounded-xl bg-pink-50 border border-pink-200 px-4 py-3 text-sm text-pink-700">
                <Loader className="size-4 animate-spin shrink-0" /> {tr('Follow your device\'s prompt...', 'Sigue las instrucciones de tu dispositivo...')}
              </div>
            )}
          </div>
        )}

        {/* ── Identity Photo Consent Step ── */}
        {currentStep === 'identity_consent' && (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
              <ShieldCheck className="size-5 text-blue-600 shrink-0" />
              {tr('Photo & Identity Data Consent', 'Consentimiento de Datos de Identidad y Foto')}
            </h2>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 leading-relaxed space-y-2">
              <p>
                {tr(
                  'This document also requires a photo of your face and/or ID as evidence of your identity.',
                  'Este documento tambien requiere una foto de tu rostro y/o de tu identificacion como evidencia de tu identidad.',
                )}
              </p>
              <p className="font-semibold text-slate-700">
                {tr(
                  'Unlike a fingerprint/Face ID check, this photo IS captured and stored — attached to this document as part of its audit trail.',
                  'A diferencia de la verificacion por huella/Face ID, esta foto SI se captura y se almacena, adjunta a este documento como parte de su registro de auditoria.',
                )}
              </p>
              <p>
                {tr(
                  'It is used solely to verify your identity as the signer of this document and is not used for facial-recognition matching against any other database.',
                  'Se usa unicamente para verificar tu identidad como firmante de este documento y no se utiliza para reconocimiento facial contra ninguna otra base de datos.',
                )}
              </p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="mt-0.5 size-4 rounded border-slate-300 accent-blue-600 cursor-pointer"
                checked={identityConsentAccepted}
                onChange={e => setIdentityConsentAccepted(e.target.checked)}
              />
              <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                {tr(
                  'I understand and consent to a photo of my face and/or ID being captured and stored for identity verification of this document.',
                  'Entiendo y doy mi consentimiento para que se capture y almacene una foto de mi rostro y/o mi identificacion para la verificacion de identidad de este documento.',
                )}
              </span>
            </label>
            <button
              disabled={!identityConsentAccepted}
              onClick={advance}
              className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:brightness-110 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 38%,#1d4ed8 68%,#1e3a8a 100%)', boxShadow: '0 3px 0 #1e3a8a' }}
            >
              {tr('Continue', 'Continuar')} <ChevronRight className="size-4" />
            </button>
          </div>
        )}

        {/* ── Selfie Step ── */}
        {currentStep === 'selfie' && (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
              <Camera className="size-5 text-blue-600 shrink-0" />
              {tr('Identity Verification Selfie', 'Selfie de Verificacion de Identidad')}
            </h2>
            <p className="text-sm text-slate-500">
              {tr('Take a clear photo of your face looking directly at the camera.', 'Toma una foto clara de tu rostro mirando directamente a la camara.')}
            </p>
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              <p className="font-semibold">{tr('Center your face inside the circle', 'Centra tu rostro dentro del circulo')}</p>
              <p>✓ {tr('Look directly at camera', 'Mira directamente a la camara')}</p>
              <p>✓ {tr('Remove sunglasses', 'Quitate los lentes de sol')}</p>
              <p>✓ {tr('Good lighting', 'Buena iluminacion')}</p>
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
                    {tr('Retake photo', 'Repetir foto')}
                  </button>
                  <button
                    onClick={advance}
                    className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white hover:brightness-110 transition-all"
                    style={{ background: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 68%,#1e3a8a 100%)', boxShadow: '0 3px 0 #1e3a8a' }}
                  >
                    {tr('Use this photo', 'Usar esta foto')}
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
                    <X className="size-4" /> {tr('Cancel', 'Cancelar')}
                  </button>
                  <button
                    onClick={() => capturePhoto('selfie')}
                    className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white flex items-center justify-center gap-1.5"
                    style={{ background: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 68%,#1e3a8a 100%)', boxShadow: '0 3px 0 #1e3a8a' }}
                  >
                    <Camera className="size-4" /> {tr('Capture', 'Capturar')}
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
                <Camera className="size-4" /> {tr('Open Front Camera', 'Abrir Camara Frontal')}
              </button>
            )}
          </div>
        )}

        {/* ── ID Photo Step ── */}
        {currentStep === 'id' && (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
              <CreditCard className="size-5 text-blue-600 shrink-0" />
              {tr('ID Document (Front and Back)', 'Documento de Identidad (Frente y Reverso)')}
            </h2>
            <p className="text-sm text-slate-500">
              {tr('Capture both sides of your official ID in high definition to complete legal verification.', 'Captura ambas caras de tu documento oficial en alta definición para completar la verificación legal.')}
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <p className="font-semibold">{tr('Required capture: front and back', 'Captura requerida: frente y reverso')}</p>
              <p>✓ {tr('Entire document is visible', 'Todo el documento es visible')}</p>
              <p>✓ {tr('No glare', 'Sin reflejos')}</p>
              <p>✓ {tr('Good lighting', 'Buena iluminacion')}</p>
              <p>✓ {tr('All corners visible', 'Todas las esquinas visibles')}</p>
            </div>

            {(idFrontDataUrl || idBackDataUrl) && !cameraActive ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                    {idFrontDataUrl ? (
                      <img src={idFrontDataUrl} alt="id-front" className="w-full object-contain bg-white max-h-52" />
                    ) : (
                      <div className="flex h-32 items-center justify-center text-xs text-slate-400">{tr('Front pending', 'Frente pendiente')}</div>
                    )}
                    <p className="border-t border-slate-100 px-3 py-2 text-center text-xs font-semibold text-slate-600">{tr('Front', 'Frente')}</p>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                    {idBackDataUrl ? (
                      <img src={idBackDataUrl} alt="id-back" className="w-full object-contain bg-white max-h-52" />
                    ) : (
                      <div className="flex h-32 items-center justify-center text-xs text-slate-400">{tr('Back pending', 'Reverso pendiente')}</div>
                    )}
                    <p className="border-t border-slate-100 px-3 py-2 text-center text-xs font-semibold text-slate-600">{tr('Back', 'Reverso')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setIdCaptureSide('front'); void startCamera('environment'); }}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {idFrontDataUrl ? tr('Retake front', 'Repetir frente') : tr('Capture front', 'Capturar frente')}
                  </button>
                  <button
                    onClick={() => { setIdCaptureSide('back'); void startCamera('environment'); }}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {idBackDataUrl ? tr('Retake back', 'Repetir reverso') : tr('Capture back', 'Capturar reverso')}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={advance}
                    disabled={!idFrontDataUrl || !idBackDataUrl}
                    className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white hover:brightness-110 transition-all"
                    style={{ background: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 68%,#1e3a8a 100%)', boxShadow: '0 3px 0 #1e3a8a' }}
                  >
                    {tr('Continue', 'Continuar')}
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
                    <X className="size-4" /> {tr('Cancel', 'Cancelar')}
                  </button>
                  <button
                    onClick={() => capturePhoto(idCaptureSide === 'front' ? 'id_front' : 'id_back')}
                    className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white flex items-center justify-center gap-1.5"
                    style={{ background: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 68%,#1e3a8a 100%)', boxShadow: '0 3px 0 #1e3a8a' }}
                  >
                    <Camera className="size-4" /> {idCaptureSide === 'front' ? tr('Capture front', 'Capturar frente') : tr('Capture back', 'Capturar reverso')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setIdCaptureSide('front'); void startCamera('environment'); }}
                className="w-full rounded-xl py-3 text-sm font-bold text-white flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                style={{ background: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 68%,#1e3a8a 100%)', boxShadow: '0 3px 0 #1e3a8a' }}
              >
                <CreditCard className="size-4" /> {tr('Photograph Front of Document', 'Fotografiar Frente del Documento')}
              </button>
            )}
          </div>
        )}

        {/* ── Signature Step ── */}
        {currentStep === 'sign' && (
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
              <PenLine className="size-5 text-blue-600 shrink-0" />
              {tr('Sign the Document', 'Firma el Documento')}
            </h2>
            <p className="text-sm text-slate-500">
              {tr('Draw your signature or type your name to create your legally valid electronic signature.', 'Dibuja tu firma o escribe tu nombre para crear tu firma electronica con validez legal.')}
            </p>

            {signatureDataUrl ? (
              <div className="space-y-4">
                {/* Signature preview */}
                <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4 flex items-center justify-center min-h-[80px]">
                  <img src={signatureDataUrl} alt={tr('Your signature', 'Tu firma')} className="max-h-24 object-contain" />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    {tr('Email for your copy (optional)', 'Correo para tu copia (opcional)')}
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder={tr('you@email.com', 'tu@correo.com')}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    {tr("We'll send the signed document here once it's ready.", 'Te enviaremos el documento firmado aquí cuando esté listo.')}
                  </p>
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
                    {tr('Change signature', 'Cambiar firma')}
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
                      ? <><Loader className="size-4 animate-spin" /> {tr('Sending...', 'Enviando...')}</>
                      : <><Upload className="size-4" /> {tr('Confirm and Send Signature', 'Confirmar y Enviar Firma')}</>
                    }
                  </button>
                </div>
                <p className="text-center text-xs text-slate-400">
                  {tr('Your signature will be placed automatically in the correct spot on the document.', 'La firma quedará ubicada automáticamente en el lugar correcto del documento.')}
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
                <PenLine className="size-4" /> {tr('Create my Signature', 'Crear mi Firma')}
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

      <VoiceReplayButton
        sessionId={voiceSessionId} role="guest" flow="sign-transaction" documentId={transactionId}
        step={currentStep} stepIndex={stepIdx}
      />
    </div>
  );
}
