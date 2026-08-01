import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { FileText, FileType2, Plus, PenLine, Trash2, ArrowLeft, HelpCircle, Link2, Copy, Check, ChevronDown, FilePenLine, Send, Building2, Sparkles, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { useLanguage } from '../contexts/language-context';
import { listTemplates, deleteTemplate, type CustomTemplate } from '../services/template-service';
import {
  listDocxTemplates, deleteDocxTemplate, listPublicExampleTemplates, cloneExampleTemplate,
  type DocxTemplate, type PublicExampleTemplate,
} from '../services/docx-template-service';
import { GenerateSendModal } from '../components/templates/GenerateSendModal';
import { DesktopAppShell } from '../components/desktop/DesktopAppShell';
import { useIsMobile } from '../hooks/use-is-mobile';
import { SITE_URL } from '../config/site';

export function MyTemplatesPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  // Desktop visitors get this wrapped in the same sidebar/header shell as
  // every other /dashboard/* screen (it's linked from that sidebar's own
  // "Mis Plantillas" item) instead of jumping to a bare full-page view
  // with the sidebar gone. Mobile keeps its existing plain-page + back
  // button, since MobileAppShell's bottom-nav doesn't have an entry for
  // this page the way the sidebar does.
  const isMobile = useIsMobile();
  const [templates, setTemplates] = useState<CustomTemplate[] | null>(null);
  const [docxTemplates, setDocxTemplates] = useState<DocxTemplate[] | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [sendTemplate, setSendTemplate] = useState<DocxTemplate | null>(null);
  const [examples, setExamples] = useState<PublicExampleTemplate[] | null>(null);
  const [cloningId, setCloningId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    listTemplates(user.id).then(setTemplates).catch(() => setTemplates([]));
    listDocxTemplates(user.id).then(setDocxTemplates).catch(() => setDocxTemplates([]));
  }, [user?.id]);

  // Loads regardless of whether the user has any templates of their own —
  // the whole point of this gallery is giving a brand-new account
  // something to start from instead of a blank page.
  useEffect(() => {
    listPublicExampleTemplates().then(setExamples).catch(() => setExamples([]));
  }, []);

  const handleUseExample = async (example: PublicExampleTemplate) => {
    if (!user?.id) return;
    setCloningId(example.id);
    try {
      const created = await cloneExampleTemplate(example.id, user.id, language);
      toast.success(language === 'en' ? 'Your own editable copy is ready!' : '¡Tu copia editable está lista!');
      navigate(`/my-templates/${created.id}/edit-docx`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not copy this template.' : 'No se pudo copiar esta plantilla.'));
    } finally {
      setCloningId(null);
    }
  };

  const handleCopyLink = (slug: string, announce?: boolean) => {
    navigator.clipboard.writeText(`${SITE_URL}/t/${slug}`).then(() => {
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
      if (announce) {
        toast.success(language === 'en' ? 'Link copied — share it so the recipient fills it in and signs' : 'Enlace copiado — compártelo para que el destinatario lo llene y firme');
      }
    });
  };

  const handleDeleteDocx = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDocxTemplate(id);
      setDocxTemplates((prev) => prev?.filter((t) => t.id !== id) ?? prev);
      toast.success(language === 'en' ? 'Template deleted' : 'Plantilla eliminada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not delete' : 'No se pudo eliminar'));
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteTemplate(id);
      setTemplates((prev) => prev?.filter((t) => t.id !== id) ?? prev);
      toast.success(language === 'en' ? 'Template deleted' : 'Plantilla eliminada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not delete' : 'No se pudo eliminar'));
    } finally {
      setDeletingId(null);
      setConfirmingId(null);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
        <p className="text-lg font-bold text-slate-800">{language === 'en' ? 'Sign in to see your templates' : 'Inicia sesión para ver tus plantillas'}</p>
        <Link to="/" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white">{language === 'en' ? 'Go home' : 'Ir al inicio'}</Link>
      </div>
    );
  }

  const pageContent = (
    <div className="mx-auto max-w-5xl">
      {isMobile && (
        <button
          type="button"
          onClick={() => navigate('/app')}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="size-4" />
          {language === 'en' ? 'Back' : 'Volver'}
        </button>
      )}

        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{language === 'en' ? 'My Templates' : 'Mis Plantillas'}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {language === 'en'
                ? 'Upload your own document once, mark the fields, and reuse it every time — the form fills it in automatically.'
                : 'Sube tu propio documento una vez, marca los campos, y reúsalo cada vez — el formulario lo llena automáticamente.'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/my-templates/ayuda')}
              className="flex size-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 hover:text-indigo-600"
              title={language === 'en' ? 'Help' : 'Ayuda'}
            >
              <HelpCircle className="size-5" />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setNewMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
              >
                <Plus className="size-4" />
                {language === 'en' ? 'New Template' : 'Nueva Plantilla'}
                <ChevronDown className={`size-4 transition-transform ${newMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {newMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNewMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    {/* Word/{{variables}} listed first — this is the primary
                        engine going forward; the legacy PDF-by-coordinates
                        option second so muscle memory from before this menu
                        existed doesn't default users into the wrong one. */}
                    <button
                      type="button"
                      onClick={() => { setNewMenuOpen(false); navigate('/my-templates/new-docx'); }}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50"
                    >
                      <FileType2 className="size-5 shrink-0 text-indigo-500" />
                      <span>
                        <span className="block text-sm font-bold text-slate-800">{language === 'en' ? 'Word with {{variables}}' : 'Word con {{variables}}'}</span>
                        <span className="block text-xs text-slate-400">{language === 'en' ? 'Public link, anyone can fill & sign' : 'Enlace público, cualquiera llena y firma'}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setNewMenuOpen(false); navigate('/my-templates/new'); }}
                      className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3.5 text-left hover:bg-slate-50"
                    >
                      <FileText className="size-5 shrink-0 text-slate-400" />
                      <span>
                        <span className="block text-sm font-bold text-slate-800">{language === 'en' ? 'PDF with boxes' : 'PDF con casillas'}</span>
                        <span className="block text-xs text-slate-400">{language === 'en' ? 'Click to place fields' : 'Clic para colocar campos'}</span>
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Public example gallery — always visible, even for a brand-new
            account with zero templates of its own. "Usar esta plantilla"
            clones it into an independent copy the new owner can freely
            rewrite (fields, clauses, everything) without touching the
            original example. */}
        {examples !== null && examples.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-400">
              <Sparkles className="size-4 text-purple-500" /> {language === 'en' ? 'Example templates' : 'Plantillas de ejemplo'}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {examples.map((ex) => (
                <div key={ex.id} className="flex flex-col gap-3 rounded-3xl border border-purple-200 bg-purple-50/40 p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-purple-100">
                      <Sparkles className="size-5 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold leading-snug text-slate-900">{ex.exampleLabel || ex.name}</p>
                      <p className="text-xs text-slate-400">
                        {ex.fieldCount} {language === 'en' ? 'field(s) · fully editable' : 'campo(s) · totalmente editable'}
                      </p>
                    </div>
                  </div>
                  {/* Real per-template instructions (written when the example
                      was created) so someone browsing the gallery understands
                      what THIS specific template is for, instead of a single
                      generic blurb shown identically on every card. Falls
                      back to that generic blurb only if a template genuinely
                      has none set. */}
                  <p className="text-xs leading-relaxed text-slate-500">
                    {(language === 'en' ? ex.instructionsEn : ex.instructionsEs) || (language === 'en'
                      ? 'Get your own independent copy — rewrite the clauses, fields, and form however you need.'
                      : 'Obtén tu propia copia independiente — reescribe las cláusulas, campos y formulario como lo necesites.')}
                  </p>
                  <button
                    type="button"
                    disabled={cloningId === ex.id}
                    onClick={() => void handleUseExample(ex)}
                    className="mt-auto flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-60"
                  >
                    {cloningId === ex.id ? <Loader className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />}
                    {language === 'en' ? 'Use this template' : 'Usar esta plantilla'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {docxTemplates !== null && docxTemplates.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-400">
              <FileType2 className="size-4" /> {language === 'en' ? 'Word templates (public link)' : 'Plantillas Word (enlace público)'}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {docxTemplates.map((t) => (
                <div key={t.id} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  {confirmingId === t.id ? (
                    <div className="flex flex-1 flex-col justify-between gap-3">
                      <p className="text-sm font-semibold text-red-700">
                        {language === 'en' ? `Delete "${t.name}"?` : `¿Eliminar "${t.name}"?`}
                      </p>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setConfirmingId(null)} className="flex-1 rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-600">
                          {language === 'en' ? 'Cancel' : 'Cancelar'}
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === t.id}
                          onClick={() => void handleDeleteDocx(t.id)}
                          className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-bold text-white disabled:opacity-50"
                        >
                          {deletingId === t.id ? '…' : (language === 'en' ? 'Delete' : 'Eliminar')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50">
                          <FileType2 className="size-5 text-indigo-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-900">{t.name}</p>
                          <p className="text-xs text-slate-400">
                            {t.detectedFields.length} {language === 'en' ? 'field(s)' : 'campo(s)'}
                          </p>
                          {t.userId !== user.id && (
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black uppercase text-violet-700">
                              <Building2 className="size-2.5" /> {language === 'en' ? 'Shared with you' : 'Compartida contigo'}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(t.publicSlug)}
                        className="flex items-center gap-1.5 truncate rounded-xl bg-slate-50 px-3 py-2 text-left text-xs font-mono text-slate-500 hover:bg-slate-100"
                      >
                        {copiedSlug === t.publicSlug ? <Check className="size-3.5 shrink-0 text-emerald-600" /> : <Link2 className="size-3.5 shrink-0 text-slate-400" />}
                        <span className="truncate">/t/{t.publicSlug}</span>
                        <Copy className="ml-auto size-3.5 shrink-0 text-slate-300" />
                      </button>
                      <div className="mt-auto flex flex-col gap-2">
                        {t.userId === user.id && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/my-templates/${t.id}/edit-docx`)}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500"
                            >
                              <PenLine className="size-3.5" />
                              {language === 'en' ? 'Edit' : 'Editar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmingId(t.id)}
                              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSendTemplate(t)}
                            title={language === 'en' ? 'You fill it in, then send only for a signature' : 'Tú lo llenas, y lo envías solo para firmar'}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 py-2 text-[11px] font-bold text-blue-700 hover:bg-blue-100"
                          >
                            <FilePenLine className="size-3.5" />
                            {language === 'en' ? 'Fill before sending' : 'Llenar antes de enviar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(t.publicSlug, true)}
                            title={language === 'en' ? 'Copy the public link — the recipient fills it in and signs' : 'Copia el enlace público — el destinatario lo llena y firma'}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
                          >
                            <Send className="size-3.5" />
                            {language === 'en' ? 'Signer fills & signs' : 'Firmante llena y firma'}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <GenerateSendModal template={sendTemplate} language={language} onClose={() => setSendTemplate(null)} />

        <h2 className="mb-3 mt-8 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-400">
          <FileText className="size-4" /> {language === 'en' ? 'PDF templates' : 'Plantillas PDF'}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates === null ? (
            [0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-3xl bg-white shadow-sm" />)
          ) : templates.length === 0 ? (
            <div className="col-span-full rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
              <FileText className="mx-auto mb-3 size-10 text-slate-300" />
              <p className="text-sm font-semibold text-slate-500">
                {language === 'en' ? "You don't have any templates yet" : 'Todavía no tienes plantillas'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/my-templates/new')}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white"
              >
                <Plus className="size-4" />
                {language === 'en' ? 'Create your first template' : 'Crea tu primera plantilla'}
              </button>
            </div>
          ) : (
            templates.map((t) => (
              <div key={t.id} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                {confirmingId === t.id ? (
                  <div className="flex flex-1 flex-col justify-between gap-3">
                    <p className="text-sm font-semibold text-red-700">
                      {language === 'en' ? `Delete "${t.name}"?` : `¿Eliminar "${t.name}"?`}
                    </p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setConfirmingId(null)} className="flex-1 rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-600">
                        {language === 'en' ? 'Cancel' : 'Cancelar'}
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === t.id}
                        onClick={() => void handleDelete(t.id)}
                        className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-bold text-white disabled:opacity-50"
                      >
                        {deletingId === t.id ? '…' : (language === 'en' ? 'Delete' : 'Eliminar')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50">
                        <FileText className="size-5 text-indigo-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">{t.name}</p>
                        <p className="text-xs text-slate-400">
                          {t.fields.length} {language === 'en' ? 'field(s)' : 'campo(s)'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto flex gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/my-templates/${t.id}/fill`)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-500"
                      >
                        <PenLine className="size-3.5" />
                        {language === 'en' ? 'Use template' : 'Usar plantilla'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(t.id)}
                        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
    </div>
  );

  if (isMobile) {
    return <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">{pageContent}</div>;
  }
  return <DesktopAppShell>{pageContent}</DesktopAppShell>;
}
