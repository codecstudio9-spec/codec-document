// Comprueba las páginas de Estados Unidos (us-intent-seo-content.ts y
// us-industry-seo-content.ts) contra el estándar de CLAUDE.md:
//   · título ≤ 60 caracteres y meta descripción ≤ 155 (Google corta ahí)
//   · slugs únicos
//   · páginas por profesión con ≥ 600 palabras de texto propio
//   · cada enlace de «documentos» apunta a una ruta que existe en el manifiesto
//
// Uso: npm run validate:us-pages  (después de generate:seo-manifest)

import fs from 'node:fs';
import path from 'node:path';
import { PAGINAS_US } from '../src/app/data/us-intent-seo-content';
import { PAGINAS_CO } from '../src/app/data/co-intent-seo-content';
import { TRADUCCIONES_SECTORES_ES } from '../src/app/data/us-industry-seo-content-es';

const manifest = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'seo-manifest.json'), 'utf-8'));
const rutas = new Set<string>(Object.keys(manifest));
// Rutas de la app que no pasan por el manifiesto (plantillas propias).
for (const extra of ['/', '/pricing', '/electronic-signature', '/nda-generator', '/online-lease-agreement',
  '/vehicle-bill-of-sale', '/promissory-note', '/independent-contractor-agreement',
  // Herramientas de la app a las que llevan los botones de las páginas nuevas.
  '/my-templates', '/firma-electronica', '/crear-documento']) rutas.add(extra);
// Generadores de documentos que existen en templates.ts.
const GENERADORES = new Set(['residential-lease', 'independent-contractor', 'service-agreement', 'nda', 'promissory-note',
  'bill-of-sale-vehicle', 'resignation-letter', 'power-of-attorney', 'child-travel-consent', 'last-will-testament',
  'prenuptial-agreement', 'wedding-planner']);
const destinoValido = (to: string) => rutas.has(to) || (to.startsWith('/generator/') && GENERADORES.has(to.slice('/generator/'.length)));

const errores: string[] = [];
const vistos = new Set<string>();
const palabras = (t: string) => t.split(/\s+/).filter(Boolean).length;

for (const p of PAGINAS_US) {
  if (vistos.has(p.slug)) errores.push(`${p.slug}: slug duplicado`);
  vistos.add(p.slug);
  if (p.titleTag.length > 60) errores.push(`${p.slug}: titleTag de ${p.titleTag.length} caracteres (> 60)`);
  if (p.metaDescription.length > 155) errores.push(`${p.slug}: metaDescription de ${p.metaDescription.length} caracteres (> 155)`);

  if (p.grupo === 'industry') {
    const total = palabras([
      p.intro, p.problema.titulo, p.problema.texto,
      ...p.puntos.flatMap((x) => [x.titulo, x.texto]),
      p.ley.titulo, p.ley.texto, p.caso.titulo, p.caso.texto,
      ...p.faq.flatMap((f) => [f.q, f.a]),
      ...(p.checklist ? [p.checklist.titulo, ...p.checklist.items] : []),
    ].join(' '));
    if (total < 600) errores.push(`${p.slug}: sólo ${total} palabras (< 600)`);
    if (!p.audiencia) errores.push(`${p.slug}: falta audiencia`);
    // La versión en español tiene que existir y estar completa: mismas
    // secciones y mismo número de puntos, preguntas y elementos de la lista.
    const es = TRADUCCIONES_SECTORES_ES[p.slug];
    if (!es) errores.push(`${p.slug}: falta la versión en español`);
    else {
      for (const campo of ['audiencia', 'h1', 'intro', 'metaDescription', 'problema', 'ley', 'caso', 'cta'] as const) {
        if (!es[campo]) errores.push(`${p.slug}: español sin ${campo}`);
      }
      if (es.puntos?.length !== p.puntos.length) errores.push(`${p.slug}: español con ${es.puntos?.length} puntos (inglés ${p.puntos.length})`);
      if (es.faq?.length !== p.faq.length) errores.push(`${p.slug}: español con ${es.faq?.length} preguntas (inglés ${p.faq.length})`);
      if (es.checklist?.items.length !== p.checklist?.items.length) errores.push(`${p.slug}: lista en español desigual`);
    }
  }

  for (const d of p.documentos ?? []) {
    if (!rutas.has(d.to)) errores.push(`${p.slug}: enlace a ruta inexistente ${d.to}`);
  }

  // Las páginas con destino propio (las de octubre de 2026) cumplen el mismo
  // mínimo de 600 palabras que las de profesión.
  if (p.ctaTo) {
    if (!destinoValido(p.ctaTo)) errores.push(`${p.slug}: botón a ruta inexistente ${p.ctaTo}`);
    const total = palabras([
      p.intro, p.problema.titulo, p.problema.texto, ...p.puntos.flatMap((x) => [x.titulo, x.texto]),
      p.ley.titulo, p.ley.texto, p.caso.titulo, p.caso.texto, ...p.faq.flatMap((f) => [f.q, f.a]),
      ...(p.checklist ? [p.checklist.titulo, ...p.checklist.items] : []),
    ].join(' '));
    if (total < 600) errores.push(`${p.slug}: sólo ${total} palabras (< 600)`);
  }
}

// ── Colombia ────────────────────────────────────────────────────────────
for (const p of PAGINAS_CO) {
  if (vistos.has(p.slug)) errores.push(`${p.slug}: slug duplicado (choca con otra página)`);
  vistos.add(p.slug);
  if (p.titleTag.length > 60) errores.push(`${p.slug}: titleTag de ${p.titleTag.length} caracteres (> 60)`);
  if (p.metaDescription.length > 155) errores.push(`${p.slug}: metaDescription de ${p.metaDescription.length} caracteres (> 155)`);
  if (!destinoValido(p.ctaTo)) errores.push(`${p.slug}: botón a ruta inexistente ${p.ctaTo}`);
  const total = palabras([
    p.intro, p.problema.titulo, p.problema.texto, ...p.puntos.flatMap((x) => [x.titulo, x.texto]),
    p.ley.titulo, p.ley.texto, p.caso.titulo, p.caso.texto, ...p.faq.flatMap((f) => [f.q, f.a]),
    ...(p.checklist ? [p.checklist.titulo, ...p.checklist.items] : []),
  ].join(' '));
  if (total < 600) errores.push(`${p.slug}: sólo ${total} palabras (< 600)`);
}

if (errores.length) {
  console.error(`validate-industry-pages: ${errores.length} problema(s)\n  ${errores.join('\n  ')}`);
  process.exit(1);
}
console.log(`validate-industry-pages: ${PAGINAS_US.length} páginas de EE. UU. y ${PAGINAS_CO.length} de Colombia OK`);
