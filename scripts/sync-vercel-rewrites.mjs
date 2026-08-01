// Regenerates vercel.json's `rewrites` array from public/seo-manifest.json
// — one explicit rewrite per route, pointing at its own pre-rendered shell
// (dist/<route>.html, written by generate-seo-shells.mjs at build time),
// so that route serves a static file with the correct <title>/description
// instead of falling through to the generic catch-all → dist/index.html.
//
// Deliberately NOT part of `npm run build` (unlike generate-seo-manifest
// and generate-seo-shells): vercel.json is routing CONFIGURATION Vercel's
// platform reads to decide how to route requests, not a static asset —
// there is no guarantee a rewrite added by the build running INSIDE a
// deploy would take effect for that same deploy. Run this locally
// whenever routes.tsx / a landing data file changes the set of SEO
// routes, then commit the updated vercel.json (same discipline as
// sitemap.xml and seo-manifest.json — regenerate, don't hand-edit).
//
// `redirects` is hand-maintained separately (small, stable — the
// pilot-combo duplicate-content consolidation) and left untouched here.

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public', 'seo-manifest.json'), 'utf-8'));
const vercelConfigPath = path.join(root, 'vercel.json');
const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf-8'));

const catchAll = vercelConfig.rewrites.find((r) => r.source === '/((?!api/).*)');
if (!catchAll) {
  console.error('sync-vercel-rewrites: could not find the existing SPA catch-all rewrite in vercel.json — aborting.');
  process.exit(1);
}

const manifestRewrites = Object.keys(manifest)
  .sort()
  .map((routePath) => ({ source: routePath, destination: `${routePath}.html` }));

vercelConfig.rewrites = [...manifestRewrites, catchAll];
fs.writeFileSync(vercelConfigPath, `${JSON.stringify(vercelConfig, null, 2)}\n`, 'utf-8');
console.log(`sync-vercel-rewrites: wrote ${manifestRewrites.length} explicit rewrites + the catch-all to vercel.json`);
