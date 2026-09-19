import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  ArrowLeft, FileText, Lock, Pencil, Download, ShieldCheck, Trash2, Check, X, Plus, HardDrive, PenLine,
  Folder, FolderPlus, Loader, Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/auth-context';
import { useLanguage } from '../contexts/language-context';
import { useIsMobile } from '../hooks/use-is-mobile';
import {
  fetchUserDocuments, renameDocument, deleteDocumentRecord, type UserDocument,
  fetchAssociatedDocuments, type AssociatedDocument,
  fetchDocumentFolders, createDocumentFolder, renameDocumentFolder, deleteDocumentFolder, moveDocumentToFolder,
  type DocumentFolder,
} from '../services/documents-service';
import { downloadFolderAsZip } from '../utils/download-folder-zip';
import { getTemplateById } from '../data/templates';
import { toProxiedPdfUrl } from '../utils/pdf-proxy';
import { openDocumentUrl } from '../utils/open-document-url';

export function MyDocumentsPage() {
  const navigate = useNavigate();
  const { user, session, isAdmin, unlimitedActive, subscriptionActive } = useAuth();
  const { language } = useLanguage();
  const isPremium = isAdmin || unlimitedActive || subscriptionActive;

  const [docs, setDocs] = useState<UserDocument[]>([]);
  const [associatedDocs, setAssociatedDocs] = useState<AssociatedDocument[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [folderModal, setFolderModal] = useState<'create' | DocumentFolder | null>(null);
  const [folderNameInput, setFolderNameInput] = useState('');
  const [folderSaving, setFolderSaving] = useState(false);
  const [zippingFolderId, setZippingFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) { setLoading(false); return; }
    Promise.all([
      fetchUserDocuments(userId).catch(() => []),
      fetchAssociatedDocuments(userId).catch(() => []),
      fetchDocumentFolders(userId).catch(() => []),
    ])
      .then(([userDocs, linked, ownFolders]) => { setDocs(userDocs); setAssociatedDocs(linked); setFolders(ownFolders); })
      .finally(() => setLoading(false));
  }, [session?.user?.id]);

  const handleMoveDoc = async (documentId: string, table: 'user_documents' | 'documents', folderId: string | null) => {
    try {
      await moveDocumentToFolder(table, documentId, folderId);
      if (table === 'user_documents') setDocs((prev) => prev.map((d) => (d.id === documentId ? { ...d, folder_id: folderId } : d)));
      else setAssociatedDocs((prev) => prev.map((d) => (d.id === documentId ? { ...d, folder_id: folderId } : d)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'es' ? 'No se pudo mover el documento' : 'Could not move the document'));
    }
  };

  const handleCreateFolder = async () => {
    const userId = session?.user?.id;
    if (!userId || !folderNameInput.trim()) return;
    setFolderSaving(true);
    try {
      const created = await createDocumentFolder(userId, folderNameInput.trim());
      setFolders((prev) => [...prev, created]);
      setFolderModal(null);
      setFolderNameInput('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'es' ? 'No se pudo crear la carpeta' : 'Could not create the folder'));
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'es' ? 'No se pudo renombrar la carpeta' : 'Could not rename the folder'));
    } finally {
      setFolderSaving(false);
    }
  };

  const handleDeleteFolder = async (folder: DocumentFolder) => {
    try {
      await deleteDocumentFolder(folder.id);
      setFolders((prev) => prev.filter((f) => f.id !== folder.id));
      setDocs((prev) => prev.map((d) => (d.folder_id === folder.id ? { ...d, folder_id: null } : d)));
      setAssociatedDocs((prev) => prev.map((d) => (d.folder_id === folder.id ? { ...d, folder_id: null } : d)));
      if (activeFolderId === folder.id) setActiveFolderId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'es' ? 'No se pudo eliminar la carpeta' : 'Could not delete the folder'));
    }
  };

  // Only signed documents (real stored PDFs — signed_pdf_url/original_pdf_url)
  // go in the zip. `docs` (generated templates) compile client-side in
  // /preview/:id and have no stored file to fetch; a tx-derived
  // associatedDocs row has no PDF either (see fetchSignTransactionsAsDocuments).
  const handleDownloadFolderZip = async (folder: DocumentFolder) => {
    const entries = associatedDocs
      .filter((d) => d.folder_id === folder.id)
      .map((d) => ({ name: d.name, url: d.signed_pdf_url || d.original_pdf_url || '' }))
      .filter((e) => e.url);
    if (entries.length === 0) {
      toast.error(language === 'es' ? 'Esta carpeta no tiene documentos para descargar' : 'This folder has no downloadable documents');
      return;
    }
    setZippingFolderId(folder.id);
    try {
      const { ok, failed } = await downloadFolderAsZip(folder.name, entries);
      if (ok === 0) toast.error(language === 'es' ? 'No se pudo descargar ningún documento de esta carpeta' : 'Could not download any document in this folder');
      else if (failed > 0) toast.warning(language === 'es' ? `Se descargaron ${ok}, ${failed} fallaron` : `Downloaded ${ok}, ${failed} failed`);
      else toast.success(language === 'es' ? 'Carpeta descargada' : 'Folder downloaded');
    } finally {
      setZippingFolderId(null);
    }
  };

  const foldersFilterActive = activeFolderId !== null;
  const visibleDocs = foldersFilterActive ? docs.filter((d) => d.folder_id === activeFolderId) : docs;
  const visibleAssociatedDocs = foldersFilterActive ? associatedDocs.filter((d) => d.folder_id === activeFolderId) : associatedDocs;
  const folderCounts = new Map<string, number>();
  for (const d of [...docs, ...associatedDocs]) {
    if (!d.folder_id) continue;
    folderCounts.set(d.folder_id, (folderCounts.get(d.folder_id) ?? 0) + 1);
  }
  const activeFolder = activeFolderId ? folders.find((f) => f.id === activeFolderId) ?? null : null;

  // This desktop document list has a direct equivalent in the mobile app
  // shell (Documentos tab) — send mobile visitors there instead of the
  // desktop layout, same redirect-not-adapt approach as "/" and "/dashboard".
  const isMobile = useIsMobile();
  useEffect(() => {
    if (isMobile) navigate('/app/documents', { replace: true });
  }, [isMobile, navigate]);
  if (isMobile) return null;

  const startRename = (doc: UserDocument) => {
    setRenamingId(doc.id);
    setRenameValue(doc.document_name);
  };

  const commitRename = async (id: string) => {
    if (!renameValue.trim()) return;
    const current = docs.find((d) => d.id === id);
    await renameDocument(id, renameValue, current?.color ?? null);
    setDocs((prev) => prev.map((d) => d.id === id ? { ...d, document_name: renameValue.trim() } : d));
    setRenamingId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteDocumentRecord(id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-xl border bg-white p-6 text-center space-y-3">
          <Lock className="size-10 mx-auto text-amber-600" />
          <h1 className="text-xl font-bold">
            {language === 'es' ? 'Inicia sesión para ver tus documentos' : 'Sign in to view your documents'}
          </h1>
          <p className="text-sm text-slate-600">
            {language === 'es'
              ? 'Aquí aparecerán los documentos que hayas generado con tu cuenta.'
              : 'Documents you generate will be saved here automatically.'}
          </p>
          <Link to="/" className="inline-flex rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-semibold">
            {language === 'es' ? 'Volver al inicio' : 'Back to home'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="size-5" />
            <span>{language === 'es' ? 'Inicio' : 'Home'}</span>
          </button>
          <h1 className="font-semibold text-lg">
            {language === 'es' ? 'Mis documentos' : 'My Documents'}
          </h1>
          <div className={`text-xs px-2 py-1 rounded-full ${isPremium ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'}`}>
            {isPremium
              ? (language === 'es' ? 'Almacenamiento premium activo' : 'Premium cloud storage active')
              : (language === 'es' ? 'Plan gratuito' : 'Free plan')}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/crear-documento')}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-bold text-white"
          >
            <Sparkles className="size-4" /> {language === 'es' ? 'Crear nuevo' : 'Create new'}
          </button>
        </div>

        {!isPremium && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <HardDrive className="size-5 shrink-0 text-amber-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                {language === 'es' ? 'Almacenamiento en la nube disponible en Premium' : 'Cloud storage available on Premium plans'}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {language === 'es'
                  ? 'Actualiza para guardar, organizar y acceder a tus documentos desde cualquier dispositivo.'
                  : 'Upgrade to save, organize and access your documents from any device.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/pricing')}
              className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
            >
              {language === 'es' ? 'Ver planes' : 'See plans'}
            </button>
          </div>
        )}

        {!loading && (docs.length > 0 || associatedDocs.length > 0) && (
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveFolderId(null)}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition"
                style={activeFolderId === null ? { background: '#0F172A', color: '#fff' } : { background: '#fff', color: '#374151', border: '1px solid #E2E8F0' }}
              >
                {language === 'es' ? 'Todas' : 'All'}
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFolderId(f.id)}
                  className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition"
                  style={activeFolderId === f.id ? { background: f.color ?? '#4F46E5', color: '#fff' } : { background: '#fff', color: '#374151', border: '1px solid #E2E8F0' }}
                >
                  <Folder className="size-3" />
                  {f.name} <span className="opacity-70">{folderCounts.get(f.id) ?? 0}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setFolderModal('create'); setFolderNameInput(''); }}
                className="flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3.5 py-1.5 text-xs font-bold text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
              >
                <FolderPlus className="size-3.5" />
                {language === 'es' ? 'Nueva carpeta' : 'New folder'}
              </button>
            </div>

            {activeFolder && (
              <div className="mt-2.5 flex items-center justify-between rounded-xl border bg-white px-4 py-2.5">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Folder className="size-4" style={{ color: activeFolder.color ?? '#4F46E5' }} />
                  {activeFolder.name}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setFolderModal(activeFolder); setFolderNameInput(activeFolder.name); }}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <Pencil className="size-3.5" /> {language === 'es' ? 'Renombrar' : 'Rename'}
                  </button>
                  <button
                    type="button"
                    disabled={zippingFolderId === activeFolder.id}
                    onClick={() => void handleDownloadFolderZip(activeFolder)}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {zippingFolderId === activeFolder.id ? <Loader className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                    {language === 'es' ? 'Descargar .zip' : 'Download .zip'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteFolder(activeFolder)}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="size-3.5" /> {language === 'es' ? 'Eliminar carpeta' : 'Delete folder'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <div className="size-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500 mr-3" />
            {language === 'es' ? 'Cargando documentos…' : 'Loading documents…'}
          </div>
        ) : docs.length === 0 && associatedDocs.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center space-y-4">
            <FileText className="size-12 mx-auto text-slate-300" />
            <div>
              <p className="text-slate-700 font-semibold text-lg">
                {language === 'es' ? 'No tienes documentos guardados' : 'No documents saved yet'}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {language === 'es'
                  ? 'Genera y descarga un documento para que aparezca aquí automáticamente.'
                  : 'Generate and download a document — it will appear here automatically.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="size-4" />
              {language === 'es' ? 'Crear documento' : 'Create document'}
            </button>
          </div>
        ) : visibleDocs.length === 0 && visibleAssociatedDocs.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center">
            <Folder className="size-10 mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-500">
              {language === 'es' ? 'No hay documentos en esta carpeta' : 'No documents in this folder'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleDocs.map((doc) => {
              const tpl = getTemplateById(doc.template_id);
              const isRenaming = renamingId === doc.id;
              const createdDate = new Date(doc.created_at).toLocaleDateString(
                language === 'es' ? 'es-US' : 'en-US',
                { year: 'numeric', month: 'short', day: 'numeric' },
              );

              return (
                <article key={doc.id} className="rounded-xl border bg-white p-4 space-y-3 shadow-sm">
                  {/* Document name — editable */}
                  {isRenaming ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void commitRename(doc.id);
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        className="flex-1 rounded-md border border-indigo-300 bg-white px-2 py-1 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-400/40"
                      />
                      <button type="button" onClick={() => void commitRename(doc.id)} className="text-emerald-600 hover:text-emerald-700">
                        <Check className="size-4" />
                      </button>
                      <button type="button" onClick={() => setRenamingId(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-semibold text-slate-900 text-sm leading-tight break-words">
                        {doc.document_name}
                      </h2>
                      <button
                        type="button"
                        onClick={() => startRename(doc)}
                        className="shrink-0 text-slate-400 hover:text-slate-700"
                        title={language === 'es' ? 'Renombrar' : 'Rename'}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500">{tpl?.category || doc.template_id}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-400">{createdDate}</span>
                  </div>

                  <div className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    <ShieldCheck className="size-3" />
                    E-SIGN &amp; UETA Compliant
                  </div>

                  {folders.length > 0 && (
                    <select
                      value={doc.folder_id ?? ''}
                      onChange={(e) => void handleMoveDoc(doc.id, 'user_documents', e.target.value || null)}
                      className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-600 outline-none focus:border-indigo-400"
                    >
                      <option value="">{language === 'es' ? 'Sin carpeta' : 'No folder'}</option>
                      {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Link
                      to={`/preview/${doc.template_id}`}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-slate-900 text-white px-3 py-2 text-xs font-semibold"
                    >
                      <Download className="size-3" />
                      {language === 'es' ? 'Abrir' : 'Open'}
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleDelete(doc.id)}
                      className="inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                      title={language === 'es' ? 'Eliminar' : 'Delete'}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* ── Documents signed as a guest, associated to this profile ─────── */}
        {visibleAssociatedDocs.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
              <PenLine className="size-4 text-indigo-600" />
              {language === 'es' ? 'Documentos que firmaste' : 'Documents you signed'}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleAssociatedDocs.map((doc) => {
                const isCompleted = doc.status === 'completed';
                const fileUrl = doc.signed_pdf_url || doc.original_pdf_url;
                const isFoldable = !doc.id.startsWith('tx:');
                const createdDate = new Date(doc.created_at).toLocaleDateString(
                  language === 'es' ? 'es-US' : 'en-US',
                  { year: 'numeric', month: 'short', day: 'numeric' },
                );
                return (
                  <article key={doc.id} className="rounded-xl border bg-white p-4 space-y-3 shadow-sm">
                    <h3 className="font-semibold text-slate-900 text-sm leading-tight break-words">
                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium ${isCompleted ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {isCompleted
                          ? (language === 'es' ? 'Completado' : 'Completed')
                          : (language === 'es' ? 'Pendiente' : 'Pending')}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{createdDate}</span>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      <ShieldCheck className="size-3" />
                      E-SIGN &amp; UETA Compliant
                    </div>
                    {isFoldable && folders.length > 0 && (
                      <select
                        value={doc.folder_id ?? ''}
                        onChange={(e) => void handleMoveDoc(doc.id, 'documents', e.target.value || null)}
                        className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-600 outline-none focus:border-indigo-400"
                      >
                        <option value="">{language === 'es' ? 'Sin carpeta' : 'No folder'}</option>
                        {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    )}
                    {fileUrl ? (
                      <button
                        type="button"
                        onClick={() => openDocumentUrl(toProxiedPdfUrl(fileUrl))}
                        className="flex items-center justify-center gap-1 rounded-md bg-slate-900 text-white px-3 py-2 text-xs font-semibold"
                      >
                        <Download className="size-3" />
                        {language === 'es' ? 'Ver PDF' : 'View PDF'}
                      </button>
                    ) : doc.href ? (
                      // Sin PDF guardado: el documento se envió a firmar y vive en
                      // sign_transactions — esta pantalla lo arma al abrirlo, y
                      // ahí mismo (para wedding-planner) están los abonos y la
                      // subida de documentos de seguimiento.
                      <Link
                        to={doc.href}
                        className="flex items-center justify-center gap-1 rounded-md bg-slate-900 text-white px-3 py-2 text-xs font-semibold"
                      >
                        <FileText className="size-3" />
                        {language === 'es' ? 'Abrir' : 'Open'}
                      </Link>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ── Create / rename folder ── */}
      {folderModal !== null && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setFolderModal(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {folderModal === 'create'
                  ? (language === 'es' ? 'Nueva carpeta' : 'New folder')
                  : (language === 'es' ? 'Renombrar carpeta' : 'Rename folder')}
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
              placeholder={language === 'es' ? 'ej. "Cliente — Acme Corp"' : 'e.g. "Client — Acme Corp"'}
              className="mb-5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400"
            />
            <button
              type="button"
              disabled={!folderNameInput.trim() || folderSaving}
              onClick={() => void (folderModal === 'create' ? handleCreateFolder() : handleRenameFolder())}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
            >
              {folderSaving
                ? <><Loader className="size-4 animate-spin" />{language === 'es' ? 'Guardando…' : 'Saving…'}</>
                : (folderModal === 'create' ? (language === 'es' ? 'Crear' : 'Create') : (language === 'es' ? 'Guardar' : 'Save'))}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
