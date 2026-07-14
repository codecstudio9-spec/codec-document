import { useState, useRef, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import {
  PenLine, UserPlus, QrCode, Copy, CheckCircle2,
  Download, X, Send, Loader2,
  ChevronDown, ChevronUp, PenTool, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { SignatureModal } from './SignatureModal';
import { createSignatureRequest, getSignatureRequestStatus } from '../../services/paypal-service';
import type { DocumentBranding } from '../../types/document';
import { SUPPORT_EMAIL } from '../../config/site';

const uid = () => Math.random().toString(36).slice(2, 10);

const SIGNER_COLORS = [
  { bg: 'bg-blue-500', shadow: 'shadow-blue-500/25' },
  { bg: 'bg-emerald-500', shadow: 'shadow-emerald-500/25' },
  { bg: 'bg-violet-500', shadow: 'shadow-violet-500/25' },
  { bg: 'bg-amber-500', shadow: 'shadow-amber-500/25' },
  { bg: 'bg-rose-500', shadow: 'shadow-rose-500/25' },
  { bg: 'bg-cyan-500', shadow: 'shadow-cyan-500/25' },
  { bg: 'bg-orange-500', shadow: 'shadow-orange-500/25' },
  { bg: 'bg-indigo-500', shadow: 'shadow-indigo-500/25' },
];

interface SignerEntry {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'idle' | 'pending' | 'signed';
  signatureDataUrl?: string;
  signedAt?: string;
  guestLink?: string;
  token?: string;
  colorIndex: number;
}

export interface SignatureForPDF {
  signerName: string;
  signatureDataUrl: string;
  signedAt: string;
}

interface Props {
  documentContent: string;
  documentId: string;
  documentName: string;
  language: 'en' | 'es';
  purchaserEmail: string;
  branding?: DocumentBranding;
  onDownloadWithSignatures: (signatures: SignatureForPDF[]) => void;
  onSignatureReadyToPlace?: (signerId: string, signerName: string, dataUrl: string) => void;
}

export function InlineSigningPanel({
  documentContent,
  documentId,
  documentName,
  language,
  purchaserEmail,
  branding,
  onDownloadWithSignatures,
  onSignatureReadyToPlace,
}: Props) {
  const [signers, setSigners] = useState<SignerEntry[]>([
    { id: uid(), name: '', email: '', role: '', status: 'idle', colorIndex: 0 },
  ]);
  const [activeModalId, setActiveModalId] = useState<string | null>(null);
  const [expandedLinkId, setExpandedLinkId] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);
  const pollingRefs = useRef<Record<string, number>>({});
  const pollingAttempts = useRef<Record<string, number>>({});
  const MAX_POLL_ATTEMPTS = 150; // 150 × 4 s = 10 minutes max

  const tr = (en: string, es: string) => (language === 'es' ? es : en);

  useEffect(() => {
    return () => {
      Object.values(pollingRefs.current).forEach(id => window.clearInterval(id));
    };
  }, []);

  const startPolling = useCallback((signerId: string, token: string) => {
    if (pollingRefs.current[signerId]) return;
    pollingAttempts.current[signerId] = 0;

    pollingRefs.current[signerId] = window.setInterval(async () => {
      pollingAttempts.current[signerId] = (pollingAttempts.current[signerId] ?? 0) + 1;

      // Stop after 10 minutes (150 attempts × 4 s)
      if (pollingAttempts.current[signerId] > MAX_POLL_ATTEMPTS) {
        window.clearInterval(pollingRefs.current[signerId]);
        delete pollingRefs.current[signerId];
        delete pollingAttempts.current[signerId];
        setSigners(prev =>
          prev.map(s => s.id === signerId && s.status === 'pending' ? { ...s, status: 'idle' } : s),
        );
        toast.error(tr('Link expired. Generate a new one.', 'El enlace expiró. Genera uno nuevo.'));
        return;
      }

      try {
        const row = await getSignatureRequestStatus(token) as any;
        if (row?.status === 'SIGNED' || row?.status === 'COMPLETED' || row?.signatureDataUrl) {
          setSigners(prev =>
            prev.map(s =>
              s.id === signerId
                ? {
                    ...s,
                    status: 'signed',
                    signatureDataUrl: row.signatureDataUrl || s.signatureDataUrl,
                    signedAt: row.guestSignedAt || new Date().toISOString(),
                  }
                : s,
            ),
          );
          window.clearInterval(pollingRefs.current[signerId]);
          delete pollingRefs.current[signerId];
          delete pollingAttempts.current[signerId];
          toast.success(tr('Signature received!', '¡Firma recibida!'));
        }
      } catch {
        /* network hiccup — keep polling until MAX_POLL_ATTEMPTS */
      }
    }, 4000);
  }, []);

  const addSigner = () => {
    if (signers.length >= 8) {
      toast.error(tr('Maximum 8 signers', 'Máximo 8 firmantes'));
      return;
    }
    setSigners(prev => [
      ...prev,
      {
        id: uid(),
        name: '',
        email: '',
        role: '',
        status: 'idle',
        colorIndex: prev.length % SIGNER_COLORS.length,
      },
    ]);
  };

  const removeSigner = (id: string) => {
    if (signers.length <= 1) return;
    if (pollingRefs.current[id]) {
      window.clearInterval(pollingRefs.current[id]);
      delete pollingRefs.current[id];
    }
    setSigners(prev => prev.filter(s => s.id !== id));
    if (expandedLinkId === id) setExpandedLinkId(null);
    if (activeModalId === id) setActiveModalId(null);
  };

  const updateSigner = (id: string, changes: Partial<SignerEntry>) => {
    setSigners(prev => prev.map(s => (s.id === id ? { ...s, ...changes } : s)));
  };

  const handleSignNow = (signerId: string) => {
    const signer = signers.find(s => s.id === signerId);
    if (!signer?.name.trim()) {
      toast.error(tr('Enter signer name first', 'Ingresa el nombre primero'));
      return;
    }
    setActiveModalId(signerId);
  };

  const handleSignatureComplete = (signerId: string, dataUrl: string) => {
    const signer = signers.find(s => s.id === signerId);
    setSigners(prev =>
      prev.map(s =>
        s.id === signerId
          ? { ...s, status: 'signed', signatureDataUrl: dataUrl, signedAt: new Date().toISOString() }
          : s,
      ),
    );
    setActiveModalId(null);
    if (signer) {
      onSignatureReadyToPlace?.(signerId, signer.name, dataUrl);
    }
    toast.success(
      tr('Signature added! Drag it on the document to position it.', '¡Firma añadida! Arrástrala en el documento para posicionarla.'),
    );
  };

  const handleSendLink = async (signerId: string) => {
    const signer = signers.find(s => s.id === signerId);
    if (!signer?.name.trim() || !signer?.email.trim()) {
      toast.error(tr('Enter name and email first', 'Ingresa nombre y email primero'));
      return;
    }
    setGeneratingLink(signerId);
    try {
      const orderId = `SIGN-${documentId}-${signerId}-${Date.now()}`;
      const result = await createSignatureRequest({
        orderId,
        documentId,
        documentName,
        documentContent,
        buyerEmail: purchaserEmail || SUPPORT_EMAIL,
        buyerName: signers[0]?.name || tr('Sender', 'Emisor'),
        signerEmail: signer.email.trim(),
        signerName: signer.name.trim(),
        contractSignerName: `${signer.name.trim()}${signer.role ? ` (${signer.role})` : ''}`,
        brandingLogo: branding?.logoDataUrl,
        signaturePlacement: 'right',
        feePaymentConfirmed: false,
      });
      updateSigner(signerId, {
        status: 'pending',
        guestLink: result.guestLink,
        token: result.token,
      });
      setExpandedLinkId(signerId);
      startPolling(signerId, result.token);
      await navigator.clipboard.writeText(result.guestLink).catch(() => {});
      toast.success(tr('Link generated and copied!', '¡Enlace generado y copiado!'));
    } catch (e: any) {
      toast.error(e?.message || tr('Could not generate link', 'No se pudo generar el enlace'));
    } finally {
      setGeneratingLink(null);
    }
  };

  const signedSigners = signers.filter(s => s.status === 'signed' && s.signatureDataUrl);
  const allSigned = signers.length > 0 && signers.every(s => s.status === 'signed');
  const pendingSigners = signers.filter(s => s.status !== 'signed');

  const handleDownload = () => {
    if (!allSigned) {
      toast.error(tr(
        'All signers must complete before downloading.',
        'Todos los firmantes deben completar antes de descargar.',
      ));
      return;
    }
    const sigs: SignatureForPDF[] = signedSigners.map(s => ({
      signerName: s.name,
      signatureDataUrl: s.signatureDataUrl!,
      signedAt: s.signedAt || new Date().toISOString(),
    }));
    onDownloadWithSignatures(sigs);
  };

  const activeModal = signers.find(s => s.id === activeModalId);

  return (
    <>
      <div className={[
        'rounded-2xl border bg-white p-5 shadow-sm transition-colors',
        allSigned ? 'border-emerald-300' : 'border-slate-200',
      ].join(' ')}>

        {/* ── Step label ─────────────────────────────────────────────────────── */}
        <div className="mb-1 flex items-center gap-2">
          <span className={[
            'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest',
            allSigned
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-indigo-100 text-indigo-700',
          ].join(' ')}>
            {allSigned
              ? tr('Step 3 — Download', 'Paso 3 — Descargar')
              : tr('Step 2 — Sign', 'Paso 2 — Firmar')}
          </span>
        </div>

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={[
              'flex size-9 items-center justify-center rounded-xl shadow-sm',
              allSigned ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600',
            ].join(' ')}>
              {allSigned ? <CheckCircle2 className="size-5" /> : <PenLine className="size-4.5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {allSigned
                  ? tr('All signatures complete', 'Todas las firmas completas')
                  : tr('Digital Signatures', 'Firmas Digitales')}
              </h3>
              <p className="text-[11px] text-slate-500">
                {signedSigners.length}/{signers.length}{' '}
                {tr('signed', 'firmado(s)')}
              </p>
            </div>
          </div>
          {/* Only show "Add signer" button while still in signing step */}
          {!allSigned && (
            <button
              type="button"
              onClick={addSigner}
              className="flex items-center gap-1.5 rounded-xl border border-dashed border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:border-indigo-400 hover:bg-indigo-100"
            >
              <UserPlus className="size-3.5" />
              {tr('Add signer', 'Añadir firmante')}
            </button>
          )}
        </div>

        {/* Signer cards */}
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {signers.map((signer, idx) => {
              const color = SIGNER_COLORS[signer.colorIndex % SIGNER_COLORS.length];
              const initials = signer.name.trim()
                ? signer.name
                    .trim()
                    .split(' ')
                    .map(w => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                : `P${idx + 1}`;
              const isLinkExpanded = expandedLinkId === signer.id;

              return (
                <motion.div
                  key={signer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.18 }}
                  className={[
                    'overflow-hidden rounded-xl border p-3 transition-colors duration-200',
                    signer.status === 'signed'
                      ? 'border-emerald-200 bg-emerald-50/60'
                      : signer.status === 'pending'
                        ? 'border-amber-200 bg-amber-50/60'
                        : 'border-slate-200 bg-slate-50',
                  ].join(' ')}
                >
                  {/* Avatar + fields + remove */}
                  <div className="flex items-start gap-3">
                    {/* Colored avatar */}
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-white text-xs font-bold shadow-md ${color.bg} ${color.shadow}`}
                    >
                      {signer.status === 'signed' ? (
                        <CheckCircle2 className="size-5" />
                      ) : (
                        initials
                      )}
                    </div>

                    {/* Fields when idle */}
                    {signer.status === 'idle' ? (
                      <div className="min-w-0 flex-1 space-y-2">
                        <input
                          type="text"
                          value={signer.name}
                          onChange={e => updateSigner(signer.id, { name: e.target.value })}
                          placeholder={tr('Full name *', 'Nombre completo *')}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                        />
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={signer.email}
                            onChange={e => updateSigner(signer.id, { email: e.target.value })}
                            placeholder={tr('Email (for link)', 'Email (para enlace)')}
                            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                          />
                          <input
                            type="text"
                            value={signer.role}
                            onChange={e => updateSigner(signer.id, { role: e.target.value })}
                            placeholder={tr('Role', 'Rol')}
                            className="w-20 shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                          />
                        </div>
                      </div>
                    ) : (
                      /* Info when pending/signed */
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {signer.name || `Parte ${idx + 1}`}
                        </p>
                        {signer.email && (
                          <p className="truncate text-[11px] text-slate-500">{signer.email}</p>
                        )}
                        {signer.role && (
                          <span className="text-[11px] text-slate-400">{signer.role}</span>
                        )}
                        {signer.status === 'signed' && (
                          <p className="mt-0.5 text-[11px] font-semibold text-emerald-600">
                            ✓ {tr('Signed', 'Firmado')}
                            {signer.signedAt &&
                              ` · ${new Date(signer.signedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          </p>
                        )}
                        {signer.status === 'pending' && (
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-amber-600">
                            <Loader2 className="size-3 animate-spin" />
                            {tr('Waiting for signature...', 'Esperando firma...')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Remove */}
                    {signers.length > 1 && signer.status !== 'signed' && (
                      <button
                        type="button"
                        onClick={() => removeSigner(signer.id)}
                        className="shrink-0 rounded-lg p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>

                  {/* Action buttons — only visible in Step 2 (not after all signed) */}
                  {signer.status === 'idle' && !allSigned && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSignNow(signer.id)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2 text-xs font-bold text-white shadow-sm transition hover:from-blue-500 hover:to-indigo-500"
                      >
                        <PenTool className="size-3.5" />
                        {tr('Sign now', 'Firmar ahora')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendLink(signer.id)}
                        disabled={generatingLink === signer.id}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
                      >
                        {generatingLink === signer.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <QrCode className="size-3.5" />
                        )}
                        {tr('Send link', 'Enviar enlace')}
                      </button>
                    </div>
                  )}

                  {/* Pending: collapsible QR/link section */}
                  {signer.status === 'pending' && signer.guestLink && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setExpandedLinkId(isLinkExpanded ? null : signer.id)}
                        className="flex w-full items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 transition hover:bg-amber-100"
                      >
                        <span className="flex items-center gap-1.5">
                          <QrCode className="size-3.5" />
                          {tr('View signing link & QR', 'Ver enlace de firma y QR')}
                        </span>
                        {isLinkExpanded ? (
                          <ChevronUp className="size-3.5" />
                        ) : (
                          <ChevronDown className="size-3.5" />
                        )}
                      </button>

                      <AnimatePresence>
                        {isLinkExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 space-y-2">
                              <div className="mx-auto flex w-32 items-center justify-center rounded-xl bg-white p-2 shadow-sm">
                                <QRCodeSVG
                                  value={signer.guestLink}
                                  size={112}
                                  level="M"
                                  includeMargin
                                />
                              </div>
                              <a
                                href={signer.guestLink}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 break-all text-[10px] text-blue-600 underline"
                              >
                                <ExternalLink className="size-2.5 shrink-0" />
                                {signer.guestLink}
                              </a>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await navigator.clipboard.writeText(signer.guestLink!);
                                    toast.success(tr('Copied!', '¡Copiado!'));
                                  }}
                                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                  <Copy className="size-3" />
                                  {tr('Copy', 'Copiar')}
                                </button>
                                <a
                                  href={`https://wa.me/?text=${encodeURIComponent(
                                    (language === 'es'
                                      ? 'Por favor firma este documento: '
                                      : 'Please sign this document: ') + signer.guestLink,
                                  )}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-100"
                                >
                                  <Send className="size-3" />
                                  WhatsApp
                                </a>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Signed: signature thumbnail */}
                  {signer.status === 'signed' && signer.signatureDataUrl && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-emerald-200 bg-white p-2">
                      <img
                        src={signer.signatureDataUrl}
                        alt={tr('Signature', 'Firma')}
                        className="mx-auto max-h-12 object-contain opacity-90"
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Signature progress & download */}
        <AnimatePresence>
          {/* Waiting state: some signed but not all */}
          {signedSigners.length > 0 && !allSigned && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mt-4"
            >
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin text-amber-600" />
                    <p className="text-xs font-bold text-amber-800">
                      {signedSigners.length}/{signers.length}{' '}
                      {tr('signer(s) completed', 'firmante(s) completado(s)')}
                    </p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-amber-200">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${(signedSigners.length / signers.length) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-amber-700">
                  {tr(
                    `Waiting for ${pendingSigners.length} remaining signature(s) before download unlocks.`,
                    `Esperando ${pendingSigners.length} firma(s) restante(s) para desbloquear la descarga.`,
                  )}
                </p>
                {/* Pending signer names */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {pendingSigners.map(s => (
                    <span
                      key={s.id}
                      className="rounded-full border border-amber-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-700"
                    >
                      ⏳ {s.name || tr(`Signer`, `Firmante`)}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* All signed — download unlocked */}
          {allSigned && (
            <motion.div
              key="all-signed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mt-4"
            >
              <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <p className="text-xs font-bold text-emerald-800">
                    {tr('All signers completed — document ready!', '¡Todos firmaron — documento listo!')}
                  </p>
                </div>
                {/* Progress bar — full */}
                <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-emerald-200">
                  <div className="h-full w-full rounded-full bg-emerald-500" />
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-emerald-500 hover:to-green-500 hover:shadow-lg"
                >
                  <Download className="size-4" />
                  {tr('Download Signed PDF', 'Descargar PDF Firmado')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Signature modal */}
      <SignatureModal
        open={!!activeModalId && !!activeModal}
        onOpenChange={(v) => { if (!v) setActiveModalId(null); }}
        signerName={activeModal?.name ?? ''}
        title={tr('Signing as', 'Firmando como') + ': ' + (activeModal?.name ?? '')}
        onConfirm={(dataUrl) => {
          if (activeModalId) handleSignatureComplete(activeModalId, dataUrl);
        }}
      />
    </>
  );
}
