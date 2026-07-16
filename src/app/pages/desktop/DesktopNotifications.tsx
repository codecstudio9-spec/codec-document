import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { PenLine, BellOff, CheckCheck } from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { DesktopAppShell } from '../../components/desktop/DesktopAppShell';
import { fetchMySignTransactions } from '../../services/mobile-dashboard-service';
import { markTransactionViewed, markAllTransactionsViewed, stashSignedTransactionForDownload, type SignTransaction } from '../../services/sign-transaction-service';
import { CARD_RADIUS, CARD_SHADOW } from '../../styles/mobile-theme';

const DOC_TYPE_LABEL_ES: Record<string, string> = {
  'residential-lease': 'Contrato de arrendamiento',
  'bill-of-sale-vehicle': 'Compraventa de vehículo',
  'promissory-note': 'Pagaré',
  nda: 'Acuerdo de confidencialidad',
  'independent-contractor': 'Contrato de servicios',
  'service-agreement': 'Contrato de servicios',
};
const DOC_TYPE_LABEL_EN: Record<string, string> = {
  'residential-lease': 'Residential lease',
  'bill-of-sale-vehicle': 'Vehicle bill of sale',
  'promissory-note': 'Promissory note',
  nda: 'Non-disclosure agreement',
  'independent-contractor': 'Service agreement',
  'service-agreement': 'Service agreement',
};

export function DesktopNotifications() {
  return (
    <DesktopAppShell>
      <NotificationsContent />
    </DesktopAppShell>
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

  const unread = (txs ?? []).filter((t) => t.status === 'completed' && !t.viewed_at);
  const docTypeLabel = language === 'en' ? DOC_TYPE_LABEL_EN : DOC_TYPE_LABEL_ES;

  const openOne = (tx: SignTransaction) => {
    void markTransactionViewed(tx.id);
    setTxs((prev) => prev?.map((t) => (t.id === tx.id ? { ...t, viewed_at: new Date().toISOString() } : t)) ?? prev);
    stashSignedTransactionForDownload(tx, language);
    navigate(`/preview/${tx.document_type}`);
  };

  const markAll = async () => {
    if (!user?.id) return;
    await markAllTransactionsViewed(user.id);
    setTxs((prev) => prev?.map((t) => (t.status === 'completed' ? { ...t, viewed_at: new Date().toISOString() } : t)) ?? prev);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">{language === 'en' ? 'Notifications' : 'Notificaciones'}</h1>
        {unread.length > 0 && (
          <button type="button" onClick={() => void markAll()} className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
            <CheckCheck className="size-3.5" /> {language === 'en' ? 'Mark all as read' : 'Marcar todas como leídas'}
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-400">{language === 'en' ? "Documents that were signed and you haven't opened yet" : 'Documentos que firmaron y aún no has abierto'}</p>

      <div className="mt-6 space-y-3">
        {txs === null ? (
          [0, 1].map((i) => <div key={i} className="h-20 animate-pulse bg-white" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }} />)
        ) : unread.length === 0 ? (
          <div className="bg-white px-6 py-16 text-center" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
            <BellOff className="mx-auto mb-2 size-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">{language === 'en' ? "You don't have any new notifications" : 'No tienes notificaciones nuevas'}</p>
          </div>
        ) : (
          unread.map((tx) => (
            <motion.button
              key={tx.id}
              whileHover={{ y: -1 }}
              type="button"
              onClick={() => openOne(tx)}
              className="flex w-full items-center gap-3 bg-white p-5 text-left"
              style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: '#ECFDF5' }}>
                <PenLine className="size-5" style={{ color: '#10B981' }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{docTypeLabel[tx.document_type] || tx.document_type} — {language === 'en' ? 'signed' : 'firmado'}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {tx.signed_at ? new Date(tx.signed_at).toLocaleString(language === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: '#2563EB' }} />
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}
