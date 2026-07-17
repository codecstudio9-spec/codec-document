import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { Users, Globe2, MapPin, Radio, Loader, Monitor, UserPlus, Repeat } from 'lucide-react';
import { DesktopAppShell } from '../../components/desktop/DesktopAppShell';
import { useLanguage } from '../../contexts/language-context';
import {
  fetchVisitorCounts, fetchTopCountries, fetchTopCities, fetchTrafficSources,
  fetchVisitorDailySeries, fetchRecentVisitors, fetchDeviceBreakdown, fetchNewVsReturning,
  type VisitorCounts, type NewVsReturning,
} from '../../services/analytics-service';
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
  const { language } = useLanguage();
  const [range, setRange] = useState<RangeDays>(7);

  const [counts, setCounts] = useState<VisitorCounts | null>(null);
  const [series, setSeries] = useState<Array<{ day: string; visitors: number }> | null>(null);
  const [sources, setSources] = useState<Array<{ source: string; visitors: number }> | null>(null);
  const [countries, setCountries] = useState<Array<{ country: string; visitors: number }> | null>(null);
  const [cities, setCities] = useState<Array<{ city: string; country: string | null; visitors: number }> | null>(null);
  const [recent, setRecent] = useState<Awaited<ReturnType<typeof fetchRecentVisitors>> | null>(null);
  const [devices, setDevices] = useState<Array<{ deviceType: string; visitors: number }> | null>(null);
  const [newVsReturning, setNewVsReturning] = useState<NewVsReturning | null>(null);

  useEffect(() => {
    fetchVisitorCounts().then(setCounts).catch(() => setCounts({ today: 0, thisWeek: 0, thisMonth: 0, total: 0 }));
    fetchRecentVisitors(20).then(setRecent).catch(() => setRecent([]));
  }, []);

  useEffect(() => {
    setSeries(null); setSources(null); setCountries(null); setCities(null); setDevices(null); setNewVsReturning(null);
    fetchVisitorDailySeries(range).then(setSeries).catch(() => setSeries([]));
    fetchTrafficSources(range).then(setSources).catch(() => setSources([]));
    fetchTopCountries(range, 8).then(setCountries).catch(() => setCountries([]));
    fetchTopCities(range, 8).then(setCities).catch(() => setCities([]));
    fetchDeviceBreakdown(range).then(setDevices).catch(() => setDevices([]));
    fetchNewVsReturning(range).then(setNewVsReturning).catch(() => setNewVsReturning({ newVisitors: 0, returningVisitors: 0 }));
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

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Analytics</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {language === 'en' ? 'Who visits Codec Document, and where they come from' : 'Quién visita Codec Document y de dónde vienen'}
          </p>
        </div>
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
      </div>

      {/* KPIs — always today/week/month/total, independent of the range filter */}
      <div className="mt-6 grid grid-cols-4 gap-5">
        <KpiCard icon={Users} value={counts?.today ?? null} label={language === 'en' ? 'Visitors today' : 'Visitantes hoy'} accent="#2563EB" />
        <KpiCard icon={Users} value={counts?.thisWeek ?? null} label={language === 'en' ? 'Visitors this week' : 'Visitantes esta semana'} accent="#10B981" />
        <KpiCard icon={Users} value={counts?.thisMonth ?? null} label={language === 'en' ? 'Visitors this month' : 'Visitantes este mes'} accent="#F59E0B" />
        <KpiCard icon={Users} value={counts?.total ?? null} label={language === 'en' ? 'Total visitors' : 'Visitantes totales'} accent="#7C3AED" />
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
        {/* Traffic sources */}
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

        {/* Top countries */}
        <div className="bg-white p-6" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
          <div className="flex items-center gap-2">
            <Globe2 className="size-4 text-slate-400" />
            <h2 className="text-sm font-black text-slate-900">{language === 'en' ? 'Top countries' : 'Top países'}</h2>
          </div>
          <div className="mt-4 h-56">
            {!countries || countries.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                {countries === null ? <Loader className="size-4 animate-spin" /> : (language === 'en' ? 'No data yet' : 'Aún sin datos')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countries} layout="vertical" margin={{ left: 8 }}>
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

      {/* Device breakdown + new vs. returning */}
      <div className="mt-6 grid grid-cols-2 gap-5">
        <div className="bg-white p-6" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
          <div className="flex items-center gap-2">
            <Monitor className="size-4 text-slate-400" />
            <h2 className="text-sm font-black text-slate-900">{language === 'en' ? 'Devices' : 'Dispositivos'}</h2>
          </div>
          <div className="mt-4 space-y-2">
            {!devices || devices.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                {devices === null ? (language === 'en' ? 'Loading…' : 'Cargando…') : (language === 'en' ? 'No data yet' : 'Aún sin datos')}
              </p>
            ) : (
              (() => {
                const total = devices.reduce((sum, d) => sum + d.visitors, 0) || 1;
                return devices.map((d, i) => (
                  <div key={d.deviceType}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{d.deviceType}</span>
                      <span className="font-bold text-slate-400">{d.visitors}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(d.visitors / total) * 100}%`, background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                    </div>
                  </div>
                ));
              })()
            )}
          </div>
        </div>

        <div className="bg-white p-6" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
          <h2 className="text-sm font-black text-slate-900">{language === 'en' ? 'New vs. returning' : 'Nuevos vs. recurrentes'}</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50">
                <UserPlus className="size-4 text-blue-600" />
              </div>
              {newVsReturning === null ? (
                <div className="mt-3 h-7 w-12 animate-pulse rounded-lg bg-slate-200" />
              ) : (
                <p className="mt-3 text-2xl font-black text-slate-900">{newVsReturning.newVisitors.toLocaleString()}</p>
              )}
              <p className="mt-0.5 text-xs font-medium text-slate-400">{language === 'en' ? 'New' : 'Nuevos'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50">
                <Repeat className="size-4 text-emerald-600" />
              </div>
              {newVsReturning === null ? (
                <div className="mt-3 h-7 w-12 animate-pulse rounded-lg bg-slate-200" />
              ) : (
                <p className="mt-3 text-2xl font-black text-slate-900">{newVsReturning.returningVisitors.toLocaleString()}</p>
              )}
              <p className="mt-0.5 text-xs font-medium text-slate-400">{language === 'en' ? 'Returning' : 'Recurrentes'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top cities + recent visitors */}
      <div className="mt-6 grid grid-cols-2 gap-5">
        <div className="bg-white p-6" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-slate-400" />
            <h2 className="text-sm font-black text-slate-900">{language === 'en' ? 'Top cities' : 'Top ciudades'}</h2>
          </div>
          <div className="mt-4 space-y-2">
            {!cities || cities.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                {cities === null ? (language === 'en' ? 'Loading…' : 'Cargando…') : (language === 'en' ? 'No data yet' : 'Aún sin datos')}
              </p>
            ) : (
              cities.map((c, i) => (
                <div key={`${c.city}-${i}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5">
                  <span className="text-sm font-semibold text-slate-700">{c.city}{c.country ? `, ${c.country}` : ''}</span>
                  <span className="text-xs font-bold text-slate-400">{c.visitors}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
          <h2 className="text-sm font-black text-slate-900">{language === 'en' ? 'Recent visitors' : 'Visitantes recientes'}</h2>
          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {!recent || recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                {recent === null ? (language === 'en' ? 'Loading…' : 'Cargando…') : (language === 'en' ? 'No visitors yet' : 'Aún no hay visitantes')}
              </p>
            ) : (
              recent.map((v) => (
                <div key={v.sessionId} className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-700">
                      {[v.city, v.country].filter(Boolean).join(', ') || (language === 'en' ? 'Unknown location' : 'Ubicación desconocida')}
                    </p>
                    <p className="truncate text-[11px] text-slate-400">
                      {v.source} · {[v.deviceType, v.browser].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={v.isRegistered ? { color: '#10B981', background: '#ECFDF5' } : { color: '#94A3B8', background: '#F1F5F9' }}
                    >
                      {v.isRegistered ? (language === 'en' ? 'Registered' : 'Registrado') : (language === 'en' ? 'Anonymous' : 'Anónimo')}
                    </span>
                    {v.isNewVisitor !== null && (
                      <span className="text-[10px] font-medium text-slate-400">
                        {v.isNewVisitor ? (language === 'en' ? 'New' : 'Nuevo') : (language === 'en' ? 'Returning' : 'Recurrente')}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
