import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { PenLine, Clock, CheckCircle2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { MobileAppShell } from '../../components/mobile/MobileAppShell';
import { MobileSignInPrompt } from '../../components/mobile/MobileSignInPrompt';
import { fetchMySignTransactions } from '../../services/mobile-dashboard-service';
import { isActiveTxStatus, stashSignedTransactionForDownload, type SignTransaction } from '../../services/sign-transaction-service';
import { CARD_RADIUS, CARD_SHADOW, DARK_GRADIENT, BLUE_GRADIENT } from '../../styles/mobile-theme';

const DOC_TYPE_LABEL: Record<string, string> = {
  'residential-lease': 'Contrato de arrendamiento',
  'bill-of-sale-vehicle': 'Compraventa de vehículo',
  'promissory-note': 'Pagaré',
  nda: 'Acuerdo de confidencialidad',
  'independent-contractor': 'Contrato de servicios',
  'service-agreement': 'Contrato de servicios',
};

export function MobileSignatures() {
  return (
    <MobileAppShell>
      <SignaturesContent />
    </MobileAppShell>
  );
}

function SignaturesContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [tab, setTab] = useState<'pending' | 'signed'>('pending');
  const [txs, setTxs] = useState<SignTransaction[] | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchMySignTransactions(user.id).then(setTxs).catch(() => setTxs([]));
  }, [user?.id]);

  const pending = (txs ?? []).filter((t) => isActiveTxStatus(t.status));
  const signed = (txs ?? []).filter((t) => t.status === 'completed');
  const list = tab === 'pending' ? pending : signed;

  if (!user) {
    return (
      <div>
        <div className="px-4 pb-8 pt-6" style={{ background: DARK_GRADIENT }}>
          <h1 className="text-xl font-black text-white">Firmas</h1>
          <p className="mt-0.5 text-xs text-white/40">Documentos enviados a firmar</p>
        </div>
        <MobileSignInPrompt
          icon={PenLine}
          title="Inicia sesión para ver tus firmas"
          description="Aquí verás las solicitudes de firma pendientes y ya firmadas de tu cuenta."
        />
      </div>
    );
  }

  return (
    <div>
      {/* Dark header block — same mixed light/dark treatment as
          Plantillas (blue) and Perfil (blue), this one navy for variety. */}
      <div className="px-4 pb-8 pt-6" style={{ background: DARK_GRADIENT }}>
        <h1 className="text-xl font-black text-white">Firmas</h1>
        <p className="mt-0.5 text-xs text-white/40">Documentos enviados a firmar</p>
      </div>

      <div className="px-4">
      {/* Tabs — pulled up to overlap the header, floating-card look */}
      <div className="-mt-5 flex gap-2 bg-white p-1.5" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
        <button
          type="button"
          onClick={() => setTab('pending')}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition"
          style={tab === 'pending' ? { background: '#2563EB', color: '#fff' } : { color: '#6B7280' }}
        >
          Pendientes {txs !== null && pending.length > 0 && <span className="text-xs opacity-80">({pending.length})</span>}
        </button>
        <button
          type="button"
          onClick={() => setTab('signed')}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition"
          style={tab === 'signed' ? { background: '#2563EB', color: '#fff' } : { color: '#6B7280' }}
        >
          Firmados {txs !== null && signed.length > 0 && <span className="text-xs opacity-80">({signed.length})</span>}
        </button>
      </div>

      {/* List */}
      <div className="mt-4 space-y-2.5">
        {txs === null ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse bg-white" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }} />
          ))
        ) : list.length === 0 ? (
          <div className="bg-white px-4 py-10 text-center" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
            {tab === 'pending' ? (
              <>
                <Clock className="mx-auto mb-2 size-7 text-slate-300" />
                <p className="text-sm font-semibold text-slate-500">No tienes firmas pendientes</p>
              </>
            ) : (
              <>
                <CheckCircle2 className="mx-auto mb-2 size-7 text-slate-300" />
                <p className="text-sm font-semibold text-slate-500">Aún no tienes documentos firmados</p>
              </>
            )}
            <button
              type="button"
              onClick={() => navigate('/app/templates')}
              className="mt-3 text-xs font-bold text-blue-600"
            >
              Crear un documento para firmar →
            </button>
          </div>
        ) : (
          list.map((tx) => {
            const isSigned = tx.status === 'completed';
            const label = DOC_TYPE_LABEL[tx.document_type] || tx.document_type;
            const handleTap = () => {
              if (isSigned) {
                // The recipient's signature only ever gets stamped onto the
                // final document here — nothing notifies the sender when
                // it happens, so this is the actual "open it and see the
                // signed result" entry point, not /sign/:id (that page is
                // the recipient's own signing flow).
                stashSignedTransactionForDownload(tx, language);
                navigate(`/preview/${tx.document_type}`);
                return;
              }
              const link = `${window.location.origin}/sign/${tx.id}`;
              navigator.clipboard.writeText(link).then(() => {
                toast.success(language === 'en' ? 'Signing link copied' : 'Enlace de firma copiado');
              }).catch(() => {
                toast.error(language === 'en' ? "Couldn't copy the link" : 'No se pudo copiar el enlace');
              });
            };
            return (
              <motion.button
                key={tx.id}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleTap}
                className="flex w-full items-center gap-3 bg-white p-4 text-left"
                style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
              >
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: isSigned ? '#ECFDF5' : '#FFFBEB' }}
                >
                  <PenLine className="size-5" style={{ color: isSigned ? '#10B981' : '#F59E0B' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{label}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {isSigned ? 'Firmado' : 'Enviado'} el {new Date(tx.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    {!isSigned && ' · toca para copiar el enlace'}
                  </p>
                </div>
                {isSigned ? (
                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{ color: '#10B981', background: '#ECFDF5' }}
                  >
                    Firmado
                  </span>
                ) : (
                  <span
                    className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{ color: '#F59E0B', background: '#FFFBEB' }}
                  >
                    <Copy className="size-3" /> Pendiente
                  </span>
                )}
              </motion.button>
            );
          })
        )}
      </div>
      </div>

      {/* Floating action — start a new signature request */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        type="button"
        onClick={() => navigate('/app/templates')}
        className="fixed flex items-center justify-center text-white"
        style={{
          bottom: 96, right: 20, width: 56, height: 56, borderRadius: 18,
          background: BLUE_GRADIENT,
          boxShadow: '0 14px 28px rgba(37,99,235,0.4)',
        }}
      >
        <PenLine className="size-5" />
      </motion.button>
    </div>
  );
}
