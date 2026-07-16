import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Search, FileText, Download, Check, Clock, FileEdit, ArrowUpDown, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { DesktopAppShell } from '../../components/desktop/DesktopAppShell';
import {
  fetchUserDocuments, fetchAssociatedDocuments, deleteDocumentRecord, deleteAssociatedDocument,
  type UserDocument, type AssociatedDocument,
} from '../../services/documents-service';
import { CARD_RADIUS, CARD_SHADOW } from '../../styles/mobile-theme';

type UnifiedDoc = { id: string; kind: 'own' | 'associated'; name: string; status: string; date: string; href: string | null };
type Filter = 'all' | 'draft' | 'signed' | 'pending';
type SortMode = 'newest' | 'oldest' | 'name';

function classify(status: string): Filter {
  if (status === 'completed') return 'signed';
  if (!status || status === 'draft') return 'draft';
  return 'pending';
}

export function DesktopDocuments() {
  return (
    <DesktopAppShell>
      <DocumentsContent />
    </DesktopAppShell>
  );
}

function DocumentsContent() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<UnifiedDoc[] | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('newest');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      fetchUserDocuments(user.id).catch(() => [] as UserDocument[]),
      fetchAssociatedDocuments(user.id).catch(() => [] as AssociatedDocument[]),
    ]).then(([own, associated]) => {
      const unified: UnifiedDoc[] = [
        ...own.map((d) => ({ id: d.id, kind: 'own' as const, name: d.document_name, status: 'draft', date: d.created_at, href: `/preview/${d.template_id}` })),
        ...associated.map((d) => ({ id: d.id, kind: 'associated' as const, name: d.name, status: d.status, date: d.created_at, href: d.signed_pdf_url || d.original_pdf_url })),
      ];
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

  const filtered = useMemo(() => {
    let rows = (docs ?? []).filter((d) => filter === 'all' || classify(d.status) === filter);
    const q = query.trim().toLowerCase();
    if (q) rows = rows.filter((d) => d.name.toLowerCase().includes(q));
    rows = [...rows].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return sort === 'oldest' ? -diff : diff;
    });
    return rows;
  }, [docs, filter, query, sort]);

  const FILTERS: Array<{ key: Filter; label: string }> = [
    { key: 'all', label: language === 'en' ? 'All' : 'Todos' },
    { key: 'draft', label: language === 'en' ? 'Drafts' : 'Borradores' },
    { key: 'signed', label: language === 'en' ? 'Signed' : 'Firmados' },
    { key: 'pending', label: language === 'en' ? 'Pending' : 'Pendientes' },
  ];

  const sortLabel = sort === 'newest'
    ? (language === 'en' ? 'Newest' : 'Más recientes')
    : sort === 'oldest'
      ? (language === 'en' ? 'Oldest' : 'Más antiguos')
      : (language === 'en' ? 'Name A-Z' : 'Nombre A-Z');

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">{language === 'en' ? 'My Documents' : 'Mis Documentos'}</h1>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={language === 'en' ? 'Search documents...' : 'Buscar documentos...'}
            className="w-full rounded-2xl bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none"
            style={{ boxShadow: CARD_SHADOW }}
          />
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className="rounded-full px-4 py-2 text-xs font-bold transition"
              style={filter === f.key ? { background: '#2563EB', color: '#fff' } : { background: '#fff', color: '#374151', boxShadow: CARD_SHADOW }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSort((s) => (s === 'newest' ? 'oldest' : s === 'oldest' ? 'name' : 'newest'))}
          className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-600"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <ArrowUpDown className="size-3.5" />
          {sortLabel}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {docs === null ? (
          [0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-32 animate-pulse bg-white" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }} />)
        ) : filtered.length === 0 ? (
          <div className="col-span-3 bg-white px-6 py-16 text-center" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
            <FileText className="mx-auto mb-2 size-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">{language === 'en' ? 'Nothing here yet' : 'Nada por aquí todavía'}</p>
          </div>
        ) : (
          filtered.map((doc) => {
            if (confirmingId === doc.id) {
              return (
                <div
                  key={doc.id}
                  className="flex flex-col justify-between gap-3 p-5"
                  style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW, background: '#FEF2F2' }}
                >
                  <div className="flex items-start gap-2">
                    <Trash2 className="size-5 shrink-0 text-red-500" />
                    <p className="text-sm font-semibold text-red-700">
                      {language === 'en' ? `Delete "${doc.name}"? This can't be undone.` : `¿Eliminar "${doc.name}"? No se puede deshacer.`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setConfirmingId(null)} className="flex-1 rounded-xl bg-white py-2 text-xs font-bold text-slate-600">
                      {language === 'en' ? 'Cancel' : 'Cancelar'}
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === doc.id}
                      onClick={() => void handleDelete(doc)}
                      className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {deletingId === doc.id ? '...' : (language === 'en' ? 'Delete' : 'Eliminar')}
                    </button>
                  </div>
                </div>
              );
            }

            const c = classify(doc.status);
            const style = c === 'signed'
              ? { color: '#10B981', bg: '#ECFDF5', label: language === 'en' ? 'Signed' : 'Firmado' }
              : c === 'draft'
                ? { color: '#6B7280', bg: '#F1F5F9', label: language === 'en' ? 'Draft' : 'Borrador' }
                : { color: '#F59E0B', bg: '#FFFBEB', label: language === 'en' ? 'Pending' : 'Pendiente' };
            return (
              <motion.div
                key={doc.id}
                whileHover={{ y: -2 }}
                className="group relative flex flex-col items-start gap-3 bg-white p-5 text-left"
                style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
              >
                <button
                  type="button"
                  onClick={() => setConfirmingId(doc.id)}
                  className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-xl bg-slate-50 opacity-0 transition group-hover:opacity-100"
                >
                  <Trash2 className="size-4 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!doc.href) return;
                    if (doc.href.startsWith('http')) window.open(doc.href, '_blank', 'noopener,noreferrer');
                    else navigate(doc.href);
                  }}
                  className="flex w-full flex-col items-start gap-3 text-left"
                >
                  <div className="flex w-full items-start justify-between">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-indigo-50">
                      <FileText className="size-5 text-indigo-500" />
                    </div>
                    {doc.href && <Download className="size-4 text-slate-300" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{doc.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {new Date(doc.date).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ color: style.color, background: style.bg }}>
                    {c === 'signed' ? <Check className="size-3" /> : c === 'draft' ? <FileEdit className="size-3" /> : <Clock className="size-3" />}
                    {style.label}
                  </span>
                </button>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
