import { useEffect, useMemo, useState } from 'react';
import {
  DollarSign, ShoppingCart, TrendingUp, Users2, FileText, PenLine,
  Globe2, Download, Loader, ArrowRight, Tag, Search, Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchSalesSummary, fetchTopDocuments, fetchConversionFunnel, fetchSignatureStats, fetchTopPages,
  type SalesSummary, type ConversionFunnel,
} from '../../services/analytics-service';
import {
  fetchBusinessLeads, updateLeadStatus, leadsToCsv, LEAD_STATUS_LABELS,
  type BusinessLead, type LeadStatus,
} from '../../services/business-leads-service';
import { getPromoCodeUsage, type PromoCodeUsage } from '../../services/promo-admin-service';
import { CARD_RADIUS, CARD_SHADOW } from '../../styles/mobile-theme';

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white p-6" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>{children}</div>;
}

function StatTile({ icon: Icon, label, value, sub, accent }: {
  icon: typeof DollarSign; label: string; value: string | null; sub?: string; accent: string;
}) {
  return (
    <Card>
      <div className="flex size-10 items-center justify-center rounded-2xl" style={{ background: `${accent}18` }}>
        <Icon className="size-5" style={{ color: accent }} />
      </div>
      {value === null ? (
        <div className="mt-4 h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <p className="mt-4 text-2xl font-black text-slate-900">{value}</p>
      )}
      <p className="mt-1 text-xs font-medium text-slate-400">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{sub}</p>}
    </Card>
  );
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function BusinessIntelligenceTab({ language }: { language: 'en' | 'es' }) {
  const [sales, setSales] = useState<SalesSummary | null>(null);
  const [topDocs, setTopDocs] = useState<Array<{ documentType: string; generatedCount: number; paidCount: number }> | null>(null);
  const [funnel, setFunnel] = useState<ConversionFunnel | null>(null);
  const [sigStats, setSigStats] = useState<{ started: number; completed: number } | null>(null);
  const [topPages, setTopPages] = useState<Array<{ landingPage: string; visits: number; conversions: number }> | null>(null);
  const [leads, setLeads] = useState<BusinessLead[] | null>(null);
  const [funnelDays, setFunnelDays] = useState<7 | 30>(30);

  const load = () => {
    fetchSalesSummary().then(setSales).catch(() => setSales({ salesToday: 0, countToday: 0, salesMonth: 0, countMonth: 0 }));
    fetchTopDocuments().then(setTopDocs).catch(() => setTopDocs([]));
    fetchSignatureStats(funnelDays).then(setSigStats).catch(() => setSigStats({ started: 0, completed: 0 }));
    fetchTopPages().then(setTopPages).catch(() => setTopPages([]));
    fetchBusinessLeads().then(setLeads).catch(() => setLeads([]));
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => {
    fetchConversionFunnel(funnelDays).then(setFunnel).catch(() => setFunnel({ visited: 0, registered: 0, generated: 0, previewed: 0, purchased: 0 }));
    fetchSignatureStats(funnelDays).then(setSigStats).catch(() => setSigStats({ started: 0, completed: 0 }));
  }, [funnelDays]);

  const avgTicket = sales && sales.countToday > 0 ? sales.salesToday / sales.countToday : 0;
  const conversionPct = funnel && funnel.visited > 0 ? (funnel.purchased / funnel.visited) * 100 : 0;

  const leadCounts = useMemo(() => {
    const all = leads ?? [];
    return { total: all.length, new: all.filter((l) => l.status === 'new').length, pending: all.filter((l) => l.status === 'new' || l.status === 'contacted').length };
  }, [leads]);

  const funnelSteps: Array<{ key: keyof ConversionFunnel; label: { en: string; es: string } }> = [
    { key: 'visited', label: { en: 'Visited', es: 'Visitó página' } },
    { key: 'registered', label: { en: 'Signed up', es: 'Se registró' } },
    { key: 'generated', label: { en: 'Generated document', es: 'Generó documento' } },
    { key: 'previewed', label: { en: 'Previewed', es: 'Previsualizó' } },
    { key: 'purchased', label: { en: 'Purchased', es: 'Compró' } },
  ];

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    try {
      await updateLeadStatus(id, status);
      setLeads((prev) => (prev ?? []).map((l) => (l.id === id ? { ...l, status } : l)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        <StatTile icon={DollarSign} accent="#10B981" label={language === 'en' ? 'Sales today' : 'Ventas hoy'}
          value={sales ? usd(sales.salesToday) : null}
          sub={sales ? `${sales.countToday} ${language === 'en' ? 'sales' : 'ventas'} · ${language === 'en' ? 'avg' : 'ticket prom.'} ${usd(avgTicket)}` : undefined} />
        <StatTile icon={TrendingUp} accent="#2563EB" label={language === 'en' ? 'Sales this month' : 'Ventas mes actual'}
          value={sales ? usd(sales.salesMonth) : null}
          sub={sales ? `${sales.countMonth} ${language === 'en' ? 'orders' : 'órdenes'}` : undefined} />
        <StatTile icon={ShoppingCart} accent="#F59E0B" label={language === 'en' ? 'Conversion' : 'Conversión'}
          value={funnel ? `${conversionPct.toFixed(1)}%` : null}
          sub={funnel ? `${funnel.visited} ${language === 'en' ? 'visitors' : 'visitantes'} · ${funnel.registered} ${language === 'en' ? 'signups' : 'registros'} · ${funnel.purchased} ${language === 'en' ? 'buys' : 'compras'}` : undefined} />
        <StatTile icon={Users2} accent="#7C3AED" label={language === 'en' ? 'Business leads' : 'Leads empresariales'}
          value={leads ? String(leadCounts.total) : null}
          sub={leads ? `${leadCounts.new} ${language === 'en' ? 'new' : 'nuevos'} · ${leadCounts.pending} ${language === 'en' ? 'pending' : 'pendientes'}` : undefined} />
      </div>

      {/* Documentos más generados + Firmas */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-black text-slate-900">{language === 'en' ? 'Most generated documents' : 'Documentos más generados'}</h2>
          <p className="mt-0.5 text-xs text-slate-400">{language === 'en' ? 'Last 30 days' : 'Últimos 30 días'}</p>
          <div className="mt-4 space-y-2">
            {!topDocs ? (
              <div className="flex justify-center py-6"><Loader className="size-4 animate-spin text-slate-300" /></div>
            ) : topDocs.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">{language === 'en' ? 'No data yet' : 'Aún sin datos'}</p>
            ) : (
              topDocs.map((d) => (
                <div key={d.documentType} className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-700"><FileText className="size-3.5 text-slate-400" />{d.documentType}</span>
                  <span className="text-xs text-slate-500">{d.generatedCount} {language === 'en' ? 'generated' : 'generados'} · <b className="text-emerald-600">{d.paidCount} {language === 'en' ? 'paid' : 'pagos'}</b></span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-black text-slate-900"><PenLine className="size-4 text-slate-400" />{language === 'en' ? 'E-signatures' : 'Firmas electrónicas'}</h2>
            <div className="flex gap-1 rounded-full bg-slate-50 p-1">
              {[7, 30].map((d) => (
                <button key={d} type="button" onClick={() => setFunnelDays(d as 7 | 30)}
                  className="rounded-full px-2.5 py-1 text-[11px] font-bold transition"
                  style={funnelDays === d ? { background: '#2563EB', color: '#fff' } : { color: '#64748B' }}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {!sigStats ? (
            <div className="mt-4 flex justify-center py-6"><Loader className="size-4 animate-spin text-slate-300" /></div>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-slate-50 p-3 text-center">
                <p className="text-xl font-black text-slate-900">{sigStats.started}</p>
                <p className="text-[11px] text-slate-400">{language === 'en' ? 'Started' : 'Creadas'}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-center">
                <p className="text-xl font-black text-emerald-700">{sigStats.completed}</p>
                <p className="text-[11px] text-slate-400">{language === 'en' ? 'Completed' : 'Completadas'}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3 text-center">
                <p className="text-xl font-black text-amber-700">{Math.max(0, sigStats.started - sigStats.completed)}</p>
                <p className="text-[11px] text-slate-400">{language === 'en' ? 'Abandoned' : 'Abandonadas'}</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Funnel */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900">Funnel</h2>
          <div className="flex gap-1 rounded-full bg-slate-50 p-1">
            {[7, 30].map((d) => (
              <button key={d} type="button" onClick={() => setFunnelDays(d as 7 | 30)}
                className="rounded-full px-2.5 py-1 text-[11px] font-bold transition"
                style={funnelDays === d ? { background: '#2563EB', color: '#fff' } : { color: '#64748B' }}>
                {d}d
              </button>
            ))}
          </div>
        </div>
        {!funnel ? (
          <div className="mt-4 flex justify-center py-6"><Loader className="size-4 animate-spin text-slate-300" /></div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {funnelSteps.map((s, i) => {
              const value = funnel[s.key];
              const prevValue = i > 0 ? funnel[funnelSteps[i - 1].key] : null;
              const pct = prevValue && prevValue > 0 ? (value / prevValue) * 100 : null;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
                    <p className="text-lg font-black text-slate-900">{value}</p>
                    <p className="text-[11px] text-slate-400">{s.label[language]}</p>
                    {pct !== null && <p className="text-[10px] font-bold text-indigo-500">{pct.toFixed(0)}%</p>}
                  </div>
                  {i < funnelSteps.length - 1 && <ArrowRight className="size-3.5 shrink-0 text-slate-300" />}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Top páginas */}
      <Card>
        <h2 className="flex items-center gap-2 text-sm font-black text-slate-900"><Globe2 className="size-4 text-slate-400" />{language === 'en' ? 'Top pages' : 'Top páginas'}</h2>
        <div className="mt-4 space-y-2">
          {!topPages ? (
            <div className="flex justify-center py-6"><Loader className="size-4 animate-spin text-slate-300" /></div>
          ) : topPages.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">{language === 'en' ? 'No data yet' : 'Aún sin datos'}</p>
          ) : (
            topPages.map((p) => (
              <div key={p.landingPage} className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5">
                <span className="truncate text-sm font-semibold text-slate-700">{p.landingPage}</span>
                <span className="shrink-0 text-xs text-slate-500">{p.visits} {language === 'en' ? 'visits' : 'visitas'} · <b className="text-emerald-600">{p.conversions}</b></span>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Empresas interesadas */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900">{language === 'en' ? 'Interested companies' : 'Empresas interesadas'}</h2>
          <button
            type="button"
            onClick={() => downloadCsv(leadsToCsv(leads ?? []), `codec-leads-${new Date().toISOString().slice(0, 10)}.csv`)}
            disabled={!leads || leads.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 disabled:opacity-40"
          >
            <Download className="size-3.5" /> {language === 'en' ? 'Export CSV' : 'Exportar CSV'}
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          {!leads ? (
            <div className="flex justify-center py-6"><Loader className="size-4 animate-spin text-slate-300" /></div>
          ) : leads.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">{language === 'en' ? 'No leads yet' : 'Aún no hay leads'}</p>
          ) : (
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead>
                <tr className="text-slate-400">
                  <th className="pb-2 font-semibold">{language === 'en' ? 'Date' : 'Fecha'}</th>
                  <th className="pb-2 font-semibold">{language === 'en' ? 'Name' : 'Nombre'}</th>
                  <th className="pb-2 font-semibold">{language === 'en' ? 'Company' : 'Empresa'}</th>
                  <th className="pb-2 font-semibold">{language === 'en' ? 'Email' : 'Correo'}</th>
                  <th className="pb-2 font-semibold">{language === 'en' ? 'Country' : 'País'}</th>
                  <th className="pb-2 font-semibold">{language === 'en' ? 'Language' : 'Idioma'}</th>
                  <th className="pb-2 font-semibold">{language === 'en' ? 'Status' : 'Estado'}</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-t border-slate-50">
                    <td className="py-2 pr-2 text-slate-500">{new Date(l.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short' })}</td>
                    <td className="py-2 pr-2 font-semibold text-slate-700">{l.name}</td>
                    <td className="py-2 pr-2 text-slate-600">{l.company ?? '—'}</td>
                    <td className="py-2 pr-2 text-slate-600">{l.email}</td>
                    <td className="py-2 pr-2 text-slate-600">{l.country ?? '—'}{l.city ? `, ${l.city}` : ''}</td>
                    <td className="py-2 pr-2">{l.language === 'es' ? '🇪🇸 ES' : l.language === 'en' ? '🇺🇸 EN' : '—'}</td>
                    <td className="py-2 pr-2">
                      <select
                        value={l.status}
                        onChange={(e) => void handleStatusChange(l.id, e.target.value as LeadStatus)}
                        className="rounded-full px-2.5 py-1 text-[11px] font-bold outline-none"
                        style={{ background: `${LEAD_STATUS_LABELS[l.status].color}18`, color: LEAD_STATUS_LABELS[l.status].color }}
                      >
                        {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((s) => (
                          <option key={s} value={s}>{LEAD_STATUS_LABELS[s][language]}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <PromoCodeLookup language={language} />
    </div>
  );
}

/** Admin types the code they want to audit — never hardcoded here, since
 * a code with no redemption limit shouldn't live in plain text in a
 * committed file (a repo that could go public). Also doubles as the
 * "notification" the admin asked for: if the usage count grew since the
 * last time THIS browser checked this same code, it's called out — an
 * in-app indicator you see when you open this panel, not a push/email
 * alert while you're away (no such infra exists in this project yet). */
function PromoCodeLookup({ language }: { language: 'en' | 'es' }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<PromoCodeUsage[] | null>(null);
  const [newSinceLastCheck, setNewSinceLastCheck] = useState(0);

  const handleSearch = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    try {
      const results = await getPromoCodeUsage(trimmed);
      setUsage(results);
      const storageKey = `promo_seen_count_${trimmed}`;
      const previouslySeen = Number(localStorage.getItem(storageKey) ?? '0');
      setNewSinceLastCheck(Math.max(0, results.length - previouslySeen));
      localStorage.setItem(storageKey, String(results.length));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
      setUsage(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="flex items-center gap-2 text-sm font-black text-slate-900">
        <Tag className="size-4 text-slate-400" />
        {language === 'en' ? 'Promo code usage' : 'Uso de código promocional'}
      </h2>
      <p className="mt-0.5 text-xs text-slate-400">
        {language === 'en' ? 'Type any code to see exactly where and when it was used.' : 'Escribe cualquier código para ver exactamente dónde y cuándo se usó.'}
      </p>
      <div className="mt-4 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleSearch(); }}
          placeholder={language === 'en' ? 'e.g. PROMO1022925002' : 'ej. PROMO1022925002'}
          className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm uppercase tracking-wide outline-none focus:border-indigo-400"
        />
        <button
          type="button"
          disabled={loading || !code.trim()}
          onClick={() => void handleSearch()}
          className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40"
        >
          {loading ? <Loader className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
          {language === 'en' ? 'Search' : 'Buscar'}
        </button>
      </div>

      {usage && newSinceLastCheck > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-bold text-amber-800">
          <Bell className="size-3.5" />
          {language === 'en'
            ? `${newSinceLastCheck} new use${newSinceLastCheck === 1 ? '' : 's'} since you last checked this code.`
            : `${newSinceLastCheck} uso${newSinceLastCheck === 1 ? '' : 's'} nuevo${newSinceLastCheck === 1 ? '' : 's'} desde tu última revisión de este código.`}
        </div>
      )}

      {usage && (
        <div className="mt-4 overflow-x-auto">
          {usage.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">{language === 'en' ? 'No redemptions yet for this code.' : 'Aún no se ha usado este código.'}</p>
          ) : (
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead>
                <tr className="text-slate-400">
                  <th className="pb-2 font-semibold">{language === 'en' ? 'Date' : 'Fecha'}</th>
                  <th className="pb-2 font-semibold">{language === 'en' ? 'Account' : 'Cuenta'}</th>
                  <th className="pb-2 font-semibold">IP</th>
                  <th className="pb-2 font-semibold">{language === 'en' ? 'Granted' : 'Otorgó'}</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((u, i) => (
                  <tr key={i} className="border-t border-slate-50">
                    <td className="py-2 pr-2 text-slate-500">{new Date(u.redeemedAt).toLocaleString(language === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</td>
                    <td className="py-2 pr-2 font-semibold text-slate-700">{u.userEmail}</td>
                    <td className="py-2 pr-2 text-slate-500">{u.ipAddress ?? '—'}</td>
                    <td className="py-2 pr-2 text-slate-500">{u.product}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </Card>
  );
}
