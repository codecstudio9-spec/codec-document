import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, FileText, Lock, Pencil, Download, ShieldCheck, Trash2, Check, X, Plus, HardDrive } from 'lucide-react';
import { useAuth } from '../contexts/auth-context';
import { useLanguage } from '../contexts/language-context';
import { fetchUserDocuments, renameDocument, deleteDocumentRecord, type UserDocument } from '../services/documents-service';
import { getTemplateById } from '../data/templates';

export function MyDocumentsPage() {
  const navigate = useNavigate();
  const { user, session, isAdmin, unlimitedActive, subscriptionActive } = useAuth();
  const { language } = useLanguage();
  const isPremium = isAdmin || unlimitedActive || subscriptionActive;

  const [docs, setDocs] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) { setLoading(false); return; }
    fetchUserDocuments(userId)
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [session?.user?.id]);

  const startRename = (doc: UserDocument) => {
    setRenamingId(doc.id);
    setRenameValue(doc.document_name);
  };

  const commitRename = async (id: string) => {
    if (!renameValue.trim()) return;
    await renameDocument(id, renameValue);
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
              onClick={() => navigate('/#plan-ultimate')}
              className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
            >
              {language === 'es' ? 'Ver planes' : 'See plans'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <div className="size-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500 mr-3" />
            {language === 'es' ? 'Cargando documentos…' : 'Loading documents…'}
          </div>
        ) : docs.length === 0 ? (
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
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map((doc) => {
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
      </main>
    </div>
  );
}
