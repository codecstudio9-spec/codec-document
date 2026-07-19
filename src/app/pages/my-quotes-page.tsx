import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowLeft, Plus, FileText, Loader, Download, Copy, Send, Trash2,
  DollarSign, TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { useLanguage } from '../contexts/language-context';
import {
  listMyQuotes, deleteQuote, createQuote, getQuotesSummary, getQuoteDocumentTitle,
  type Quote, type QuoteStatus,
} from '../services/quotes-service';

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

  const load = () => {
    listMyQuotes().then(setQuotes).catch(() => setQuotes([]));
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

  const handleDuplicate = async (q: Quote) => {
    setDuplicating(q.id);
    try {
      const newId = await createQuote({
        country: q.country ?? undefined, language: q.language, quote_type: q.quote_type,
        client_name: q.client_name, client_company: q.client_company ?? undefined,
        client_position: q.client_position ?? undefined, client_email: q.client_email ?? undefined,
        client_phone: q.client_phone ?? undefined, client_address: q.client_address ?? undefined,
        project_name: q.project_name ?? undefined, executive_summary: q.executive_summary ?? undefined,
        project_objective: q.project_objective ?? undefined, project_scope: q.project_scope ?? undefined,
        proposal_blocks: q.proposal_blocks, subtotal: q.subtotal, discount_total: q.discount_total,
        tax_total: q.tax_total, total: q.total,
      }, []);
      toast.success(language === 'en' ? 'Quote duplicated.' : 'Cotización duplicada.');
      navigate(`/my-quotes/${newId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setDuplicating(null);
    }
  };

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
        <button type="button" onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700">
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

        <div className="mt-6 space-y-2.5">
          {!quotes ? (
            <div className="flex justify-center py-12"><Loader className="size-6 animate-spin text-indigo-500" /></div>
          ) : quotes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <FileText className="mx-auto mb-2 size-8 text-slate-300" />
              <p className="text-sm font-semibold text-slate-500">
                {language === 'en' ? 'No quotes yet — create your first one.' : 'Aún no tienes cotizaciones — crea la primera.'}
              </p>
            </div>
          ) : (
            quotes.map((q) => (
              <div key={q.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-slate-800">{q.client_name}</p>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${STATUS_LABELS[q.status].color}18`, color: STATUS_LABELS[q.status].color }}>
                      {STATUS_LABELS[q.status][language]}
                    </span>
                  </div>
                  <p className="truncate text-xs text-slate-400">
                    {getQuoteDocumentTitle(q.country, q.quote_type, q.language)} · {q.quote_number} · {new Date(q.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
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
