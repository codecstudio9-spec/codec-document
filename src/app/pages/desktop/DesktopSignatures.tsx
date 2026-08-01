import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { PenLine, Clock, CheckCircle2, XCircle, Copy, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { DesktopAppShell } from '../../components/desktop/DesktopAppShell';
import { BulkSelectionBar } from '../../components/BulkSelectionBar';
import { useLongPress } from '../../hooks/use-long-press';
import { fetchMySignTransactions } from '../../services/mobile-dashboard-service';
import {
  isActiveTxStatus, stashSignedTransactionForDownload, markTransactionViewed, deleteSignTransaction,
  type SignTransaction,
} from '../../services/sign-transaction-service';
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
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirming, setBulkConfirming] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetchMySignTransactions(user.id).then(setTxs).catch(() => setTxs([]));
  }, [user?.id]);

  const pending = (txs ?? []).filter((t) => isActiveTxStatus(t.status));
  const signed = (txs ?? []).filter((t) => t.status === 'completed');
  const rejected = (txs ?? []).filter((t) => t.status === 'cancelled' || t.status === 'expired');
  const list = tab === 'pending' ? pending : tab === 'signed' ? signed : rejected;
  const docTypeLabel = language === 'en' ? DOC_TYPE_LABEL_EN : DOC_TYPE_LABEL_ES;

  const TABS: Array<{ key: Tab; label: string; count: number }> = [
    { key: 'pending', label: language === 'en' ? 'Pending' : 'Pendientes', count: pending.length },
    { key: 'signed', label: language === 'en' ? 'Signed' : 'Firmadas', count: signed.length },
    { key: 'rejected', label: language === 'en' ? 'Rejected' : 'Rechazadas', count: rejected.length },
  ];

  const changeTab = (t: Tab) => {
    setTab(t);
    setSelectMode(false);
    setSelected(new Set());
    setBulkConfirming(false);
  };
  const enterSelectMode = (id: string) => {
    setSelectMode(true);
    setSelected(new Set([id]));
  };
  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
    setBulkConfirming(false);
  };
  const allSelected = list.length > 0 && selected.size === list.length;
  const toggleSelectAll = () => setSelected(allSelected ? new Set() : new Set(list.map((t) => t.id)));

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    const targets = list.filter((t) => selected.has(t.id));
    const results = await Promise.allSettled(targets.map((t) => deleteSignTransaction(t.id).then(() => t.id)));
    const deletedIds = new Set(
      results.filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled').map((r) => r.value),
    );
    setTxs((prev) => prev?.filter((t) => !deletedIds.has(t.id)) ?? prev);
    const failedCount = results.length - deletedIds.size;
    if (failedCount > 0) {
      toast.error(language === 'en' ? `${failedCount} could not be deleted` : `${failedCount} no se pudieron eliminar`);
    } else {
      toast.success(language === 'en' ? 'Deleted' : 'Eliminado');
    }
    setBulkDeleting(false);
    exitSelectMode();
  };

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
      toast.success(language === 'en' ? 'Signing link copied' : 'Enlace de firma copiado');
    });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-black text-slate-900">{language === 'en' ? 'Signatures' : 'Firmas'}</h1>

      <div className="mt-5 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => changeTab(t.key)}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition"
            style={tab === t.key ? { background: '#2563EB', color: '#fff' } : { background: '#fff', color: '#374151', boxShadow: CARD_SHADOW }}
          >
            {t.label} {t.count > 0 && <span className="text-xs opacity-80">({t.count})</span>}
          </button>
        ))}
      </div>

      {selectMode && (
        <div className="mt-5">
          <BulkSelectionBar
            language={language}
            selectedCount={selected.size}
            allSelected={allSelected}
            onToggleSelectAll={toggleSelectAll}
            onCancel={exitSelectMode}
            confirming={bulkConfirming}
            onRequestDelete={() => setBulkConfirming(true)}
            onConfirmDelete={() => void handleBulkDelete()}
            onCancelConfirm={() => setBulkConfirming(false)}
            deleting={bulkDeleting}
          />
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-4">
        {txs === null ? (
          [0, 1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse bg-white" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }} />)
        ) : list.length === 0 ? (
          <div className="col-span-2 bg-white px-6 py-16 text-center" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
            {tab === 'pending' ? <Clock className="mx-auto mb-2 size-8 text-slate-300" />
              : tab === 'signed' ? <CheckCircle2 className="mx-auto mb-2 size-8 text-slate-300" />
              : <XCircle className="mx-auto mb-2 size-8 text-slate-300" />}
            <p className="text-sm font-semibold text-slate-500">{language === 'en' ? 'Nothing here yet' : 'Nada por aquí todavía'}</p>
          </div>
        ) : (
          list.map((tx) => (
            <DesktopSigCard
              key={tx.id}
              tx={tx}
              tab={tab}
              language={language}
              docTypeLabel={docTypeLabel}
              selectMode={selectMode}
              selected={selected.has(tx.id)}
              onEnterSelectMode={enterSelectMode}
              onToggleSelected={toggleSelected}
              onOpen={openTx}
              onCopyLink={copyLink}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface DesktopSigCardProps {
  tx: SignTransaction;
  tab: Tab;
  language: 'en' | 'es';
  docTypeLabel: Record<string, string>;
  selectMode: boolean;
  selected: boolean;
  onEnterSelectMode: (id: string) => void;
  onToggleSelected: (id: string) => void;
  onOpen: (tx: SignTransaction) => void;
  onCopyLink: (e: React.MouseEvent, tx: SignTransaction) => void;
}

function DesktopSigCard({
  tx, tab, language, docTypeLabel, selectMode, selected,
  onEnterSelectMode, onToggleSelected, onOpen, onCopyLink,
}: DesktopSigCardProps) {
  const isSigned = tx.status === 'completed';
  const isRejected = tx.status === 'cancelled' || tx.status === 'expired';
  const label = docTypeLabel[tx.document_type] || tx.document_type;
  const style = isSigned
    ? { color: '#10B981', bg: '#ECFDF5', text: language === 'en' ? 'Signed' : 'Firmado' }
    : isRejected
      ? { color: '#EF4444', bg: '#FEF2F2', text: language === 'en' ? 'Rejected' : 'Rechazado' }
      : { color: '#F59E0B', bg: '#FFFBEB', text: language === 'en' ? 'Pending' : 'Pendiente' };

  const longPress = useLongPress({
    onLongPress: () => onEnterSelectMode(tx.id),
    onTap: () => (selectMode ? onToggleSelected(tx.id) : onOpen(tx)),
  });

  return (
    <motion.button
      whileHover={{ y: -2 }}
      type="button"
      {...longPress}
      className="flex items-center gap-3 bg-white p-4 text-left"
      style={{
        borderRadius: CARD_RADIUS,
        boxShadow: CARD_SHADOW,
        outline: selected ? '2px solid #2563EB' : undefined,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {selectMode && (
        <span className="flex size-6 shrink-0 items-center justify-center">
          {selected ? <CheckCircle2 className="size-5 text-blue-600" /> : <Circle className="size-5 text-slate-300" />}
        </span>
      )}
      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: style.bg }}>
        <PenLine className="size-5" style={{ color: style.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900">{label}</p>
        <p className="mt-0.5 text-xs text-slate-400">
          {new Date(tx.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short' })}
        </p>
      </div>
      {!selectMode && (
        tab === 'pending' ? (
          <button
            type="button"
            onClick={(e) => onCopyLink(e, tx)}
            className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
            style={{ color: style.color, background: style.bg }}
          >
            <Copy className="size-3" /> {language === 'en' ? 'Copy' : 'Copiar'}
          </button>
        ) : (
          <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ color: style.color, background: style.bg }}>
            {style.text}
          </span>
        )
      )}
    </motion.button>
  );
}
