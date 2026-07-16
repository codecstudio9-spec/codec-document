import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { PenLine, Clock, CheckCircle2, XCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { DesktopAppShell } from '../../components/desktop/DesktopAppShell';
import { fetchMySignTransactions } from '../../services/mobile-dashboard-service';
import { isActiveTxStatus, stashSignedTransactionForDownload, markTransactionViewed, type SignTransaction } from '../../services/sign-transaction-service';
import { CARD_RADIUS, CARD_SHADOW } from '../../styles/mobile-theme';

const DOC_TYPE_LABEL: Record<string, string> = {
  'residential-lease': 'Contrato de arrendamiento',
  'bill-of-sale-vehicle': 'Compraventa de vehículo',
  'promissory-note': 'Pagaré',
  nda: 'Acuerdo de confidencialidad',
  'independent-contractor': 'Contrato de servicios',
  'service-agreement': 'Contrato de servicios',
};

type Tab = 'pending' | 'signed' | 'rejected';

export function DesktopSignatures() {
  return (
    <DesktopAppShell>
      <SignaturesContent />
    </DesktopAppShell>
  );
}

function SignaturesContent() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('pending');
  const [txs, setTxs] = useState<SignTransaction[] | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchMySignTransactions(user.id).then(setTxs).catch(() => setTxs([]));
  }, [user?.id]);

  const pending = (txs ?? []).filter((t) => isActiveTxStatus(t.status));
  const signed = (txs ?? []).filter((t) => t.status === 'completed');
  const rejected = (txs ?? []).filter((t) => t.status === 'cancelled' || t.status === 'expired');
  const list = tab === 'pending' ? pending : tab === 'signed' ? signed : rejected;

  const TABS: Array<{ key: Tab; label: string; count: number }> = [
    { key: 'pending', label: 'Pendientes', count: pending.length },
    { key: 'signed', label: 'Firmadas', count: signed.length },
    { key: 'rejected', label: 'Rechazadas', count: rejected.length },
  ];

  const openTx = (tx: SignTransaction) => {
    if (tx.status === 'completed') {
      if (!tx.viewed_at) void markTransactionViewed(tx.id);
      stashSignedTransactionForDownload(tx, language);
      navigate(`/preview/${tx.document_type}`);
      return;
    }
    navigate(`/sign/${tx.id}`);
  };

  const copyLink = (e: React.MouseEvent, tx: SignTransaction) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/sign/${tx.id}`).then(() => {
      toast.success('Enlace de firma copiado');
    });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-black text-slate-900">Firmas</h1>

      <div className="mt-5 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition"
            style={tab === t.key ? { background: '#2563EB', color: '#fff' } : { background: '#fff', color: '#374151', boxShadow: CARD_SHADOW }}
          >
            {t.label} {t.count > 0 && <span className="text-xs opacity-80">({t.count})</span>}
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        {txs === null ? (
          [0, 1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse bg-white" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }} />)
        ) : list.length === 0 ? (
          <div className="col-span-2 bg-white px-6 py-16 text-center" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
            {tab === 'pending' ? <Clock className="mx-auto mb-2 size-8 text-slate-300" />
              : tab === 'signed' ? <CheckCircle2 className="mx-auto mb-2 size-8 text-slate-300" />
              : <XCircle className="mx-auto mb-2 size-8 text-slate-300" />}
            <p className="text-sm font-semibold text-slate-500">Nada por aquí todavía</p>
          </div>
        ) : (
          list.map((tx) => {
            const isSigned = tx.status === 'completed';
            const isRejected = tx.status === 'cancelled' || tx.status === 'expired';
            const label = DOC_TYPE_LABEL[tx.document_type] || tx.document_type;
            const style = isSigned
              ? { color: '#10B981', bg: '#ECFDF5', text: 'Firmado' }
              : isRejected
                ? { color: '#EF4444', bg: '#FEF2F2', text: 'Rechazado' }
                : { color: '#F59E0B', bg: '#FFFBEB', text: 'Pendiente' };
            return (
              <motion.button
                key={tx.id}
                whileHover={{ y: -2 }}
                type="button"
                onClick={() => openTx(tx)}
                className="flex items-center gap-3 bg-white p-4 text-left"
                style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: style.bg }}>
                  <PenLine className="size-5" style={{ color: style.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{label}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {new Date(tx.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                {tab === 'pending' ? (
                  <button
                    type="button"
                    onClick={(e) => copyLink(e, tx)}
                    className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
                    style={{ color: style.color, background: style.bg }}
                  >
                    <Copy className="size-3" /> Copiar
                  </button>
                ) : (
                  <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ color: style.color, background: style.bg }}>
                    {style.text}
                  </span>
                )}
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}
