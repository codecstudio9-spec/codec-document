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

const manifest = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public', 'seo-manifest.json'), 'utf-8'));
const rutas = new Set<string>(Object.keys(manifest));
// Rutas de la app que no pasan por el manifiesto (plantillas propias).
for (const extra of ['/', '/pricing', '/electronic-signature', '/nda-generator', '/online-lease-agreement',
  '/vehicle-bill-of-sale', '/promissory-note', '/independent-contractor-agreement']) rutas.add(extra);

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
  }

  for (const d of p.documentos ?? []) {
    if (!rutas.has(d.to)) errores.push(`${p.slug}: enlace a ruta inexistente ${d.to}`);
  }
}

if (errores.length) {
  console.error(`validate-industry-pages: ${errores.length} problema(s)\n  ${errores.join('\n  ')}`);
  process.exit(1);
}
console.log(`validate-industry-pages: ${PAGINAS_US.length} páginas OK`);
