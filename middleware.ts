// Vercel Edge Middleware — sets the authoritative canonical (and, when a
// genuine translation exists, hreflang) URL as an HTTP `Link` response
// header on every marketing/SEO page.
//
// Why this exists: index.html is a single static shell served for ~200
// different routes (see the SPA rewrite in vercel.json). A canonical/
// hreflang baked into that shared HTML was necessarily wrong on every
// route except the one it was written for — every inner page told any
// crawler that didn't execute JS "the homepage is the canonical version of
// me", which is exactly the failure mode behind a page being dropped from
// the index in favor of the wrong URL. An HTTP header is seen by every
// crawler (JS or not) before a single byte of HTML is parsed, so this is
// the authoritative source of truth; SEOHead.tsx (client-side) reinforces
// the same values once React mounts, but this header is what protects
// non-JS-executing consumers (Bing, most social-preview bots, etc.).
//
// Deploy: this file is picked up automatically by Vercel on every deploy —
// no separate deploy step, just part of the normal `vercel deploy` /
// git-push-triggered build for this project.

import { next } from '@vercel/functions';
import { getHreflangCluster } from './src/app/data/hreflang-clusters';

const SITE = 'https://www.codecdocument.com';

// App/product routes have no independent SEO identity of their own (behind
// auth, or a functional tool page, not a landing page) — leave them alone.
// Keep in sync with EXCLUDE_PREFIXES/EXCLUDE_EXACT in scripts/generate-sitemap.mjs.
const EXCLUDED = /^\/(api|generator|preview|my-[a-z-]+|admin|dashboard|app|sign|checkout|success)(\/|$)/;

// One-off routes whose path looks like a marketing landing but is actually
// the authenticated in-app tool (both point at ProtectedSignaturePage —
// verified by reading routes.tsx). A prefix rule can't catch these.
const EXCLUDED_EXACT = new Set(['/firma-electronica', '/signatures']);

export default function middleware(request: Request) {
  const url = new URL(request.url);

  if (EXCLUDED.test(url.pathname) || EXCLUDED_EXACT.has(url.pathname)) {
    return next();
  }

  const canonical = `${SITE}${url.pathname}`;
  const links = [`<${canonical}>; rel="canonical"`];

  // Only emit hreflang alternates for pages with a REAL translated
  // counterpart (see hreflang-clusters.ts for why this is deliberately
  // strict). Pages without one simply get a correct canonical here —
  // SEOHead.tsx still adds a client-side self-referencing hreflang tag
  // once the page's own fixed language is known.
  const cluster = getHreflangCluster(url.pathname);
  if (cluster) {
    links.push(`<${canonical}>; rel="alternate"; hreflang="x-default"`);
    cluster.forEach(({ hreflang, path }) => {
      links.push(`<${SITE}${path}>; rel="alternate"; hreflang="${hreflang}"`);
    });
  }

  const response = next();
  response.headers.set('Link', links.join(', '));
  return response;
}

export const config = {
  // Runs on every route except static assets (anything with a file
  // extension) and the api/ prefix — cheap at the edge, but no reason to
  // run it on requests that were never going to get a Link header anyway.
  matcher: '/((?!api|.*\\..*).*)',
};
