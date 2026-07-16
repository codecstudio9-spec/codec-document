import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, PenLine, BellOff, CheckCheck } from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { MobileAppShell } from '../../components/mobile/MobileAppShell';
import { MobileSignInPrompt } from '../../components/mobile/MobileSignInPrompt';
import { fetchMySignTransactions } from '../../services/mobile-dashboard-service';
import { markTransactionViewed, markAllTransactionsViewed, stashSignedTransactionForDownload, type SignTransaction } from '../../services/sign-transaction-service';
import { CARD_RADIUS, CARD_SHADOW, DARK_GRADIENT } from '../../styles/mobile-theme';

const DOC_TYPE_LABEL: Record<string, string> = {
  'residential-lease': 'Contrato de arrendamiento',
  'bill-of-sale-vehicle': 'Compraventa de vehículo',
  'promissory-note': 'Pagaré',
  nda: 'Acuerdo de confidencialidad',
  'independent-contractor': 'Contrato de servicios',
  'service-agreement': 'Contrato de servicios',
};

export function MobileNotifications() {
  return (
    <MobileAppShell>
      <NotificationsContent />
    </MobileAppShell>
  );
}

function NotificationsContent() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [txs, setTxs] = useState<SignTransaction[] | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchMySignTransactions(user.id).then(setTxs).catch(() => setTxs([]));
  }, [user?.id]);

  if (!user) {
    return (
      <div>
        <div className="px-4 pb-8 pt-6" style={{ background: DARK_GRADIENT }}>
          <h1 className="text-xl font-black text-white">Notificaciones</h1>
        </div>
        <MobileSignInPrompt
          icon={BellOff}
          title="Inicia sesión para ver tus notificaciones"
          description="Aquí verás cuándo alguien firma un documento que le enviaste."
        />
      </div>
    );
  }

  const unread = (txs ?? []).filter((t) => t.status === 'completed' && !t.viewed_at);

  const openOne = (tx: SignTransaction) => {
    void markTransactionViewed(tx.id);
    setTxs((prev) => prev?.map((t) => (t.id === tx.id ? { ...t, viewed_at: new Date().toISOString() } : t)) ?? prev);
    stashSignedTransactionForDownload(tx, language);
    navigate(`/preview/${tx.document_type}`);
  };

  const markAll = async () => {
    if (!user.id) return;
    await markAllTransactionsViewed(user.id);
    setTxs((prev) => prev?.map((t) => (t.status === 'completed' ? { ...t, viewed_at: new Date().toISOString() } : t)) ?? prev);
  };

  return (
    <div>
      <div className="px-4 pb-6 pt-6" style={{ background: DARK_GRADIENT }}>
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => navigate('/app/profile')} className="flex size-8 items-center justify-center rounded-xl bg-white/10">
            <ArrowLeft className="size-4 text-white" />
          </motion.button>
          <div>
            <h1 className="text-xl font-black text-white">Notificaciones</h1>
            <p className="mt-0.5 text-xs text-white/40">Documentos que firmaron y aún no has abierto</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {unread.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => void markAll()}
            className="mb-3 flex w-full items-center justify-center gap-2 py-2.5 text-xs font-bold text-blue-600"
          >
            <CheckCheck className="size-3.5" /> Marcar todas como leídas
          </motion.button>
        )}

        {txs === null ? (
          <div className="space-y-2.5">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 animate-pulse bg-white" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }} />
            ))}
          </div>
        ) : unread.length === 0 ? (
          <div className="bg-white px-4 py-10 text-center" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
            <BellOff className="mx-auto mb-2 size-7 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">No tienes notificaciones nuevas</p>
            <p className="mt-0.5 text-xs text-slate-400">Aquí aparecerán los documentos en cuanto alguien los firme</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {unread.map((tx) => (
              <motion.button
                key={tx.id}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => openOne(tx)}
                className="flex w-full items-center gap-3 bg-white p-4 text-left"
                style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: '#ECFDF5' }}>
                  <PenLine className="size-5" style={{ color: '#10B981' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {DOC_TYPE_LABEL[tx.document_type] || tx.document_type} — firmado
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {tx.signed_at ? new Date(tx.signed_at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: '#2563EB' }} />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
