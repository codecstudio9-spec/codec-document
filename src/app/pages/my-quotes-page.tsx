import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowLeft, Plus, FileText, Loader, Download, Copy, Send, Trash2,
  DollarSign, TrendingUp, Eye, Pencil, FolderPlus, Folder, FolderOpen, X, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { useLanguage } from '../contexts/language-context';
import {
  listMyQuotes, deleteQuote, getQuotesSummary, getQuoteDocumentTitle,
  getQuoteViewStats, formatRelativeTime,
  listMyQuoteFolders, createQuoteFolder, deleteQuoteFolder, setQuoteFolder, setQuoteName, duplicateQuote,
  type Quote, type QuoteStatus, type QuoteFolder,
} from '../services/quotes-service';

type ViewStats = Awaited<ReturnType<typeof getQuoteViewStats>>;

const STATUS_LABELS: Record<QuoteStatus, { es: string; en: string; color: string }> = {
  draft: { es: 'Borrador', en: 'Draft', color: '#94A3B8' },
  sent: { es: 'Enviada', en: 'Sent', color: '#2563EB' },
  viewed: { es: 'Vista', en: 'Viewed', color: '#F59E0B' },
  accepted: { es: 'Aceptada', en: 'Accepted', color: '#10B981' },
  rejected: { es: 'Rechazada', en: 'Rejected', color: '#EF4444' },
};

export function MyQuotesPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getQuotesSummary>> | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [viewStatsByQuote, setViewStatsByQuote] = useState<Record<string, ViewStats>>({});

  const [folders, setFolders] = useState<QuoteFolder[]>([]);
  /** null = todas; 'sin' = las que no están en ninguna carpeta. */
  const [carpetaActiva, setCarpetaActiva] = useState<string | null>(null);
  const [creandoCarpeta, setCreandoCarpeta] = useState(false);
  const [nombreCarpeta, setNombreCarpeta] = useState('');
  /** id de la cotización cuyo nombre se está editando en línea. */
  const [renombrando, setRenombrando] = useState<string | null>(null);
  const [nombreBorrador, setNombreBorrador] = useState('');

  const load = () => {
    listMyQuoteFolders().then(setFolders).catch(() => {});
    listMyQuotes().then((qs) => {
      setQuotes(qs);
      // "El cliente abrió la propuesta hace 2 horas" at a glance, per row —
      // only meaningful once a quote has actually been sent.
      const sentQuotes = qs.filter((q) => q.status !== 'draft');
      Promise.all(sentQuotes.map((q) => getQuoteViewStats(q.id).then((stats) => [q.id, stats] as const).catch(() => null)))
        .then((results) => {
          const map: Record<string, ViewStats> = {};
          for (const r of results) { if (r) map[r[0]] = r[1]; }
          setViewStatsByQuote(map);
        });
    }).catch(() => setQuotes([]));
    getQuotesSummary().then(setSummary).catch(() => {});
  };
  useEffect(() => { if (user) load(); }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await deleteQuote(id);
      toast.success(language === 'en' ? 'Quote deleted.' : 'Cotización eliminada.');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  };

  /** Duplicar es ahora una sola llamada: la copia de la cotización y de sus
   *  productos ocurre dentro de la base de datos (duplicate_quote). Antes
   *  había que leer el registro completo y reconstruirlo campo a campo aquí,
   *  y cada campo nuevo obligaba a acordarse de añadirlo también en esta
   *  lista — así fue como una versión anterior perdía los productos. */
  const handleDuplicate = async (q: Quote) => {
    setDuplicating(q.id);
    try {
      const newId = await duplicateQuote(q.id);
      toast.success(language === 'en' ? 'Quote duplicated.' : 'Cotización duplicada.');
      navigate(`/my-quotes/${newId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setDuplicating(null);
    }
  };

  const guardarNombre = async (id: string) => {
    try {
      await setQuoteName(id, nombreBorrador);
      setQuotes((prev) => prev?.map((x) => (x.id === id ? { ...x, name: nombreBorrador.trim() || null } : x)) ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setRenombrando(null);
    }
  };

  const moverACarpeta = async (id: string, folderId: string | null) => {
    try {
      await setQuoteFolder(id, folderId);
      setQuotes((prev) => prev?.map((x) => (x.id === id ? { ...x, folder_id: folderId } : x)) ?? null);
      listMyQuoteFolders().then(setFolders).catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  };

  const crearCarpeta = async () => {
    const nombre = nombreCarpeta.trim();
    if (!nombre) return;
    try {
      await createQuoteFolder(nombre);
      setNombreCarpeta('');
      setCreandoCarpeta(false);
      listMyQuoteFolders().then(setFolders).catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  };

  const borrarCarpeta = async (f: QuoteFolder) => {
    try {
      await deleteQuoteFolder(f.id);
      if (carpetaActiva === f.id) setCarpetaActiva(null);
      // Las cotizaciones que había dentro no se borran: vuelven a «sin
      // carpeta» (ON DELETE SET NULL). Se recarga para reflejarlo.
      load();
      toast.success(language === 'en'
        ? `Folder deleted — its ${f.quoteCount} quote(s) are still there, now without a folder.`
        : `Carpeta eliminada — sus ${f.quoteCount} cotizacion(es) siguen ahí, ahora sin carpeta.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  };

  const visibles = (quotes ?? []).filter((q) => {
    if (carpetaActiva === null) return true;
    if (carpetaActiva === 'sin') return !q.folder_id;
    return q.folder_id === carpetaActiva;
  });

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
        <p className="text-lg font-bold text-slate-800">{language === 'en' ? 'Sign in to see your quotes' : 'Inicia sesión para ver tus cotizaciones'}</p>
        <Link to="/" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white">{language === 'en' ? 'Go home' : 'Ir al inicio'}</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => navigate(window.matchMedia('(max-width: 767px)').matches ? '/app' : '/dashboard')}
          className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="size-4" /> {language === 'en' ? 'Back' : 'Volver'}
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
              <FileText className="size-6 text-indigo-600" />
              {language === 'en' ? 'Smart Quotes' : 'Cotizaciones Inteligentes'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {language === 'en' ? 'Create, send, and get quotes signed — full agreements, not just PDFs.' : 'Crea, envía y logra que firmen tus cotizaciones — acuerdos completos, no solo PDFs.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/my-quotes/new')}
            className="flex shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg"
          >
            <Plus className="size-4" /> {language === 'en' ? 'New quote' : 'Nueva cotización'}
          </button>
        </div>

        {summary && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <FileText className="size-4 text-indigo-400" />
              <p className="mt-2 text-xl font-black text-slate-900">{summary.totalCount}</p>
              <p className="text-xs text-slate-400">{language === 'en' ? 'Total' : 'Total'}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <TrendingUp className="size-4 text-emerald-500" />
              <p className="mt-2 text-xl font-black text-slate-900">{summary.acceptedCount}</p>
              <p className="text-xs text-slate-400">{language === 'en' ? 'Accepted' : 'Aceptadas'}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <DollarSign className="size-4 text-amber-500" />
              <p className="mt-2 text-xl font-black text-slate-900">${summary.quotedValue.toFixed(0)}</p>
              <p className="text-xs text-slate-400">{language === 'en' ? 'Quoted value' : 'Valor cotizado'}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <DollarSign className="size-4 text-emerald-500" />
              <p className="mt-2 text-xl font-black text-slate-900">${summary.acceptedValue.toFixed(0)}</p>
              <p className="text-xs text-slate-400">{language === 'en' ? 'Accepted value' : 'Valor aceptado'}</p>
            </div>
          </div>
        )}

        {/* Carpetas. Existen aunque estén vacías (tabla propia), porque crear
            «Proveedores» y verla desaparecer hasta meter algo dentro no es
            cómo funciona una carpeta en ningún sitio. */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {([
            { id: null as string | null, nombre: language === 'en' ? 'All' : 'Todas', color: '#64748B', n: quotes?.length ?? 0 },
            ...folders.map((f) => ({ id: f.id, nombre: f.name, color: f.color, n: f.quoteCount })),
            { id: 'sin' as string | null, nombre: language === 'en' ? 'No folder' : 'Sin carpeta', color: '#94A3B8', n: (quotes ?? []).filter((q) => !q.folder_id).length },
          ]).map((c) => (
            <button
              key={String(c.id)}
              type="button"
              onClick={() => setCarpetaActiva(c.id)}
              className={`group flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                carpetaActiva === c.id ? 'text-white shadow-sm' : 'bg-white text-slate-500 hover:text-slate-700'
              }`}
              style={carpetaActiva === c.id ? { background: c.color } : undefined}
            >
              {carpetaActiva === c.id ? <FolderOpen className="size-3.5" /> : <Folder className="size-3.5" />}
              {c.nombre}
              <span className={carpetaActiva === c.id ? 'opacity-70' : 'text-slate-300'}>{c.n}</span>
              {c.id && c.id !== 'sin' && carpetaActiva === c.id && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); void borrarCarpeta(folders.find((f) => f.id === c.id)!); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); void borrarCarpeta(folders.find((f) => f.id === c.id)!); } }}
                  className="ml-0.5 opacity-60 hover:opacity-100"
                  title={language === 'en' ? 'Delete folder' : 'Eliminar carpeta'}
                >
                  <X className="size-3" />
                </span>
              )}
            </button>
          ))}

          {creandoCarpeta ? (
            <span className="flex items-center gap-1 rounded-full bg-white px-2 py-1 shadow-sm">
              <input
                autoFocus
                value={nombreCarpeta}
                onChange={(e) => setNombreCarpeta(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void crearCarpeta();
                  if (e.key === 'Escape') { setCreandoCarpeta(false); setNombreCarpeta(''); }
                }}
                placeholder={language === 'en' ? 'Clients, Suppliers…' : 'Clientes, Proveedores…'}
                className="w-36 bg-transparent px-1.5 text-xs outline-none"
              />
              <button type="button" onClick={() => void crearCarpeta()} className="text-emerald-600"><Check className="size-3.5" /></button>
              <button type="button" onClick={() => { setCreandoCarpeta(false); setNombreCarpeta(''); }} className="text-slate-300"><X className="size-3.5" /></button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setCreandoCarpeta(true)}
              className="flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3.5 py-1.5 text-xs font-bold text-slate-400 hover:border-indigo-400 hover:text-indigo-500"
            >
              <FolderPlus className="size-3.5" />
              {language === 'en' ? 'New folder' : 'Nueva carpeta'}
            </button>
          )}
        </div>

        <div className="mt-4 space-y-2.5">
          {!quotes ? (
            <div className="flex justify-center py-12"><Loader className="size-6 animate-spin text-indigo-500" /></div>
          ) : visibles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <FileText className="mx-auto mb-2 size-8 text-slate-300" />
              <p className="text-sm font-semibold text-slate-500">
                {/* Una carpeta vacía no es lo mismo que no tener nada: sin
                    distinguirlo, el panel parecía roto al abrir una carpeta
                    recién creada. */}
                {quotes.length === 0
                  ? (language === 'en' ? 'No quotes yet — create your first one.' : 'Aún no tienes cotizaciones — crea la primera.')
                  : (language === 'en' ? 'Nothing in this folder yet.' : 'Todavía no hay nada en esta carpeta.')}
              </p>
            </div>
          ) : (
            visibles.map((q) => (
              <div key={q.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {renombrando === q.id ? (
                      <input
                        autoFocus
                        value={nombreBorrador}
                        onChange={(e) => setNombreBorrador(e.target.value)}
                        onBlur={() => void guardarNombre(q.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void guardarNombre(q.id);
                          if (e.key === 'Escape') setRenombrando(null);
                        }}
                        placeholder={language === 'en' ? 'Kevin Hernández' : 'Kevin Hernández'}
                        className="min-w-0 flex-1 rounded-lg border border-indigo-300 px-2 py-1 text-sm font-bold text-slate-800 outline-none"
                      />
                    ) : (
                      <>
                        {/* El rótulo propio manda sobre el nombre del cliente:
                            es el que su dueño eligió para reconocerla. */}
                        <p className="truncate text-sm font-bold text-slate-800">{q.name || q.client_name}</p>
                        <button
                          type="button"
                          onClick={() => { setRenombrando(q.id); setNombreBorrador(q.name ?? ''); }}
                          title={language === 'en' ? 'Name this quote' : 'Ponerle nombre'}
                          className="shrink-0 text-slate-300 transition hover:text-indigo-500"
                        >
                          <Pencil className="size-3" />
                        </button>
                      </>
                    )}
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${STATUS_LABELS[q.status].color}18`, color: STATUS_LABELS[q.status].color }}>
                      {STATUS_LABELS[q.status][language]}
                    </span>
                  </div>
                  <p className="truncate text-xs text-slate-400">
                    {q.name ? `${q.client_name} · ` : ''}
                    {getQuoteDocumentTitle(q.country, q.quote_type, q.language)} · {q.quote_number} · {new Date(q.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  {folders.length > 0 && (
                    <select
                      value={q.folder_id ?? ''}
                      onChange={(e) => void moverACarpeta(q.id, e.target.value || null)}
                      className="mt-1 max-w-[180px] truncate rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500 outline-none"
                    >
                      <option value="">{language === 'en' ? 'No folder' : 'Sin carpeta'}</option>
                      {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  )}
                  {viewStatsByQuote[q.id] && viewStatsByQuote[q.id].viewCount > 0 && viewStatsByQuote[q.id].lastViewedAt && (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-semibold text-indigo-500">
                      <Eye className="size-3" />
                      {language === 'en'
                        ? `Opened ${formatRelativeTime(viewStatsByQuote[q.id].lastViewedAt as string, 'en')}${viewStatsByQuote[q.id].viewCount > 1 ? ` (${viewStatsByQuote[q.id].viewCount}×)` : ''}`
                        : `Abierta ${formatRelativeTime(viewStatsByQuote[q.id].lastViewedAt as string, 'es')}${viewStatsByQuote[q.id].viewCount > 1 ? ` (${viewStatsByQuote[q.id].viewCount}×)` : ''}`}
                    </p>
                  )}
                </div>
                <p className="shrink-0 text-sm font-black text-slate-700">${q.total.toFixed(2)}</p>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => navigate(`/my-quotes/${q.id}`)} title={language === 'en' ? 'Edit / send' : 'Editar / enviar'} className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-indigo-600">
                    <Send className="size-4" />
                  </button>
                  {q.pdf_url && (
                    <a href={q.pdf_url} target="_blank" rel="noopener noreferrer" title={language === 'en' ? 'Download' : 'Descargar'} className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-indigo-600">
                      <Download className="size-4" />
                    </a>
                  )}
                  <button type="button" disabled={duplicating === q.id} onClick={() => void handleDuplicate(q)} title={language === 'en' ? 'Duplicate' : 'Duplicar'} className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-40">
                    {duplicating === q.id ? <Loader className="size-4 animate-spin" /> : <Copy className="size-4" />}
                  </button>
                  <button type="button" onClick={() => void handleDelete(q.id)} title={language === 'en' ? 'Delete' : 'Eliminar'} className="flex size-8 items-center justify-center rounded-full text-slate-300 hover:bg-red-50 hover:text-red-500">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
