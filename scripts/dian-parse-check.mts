// Corre el parser DIAN contra los fixtures anonimizados y reporta qué
// extrajo de cada uno. No es una suite de pruebas: es el instrumento para
// mirar el comportamiento del parser sobre documentos reales de emisores
// distintos, que es donde aparecen las variaciones que ningún anexo técnico
// documenta.
//
//   npm run check:dian                    (usa ./fixtures-dian)
//   npm run check:dian -- otra/carpeta

import fs from 'node:fs';
import path from 'node:path';
import { parseDianXml } from '../src/lib/dian/parser';

const dir = path.resolve(process.argv[2] ?? './fixtures-dian');
if (!fs.existsSync(dir)) {
  console.error(`\n  No existe la carpeta: ${dir}`);
  console.error(`  Genera fixtures con:  npm run anonymize:dian -- <zip o carpeta>\n`);
  process.exit(1);
}

const archivos = fs.readdirSync(dir).filter((f) => /\.xml$/i.test(f)).sort();
if (archivos.length === 0) {
  console.error(`\n  No hay .xml en ${dir}\n`);
  process.exit(1);
}

const money = (n: number) =>
  n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

let ok = 0;
let conExcepciones = 0;
const excepcionesPorCodigo: Record<string, number> = {};
const tipos: Record<string, number> = {};
const impuestosVistos: Record<string, number> = {};

console.log(`\n  Parseando ${archivos.length} documento(s) de ${dir}\n`);
console.log('  ' + '─'.repeat(74));

for (const f of archivos) {
  const xml = fs.readFileSync(path.join(dir, f), 'utf8');
  const t0 = performance.now();
  const r = parseDianXml(xml);
  const ms = (performance.now() - t0).toFixed(1);

  if (!r.documento) {
    console.log(`\n  ✕ ${f}  (${ms} ms)`);
    for (const e of r.excepciones) console.log(`      ${e.codigo}: ${e.mensaje}`);
    for (const e of r.excepciones) excepcionesPorCodigo[e.codigo] = (excepcionesPorCodigo[e.codigo] ?? 0) + 1;
    continue;
  }

  const d = r.documento;
  tipos[d.tipo] = (tipos[d.tipo] ?? 0) + 1;
  for (const i of d.impuestos) {
    if (i.alcance === 'documento') {
      const k = `${i.codigo} ${i.nombre}`;
      impuestosVistos[k] = (impuestosVistos[k] ?? 0) + 1;
    }
  }

  const marca = r.excepciones.length === 0 ? '✓' : '⚠';
  if (r.excepciones.length === 0) ok++; else conExcepciones++;

  console.log(`\n  ${marca} ${f}  (${ms} ms)`);
  console.log(`      ${d.tipo}  ${d.numeroCompleto}   ${d.fechaEmision}   ${d.moneda}`);
  console.log(`      CUFE          ${d.cufe.slice(0, 32)}…  (${d.cufeEsquema || 'sin esquema'}, ${d.cufe.length} car.)`);
  console.log(`      Emisor        ${d.emisor.nit}-${d.emisor.dv}  ${d.emisor.razonSocial.slice(0, 44)}`);
  console.log(`      Receptor      ${d.receptor.nit}-${d.receptor.dv}  ${d.receptor.razonSocial.slice(0, 44)}`);
  console.log(`      Líneas        ${d.lineas.length}`);
  console.log(`      Base          ${money(d.totales.baseImponible).padStart(16)}`);
  console.log(`      IVA           ${money(d.resumen.iva).padStart(16)}${
    Object.keys(d.resumen.baseIvaPorTarifa).length
      ? '   por tarifa: ' + Object.entries(d.resumen.baseIvaPorTarifa).map(([t, b]) => `${t}% → ${money(b)}`).join(' · ')
      : ''}`);
  if (d.resumen.inc) console.log(`      INC           ${money(d.resumen.inc).padStart(16)}`);
  if (d.resumen.bolsas) console.log(`      Bolsas        ${money(d.resumen.bolsas).padStart(16)}`);
  if (d.resumen.otros) console.log(`      Otros         ${money(d.resumen.otros).padStart(16)}`);
  if (d.resumen.totalRetenciones) {
    console.log(`      Retenciones   ${money(d.resumen.totalRetenciones).padStart(16)}   renta ${money(d.resumen.reteRenta)} · iva ${money(d.resumen.reteIva)} · ica ${money(d.resumen.reteIca)}`);
  }
  console.log(`      TOTAL         ${money(d.totales.total).padStart(16)}`);
  console.log(`      Autorización  res. ${d.autorizacion.resolucion || '—'}  rango ${d.autorizacion.prefijo}${d.autorizacion.rangoDesde}–${d.autorizacion.rangoHasta}`);
  console.log(`      Validado DIAN ${r.validacionDian ? 'sí, ' + r.validacionDian.fecha : 'no viene el acuse'}`);

  if (d.lineas.length) {
    const l = d.lineas[0];
    console.log(`      Línea 1       ${l.cantidad} ${l.unidadMedida} × ${money(l.precioUnitario)} = ${money(l.valorBruto)}   ${l.descripcion.slice(0, 34)}`);
  }

  for (const e of r.excepciones) {
    console.log(`      ⚠ ${e.codigo}: ${e.mensaje}${e.esperado ? ` (esperado ${e.esperado}, calculado ${e.encontrado})` : ''}`);
    excepcionesPorCodigo[e.codigo] = (excepcionesPorCodigo[e.codigo] ?? 0) + 1;
  }
}

const listar = (o: Record<string, number>) =>
  Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `      ${k}  ×${v}`).join('\n') || '      (ninguno)';

console.log('\n  ' + '─'.repeat(74));
console.log(`\n  Limpios ${ok} · con observaciones ${conExcepciones} · total ${archivos.length}\n`);
console.log('  Tipos detectados');
console.log(listar(tipos));
console.log('\n  Impuestos a nivel documento');
console.log(listar(impuestosVistos));
console.log('\n  Excepciones');
console.log(listar(excepcionesPorCodigo));
console.log('');
