import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { FileText, FileType2, PenLine, Trash2, HelpCircle, Link2, Copy, Check, FilePenLine, Send, Building2, Sparkles, Upload, Image as ImageIcon, Loader, FolderOpen, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { useLanguage } from '../contexts/language-context';
import { useVoiceSpeak } from '../hooks/useVoiceGuide';
import { listTemplates, deleteTemplate, type CustomTemplate } from '../services/template-service';
import {
  listDocxTemplates, deleteDocxTemplate, listPublicExampleTemplates, cloneExampleTemplate,
  type DocxTemplate, type PublicExampleTemplate,
} from '../services/docx-template-service';
import { GenerateSendModal } from '../components/templates/GenerateSendModal';
import { GaleriaEjemplos } from '../components/templates/GaleriaEjemplos';
import { DesktopAppShell } from '../components/desktop/DesktopAppShell';
import { MobileAppShell } from '../components/mobile/MobileAppShell';
import { useIsMobile } from '../hooks/use-is-mobile';
import { SITE_URL } from '../config/site';
import { GoogleDriveButton } from '../components/templates/GoogleDriveButton';
import { MIME_DOCX, MIME_GOOGLE_DOC, MIME_PDF } from '../services/google-drive-picker';
import { ACCEPT_CUALQUIER_DOCUMENTO, prepararArchivoPlantilla } from '../services/archivo-plantilla';

export function MyTemplatesPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { speak } = useVoiceSpeak();
  // Presentación de la pantalla: qué se puede hacer aquí y por dónde empezar.
  useEffect(() => {
    speak({
      es: 'Aquí están tus plantillas: documentos que preparas una vez y reutilizas siempre. Arriba sube tu documento en Word, en PDF o una foto, tal como lo tienes. Abajo están tus plantillas guardadas y las plantillas prediseñadas, listas para usar.',
      en: 'These are your templates: documents you set up once and reuse every time. Up top, upload your document as Word, PDF or a photo, just as you have it. Below are your saved templates and the ready-made templates.',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [pestana, setPestana] = useState<'mias' | 'prediseñadas' | null>(null);
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

  // Cualquier archivo (Word, PDF o foto) entra por la misma caja y se va al
  // editor que le corresponde — el cliente no tiene que saber cuál es cuál.
  const handleArchivo = async (file?: File | null) => {
    if (!file) return;
    setSubiendo(true);
    try {
      navigate(await prepararArchivoPlantilla(file, language));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err), { duration: 8000 });
      setSubiendo(false);
    }
  };

  const handleUseExample = async (example: PublicExampleTemplate) => {
    if (!user?.id) return;
    setCloningId(example.id);
    try {
      const created = await cloneExampleTemplate(example.id, user.id, language);
      toast.success(created.yaExistia
        ? (language === 'en' ? 'You already had this one — opening your copy' : 'Ya tenías esta plantilla — abriendo tu copia')
        : (language === 'en' ? 'Your own editable copy is ready!' : '¡Tu copia editable está lista!'));
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

  const cargandoMias = docxTemplates === null || templates === null;
  const totalMias = (docxTemplates?.length ?? 0) + (templates?.length ?? 0);
  // Sin plantillas propias todavía, se abre directo en las prediseñadas: una
  // pestaña vacía como primera impresión no ayuda a nadie.
  const pestanaActiva = pestana ?? (!cargandoMias && totalMias === 0 ? 'prediseñadas' : 'mias');

  const pageContent = (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{language === 'en' ? 'Templates' : 'Plantillas'}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {language === 'en'
              ? 'Upload a document once. Next time you just fill in the details and send it to sign.'
              : 'Sube un documento una vez. La próxima vez solo llenas los datos y lo envías a firmar.'}
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
          <button
            type="button"
            onClick={() => navigate('/crear-documento')}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
          >
            <Sparkles className="size-4" />
            {language === 'en' ? 'New document with AI' : 'Nuevo documento con IA'}
          </button>
        </div>
      </div>

      {/* Una sola caja para lo que el cliente tenga: Word, PDF o una foto.
          prepararArchivoPlantilla decide a qué editor va — antes había que
          escoger entre «Word» y «PDF» en un menú sin saber la diferencia. */}
      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
        <div className="mb-5 text-center">
          <h2 className="text-xl font-bold text-slate-900">{language === 'en' ? 'Upload your document' : 'Sube tu documento'}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {language === 'en'
              ? "Just as you use it today — we find the blanks to fill in on our own."
              : 'Tal como lo usas hoy. Nosotros encontramos los espacios para llenar.'}
          </p>
        </div>
        <label
          onDragEnter={() => setArrastrando(true)}
          onDragLeave={() => setArrastrando(false)}
          onDrop={() => setArrastrando(false)}
          className={`group relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${arrastrando ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50/40 hover:border-indigo-400 hover:bg-indigo-50/50'}`}
        >
          <input
            type="file"
            accept={ACCEPT_CUALQUIER_DOCUMENTO}
            disabled={subiendo}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            onChange={(e) => { void handleArchivo(e.target.files?.[0]); e.target.value = ''; }}
          />
          <div className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
            {subiendo ? <Loader className="size-8 animate-spin text-indigo-500" /> : <Upload className="size-8 text-slate-500" />}
          </div>
          <p className="text-base font-semibold text-slate-900">
            {subiendo
              ? (language === 'en' ? 'Opening your document…' : 'Abriendo tu documento…')
              : (language === 'en' ? 'Drag your document here' : 'Arrastra tu documento aquí')}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {[
              { icon: <FileType2 className="size-3.5 text-indigo-500" />, label: 'Word' },
              { icon: <FileText className="size-3.5 text-rose-500" />, label: 'PDF' },
              { icon: <ImageIcon className="size-3.5 text-emerald-500" />, label: language === 'en' ? 'Photo' : 'Foto' },
            ].map((f) => (
              <span key={f.label} className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600">
                {f.icon}{f.label}
              </span>
            ))}
          </div>
          <span className="mt-4 inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            {language === 'en' ? 'Choose file' : 'Elegir archivo'}
          </span>
        </label>
        <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <GoogleDriveButton
            mimeTypes={[MIME_DOCX, MIME_GOOGLE_DOC, MIME_PDF]}
            language={language}
            onFile={(file) => handleArchivo(file)}
            className="w-full sm:w-auto"
          />
          <button
            type="button"
            onClick={() => navigate('/crear-documento')}
            className="w-full rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50 sm:w-auto"
          >
            {language === 'en' ? 'No file? Write, paste or dictate it' : '¿Sin archivo? Escríbelo, pégalo o díctalo'}
          </button>
        </div>
      </section>

      {/* Lo ya guardado y lo listo para usar, en dos pestañas en vez de tres
          listas apiladas (Word, PDF, ejemplos) que había que recorrer. */}
      <div className="mt-8 flex gap-1 rounded-2xl bg-slate-100 p-1">
        {([
          { key: 'mias' as const, icon: <FolderOpen className="size-4" />, label: language === 'en' ? 'My templates' : 'Mis plantillas', count: cargandoMias ? null : totalMias },
          { key: 'prediseñadas' as const, icon: <LayoutGrid className="size-4" />, label: language === 'en' ? 'Ready-made templates' : 'Plantillas prediseñadas', count: examples?.length ?? null },
        ]).map((tab) => {
          const activa = pestanaActiva === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setPestana(tab.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-bold transition sm:gap-2 sm:px-3 sm:text-sm ${activa ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== null && (
                <span className={`rounded-full px-2 py-0.5 text-[11px] ${activa ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {pestanaActiva === 'prediseñadas' ? (
          examples === null ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-3xl bg-white shadow-sm" />)}
            </div>
          ) : examples.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">{language === 'en' ? 'No ready-made templates yet.' : 'Todavía no hay plantillas prediseñadas.'}</p>
          ) : (
            <GaleriaEjemplos
              ejemplos={examples}
              language={language}
              cloningId={cloningId}
              onUsar={(ex) => void handleUseExample(ex)}
              sinTitulo
            />
          )
        ) : cargandoMias ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-3xl bg-white shadow-sm" />)}
          </div>
        ) : totalMias === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-12 text-center">
            <FolderOpen className="mx-auto mb-3 size-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">
              {language === 'en' ? "You don't have any templates yet" : 'Todavía no tienes plantillas'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {language === 'en' ? 'Upload a document above, or start from a ready-made one.' : 'Sube un documento arriba, o empieza con una prediseñada.'}
            </p>
            <button
              type="button"
              onClick={() => setPestana('prediseñadas')}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white"
            >
              <LayoutGrid className="size-4" />
              {language === 'en' ? 'See ready-made templates' : 'Ver plantillas prediseñadas'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {docxTemplates!.map((t) => (
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
                          <span className="mr-1.5 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-black uppercase text-indigo-600">Word</span>
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
                      {/* Acción principal, como «Use template» en Dropbox Sign:
                          llenar → enviar a firmar o descargar, en un solo modal. */}
                      <button
                        type="button"
                        onClick={() => setSendTemplate(t)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-500"
                      >
                        <FilePenLine className="size-4" />
                        {language === 'en' ? 'Use template' : 'Usar plantilla'}
                      </button>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(t.publicSlug, true)}
                          title={language === 'en' ? 'Copy the public link — the recipient fills it in and signs' : 'Copia el enlace público — el destinatario lo llena y firma'}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
                        >
                          <Send className="size-3.5" />
                          {language === 'en' ? 'Signer fills & signs' : 'Firmante llena y firma'}
                        </button>
                        {t.userId === user.id && (
                          <>
                            <button
                              type="button"
                              onClick={() => navigate(`/my-templates/${t.id}/edit-docx`)}
                              title={language === 'en' ? 'Edit template' : 'Editar plantilla'}
                              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
                            >
                              <PenLine className="size-3.5" />
                              {language === 'en' ? 'Edit' : 'Editar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmingId(t.id)}
                              title={language === 'en' ? 'Delete' : 'Eliminar'}
                              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
            {templates!.map((t) => (
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
                          <span className="mr-1.5 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-black uppercase text-rose-600">PDF</span>
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
            ))}
          </div>
        )}
      </div>

      <GenerateSendModal template={sendTemplate} language={language} onClose={() => setSendTemplate(null)} />
    </div>
  );

  if (isMobile) {
    // Con el menú inferior de la app, como Documentos y Firmas: «Plantillas»
    // es una de sus pestañas.
    return <MobileAppShell><div className="px-4 pt-5">{pageContent}</div></MobileAppShell>;
  }
  return <DesktopAppShell>{pageContent}</DesktopAppShell>;
}
