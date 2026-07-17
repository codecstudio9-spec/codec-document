import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Tooltip,
} from 'recharts';
import { ArrowLeft, Users, Globe2, MapPin, Radio, Loader, UserPlus, Repeat } from 'lucide-react';
import { MobileAppShell } from '../../components/mobile/MobileAppShell';
import { useLanguage } from '../../contexts/language-context';
import {
  fetchAnalyticsSummary, fetchVisitorsTrend, fetchTrafficSources, fetchLocationSummary,
  fetchRecentVisitors, topCountriesFromLocations,
  type AnalyticsSummary,
} from '../../services/analytics-service';
import { CARD_RADIUS, CARD_SHADOW, DARK_GRADIENT } from '../../styles/mobile-theme';

const PIE_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#7C3AED', '#06B6D4', '#EC4899'];
type RangeDays = 1 | 7 | 30 | 90;

export function MobileAdminAnalytics() {
  return (
    <MobileAppShell>
      <AnalyticsContent />
    </MobileAppShell>
  );
}

function AnalyticsContent() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [range, setRange] = useState<RangeDays>(7);

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
    fetchTrafficSources().then(setSources).catch(() => setSources([]));
    fetchLocationSummary().then(setLocations).catch(() => setLocations([]));
  }, []);

  useEffect(() => {
    setSeries(null);
    fetchVisitorsTrend(range).then(setSeries).catch(() => setSeries([]));
  }, [range]);

  const RANGE_OPTIONS: Array<{ key: RangeDays; label: string }> = [
    { key: 1, label: language === 'en' ? 'Today' : 'Hoy' },
    { key: 7, label: language === 'en' ? '7d' : '7d' },
    { key: 30, label: language === 'en' ? '30d' : '30d' },
    { key: 90, label: language === 'en' ? '90d' : '90d' },
  ];

  const seriesFormatted = useMemo(
    () => (series ?? []).map((s) => ({
      ...s,
      label: new Date(s.day).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short' }),
    })),
    [series, language],
  );

  const topCountries = useMemo(() => topCountriesFromLocations(locations ?? []).slice(0, 6), [locations]);
  const topCities = useMemo(() => (locations ?? []).slice().sort((a, b) => b.visitors - a.visitors).slice(0, 6), [locations]);

  return (
    <div>
      {/* Header */}
      <div className="px-4 pb-6 pt-6" style={{ background: DARK_GRADIENT }}>
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => navigate('/app/profile')} className="flex size-8 items-center justify-center rounded-xl bg-white/10">
            <ArrowLeft className="size-4 text-white" />
          </motion.button>
          <div>
            <h1 className="text-xl font-black text-white">Analytics</h1>
            <p className="mt-0.5 text-xs text-white/40">
              {language === 'en' ? 'Who visits, and where from' : 'Quién visita y de dónde'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Range filter */}
        <div className="flex gap-1.5 rounded-full bg-white p-1" style={{ boxShadow: CARD_SHADOW }}>
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setRange(opt.key)}
              className="flex-1 rounded-full py-2 text-xs font-bold transition"
              style={range === opt.key ? { background: '#2563EB', color: '#fff' } : { color: '#64748B' }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Users, value: summary?.visitorsToday ?? null, label: language === 'en' ? 'Today' : 'Hoy', accent: '#2563EB' },
            { icon: Users, value: summary?.visitorsThisWeek ?? null, label: language === 'en' ? 'This week' : 'Esta semana', accent: '#10B981' },
            { icon: Users, value: summary?.visitorsThisMonth ?? null, label: language === 'en' ? 'This month' : 'Este mes', accent: '#F59E0B' },
            { icon: Users, value: summary?.totalVisitors ?? null, label: language === 'en' ? 'Total' : 'Total', accent: '#7C3AED' },
          ].map(({ icon: Icon, value, label, accent }) => (
            <div key={label} className="bg-white p-4" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
              <div className="flex size-9 items-center justify-center rounded-xl" style={{ background: `${accent}18` }}>
                <Icon className="size-4" style={{ color: accent }} />
              </div>
              {value === null ? (
                <div className="mt-3 h-6 w-10 animate-pulse rounded-lg bg-slate-100" />
              ) : (
                <p className="mt-3 text-2xl font-black text-slate-900">{value.toLocaleString()}</p>
              )}
              <p className="mt-0.5 text-xs font-medium text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Trend */}
        <div className="bg-white p-4" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
          <h2 className="text-sm font-black text-slate-900">{language === 'en' ? 'Visitor trend' : 'Tendencia de visitantes'}</h2>
          <div className="mt-3 h-48">
            {seriesFormatted.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                <Loader className="mr-2 size-4 animate-spin" /> {language === 'en' ? 'Loading…' : 'Cargando…'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={seriesFormatted}>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                  <Line type="monotone" dataKey="visitors" stroke="#2563EB" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* New vs returning */}
        <div className="bg-white p-4" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
          <h2 className="text-sm font-black text-slate-900">{language === 'en' ? 'New vs. returning' : 'Nuevos vs. recurrentes'}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-50 p-3">
              <UserPlus className="size-4 text-blue-600" />
              <p className="mt-2 text-xl font-black text-slate-900">{summary ? `${summary.newVisitorsPct.toFixed(0)}%` : '—'}</p>
              <p className="text-[11px] font-medium text-slate-400">{language === 'en' ? 'New' : 'Nuevos'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <Repeat className="size-4 text-emerald-600" />
              <p className="mt-2 text-xl font-black text-slate-900">{summary ? `${summary.returningVisitorsPct.toFixed(0)}%` : '—'}</p>
              <p className="text-[11px] font-medium text-slate-400">{language === 'en' ? 'Returning' : 'Recurrentes'}</p>
            </div>
          </div>
        </div>

        {/* Traffic sources */}
        <div className="bg-white p-4" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-slate-400" />
            <h2 className="text-sm font-black text-slate-900">{language === 'en' ? 'Traffic sources' : 'Fuentes de tráfico'}</h2>
          </div>
          <div className="mt-3 h-40">
            {!sources || sources.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                {sources === null ? <Loader className="size-4 animate-spin" /> : (language === 'en' ? 'No data yet' : 'Aún sin datos')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sources} dataKey="visitors" nameKey="source" innerRadius={32} outerRadius={60} paddingAngle={2}>
                    {sources.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {sources && sources.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sources.map((s, i) => (
                <span key={s.source} className="flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600">
                  <span className="size-1.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {s.source} · {s.visitors}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Top countries */}
        <div className="bg-white p-4" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
          <div className="flex items-center gap-2">
            <Globe2 className="size-4 text-slate-400" />
            <h2 className="text-sm font-black text-slate-900">{language === 'en' ? 'Top countries' : 'Top países'}</h2>
          </div>
          <div className="mt-3 space-y-1.5">
            {!locations || topCountries.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">
                {locations === null ? (language === 'en' ? 'Loading…' : 'Cargando…') : (language === 'en' ? 'No data yet' : 'Aún sin datos')}
              </p>
            ) : (
              topCountries.map((c) => (
                <div key={c.country} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span className="text-xs font-semibold text-slate-700">{c.country}</span>
                  <span className="text-xs font-bold text-slate-400">{c.visitors}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top cities */}
        <div className="bg-white p-4" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-slate-400" />
            <h2 className="text-sm font-black text-slate-900">{language === 'en' ? 'Top cities' : 'Top ciudades'}</h2>
          </div>
          <div className="mt-3 space-y-1.5">
            {!locations || topCities.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">
                {locations === null ? (language === 'en' ? 'Loading…' : 'Cargando…') : (language === 'en' ? 'No data yet' : 'Aún sin datos')}
              </p>
            ) : (
              topCities.map((c, i) => (
                <div key={`${c.city}-${i}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <span className="text-xs font-semibold text-slate-700">{c.city}{c.country ? `, ${c.country}` : ''}</span>
                  <span className="text-xs font-bold text-slate-400">{c.visitors}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent visitors */}
        <div className="bg-white p-4 pb-6" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
          <h2 className="text-sm font-black text-slate-900">{language === 'en' ? 'Recent visitors' : 'Visitantes recientes'}</h2>
          <div className="mt-3 space-y-1.5">
            {!recent || recent.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">
                {recent === null ? (language === 'en' ? 'Loading…' : 'Cargando…') : (language === 'en' ? 'No visitors yet' : 'Aún no hay visitantes')}
              </p>
            ) : (
              recent.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-700">
                      {[v.city, v.country].filter(Boolean).join(', ') || (language === 'en' ? 'Unknown' : 'Desconocido')}
                    </p>
                    <p className="truncate text-[10px] text-slate-400">{v.source} · {[v.device, v.browser].filter(Boolean).join(' · ')}</p>
                  </div>
                  {v.isNewVisitor !== null && (
                    <span
                      className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                      style={v.isNewVisitor ? { color: '#2563EB', background: '#EFF6FF' } : { color: '#10B981', background: '#ECFDF5' }}
                    >
                      {v.isNewVisitor ? (language === 'en' ? 'New' : 'Nuevo') : (language === 'en' ? 'Return' : 'Recur.')}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
