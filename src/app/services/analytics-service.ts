/**
 * Visitor-origin analytics — "de dónde vienen las personas y quiénes son
 * los que me visitan". One row per SESSION (not per page view): tracking
 * inserts, admin dashboard reads via SECURITY DEFINER RPCs (see
 * supabase_add_visitor_analytics_migration.sql) so raw rows are never
 * exposed to non-admins even though INSERT is open to anon.
 */

import { supabase, publicSupabase } from '../../lib/supabase';

const SESSION_KEY = 'codec_analytics_session';
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min of inactivity = new "visit"

function randomId(): string {
  return typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Returns [sessionId, isNewSession] — a new session id is minted (and the
 * caller should log a visitor row) whenever there's none stored yet or the
 * last one went stale past SESSION_TTL_MS. */
function getOrCreateSessionId(): { id: string; isNew: boolean } {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { id: string; lastSeen: number };
      if (Date.now() - parsed.lastSeen < SESSION_TTL_MS) {
        window.localStorage.setItem(SESSION_KEY, JSON.stringify({ id: parsed.id, lastSeen: Date.now() }));
        return { id: parsed.id, isNew: false };
      }
    }
  } catch { /* localStorage unavailable — fall through to a fresh id */ }

  const id = randomId();
  try { window.localStorage.setItem(SESSION_KEY, JSON.stringify({ id, lastSeen: Date.now() })); } catch { /* noop */ }
  return { id, isNew: true };
}

/** Classifies document.referrer + UTM params into the buckets requested:
 * Google, Facebook, Instagram, LinkedIn, Directo, Referidos, Email. UTM
 * params (from paid/ad links) take priority over the raw referrer host,
 * since that's how campaigns are actually tagged. */
function classifyReferrerSource(referrer: string, search: string): { source: string; host: string | null } {
  const params = new URLSearchParams(search);
  const utmSource = (params.get('utm_source') || '').toLowerCase();

  const fromUtm = (): string | null => {
    if (!utmSource) return null;
    if (utmSource.includes('google')) return 'Google';
    if (utmSource.includes('facebook') || utmSource === 'fb') return 'Facebook';
    if (utmSource.includes('instagram') || utmSource === 'ig') return 'Instagram';
    if (utmSource.includes('linkedin')) return 'LinkedIn';
    if (utmSource.includes('email') || utmSource.includes('newsletter')) return 'Email';
    return null;
  };

  const utmMatch = fromUtm();
  if (utmMatch) return { source: utmMatch, host: null };

  if (!referrer) return { source: 'Directo', host: null };

  let host = '';
  try { host = new URL(referrer).hostname.toLowerCase(); } catch { return { source: 'Referidos', host: null }; }

  const ownHost = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  if (host === ownHost) return { source: 'Directo', host };

  if (host.includes('google.')) return { source: 'Google', host };
  if (host.includes('facebook.') || host.includes('fb.com') || host.includes('m.facebook')) return { source: 'Facebook', host };
  if (host.includes('instagram.')) return { source: 'Instagram', host };
  if (host.includes('linkedin.')) return { source: 'LinkedIn', host };
  if (host.includes('mail.') || host.includes('outlook.') || host.includes('webmail')) return { source: 'Email', host };

  return { source: 'Referidos', host };
}

let geoCache: { country: string | null; country_code: string | null; city: string | null; region: string | null } | null = null;

async function resolveGeo(): Promise<{ country: string | null; country_code: string | null; city: string | null; region: string | null }> {
  if (geoCache) return geoCache;
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    window.clearTimeout(timeout);
    const data = await res.json() as { success?: boolean; country?: string; country_code?: string; city?: string; region?: string };
    geoCache = data?.success
      ? { country: data.country ?? null, country_code: data.country_code ?? null, city: data.city ?? null, region: data.region ?? null }
      : { country: null, country_code: null, city: null, region: null };
  } catch {
    geoCache = { country: null, country_code: null, city: null, region: null };
  }
  return geoCache;
}

/** Fire-and-forget — call once per page load. Only actually writes a row
 * the first time a given session is seen (rolling 30 min window), so
 * navigating between pages doesn't inflate "visitantes" counts. */
export function trackVisitorSession(): void {
  if (typeof window === 'undefined') return;
  const { id: sessionId, isNew } = getOrCreateSessionId();
  if (!isNew) return;

  void (async () => {
    try {
      const geo = await resolveGeo();
      const { source, host } = classifyReferrerSource(document.referrer, window.location.search);
      let userId: string | null = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id ?? null;
      } catch { /* anonymous visitor */ }

      await publicSupabase.from('analytics_visitors').insert({
        session_id: sessionId,
        user_id: userId,
        country: geo.country,
        country_code: geo.country_code,
        city: geo.city,
        region: geo.region,
        referrer_source: source,
        referrer_host: host,
        landing_page: window.location.pathname,
        language: navigator.language ?? null,
      });
    } catch { /* tracking must never break the real user experience */ }
  })();
}

// ─── Admin reads (SECURITY DEFINER RPCs — return nothing for non-admins) ──

export interface VisitorCounts { today: number; thisWeek: number; thisMonth: number; total: number }

export async function fetchVisitorCounts(): Promise<VisitorCounts> {
  const { data, error } = await supabase.rpc('admin_visitor_counts');
  const row = !error && Array.isArray(data) ? data[0] : null;
  return {
    today: Number(row?.today ?? 0),
    thisWeek: Number(row?.this_week ?? 0),
    thisMonth: Number(row?.this_month ?? 0),
    total: Number(row?.total ?? 0),
  };
}

function sinceIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function fetchTopCountries(days: number, limit = 10): Promise<Array<{ country: string; countryCode: string | null; visitors: number }>> {
  const { data, error } = await supabase.rpc('admin_top_countries', { p_since: sinceIso(days), p_limit: limit });
  if (error || !data) return [];
  return (data as any[]).map((r) => ({ country: r.country, countryCode: r.country_code, visitors: Number(r.visitors) }));
}

export async function fetchTopCities(days: number, limit = 10): Promise<Array<{ city: string; country: string | null; visitors: number }>> {
  const { data, error } = await supabase.rpc('admin_top_cities', { p_since: sinceIso(days), p_limit: limit });
  if (error || !data) return [];
  return (data as any[]).map((r) => ({ city: r.city, country: r.country, visitors: Number(r.visitors) }));
}

export async function fetchTrafficSources(days: number): Promise<Array<{ source: string; visitors: number }>> {
  const { data, error } = await supabase.rpc('admin_traffic_sources', { p_since: sinceIso(days) });
  if (error || !data) return [];
  return (data as any[]).map((r) => ({ source: r.referrer_source, visitors: Number(r.visitors) }));
}

export async function fetchVisitorDailySeries(days: number): Promise<Array<{ day: string; visitors: number }>> {
  const { data, error } = await supabase.rpc('admin_visitor_daily_series', { p_since: sinceIso(days) });
  if (error || !data) return [];
  return (data as any[]).map((r) => ({ day: r.day, visitors: Number(r.visitors) }));
}

export async function fetchRecentVisitors(limit = 50): Promise<Array<{
  sessionId: string; country: string | null; city: string | null; source: string;
  landingPage: string | null; isRegistered: boolean; createdAt: string;
}>> {
  const { data, error } = await supabase.rpc('admin_recent_visitors', { p_limit: limit });
  if (error || !data) return [];
  return (data as any[]).map((r) => ({
    sessionId: r.session_id, country: r.country, city: r.city, source: r.referrer_source,
    landingPage: r.landing_page, isRegistered: Boolean(r.is_registered), createdAt: r.created_at,
  }));
}
