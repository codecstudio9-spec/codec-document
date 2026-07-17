/**
 * Visitor-origin analytics — "de dónde vienen las personas y quiénes son
 * los que me visitan". One row per SESSION (not per page view), written
 * directly to analytics_visitors (INSERT is open to anon/authenticated by
 * its own RLS policy); the admin dashboard reads through 5 SECURITY
 * DEFINER RPCs (get_analytics_summary, get_visitors_trend,
 * get_traffic_sources_summary, get_location_summary, get_recent_visitors
 * — see supabase_analytics_rpcs_final.sql) so raw rows are never exposed
 * to a non-admin even via the anon key.
 *
 * Column/function names here match exactly what's actually live in
 * Supabase — this table was built by hand in the SQL editor (not by
 * running the original migration file verbatim), so the real schema
 * differs from the first design: e.g. `device`+`os` instead of a single
 * `device_type`, no `user_id`/`country_code`/`language`/`referrer_host`/
 * `visitor_id` columns at all.
 */

import { supabase, publicSupabase } from '../../lib/supabase';

const SESSION_KEY = 'codec_analytics_session';
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min of inactivity = new "visit"
const VISITOR_KEY = 'codec_analytics_visitor';

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

/** analytics_visitors has no visitor_id column to persist server-side, so
 * "new vs. returning" is decided here (a long-lived id in localStorage,
 * separate from the 30-min session id) and just sent up as the boolean
 * the is_new_visitor column expects. */
function isFirstTimeOnThisBrowser(): boolean {
  try {
    if (window.localStorage.getItem(VISITOR_KEY)) return false;
    window.localStorage.setItem(VISITOR_KEY, randomId());
    return true;
  } catch {
    return true;
  }
}

/** Coarse device/OS/browser detection from the user agent — enough to
 * answer "quiénes son los que me visitan", not meant to be exhaustive. */
function parseUserAgent(ua: string): { device: string; os: string; browser: string } {
  const isTablet = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
  const isMobile = !isTablet && /Mobi|iPhone|Android/i.test(ua);
  const device = isTablet ? 'Tablet' : isMobile ? 'Móvil' : 'Desktop';

  let os = 'Otro';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Otro';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\//.test(ua) || /Opera/.test(ua)) browser = 'Opera';
  else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = 'Chrome';
  else if (/CriOS\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua) && /Version\//.test(ua)) browser = 'Safari';

  return { device, os, browser };
}

/** Classifies document.referrer + UTM params into the buckets requested:
 * Google, Facebook, Instagram, LinkedIn, Directo, Referidos, Email. UTM
 * params (from paid/ad links) take priority over the raw referrer host,
 * since that's how campaigns are actually tagged. */
function classifyReferrerSource(referrer: string, search: string): string {
  const params = new URLSearchParams(search);
  const utmSource = (params.get('utm_source') || '').toLowerCase();

  if (utmSource) {
    if (utmSource.includes('google')) return 'Google';
    if (utmSource.includes('facebook') || utmSource === 'fb') return 'Facebook';
    if (utmSource.includes('instagram') || utmSource === 'ig') return 'Instagram';
    if (utmSource.includes('linkedin')) return 'LinkedIn';
    if (utmSource.includes('email') || utmSource.includes('newsletter')) return 'Email';
  }

  if (!referrer) return 'Directo';

  let host = '';
  try { host = new URL(referrer).hostname.toLowerCase(); } catch { return 'Referidos'; }

  const ownHost = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  if (host === ownHost) return 'Directo';

  if (host.includes('google.')) return 'Google';
  if (host.includes('facebook.') || host.includes('fb.com') || host.includes('m.facebook')) return 'Facebook';
  if (host.includes('instagram.')) return 'Instagram';
  if (host.includes('linkedin.')) return 'LinkedIn';
  if (host.includes('mail.') || host.includes('outlook.') || host.includes('webmail')) return 'Email';

  return 'Referidos';
}

let geoCache: { country: string | null; city: string | null; region: string | null } | null = null;

async function resolveGeo(): Promise<{ country: string | null; city: string | null; region: string | null }> {
  if (geoCache) return geoCache;
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    window.clearTimeout(timeout);
    const data = await res.json() as { success?: boolean; country?: string; city?: string; region?: string };
    geoCache = data?.success
      ? { country: data.country ?? null, city: data.city ?? null, region: data.region ?? null }
      : { country: null, city: null, region: null };
  } catch {
    geoCache = { country: null, city: null, region: null };
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

  const isNewVisitor = isFirstTimeOnThisBrowser();

  void (async () => {
    try {
      const geo = await resolveGeo();
      const source = classifyReferrerSource(document.referrer, window.location.search);
      const { device, os, browser } = parseUserAgent(navigator.userAgent ?? '');

      await publicSupabase.from('analytics_visitors').insert({
        session_id: sessionId,
        country: geo.country,
        city: geo.city,
        region: geo.region,
        referrer_source: source,
        landing_page: window.location.pathname,
        device,
        os,
        browser,
        is_new_visitor: isNewVisitor,
      });
    } catch { /* tracking must never break the real user experience */ }
  })();
}

/**
 * Fire-and-forget — flips one boolean on the CURRENT session's
 * analytics_visitors row (generated_document / completed_signature),
 * via a SECURITY DEFINER RPC since analytics_visitors has no client-side
 * UPDATE policy (INSERT-only, same reasoning as trackVisitorSession
 * above). Never awaited by callers — a tracking failure must never block
 * the real action (document generated / signature completed) it's
 * describing. Safe to call from anonymous flows (guest signing) too: the
 * RPC is granted to anon.
 */
export function markVisitorActivity(kind: 'document' | 'signature'): void {
  if (typeof window === 'undefined') return;
  const { id: sessionId } = getOrCreateSessionId();
  void (async () => {
    try {
      await publicSupabase.rpc('mark_visitor_activity', { p_session_id: sessionId, p_event: kind });
    } catch { /* tracking must never break the real flow */ }
  })();
}

// ─── Admin reads (SECURITY DEFINER RPCs — return nothing for non-admins) ──

export interface AnalyticsSummary {
  totalVisitors: number;
  visitorsToday: number;
  visitorsThisWeek: number;
  visitorsThisMonth: number;
  newVisitorsPct: number;
  returningVisitorsPct: number;
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const { data, error } = await supabase.rpc('get_analytics_summary');
  const row = !error && Array.isArray(data) ? data[0] : null;
  return {
    totalVisitors: Number(row?.total_visitors ?? 0),
    visitorsToday: Number(row?.visitors_today ?? 0),
    visitorsThisWeek: Number(row?.visitors_this_week ?? 0),
    visitorsThisMonth: Number(row?.visitors_this_month ?? 0),
    newVisitorsPct: Number(row?.new_visitors_pct ?? 0),
    returningVisitorsPct: Number(row?.returning_visitors_pct ?? 0),
  };
}

export async function fetchVisitorsTrend(daysLimit: number): Promise<Array<{ day: string; visitors: number }>> {
  const { data, error } = await supabase.rpc('get_visitors_trend', { days_limit: daysLimit });
  if (error || !data) return [];
  return (data as any[]).map((r) => ({ day: r.visit_date, visitors: Number(r.total_visits) }));
}

/** All-time — get_traffic_sources_summary() takes no date-range param. */
export async function fetchTrafficSources(): Promise<Array<{ source: string; visitors: number }>> {
  const { data, error } = await supabase.rpc('get_traffic_sources_summary');
  if (error || !data) return [];
  return (data as any[]).map((r) => ({ source: r.source, visitors: Number(r.count) }));
}

/** All-time — get_location_summary() takes no date-range param. Each row
 * is a unique (city, country) pair, so "top countries" is derived here by
 * summing rows client-side rather than a second RPC. */
export async function fetchLocationSummary(): Promise<Array<{ city: string; country: string; visitors: number }>> {
  const { data, error } = await supabase.rpc('get_location_summary');
  if (error || !data) return [];
  return (data as any[]).map((r) => ({ city: r.city_name, country: r.country_name, visitors: Number(r.count) }));
}

export function topCountriesFromLocations(
  locations: Array<{ city: string; country: string; visitors: number }>,
): Array<{ country: string; visitors: number }> {
  const byCountry = new Map<string, number>();
  for (const loc of locations) {
    byCountry.set(loc.country, (byCountry.get(loc.country) ?? 0) + loc.visitors);
  }
  return [...byCountry.entries()]
    .map(([country, visitors]) => ({ country, visitors }))
    .sort((a, b) => b.visitors - a.visitors);
}

export async function fetchRecentVisitors(): Promise<Array<{
  id: string; country: string | null; city: string | null; source: string;
  landingPage: string | null; device: string | null; browser: string | null;
  isNewVisitor: boolean | null; createdAt: string;
  generatedDocument: boolean; completedSignature: boolean;
}>> {
  const { data, error } = await supabase.rpc('get_recent_visitors');
  if (error || !data) return [];
  return (data as any[]).map((r) => ({
    id: r.id, country: r.country, city: r.city, source: r.referrer_source,
    landingPage: r.landing_page, device: r.device, browser: r.browser ?? null,
    isNewVisitor: r.is_new_visitor, createdAt: r.created_at,
    // Both default to false until supabase_analytics_activity_migration.sql
    // is run AND get_recent_visitors is updated to return them — see that
    // file's header comment. Never crashes in the meantime, just shows
    // no badges.
    generatedDocument: Boolean(r.generated_document),
    completedSignature: Boolean(r.completed_signature),
  }));
}
