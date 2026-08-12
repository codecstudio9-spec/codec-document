// Builds public/seo-manifest.json — a { [pathname]: { title, description } }
// lookup that middleware.ts reads to rewrite the raw HTML <title> and meta
// description PER ROUTE, before a single byte reaches a non-JS crawler.
//
// Why this exists: index.html is one static shell served for ~190 routes
// (see vercel.json's SPA rewrite). Until now only the canonical/hreflang
// `Link` header was corrected per-route (middleware.ts) — the <title> and
// description stayed the generic homepage copy in the raw HTML, only
// getting corrected client-side by SEOHead.tsx once React mounts. That's
// invisible to Bing, most social-preview bots (WhatsApp/Slack/Discord
// unfurls — WhatsApp matters a lot for this app's LATAM audience), and is
// a weaker signal for Google too (relies on secondary/deferred rendering).
//
// This script deliberately duplicates each page family's exact title/
// description template instead of importing the .tsx component that
// builds it (components need a DOM/React render to execute) — same
// tradeoff already accepted in generate-sitemap.mjs's HREFLANG_CLUSTERS
// comment. Keep both in sync if a landing component's title logic changes.
//
// Run via `tsx` (not plain node) since these are .ts data modules —
// already a project devDependency transitively via @vercel/node and vite.

import fs from 'node:fs';
import path from 'node:path';
import { ARTICLES } from '../src/app/data/article-content';
import { DOCTYPE_STATE_CONFIGS } from '../src/app/data/doctype-state-seo-content';
import { CITY_SEO_CONFIGS } from '../src/app/data/city-seo-content';
import { STATE_SEO_CONFIGS } from '../src/app/data/state-seo-content';
import { LATAM_COUNTRIES } from '../src/app/data/latam-signature-seo-content';
import { PROFESSION_PAGES } from '../src/app/data/profession-seo-content';
import { FREE_FEATURE_PAGES } from '../src/app/data/free-feature-seo-content';
import { QUOTE_SEO_PAGES } from '../src/app/data/quote-seo-content';
import { CIUDADES_CONTADOR } from '../src/app/data/contador-dian-seo-content';
import { NECESIDADES_CONTADOR } from '../src/app/data/contador-necesidad-seo-content';

const manifest: Record<string, { title: string; description: string }> = {};

const add = (routePath: string, title: string, description: string) => {
  manifest[routePath] = { title, description };
};

// ── Blog articles (ArticleLanding.tsx) ──────────────────────────────────
for (const a of ARTICLES) {
  add(`/blog/${a.slug}`, `${a.title} | Codec Document`, a.metaDescription);
}

// ── Document type × state (DocTypeStateLanding.tsx) ─────────────────────
for (const d of DOCTYPE_STATE_CONFIGS) {
  add(
    `/${d.docType}-${d.stateSlug}`,
    `${d.docTypeLabelEn} for ${d.stateName} — Free Template & E-Signature | CodecDocument`,
    `Create a ${d.docTypeLabelEn} for ${d.stateName} with state-specific legal language. Free template, instant preview, and ESIGN Act compliant electronic signature with identity verification.`,
  );
}

// ── City × document type (CityDocTypeLanding.tsx) — reuses the city's
// state facts verbatim, only title/description/canonical are city-specific ──
for (const city of CITY_SEO_CONFIGS) {
  for (const d of DOCTYPE_STATE_CONFIGS) {
    if (d.stateSlug !== city.state.slug) continue;
    add(
      `/${d.docType}-${city.slug}`,
      `${d.docTypeLabelEn} in ${city.cityName}, ${city.state.name} — Free Template & E-Signature | CodecDocument`,
      `Create a ${d.docTypeLabelEn} in ${city.cityName}, ${city.state.name} with ${city.state.name}-specific legal language. Free template, instant preview, and ESIGN Act compliant electronic signature with identity verification.`,
    );
  }
}

// ── State hub (StateLegalDocumentsLanding.tsx) ──────────────────────────
for (const s of STATE_SEO_CONFIGS) {
  add(
    `/legal-documents-${s.slug}`,
    `Free Legal Documents & E-Signatures in ${s.name} | CodecDocument`,
    `Create legally-vetted documents and ESIGN Act compliant e-signatures for ${s.name}. Free NDA, lease agreement, and contract templates with ${s.name}-specific clauses, identity verification, and audit trail.`,
  );
}

// ── City hub (CityLegalDocumentsLanding.tsx) ────────────────────────────
for (const city of CITY_SEO_CONFIGS) {
  add(
    `/${city.slug}`,
    `Free Legal Documents & E-Signatures in ${city.cityName}, ${city.state.name} | CodecDocument`,
    `Create legally-vetted documents and ESIGN Act compliant e-signatures in ${city.cityName}, ${city.state.name} — under ${city.state.name} law. Free NDA, lease agreement, and contract templates with identity verification and audit trail.`,
  );
}

// ── LATAM country signature pages (CountrySignatureLanding.tsx) — always
// Spanish (FixedLanguageProvider defaultLanguage="es") ───────────────────
for (const c of LATAM_COUNTRIES) {
  add(
    `/firma-electronica-${c.slug}`,
    `Firma Electrónica en ${c.nameEs} | Válida y Legal — CodecDocument`,
    `Firma documentos electrónicamente en ${c.nameEs}, con total cumplimiento de la ley local (${c.lawBadgeEs}). Plan gratuito, verificación de identidad y pista de auditoría SHA-256 en cada firma.`,
  );
}

// ── Profession pages (ProfessionLanding.tsx) — Spanish only ─────────────
for (const p of PROFESSION_PAGES) {
  add(`/firma-electronica-para-${p.slug}`, p.titleEs, p.descEs);
}

// ── Free-feature pages (FreeFeatureLanding.tsx) — Spanish only ──────────
for (const p of FREE_FEATURE_PAGES) {
  add(`/${p.slug}`, p.titleEs, p.descEs);
}

// ── Quote/proposal generator pages (QuoteSeoLanding.tsx) ────────────────
for (const p of QUOTE_SEO_PAGES) {
  add(`/${p.slug}`, p.titleTag, p.metaDescription);
}

// ── Automatización para Contadores (módulo DIAN, sólo Colombia) ─────────
//
// Entra al manifiesto aunque sea una herramienta con sesión, y por una razón
// concreta: es el enlace que se comparte por WhatsApp con los contadores. Sin
// título ni descripción propios, la vista previa del enlace mostraba el texto
// genérico del sitio —«Codec Document · Documentos legales»— que no dice nada
// a un contador y hace que el enlace parezca publicidad.
//
// El texto va en español de Colombia y con las palabras que un contador
// escribe en Google: XML, DIAN, facturas, Excel, Siigo. «Documentos
// electrónicos» es como se llama la norma, no como se busca el problema.
add(
  '/documentos-electronicos',
  'Descargar XML de la DIAN y pasarlos a Excel — Automatización para Contadores | Codec Document',
  'Convierte los XML de la DIAN en información contable lista para usar: arrastra los ZIP y obtén el Excel con IVA, retenciones y totales cuadrados. Cruza lo reportado en la DIAN contra tu contabilidad y detecta las facturas que faltan. Hecho en Colombia para contadores.',
);

// ── Automatizacion para Contadores por ciudad (12 paginas, solo Colombia) ─
for (const c of CIUDADES_CONTADOR) {
  add(`/${c.slug}`, c.titleTag, c.metaDescription);
}

// ── Las mismas herramientas, por NECESIDAD en vez de por ciudad ──────────
for (const n of NECESIDADES_CONTADOR) {
  add(`/${n.slug}`, n.titleTag, n.metaDescription);
}

const outFile = path.join(process.cwd(), 'public', 'seo-manifest.json');
fs.writeFileSync(outFile, JSON.stringify(manifest), 'utf-8');
console.log(`seo-manifest.json written with ${Object.keys(manifest).length} routes`);
