// Generates one static HTML file per route in public/seo-manifest.json,
// each an exact copy of the real built dist/index.html (same <script>
// tags, same JS bundle references — the SPA boots up identically) except
// with the <title>, meta description, and OG/Twitter title+description
// swapped to that route's real values.
//
// Why this exists, and why it's a build step instead of Edge Middleware:
// Vercel Edge Middleware's `next()` returns a sentinel "continue" Response,
// not the actual origin HTML — middleware can set headers (see
// middleware.ts's canonical/hreflang Link header) but cannot rewrite the
// response BODY. The only way to get a per-route-correct <title> in the
// raw HTML (for Bing, WhatsApp/Slack/Discord link previews, and Google's
// fast first-rendering pass — not just the client-side SEOHead.tsx fix,
// which only non-JS crawlers never see) is to actually serve a different
// static file per route. vercel.json has an explicit rewrite for each of
// these routes pointing at its generated shell; every other route keeps
// falling through to the generic dist/index.html via the catch-all
// rewrite, unaffected.
//
// Every visitor (human or bot) gets the exact same file — this is
// standard SPA "prerendered shell" practice, not cloaking: nothing here
// differs from what a human eventually sees once React hydrates, it's
// just the initial static bytes.
//
// Runs after `vite build` (needs the real dist/index.html with Vite's
// hashed asset filenames already injected) — see package.json's `build` script.

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const shellPath = path.join(distDir, 'index.html');
const manifestPath = path.join(root, 'public', 'seo-manifest.json');

if (!fs.existsSync(shellPath)) {
  console.error('generate-seo-shells: dist/index.html not found — run `vite build` first.');
  process.exit(1);
}

const shellHtml = fs.readFileSync(shellPath, 'utf-8');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

let written = 0;
for (const [routePath, { title, description }] of Object.entries(manifest)) {
  const escapedTitle = escapeHtml(title);
  const escapedDesc = escapeHtml(description);
  const html = shellHtml
    .replace(/<title>[^<]*<\/title>/, `<title>${escapedTitle}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${escapedDesc}$2`)
    .replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/, `$1${escapedTitle}$2`)
    .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${escapedDesc}$2`)
    .replace(/(<meta\s+property="og:url"\s+content=")[^"]*(")/, `$1https://www.codecdocument.com${routePath}$2`)
    .replace(/(<meta\s+name="twitter:title"\s+content=")[^"]*(")/, `$1${escapedTitle}$2`)
    .replace(/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/, `$1${escapedDesc}$2`);

  const outPath = path.join(distDir, `${routePath.replace(/^\//, '')}.html`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf-8');
  written += 1;
}

console.log(`generate-seo-shells: wrote ${written} per-route HTML shells into dist/`);
