import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Plus, FileText, Download, Check, Clock, FileEdit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { MobileAppShell } from '../../components/mobile/MobileAppShell';
import { MobileSignInPrompt } from '../../components/mobile/MobileSignInPrompt';
import {
  fetchUserDocuments, fetchAssociatedDocuments, deleteDocumentRecord, deleteAssociatedDocument,
  type UserDocument, type AssociatedDocument,
} from '../../services/documents-service';
import { CARD_RADIUS, CARD_SHADOW, BLUE_GRADIENT } from '../../styles/mobile-theme';

type UnifiedDoc = {
  id: string;
  kind: 'own' | 'associated';
  name: string;
  status: string;
  date: string;
  href: string | null;
};

type Filter = 'all' | 'draft' | 'signed' | 'pending';

function classify(status: string): Filter {
  if (status === 'completed') return 'signed';
  if (!status || status === 'draft') return 'draft';
  return 'pending';
}

export function MobileDocuments() {
  return (
    <MobileAppShell>
      <DocumentsContent />
    </MobileAppShell>
  );
}

function DocumentsContent() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<UnifiedDoc[] | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      fetchUserDocuments(user.id).catch(() => [] as UserDocument[]),
      fetchAssociatedDocuments(user.id).catch(() => [] as AssociatedDocument[]),
    ]).then(([own, associated]) => {
      const unified: UnifiedDoc[] = [
        ...own.map((d) => ({
          id: d.id, kind: 'own' as const, name: d.document_name, status: 'draft', date: d.created_at,
          href: `/preview/${d.template_id}`,
        })),
        ...associated.map((d) => ({
          id: d.id, kind: 'associated' as const, name: d.name, status: d.status, date: d.created_at,
          href: d.signed_pdf_url || d.original_pdf_url,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setDocs(unified);
    });
  }, [user?.id]);

  const handleDelete = async (doc: UnifiedDoc) => {
    setDeletingId(doc.id);
    try {
      if (doc.kind === 'own') await deleteDocumentRecord(doc.id);
      else await deleteAssociatedDocument(doc.id);
      setDocs((prev) => prev?.filter((d) => d.id !== doc.id) ?? prev);
      toast.success(language === 'en' ? 'Document deleted' : 'Documento eliminado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not delete the document' : 'No se pudo eliminar el documento'));
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  };

  const filtered = (docs ?? []).filter((d) => filter === 'all' || classify(d.status) === filter);

  const FILTERS: Array<{ key: Filter; label: string }> = [
    { key: 'all', label: language === 'en' ? 'All' : 'Todos' },
    { key: 'draft', label: language === 'en' ? 'Drafts' : 'Borradores' },
    { key: 'signed', label: language === 'en' ? 'Signed' : 'Firmados' },
    { key: 'pending', label: language === 'en' ? 'Pending' : 'Pendientes' },
  ];

  if (!user) {
    return (
      <div className="px-4 pt-5">
        <h1 className="text-xl font-black text-slate-900">{language === 'en' ? 'Documents' : 'Documentos'}</h1>
        <MobileSignInPrompt
          icon={FileText}
          title={language === 'en' ? 'Sign in to see your documents' : 'Inicia sesión para ver tus documentos'}
          description={language === 'en' ? 'Your drafts and signed documents will show up here once you have an account.' : 'Tus borradores y documentos firmados aparecerán aquí una vez tengas una cuenta.'}
        />
      </div>
    );
  }

  return (
    <div className="relative px-4 pt-5">
      <h1 className="text-xl font-black text-slate-900">{language === 'en' ? 'Documents' : 'Documentos'}</h1>

      {/* Filters */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition active:scale-95"
            style={
              filter === f.key
                ? { background: '#2563EB', color: '#fff' }
                : { background: '#fff', color: '#374151', border: '1px solid #E5E7EB' }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-4 space-y-2.5">
        {docs === null ? (
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse bg-white" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }} />
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white px-4 py-10 text-center" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
            <FileText className="mx-auto mb-2 size-7 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">{language === 'en' ? 'Nothing here yet' : 'Nada por aquí todavía'}</p>
          </div>
        ) : (
          filtered.map((doc) => {
            if (confirmingId === doc.id) {
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-4"
                  style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW, background: '#FEF2F2' }}
                >
                  <Trash2 className="size-5 shrink-0 text-red-500" />
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-red-700">
                    {language === 'en' ? `Delete "${doc.name}"? This can't be undone.` : `¿Eliminar "${doc.name}"? No se puede deshacer.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600"
                  >
                    {language === 'en' ? 'Cancel' : 'Cancelar'}
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === doc.id}
                    onClick={() => void handleDelete(doc)}
                    className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {deletingId === doc.id ? '...' : (language === 'en' ? 'Delete' : 'Eliminar')}
                  </button>
                </div>
              );
            }

            const c = classify(doc.status);
            const style = c === 'signed'
              ? { color: '#10B981', bg: '#ECFDF5', label: language === 'en' ? 'Signed' : 'Firmado' }
              : c === 'draft'
                ? { color: '#6B7280', bg: '#F1F5F9', label: language === 'en' ? 'Draft' : 'Borrador' }
                : { color: '#F59E0B', bg: '#FFFBEB', label: language === 'en' ? 'Pending' : 'Pendiente' };
            const openDoc = () => {
              if (!doc.href) return;
              if (doc.href.startsWith('http')) {
                window.open(doc.href, '_blank', 'noopener,noreferrer');
              } else {
                navigate(doc.href);
              }
            };
            return (
              <motion.div
                key={doc.id}
                whileTap={{ scale: 0.99 }}
                className="flex items-center gap-2 bg-white p-4"
                style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
              >
                <button type="button" onClick={openDoc} disabled={!doc.href} className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:opacity-70">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50">
                    <FileText className="size-5 text-indigo-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{doc.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {style.label} · {new Date(doc.date).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full" style={{ background: style.bg }}>
                    {c === 'signed'
                      ? <Check className="size-3.5" style={{ color: style.color }} />
                      : c === 'draft'
                        ? <FileEdit className="size-3.5" style={{ color: style.color }} />
                        : <Clock className="size-3.5" style={{ color: style.color }} />}
                  </span>
                  {doc.href && (
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50">
                      <Download className="size-4 text-slate-500" />
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingId(doc.id)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 active:scale-90"
                >
                  <Trash2 className="size-4 text-slate-400" />
                </button>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Floating create button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        type="button"
        onClick={() => navigate('/app/templates')}
        className="fixed flex items-center justify-center text-white"
        style={{
          bottom: 96,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 18,
          background: BLUE_GRADIENT,
          boxShadow: '0 14px 28px rgba(37,99,235,0.4)',
        }}
      >
        <Plus className="size-6" />
      </motion.button>
    </div>
  );
}
