import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  Search, FileText, Download, Check, Clock, FileEdit, ArrowUpDown, Trash2, Pencil,
  CheckCircle2, Circle, Folder, FolderPlus, Loader, X, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { DesktopAppShell } from '../../components/desktop/DesktopAppShell';
import { DocumentEditModal } from '../../components/DocumentEditModal';
import { BulkSelectionBar } from '../../components/BulkSelectionBar';
import { useLongPress } from '../../hooks/use-long-press';
import {
  fetchUserDocuments, fetchAssociatedDocuments, deleteDocumentRecord, deleteAssociatedDocument,
  updateUserDocumentDetails, updateAssociatedDocumentDetails, getSignedDocumentExpiry,
  fetchDocumentFolders, createDocumentFolder, renameDocumentFolder, deleteDocumentFolder, moveDocumentToFolder,
  type UserDocument, type AssociatedDocument, type DocumentFolder,
} from '../../services/documents-service';
import { downloadFolderAsZip } from '../../utils/download-folder-zip';
import { CARD_RADIUS, CARD_SHADOW } from '../../styles/mobile-theme';
import { toProxiedPdfUrl } from '../../utils/pdf-proxy';
import { openDocumentUrl } from '../../utils/open-document-url';

type UnifiedDoc = {
  id: string; kind: 'own' | 'associated'; name: string; status: string; date: string;
  href: string | null; color: string | null; daysLeft: number | null;
  folderId: string | null;
  /** Which table owns this row — null for a synthetic sign_transaction
   * row (id `tx:<uuid>`, see fetchSignTransactionsAsDocuments), which has
   * no real row to file into a folder. */
  table: 'user_documents' | 'documents' | null;
};
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
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [folderModal, setFolderModal] = useState<'create' | DocumentFolder | null>(null);
  const [folderNameInput, setFolderNameInput] = useState('');
  const [folderSaving, setFolderSaving] = useState(false);
  const [zippingFolderId, setZippingFolderId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('newest');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingDoc, setEditingDoc] = useState<UnifiedDoc | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirming, setBulkConfirming] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      fetchUserDocuments(user.id).catch(() => [] as UserDocument[]),
      fetchAssociatedDocuments(user.id).catch(() => [] as AssociatedDocument[]),
      fetchDocumentFolders(user.id).catch(() => [] as DocumentFolder[]),
    ]).then(([own, associated, ownFolders]) => {
      const unified: UnifiedDoc[] = [
        ...own.map((d) => ({
          id: d.id, kind: 'own' as const, name: d.document_name, status: 'draft', date: d.created_at,
          href: `/preview/${d.template_id}`, color: d.color, daysLeft: null,
          folderId: d.folder_id, table: 'user_documents' as const,
        })),
        ...associated.map((d) => ({
          id: d.id, kind: 'associated' as const, name: d.name, status: d.status, date: d.created_at,
          href: d.signed_pdf_url || d.original_pdf_url || d.href || null, color: d.color,
          daysLeft: getSignedDocumentExpiry(d)?.daysLeft ?? null,
          folderId: d.folder_id, table: d.id.startsWith('tx:') ? null : ('documents' as const),
        })),
      ];
      setDocs(unified);
      setFolders(ownFolders);
    });
  }, [user?.id]);

  const handleCreateFolder = async () => {
    if (!user?.id || !folderNameInput.trim()) return;
    setFolderSaving(true);
    try {
      const created = await createDocumentFolder(user.id, folderNameInput.trim());
      setFolders((prev) => [...prev, created]);
      setFolderModal(null);
      setFolderNameInput('');
      toast.success(language === 'en' ? 'Folder created' : 'Carpeta creada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not create the folder' : 'No se pudo crear la carpeta'));
    } finally {
      setFolderSaving(false);
    }
  };

  const handleRenameFolder = async () => {
    if (typeof folderModal !== 'object' || !folderModal || !folderNameInput.trim()) return;
    setFolderSaving(true);
    try {
      await renameDocumentFolder(folderModal.id, folderNameInput.trim());
      setFolders((prev) => prev.map((f) => (f.id === folderModal.id ? { ...f, name: folderNameInput.trim() } : f)));
      setFolderModal(null);
      setFolderNameInput('');
      toast.success(language === 'en' ? 'Folder renamed' : 'Carpeta renombrada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not rename the folder' : 'No se pudo renombrar la carpeta'));
    } finally {
      setFolderSaving(false);
    }
  };

  const handleDeleteFolder = async (folder: DocumentFolder) => {
    try {
      await deleteDocumentFolder(folder.id);
      setFolders((prev) => prev.filter((f) => f.id !== folder.id));
      setDocs((prev) => prev?.map((d) => (d.folderId === folder.id ? { ...d, folderId: null } : d)) ?? prev);
      if (activeFolderId === folder.id) setActiveFolderId(null);
      toast.success(language === 'en' ? 'Folder deleted, documents kept, unfiled' : 'Carpeta eliminada, los documentos se conservaron sin carpeta');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not delete the folder' : 'No se pudo eliminar la carpeta'));
    }
  };

  const handleDownloadFolderZip = async (folder: DocumentFolder) => {
    // `href` is a real downloadable PDF URL only for signed documents —
    // a generated-template ('own') doc's href is an in-app route
    // (`/preview/:id`, compiled client-side, no stored file) and a
    // sign_transaction's is `/sign/:id`; fetching either as a PDF would
    // just zip up the SPA's index.html.
    const inFolder = (docs ?? []).filter((d) => d.folderId === folder.id && d.href?.startsWith('http'));
    if (inFolder.length === 0) {
      toast.error(language === 'en' ? 'This folder has no downloadable documents' : 'Esta carpeta no tiene documentos para descargar');
      return;
    }
    setZippingFolderId(folder.id);
    try {
      const { ok, failed } = await downloadFolderAsZip(folder.name, inFolder.map((d) => ({ name: d.name, url: d.href! })));
      if (ok === 0) {
        toast.error(language === 'en' ? 'Could not download any document in this folder' : 'No se pudo descargar ningún documento de esta carpeta');
      } else if (failed > 0) {
        toast.warning(language === 'en' ? `Downloaded ${ok}, ${failed} failed` : `Se descargaron ${ok}, ${failed} fallaron`);
      } else {
        toast.success(language === 'en' ? 'Folder downloaded' : 'Carpeta descargada');
      }
    } finally {
      setZippingFolderId(null);
    }
  };

  const handleSaveEdit = async (name: string, color: string | null, folderId: string | null) => {
    if (!editingDoc) return;
    setSavingEdit(true);
    try {
      if (editingDoc.kind === 'own') await updateUserDocumentDetails(editingDoc.id, name, color);
      else await updateAssociatedDocumentDetails(editingDoc.id, name, color);
      if (editingDoc.table && folderId !== editingDoc.folderId) {
        await moveDocumentToFolder(editingDoc.table, editingDoc.id, folderId);
      }
      setDocs((prev) => prev?.map((d) => (d.id === editingDoc.id ? { ...d, name, color, folderId: editingDoc.table ? folderId : d.folderId } : d)) ?? prev);
      toast.success(language === 'en' ? 'Document updated' : 'Documento actualizado');
      setEditingDoc(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not update the document' : 'No se pudo actualizar el documento'));
    } finally {
      setSavingEdit(false);
    }
  };

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
    if (activeFolderId !== null) rows = rows.filter((d) => d.folderId === activeFolderId);
    const q = query.trim().toLowerCase();
    if (q) rows = rows.filter((d) => d.name.toLowerCase().includes(q));
    rows = [...rows].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return sort === 'oldest' ? -diff : diff;
    });
    return rows;
  }, [docs, filter, query, sort, activeFolderId]);

  const folderCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of docs ?? []) {
      if (!d.folderId) continue;
      counts.set(d.folderId, (counts.get(d.folderId) ?? 0) + 1);
    }
    return counts;
  }, [docs]);

  const activeFolder = activeFolderId ? folders.find((f) => f.id === activeFolderId) ?? null : null;

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
  const allSelected = filtered.length > 0 && selected.size === filtered.length;
  const toggleSelectAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((d) => d.id)));

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    const targets = filtered.filter((d) => selected.has(d.id));
    const results = await Promise.allSettled(
      targets.map((d) => (d.kind === 'own' ? deleteDocumentRecord(d.id) : deleteAssociatedDocument(d.id)).then(() => d.id)),
    );
    const deletedIds = new Set(
      results.filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled').map((r) => r.value),
    );
    setDocs((prev) => prev?.filter((d) => !deletedIds.has(d.id)) ?? prev);
    const failedCount = results.length - deletedIds.size;
    if (failedCount > 0) {
      toast.error(language === 'en' ? `${failedCount} could not be deleted` : `${failedCount} no se pudieron eliminar`);
    } else {
      toast.success(language === 'en' ? 'Documents deleted' : 'Documentos eliminados');
    }
    setBulkDeleting(false);
    exitSelectMode();
  };

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
        <button
          type="button"
          onClick={() => navigate('/crear-documento')}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-bold text-white"
        >
          <Sparkles className="size-4" /> {language === 'en' ? 'Create a new document' : 'Crea un documento nuevo'}
        </button>
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

      {/* ── Folders — filed documents stay findable without scrolling
          past everything else; unfiled ones ("Todas") are unaffected. ── */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveFolderId(null)}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition"
          style={activeFolderId === null ? { background: '#0F172A', color: '#fff' } : { background: '#fff', color: '#374151', boxShadow: CARD_SHADOW }}
        >
          {language === 'en' ? 'All' : 'Todas'}
        </button>
        {folders.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFolderId(f.id)}
            className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition"
            style={activeFolderId === f.id ? { background: f.color ?? '#2563EB', color: '#fff' } : { background: '#fff', color: '#374151', boxShadow: CARD_SHADOW }}
          >
            <Folder className="size-3" />
            {f.name}
            <span className="opacity-70">{folderCounts.get(f.id) ?? 0}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => { setFolderModal('create'); setFolderNameInput(''); }}
          className="flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3.5 py-1.5 text-xs font-bold text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600"
        >
          <FolderPlus className="size-3.5" />
          {language === 'en' ? 'New folder' : 'Nueva carpeta'}
        </button>
      </div>

      {/* ── Active-folder toolbar — rename / download-as-zip / delete ── */}
      {activeFolder && (
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-white px-4 py-2.5" style={{ boxShadow: CARD_SHADOW }}>
          <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Folder className="size-4" style={{ color: activeFolder.color ?? '#2563EB' }} />
            {activeFolder.name}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => { setFolderModal(activeFolder); setFolderNameInput(activeFolder.name); }}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <Pencil className="size-3.5" /> {language === 'en' ? 'Rename' : 'Renombrar'}
            </button>
            <button
              type="button"
              disabled={zippingFolderId === activeFolder.id}
              onClick={() => void handleDownloadFolderZip(activeFolder)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {zippingFolderId === activeFolder.id ? <Loader className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
              {language === 'en' ? 'Download .zip' : 'Descargar .zip'}
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteFolder(activeFolder)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 className="size-3.5" /> {language === 'en' ? 'Delete folder' : 'Eliminar carpeta'}
            </button>
          </div>
        </div>
      )}

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

            return (
              <DesktopDocCard
                key={doc.id}
                doc={doc}
                language={language}
                navigate={navigate}
                selectMode={selectMode}
                selected={selected.has(doc.id)}
                onEnterSelectMode={enterSelectMode}
                onToggleSelected={toggleSelected}
                onEdit={() => setEditingDoc(doc)}
                onDeleteRequest={() => setConfirmingId(doc.id)}
              />
            );
          })
        )}
      </div>

      <DocumentEditModal
        open={editingDoc !== null}
        initialName={editingDoc?.name ?? ''}
        initialColor={editingDoc?.color ?? null}
        folders={editingDoc?.table ? folders : []}
        initialFolderId={editingDoc?.folderId ?? null}
        isSaving={savingEdit}
        onClose={() => setEditingDoc(null)}
        onSave={(name, color, folderId) => void handleSaveEdit(name, color, folderId)}
      />

      {/* ── Create / rename folder ── */}
      {folderModal !== null && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setFolderModal(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {folderModal === 'create'
                  ? (language === 'en' ? 'New folder' : 'Nueva carpeta')
                  : (language === 'en' ? 'Rename folder' : 'Renombrar carpeta')}
              </h2>
              <button type="button" onClick={() => setFolderModal(null)} className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
                <X className="size-4" />
              </button>
            </div>
            <input
              autoFocus
              value={folderNameInput}
              onChange={(e) => setFolderNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void (folderModal === 'create' ? handleCreateFolder() : handleRenameFolder()); }}
              maxLength={60}
              placeholder={language === 'en' ? 'e.g. "Client: Acme Corp"' : 'ej. "Cliente: Acme Corp"'}
              className="mb-5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400"
            />
            <button
              type="button"
              disabled={!folderNameInput.trim() || folderSaving}
              onClick={() => void (folderModal === 'create' ? handleCreateFolder() : handleRenameFolder())}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
            >
              {folderSaving
                ? <><Loader className="size-4 animate-spin" />{language === 'en' ? 'Saving…' : 'Guardando…'}</>
                : (folderModal === 'create' ? (language === 'en' ? 'Create' : 'Crear') : (language === 'en' ? 'Save' : 'Guardar'))}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface DesktopDocCardProps {
  doc: UnifiedDoc;
  language: 'en' | 'es';
  navigate: ReturnType<typeof useNavigate>;
  selectMode: boolean;
  selected: boolean;
  onEnterSelectMode: (id: string) => void;
  onToggleSelected: (id: string) => void;
  onEdit: () => void;
  onDeleteRequest: () => void;
}

function DesktopDocCard({
  doc, language, navigate, selectMode, selected,
  onEnterSelectMode, onToggleSelected, onEdit, onDeleteRequest,
}: DesktopDocCardProps) {
  const c = classify(doc.status);
  const style = c === 'signed'
    ? { color: '#10B981', bg: '#ECFDF5', label: language === 'en' ? 'Signed' : 'Firmado' }
    : c === 'draft'
      ? { color: '#6B7280', bg: '#F1F5F9', label: language === 'en' ? 'Draft' : 'Borrador' }
      : { color: '#F59E0B', bg: '#FFFBEB', label: language === 'en' ? 'Pending' : 'Pendiente' };

  const openDoc = () => {
    if (!doc.href) return;
    if (doc.href.startsWith('http')) openDocumentUrl(toProxiedPdfUrl(doc.href));
    else navigate(doc.href);
  };

  const longPress = useLongPress({
    onLongPress: () => onEnterSelectMode(doc.id),
    onTap: () => (selectMode ? onToggleSelected(doc.id) : openDoc()),
  });

  return (
    <motion.div
      whileHover={{ y: -2 }}
      {...longPress}
      className="group relative flex flex-col items-start gap-3 bg-white p-5 text-left"
      style={{
        borderRadius: CARD_RADIUS,
        boxShadow: CARD_SHADOW,
        borderLeft: doc.color ? `4px solid ${doc.color}` : undefined,
        outline: selected ? '2px solid #2563EB' : undefined,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {selectMode ? (
        <span className="absolute right-3 top-3">
          {selected ? <CheckCircle2 className="size-5 text-blue-600" /> : <Circle className="size-5 text-slate-300" />}
        </span>
      ) : (
        <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="flex size-8 items-center justify-center rounded-xl bg-slate-50"
          >
            <Pencil className="size-4 text-slate-400" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDeleteRequest(); }}
            className="flex size-8 items-center justify-center rounded-xl bg-slate-50"
          >
            <Trash2 className="size-4 text-slate-400" />
          </button>
        </div>
      )}
      <div className="flex w-full flex-col items-start gap-3 text-left">
        <div className="flex w-full items-start justify-between">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-indigo-50" style={doc.color ? { background: `${doc.color}1a` } : undefined}>
            <FileText className="size-5 text-indigo-500" style={doc.color ? { color: doc.color } : undefined} />
          </div>
          {!selectMode && doc.href && <Download className="size-4 text-slate-300" />}
        </div>
        <div className="w-full min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{doc.name}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {new Date(doc.date).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ color: style.color, background: style.bg }}>
          {c === 'signed' ? <Check className="size-3" /> : c === 'draft' ? <FileEdit className="size-3" /> : <Clock className="size-3" />}
          {style.label}
        </span>
        {doc.daysLeft !== null && (
          <p className="mt-1 text-[10px] text-slate-400">
            {language === 'en'
              ? `Expires in ${doc.daysLeft} day${doc.daysLeft === 1 ? '' : 's'}`
              : `Vence en ${doc.daysLeft} día${doc.daysLeft === 1 ? '' : 's'}`}
          </p>
        )}
      </div>
    </motion.div>
  );
}
