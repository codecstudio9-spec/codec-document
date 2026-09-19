import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  Plus, FileText, Download, Check, Clock, FileEdit, Trash2, Pencil, CheckCircle2, Circle,
  Folder, FolderPlus, Loader, X, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { MobileAppShell } from '../../components/mobile/MobileAppShell';
import { MobileSignInPrompt } from '../../components/mobile/MobileSignInPrompt';
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
import { CARD_RADIUS, CARD_SHADOW, BLUE_GRADIENT } from '../../styles/mobile-theme';
import { toProxiedPdfUrl } from '../../utils/pdf-proxy';
import { openDocumentUrl } from '../../utils/open-document-url';

type UnifiedDoc = {
  id: string;
  kind: 'own' | 'associated';
  name: string;
  status: string;
  date: string;
  href: string | null;
  color: string | null;
  daysLeft: number | null;
  folderId: string | null;
  /** Which table owns this row — null for a synthetic sign_transaction
   * row (id `tx:<uuid>`), which has no real row to file into a folder. */
  table: 'user_documents' | 'documents' | null;
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
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [folderModal, setFolderModal] = useState<'create' | DocumentFolder | null>(null);
  const [folderNameInput, setFolderNameInput] = useState('');
  const [folderSaving, setFolderSaving] = useState(false);
  const [zippingFolderId, setZippingFolderId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
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
          href: d.signed_pdf_url || d.original_pdf_url || d.href || null, color: d.color, daysLeft: getSignedDocumentExpiry(d)?.daysLeft ?? null,
          folderId: d.folder_id, table: d.id.startsWith('tx:') ? null : ('documents' as const),
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setDocs(unified);
      setFolders(ownFolders);
    });
  }, [user?.id]);

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
      toast.success(language === 'en' ? 'Folder deleted — documents kept, unfiled' : 'Carpeta eliminada — los documentos se conservaron sin carpeta');
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

  const filtered = (docs ?? []).filter((d) => (filter === 'all' || classify(d.status) === filter) && (activeFolderId === null || d.folderId === activeFolderId));

  const folderCounts = new Map<string, number>();
  for (const d of docs ?? []) {
    if (!d.folderId) continue;
    folderCounts.set(d.folderId, (folderCounts.get(d.folderId) ?? 0) + 1);
  }
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
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-black text-slate-900">{language === 'en' ? 'Documents' : 'Documentos'}</h1>
        <button
          type="button"
          onClick={() => navigate('/crear-documento')}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-3.5 py-2 text-xs font-bold text-white"
        >
          <Sparkles className="size-3.5" /> {language === 'en' ? 'Create new' : 'Crear nuevo'}
        </button>
      </div>

      {selectMode && (
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
      )}

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

      {/* Folders */}
      <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <button
          type="button"
          onClick={() => setActiveFolderId(null)}
          className="shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition active:scale-95"
          style={activeFolderId === null ? { background: '#0F172A', color: '#fff' } : { background: '#fff', color: '#374151', border: '1px solid #E5E7EB' }}
        >
          {language === 'en' ? 'All' : 'Todas'}
        </button>
        {folders.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFolderId(f.id)}
            className="shrink-0 flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition active:scale-95"
            style={activeFolderId === f.id ? { background: f.color ?? '#2563EB', color: '#fff' } : { background: '#fff', color: '#374151', border: '1px solid #E5E7EB' }}
          >
            <Folder className="size-3" />
            {f.name} <span className="opacity-70">{folderCounts.get(f.id) ?? 0}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => { setFolderModal('create'); setFolderNameInput(''); }}
          className="shrink-0 flex items-center gap-1.5 whitespace-nowrap rounded-full border border-dashed border-slate-300 px-3.5 py-1.5 text-xs font-bold text-slate-500 active:scale-95"
        >
          <FolderPlus className="size-3.5" />
          {language === 'en' ? 'New folder' : 'Nueva carpeta'}
        </button>
      </div>

      {activeFolder && (
        <div className="mt-2.5 flex items-center justify-between bg-white px-3.5 py-2" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
          <span className="flex min-w-0 items-center gap-1.5 truncate text-xs font-bold text-slate-700">
            <Folder className="size-3.5 shrink-0" style={{ color: activeFolder.color ?? '#2563EB' }} />
            <span className="truncate">{activeFolder.name}</span>
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => { setFolderModal(activeFolder); setFolderNameInput(activeFolder.name); }}
              className="flex size-8 items-center justify-center rounded-xl bg-slate-50 active:scale-90"
            >
              <Pencil className="size-3.5 text-slate-400" />
            </button>
            <button
              type="button"
              disabled={zippingFolderId === activeFolder.id}
              onClick={() => void handleDownloadFolderZip(activeFolder)}
              className="flex size-8 items-center justify-center rounded-xl bg-slate-50 active:scale-90 disabled:opacity-50"
            >
              {zippingFolderId === activeFolder.id ? <Loader className="size-3.5 animate-spin text-slate-400" /> : <Download className="size-3.5 text-slate-400" />}
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteFolder(activeFolder)}
              className="flex size-8 items-center justify-center rounded-xl bg-red-50 active:scale-90"
            >
              <Trash2 className="size-3.5 text-red-500" />
            </button>
          </div>
        </div>
      )}

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

            return (
              <MobileDocRow
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

      {/* Floating create button */}
      {!selectMode && (
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
      )}

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
              placeholder={language === 'en' ? 'e.g. "Client — Acme Corp"' : 'ej. "Cliente — Acme Corp"'}
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

interface MobileDocRowProps {
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

function MobileDocRow({
  doc, language, navigate, selectMode, selected,
  onEnterSelectMode, onToggleSelected, onEdit, onDeleteRequest,
}: MobileDocRowProps) {
  const c = classify(doc.status);
  const style = c === 'signed'
    ? { color: '#10B981', bg: '#ECFDF5', label: language === 'en' ? 'Signed' : 'Firmado' }
    : c === 'draft'
      ? { color: '#6B7280', bg: '#F1F5F9', label: language === 'en' ? 'Draft' : 'Borrador' }
      : { color: '#F59E0B', bg: '#FFFBEB', label: language === 'en' ? 'Pending' : 'Pendiente' };

  const openDoc = () => {
    if (!doc.href) return;
    if (doc.href.startsWith('http')) {
      openDocumentUrl(toProxiedPdfUrl(doc.href));
    } else {
      navigate(doc.href);
    }
  };

  const longPress = useLongPress({
    onLongPress: () => onEnterSelectMode(doc.id),
    onTap: () => (selectMode ? onToggleSelected(doc.id) : openDoc()),
  });

  return (
    <motion.div
      whileTap={{ scale: 0.99 }}
      {...longPress}
      className="flex items-center gap-2 bg-white p-4"
      style={{
        borderRadius: CARD_RADIUS,
        boxShadow: CARD_SHADOW,
        borderLeft: doc.color ? `4px solid ${doc.color}` : undefined,
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
      <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50" style={doc.color ? { background: `${doc.color}1a` } : undefined}>
          <FileText className="size-5 text-indigo-500" style={doc.color ? { color: doc.color } : undefined} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">{doc.name}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {style.label} · {new Date(doc.date).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
            {doc.daysLeft !== null && (
              <> · {language === 'en' ? `expires in ${doc.daysLeft}d` : `vence en ${doc.daysLeft}d`}</>
            )}
          </p>
        </div>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full" style={{ background: style.bg }}>
          {c === 'signed'
            ? <Check className="size-3.5" style={{ color: style.color }} />
            : c === 'draft'
              ? <FileEdit className="size-3.5" style={{ color: style.color }} />
              : <Clock className="size-3.5" style={{ color: style.color }} />}
        </span>
        {!selectMode && doc.href && (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50">
            <Download className="size-4 text-slate-500" />
          </span>
        )}
      </div>
      {!selectMode && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 active:scale-90"
          >
            <Pencil className="size-4 text-slate-400" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDeleteRequest(); }}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 active:scale-90"
          >
            <Trash2 className="size-4 text-slate-400" />
          </button>
        </>
      )}
    </motion.div>
  );
}
