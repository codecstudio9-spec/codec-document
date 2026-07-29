/**
 * Explicit registry of genuine translation pairs for hreflang purposes.
 *
 * IMPORTANT — what belongs here and what doesn't:
 * hreflang tells Google "these URLs are the SAME content, just in a
 * different language/region — show the visitor whichever one matches
 * them." That is only true for a real translation of the same page.
 *
 * It is NOT true for, e.g., a California lease-agreement landing and a
 * Colombia lease-agreement landing — those are two different documents
 * citing two different countries' laws, aimed at two different markets.
 * Linking them via hreflang would incorrectly tell Google they're
 * interchangeable, which can hurt both pages' relevance instead of
 * helping. Do NOT add a general "this is the LatAm counterpart of that
 * US page" entry here — only add a pair when someone has actually
 * authored the same content twice, once per language.
 *
 * Audited on 2026-07-29: no such genuine pair currently exists in the
 * ~200 SEO pages (e.g. /electronic-signature is a US marketing landing;
 * /firma-electronica is the authenticated in-app signing tool — not a
 * translation of each other). This map starts empty. Add an entry only
 * when a real translated duplicate is created.
 *
 * Every path here must be a path already registered in src/app/routes.tsx.
 */
export interface HreflangClusterEntry {
  hreflang: string; // e.g. 'en', 'es', 'es-CO' (BCP 47 — plain 'es' for
                     // pan-Spanish content, a region subtag only if the
                     // page is genuinely written for that one country)
  path: string; // site-relative path, e.g. '/electronic-signature'
}

/** path -> the OTHER members of its cluster (never includes itself). */
const CLUSTERS: HreflangClusterEntry[][] = [
  // Example shape for when a real pair exists:
  // [{ hreflang: 'en', path: '/electronic-signature' }, { hreflang: 'es', path: '/firma-electronica-general' }],
];

const PATH_TO_CLUSTER = new Map<string, HreflangClusterEntry[]>();
for (const cluster of CLUSTERS) {
  for (const member of cluster) {
    PATH_TO_CLUSTER.set(member.path, cluster.filter((m) => m.path !== member.path));
  }
}

/** Returns the other language(s) of `path`'s page, or null if this page
 * has no genuine translated counterpart (the common case — see above). */
export function getHreflangCluster(path: string): HreflangClusterEntry[] | null {
  return PATH_TO_CLUSTER.get(path) ?? null;
}
