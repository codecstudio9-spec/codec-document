// Regenerates public/sitemap.xml from the actual routes registered in
// src/app/routes.tsx, instead of a 1000+ line hand-maintained file that had
// drifted out of sync with real routes and had a broken hreflang pattern
// (every <url> emitted hreflang="en" AND hreflang="es" pointing at the
// SAME <loc> — a no-op, not a real language cluster; see
// src/app/data/hreflang-clusters.ts for the real, deliberately near-empty
// registry of genuine translation pairs this script now uses instead).
//
// Run as part of `npm run build` (see package.json's postbuild script).

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const routesFile = path.join(root, 'src', 'app', 'routes.tsx');
const outFile = path.join(root, 'public', 'sitemap.xml');

// Keep in sync with SITE_URL in src/app/config/site.ts.
const SITE_URL = 'https://www.codecdocument.com';

// Keep in sync with the EXCLUDED pattern in middleware.ts — these are
// authenticated/app-functionality routes with no independent SEO identity,
// not public marketing/content pages.
const EXCLUDE_PREFIXES = ['/generator', '/preview', '/my-', '/admin', '/sign', '/checkout', '/success', '/api', '/dashboard', '/app'];

// One-off routes whose path LOOKS like a marketing landing but is actually
// the authenticated in-app tool (verified by reading routes.tsx — both
// point at ProtectedSignaturePage). Add to this list if another such alias
// is ever introduced; a path-prefix rule alone can't catch these.
// '/documentos-electronicos' es el módulo DIAN: herramienta autenticada en
// pruebas cerradas. Mantener en sync con EXCLUDED_EXACT de middleware.ts.
// '/documentos-electronicos' ya NO se excluye: la herramienta se abrió a todos
// y su enlace se comparte con contadores, así que tiene que poder encontrarse
// en Google. Pide sesión para usarla, pero la pantalla previa explica qué hace
// —que es justo lo que el buscador debe indexar.
const EXCLUDE_EXACT = new Set(['/firma-electronica', '/signatures', '*', '']);

function isExcluded(p) {
  if (EXCLUDE_EXACT.has(p)) return true;
  if (p.includes(':')) return true; // dynamic route — can't enumerate without importing its data module
  return EXCLUDE_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`) || p.startsWith(prefix));
}

function extractPaths(source) {
  const pathRe = /path:\s*"([^"]+)"/g;
  const paths = new Set();
  let match;
  while ((match = pathRe.exec(source))) {
    paths.add(match[1]);
  }
  return [...paths];
}

// Mirrors getHreflangCluster in src/app/data/hreflang-clusters.ts — kept as
// a tiny inline duplicate here rather than importing the .ts file directly,
// since this script runs under plain Node (no TS loader configured for
// scripts/). Update both together if a real cluster is ever added.
const HREFLANG_CLUSTERS = [];

function clusterFor(p) {
  for (const cluster of HREFLANG_CLUSTERS) {
    if (cluster.some((m) => m.path === p)) return cluster;
  }
  return null;
}

function buildUrlEntry(p, lastmod) {
  const loc = `${SITE_URL}${p}`;
  const cluster = clusterFor(p);
  const altLines = cluster
    ? cluster
        .map((m) => `    <xhtml:link rel="alternate" hreflang="${m.hreflang}" href="${SITE_URL}${m.path}" />`)
        .join('\n') + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />\n`
    : '';
  const priority = p === '/' ? '1.0' : '0.7';
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
${altLines}  </url>`;
}

function main() {
  const source = fs.readFileSync(routesFile, 'utf8');
  const allPaths = extractPaths(source);
  const included = allPaths.filter((p) => !isExcluded(p)).sort();
  const lastmod = new Date().toISOString().slice(0, 10);

  const body = included.map((p) => buildUrlEntry(p, lastmod)).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`;

  fs.writeFileSync(outFile, xml, 'utf8');
  console.log(`[generate-sitemap] Wrote ${included.length} URLs to public/sitemap.xml (excluded ${allPaths.length - included.length} app/dynamic routes).`);
}

main();
