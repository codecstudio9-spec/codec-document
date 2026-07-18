// Real-time IP geolocation for the signing flow — same ipwho.is service
// already used in language-context.tsx and analytics-service.ts, just
// requesting country_code (ISO 3166-1 alpha-2, e.g. "CO") specifically
// since that's what resolveJurisdiction() in signature-jurisdictions.ts
// keys on. Cached at module level per page load (a signer's country
// doesn't change mid-session) so repeated calls across a signing flow
// (consent step, then final compile) don't re-hit the network.

let cachedCountryCode: string | null | undefined; // undefined = not fetched yet

export async function detectSignerCountryCode(): Promise<string | null> {
  if (cachedCountryCode !== undefined) return cachedCountryCode;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json() as { success?: boolean; country_code?: string };
    cachedCountryCode = data?.success && data.country_code ? data.country_code.toUpperCase() : null;
  } catch {
    cachedCountryCode = null; // network failure — caller falls back to the default (US) jurisdiction
  }
  return cachedCountryCode;
}
