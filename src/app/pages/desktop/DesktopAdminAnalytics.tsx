import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Users, Globe2, MapPin, Radio, Loader, UserPlus, Repeat, FileText, PenLine, ChevronDown } from 'lucide-react';
import { DesktopAppShell } from '../../components/desktop/DesktopAppShell';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import {
  fetchAnalyticsSummary, fetchVisitorsTrend, fetchTrafficSources, fetchLocationSummary,
  fetchRecentVisitors, topCountriesFromLocations, SOURCE_LABELS,
  type AnalyticsSummary,
} from '../../services/analytics-service';
import { BusinessIntelligenceTab } from '../../components/admin/BusinessIntelligenceTab';
import { AnalyticsAccessManager } from '../../components/admin/AnalyticsAccessManager';
import { CARD_RADIUS, CARD_SHADOW } from '../../styles/mobile-theme';

const PIE_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#7C3AED', '#06B6D4', '#EC4899'];
type RangeDays = 1 | 7 | 30 | 90;

function KpiCard({ icon: Icon, value, label, accent }: { icon: typeof Users; value: number | null; label: string; accent: string }) {
  return (
    <div className="bg-white p-6" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
      <div className="flex size-11 items-center justify-center rounded-2xl" style={{ background: `${accent}18` }}>
        <Icon className="size-5" style={{ color: accent }} />
      </div>
      {value === null ? (
        <div className="mt-4 h-8 w-14 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <p className="mt-4 text-3xl font-black text-slate-900">{value.toLocaleString()}</p>
      )}
      <p className="mt-1 text-sm font-medium text-slate-400">{label}</p>
    </div>
  );
}

export function DesktopAdminAnalytics() {
  return (
    <DesktopAppShell>
      <AdminAnalyticsContent />
    </DesktopAppShell>
  );
}

function AdminAnalyticsContent() {
  const { isAdmin } = useAuth();
  const { language } = useLanguage();
  const [tab, setTab] = useState<'visitantes' | 'comercial'>('comercial');
  const [range, setRange] = useState<RangeDays>(7);
  const [showAllRecent, setShowAllRecent] = useState(false);

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [series, setSeries] = useState<Array<{ day: string; visitors: number }> | null>(null);
  const [sources, setSources] = useState<Array<{ source: string; visitors: number }> | null>(null);
  const [locations, setLocations] = useState<Array<{ city: string; country: string; visitors: number }> | null>(null);
  const [recent, setRecent] = useState<Awaited<ReturnType<typeof fetchRecentVisitors>> | null>(null);

  useEffect(() => {
    fetchAnalyticsSummary().then(setSummary).catch(() => setSummary({
      totalVisitors: 0, visitorsToday: 0, visitorsThisWeek: 0, visitorsThisMonth: 0,
      newVisitorsPct: 0, returningVisitorsPct: 0,
    }));
    fetchRecentVisitors().then(setRecent).catch(() => setRecent([]));
    // All-time — the underlying RPCs don't take a date range.
    fetchTrafficSources().then(setSources).catch(() => setSources([]));
    fetchLocationSummary().then(setLocations).catch(() => setLocations([]));
  }, []);

  useEffect(() => {
    setSeries(null);
    fetchVisitorsTrend(range).then(setSeries).catch(() => setSeries([]));
  }, [range]);

  const RANGE_OPTIONS: Array<{ key: RangeDays; label: string }> = [
    { key: 1, label: language === 'en' ? 'Today' : 'Hoy' },
    { key: 7, label: language === 'en' ? '7 days' : '7 días' },
    { key: 30, label: language === 'en' ? '30 days' : '30 días' },
    { key: 90, label: language === 'en' ? '90 days' : '90 días' },
  ];

  const seriesFormatted = useMemo(
    () => (series ?? []).map((s) => ({
      ...s,
      label: new Date(s.day).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short' }),
    })),
    [series, language],
  );

  const topCountries = useMemo(() => topCountriesFromLocations(locations ?? []).slice(0, 8), [locations]);
  const topCities = useMemo(() => (locations ?? []).slice().sort((a, b) => b.visitors - a.visitors).slice(0, 8), [locations]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Analytics</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {language === 'en' ? 'Who visits Codec Document, and where they come from' : 'Quién visita Codec Document y de dónde vienen'}
          </p>
        </div>
        {tab === 'visitantes' && (
          <div className="flex gap-1.5 rounded-full bg-white p-1" style={{ boxShadow: CARD_SHADOW }}>
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setRange(opt.key)}
                className="rounded-full px-3.5 py-1.5 text-xs font-bold transition"
                style={range === opt.key ? { background: '#2563EB', color: '#fff' } : { color: '#64748B' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Comercial / Leads & Ventas — solo admin, ver AdminRoute en routes.tsx */}
      <div className="mt-4 flex gap-1.5 rounded-full bg-white p-1 w-fit" style={{ boxShadow: CARD_SHADOW }}>
        {(['comercial', 'visitantes'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="rounded-full px-4 py-2 text-xs font-bold transition"
            style={tab === t ? { background: '#4338CA', color: '#fff' } : { color: '#64748B' }}
          >
            {t === 'comercial' ? (language === 'en' ? 'Business' : 'Comercial') : (language === 'en' ? 'Visitors' : 'Visitantes')}
          </button>
        ))}
      </div>

      {tab === 'comercial' && (
        <div className="mt-6 space-y-6">
          <BusinessIntelligenceTab language={language} />
          {/* Never shown to a granted analytics-only viewer — see
              AnalyticsAccessManager's own doc comment for why. */}
          {isAdmin && <AnalyticsAccessManager language={language} />}
        </div>
      )}

      {tab === 'visitantes' && <>
      {/* KPIs — always today/week/month/total, independent of the range filter */}
      <div className="mt-6 grid grid-cols-4 gap-5">
        <KpiCard icon={Users} value={summary?.visitorsToday ?? null} label={language === 'en' ? 'Visitors today' : 'Visitantes hoy'} accent="#2563EB" />
        <KpiCard icon={Users} value={summary?.visitorsThisWeek ?? null} label={language === 'en' ? 'Visitors this week' : 'Visitantes esta semana'} accent="#10B981" />
        <KpiCard icon={Users} value={summary?.visitorsThisMonth ?? null} label={language === 'en' ? 'Visitors this month' : 'Visitantes este mes'} accent="#F59E0B" />
        <KpiCard icon={Users} value={summary?.totalVisitors ?? null} label={language === 'en' ? 'Total visitors' : 'Visitantes totales'} accent="#7C3AED" />
      </div>

      {/* Visitor trend */}
      <div className="mt-6 bg-white p-6" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
        <h2 className="text-sm font-black text-slate-900">{language === 'en' ? 'Visitor trend' : 'Tendencia de visitantes'}</h2>
        <div className="mt-4 h-64">
          {seriesFormatted.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              <Loader className="mr-2 size-4 animate-spin" /> {language === 'en' ? 'Loading…' : 'Cargando…'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={seriesFormatted}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Line type="monotone" dataKey="visitors" stroke="#2563EB" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-5">
        {/* Traffic sources (all-time) */}
        <div className="bg-white p-6" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-slate-400" />
            <h2 className="text-sm font-black text-slate-900">{language === 'en' ? 'Traffic sources' : 'Fuentes de tráfico'}</h2>
          </div>
          <div className="mt-4 h-56">
            {!sources || sources.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                {sources === null ? <Loader className="size-4 animate-spin" /> : (language === 'en' ? 'No data yet' : 'Aún sin datos')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sources} dataKey="visitors" nameKey="source" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {sources.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {sources && sources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {sources.map((s, i) => (
                <span key={s.source} className="flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  <span className="size-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {s.source} · {s.visitors}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Top countries (all-time) */}
        <div className="bg-white p-6" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
          <div className="flex items-center gap-2">
            <Globe2 className="size-4 text-slate-400" />
            <h2 className="text-sm font-black text-slate-900">{language === 'en' ? 'Top countries' : 'Top países'}</h2>
          </div>
          <div className="mt-4 h-56">
            {!locations || topCountries.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                {locations === null ? <Loader className="size-4 animate-spin" /> : (language === 'en' ? 'No data yet' : 'Aún sin datos')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCountries} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="country" width={90} tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                  <Bar dataKey="visitors" fill="#2563EB" radius={[0, 6, 6, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* New vs. returning + top cities */}
      <div className="mt-6 grid grid-cols-2 gap-5">
        <div className="bg-white p-6" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
          <h2 className="text-sm font-black text-slate-900">{language === 'en' ? 'New vs. returning' : 'Nuevos vs. recurrentes'}</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50">
                <UserPlus className="size-4 text-blue-600" />
              </div>
              {summary === null ? (
                <div className="mt-3 h-7 w-16 animate-pulse rounded-lg bg-slate-200" />
              ) : (
                <p className="mt-3 text-2xl font-black text-slate-900">{summary.newVisitorsPct.toFixed(0)}%</p>
              )}
              <p className="mt-0.5 text-xs font-medium text-slate-400">{language === 'en' ? 'New' : 'Nuevos'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50">
                <Repeat className="size-4 text-emerald-600" />
              </div>
              {summary === null ? (
                <div className="mt-3 h-7 w-16 animate-pulse rounded-lg bg-slate-200" />
              ) : (
                <p className="mt-3 text-2xl font-black text-slate-900">{summary.returningVisitorsPct.toFixed(0)}%</p>
              )}
              <p className="mt-0.5 text-xs font-medium text-slate-400">{language === 'en' ? 'Returning' : 'Recurrentes'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-slate-400" />
            <h2 className="text-sm font-black text-slate-900">{language === 'en' ? 'Top cities' : 'Top ciudades'}</h2>
          </div>
          <div className="mt-4 space-y-2">
            {!locations || topCities.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                {locations === null ? (language === 'en' ? 'Loading…' : 'Cargando…') : (language === 'en' ? 'No data yet' : 'Aún sin datos')}
              </p>
            ) : (
              topCities.map((c, i) => (
                <div key={`${c.city}-${i}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5">
                  <span className="text-sm font-semibold text-slate-700">{c.city}{c.country ? `, ${c.country}` : ''}</span>
                  <span className="text-xs font-bold text-slate-400">{c.visitors}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent visitors */}
      <div className="mt-6 bg-white p-6" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900">{language === 'en' ? 'Recent visitors' : 'Visitantes recientes'}</h2>
          {recent && recent.length > 0 && (
            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-400">
              <span className="flex items-center gap-1"><FileText className="size-3 text-blue-500" />{recent.filter((v) => v.generatedDocument).length} {language === 'en' ? 'generated a doc' : 'generaron doc.'}</span>
              <span className="flex items-center gap-1"><PenLine className="size-3 text-emerald-500" />{recent.filter((v) => v.completedSignature).length} {language === 'en' ? 'signed' : 'firmaron'}</span>
            </div>
          )}
        </div>
        <div className="mt-4 space-y-2">
          {!recent || recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              {recent === null ? (language === 'en' ? 'Loading…' : 'Cargando…') : (language === 'en' ? 'No visitors yet' : 'Aún no hay visitantes')}
            </p>
          ) : (
            (showAllRecent ? recent : recent.slice(0, 8)).map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-700">
                    {[v.city, v.country].filter(Boolean).join(', ') || (language === 'en' ? 'Unknown location' : 'Ubicación desconocida')}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">
                    {v.source} · {[v.device, v.browser].filter(Boolean).join(' · ')} · {v.landingPage}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {v.generatedDocument && (
                    <span
                      className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700"
                      title={v.documentSource ? SOURCE_LABELS[v.documentSource]?.[language] : undefined}
                    >
                      <FileText className="size-3" />
                      {v.documentSource ? SOURCE_LABELS[v.documentSource]?.[language] : (language === 'en' ? 'Document' : 'Documento')}
                    </span>
                  )}
                  {v.completedSignature && (
                    <span
                      className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700"
                      title={v.signatureSource ? SOURCE_LABELS[v.signatureSource]?.[language] : undefined}
                    >
                      <PenLine className="size-3" />
                      {v.signatureSource ? SOURCE_LABELS[v.signatureSource]?.[language] : (language === 'en' ? 'Signature' : 'Firma')}
                    </span>
                  )}
                  {v.isNewVisitor !== null && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={v.isNewVisitor ? { color: '#2563EB', background: '#EFF6FF' } : { color: '#10B981', background: '#ECFDF5' }}
                    >
                      {v.isNewVisitor ? (language === 'en' ? 'New' : 'Nuevo') : (language === 'en' ? 'Returning' : 'Recurrente')}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        {recent && recent.length > 8 && (
          <button
            type="button"
            onClick={() => setShowAllRecent((s) => !s)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-slate-500 hover:bg-slate-50"
          >
            {showAllRecent ? (language === 'en' ? 'Show less' : 'Mostrar menos') : `${language === 'en' ? 'Show all' : 'Mostrar todos'} (${recent.length})`}
            <ChevronDown className={`size-3.5 transition-transform ${showAllRecent ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
      </>}
    </div>
  );
}
