// Comprobaciones de las reglas CONTABLES del motor DIAN.
//
//   npm run check:dian-contabilidad
//
// El parser ya tiene su comprobación (check:dian) y el lector XML la suya
// (check:dian-security). Faltaba la capa que decide qué número ve el contador
// en la declaración, que es donde un error no rompe nada visiblemente: sale
// una cifra plausible, y equivocada.
//
// Todo lo de aquí gira alrededor de la nota crédito, porque es el único
// documento que RESTA. Si suma, el periodo entero queda inflado y el IVA
// descontable también — con la DIAN, eso no es un bug de software, es una
// declaración mal presentada.

import { totalesDelPeriodo, signoDelTipo, type DocumentoReporte } from '../src/lib/dian/reporte';
import { auditar, type DocumentoDian, type RegistroContable } from '../src/lib/dian/auditoria';

let fallos = 0;
let pasadas = 0;

function comprobar(nombre: string, obtenido: unknown, esperado: unknown) {
  const ok = JSON.stringify(obtenido) === JSON.stringify(esperado);
  if (ok) { pasadas++; console.log(`  ✓ ${nombre}`); return; }
  fallos++;
  console.log(`  ✕ ${nombre}`);
  console.log(`      esperado  ${JSON.stringify(esperado)}`);
  console.log(`      obtenido  ${JSON.stringify(obtenido)}`);
}

const doc = (over: Partial<DocumentoReporte>): DocumentoReporte => ({
  id: 'x', doc_type: 'factura', doc_type_code: '01', cufe: null, prefix: null,
  number: null, full_number: null, issue_date: '2026-08-01', due_date: null,
  currency: 'COP', payment_form: null, payment_method: null,
  issuer_nit: '900123456', issuer_dv: '7', issuer_name: 'PROVEEDOR',
  issuer_trade_name: null, receiver_nit: '901987654', receiver_name: 'CLIENTE',
  line_total: 0, taxable_base: 0, total_iva: 0, total_inc: 0, total_ica: 0,
  total_bolsas: 0, total_otros: 0, total_rete_renta: 0, total_rete_iva: 0,
  total_rete_ica: 0, total_impuestos: 0, total_retenciones: 0, discounts: 0,
  total: 0, status: 'PROCESSED', dian_validated: true, ...over,
});

const valor = (docs: DocumentoReporte[], concepto: string): number =>
  totalesDelPeriodo(docs).find(([c]) => c === concepto)?.[1] ?? NaN;

console.log('\n  Reglas contables del reporte\n');

// ── El caso que motiva todo esto ───────────────────────────────────────────
// Una factura de 1.000.000 + IVA y una nota crédito que devuelve la mitad.
// Lo que el contador debe declarar es la diferencia, no la suma.
{
  const docs = [
    doc({ id: 'f1', doc_type: 'factura', line_total: 1000000, taxable_base: 1000000, total_iva: 190000, total: 1190000 }),
    doc({ id: 'nc1', doc_type: 'nota_credito', line_total: 500000, taxable_base: 500000, total_iva: 95000, total: 595000 }),
  ];
  comprobar('la nota crédito resta de la base', valor(docs, 'Total BASE'), 500000);
  comprobar('la nota crédito resta del IVA descontable', valor(docs, 'Total IVA'), 95000);
  comprobar('la nota crédito resta del total', valor(docs, 'TOTAL DOCUMENTOS'), 595000);
}

// ── La nota débito NO resta ───────────────────────────────────────────────
// Es el error simétrico y menos evidente: quien programa "las notas llevan
// signo" se lleva por delante la nota débito, que aumenta el valor.
{
  const docs = [
    doc({ id: 'f1', line_total: 1000000, total_iva: 190000, total: 1190000 }),
    doc({ id: 'nd1', doc_type: 'nota_debito', line_total: 100000, total_iva: 19000, total: 119000 }),
  ];
  comprobar('la nota débito suma', valor(docs, 'TOTAL DOCUMENTOS'), 1309000);
  comprobar('la nota débito suma al IVA', valor(docs, 'Total IVA'), 209000);
}

// ── El documento equivalente POS es una venta normal ──────────────────────
{
  const docs = [doc({ id: 'p1', doc_type: 'documento_equivalente', total: 34510, total_iva: 5510 })];
  comprobar('el documento equivalente POS suma', valor(docs, 'TOTAL DOCUMENTOS'), 34510);
  comprobar('el signo del POS es positivo', signoDelTipo('documento_equivalente'), 1);
}

// ── Las retenciones de una nota crédito también se reversan ───────────────
{
  const docs = [
    doc({ id: 'f1', total_rete_renta: 25000, total: 1000000 }),
    doc({ id: 'nc1', doc_type: 'nota_credito', total_rete_renta: 10000, total: 400000 }),
  ];
  comprobar('la retención de la nota crédito se reversa', valor(docs, 'Total RETE RENTA'), 15000);
}

console.log('\n  Auditor DIAN contra contabilidad\n');

const dian = (over: Partial<DocumentoDian>): DocumentoDian => ({
  id: 'd1', cufe: 'CUFE-1', issuer_nit: '900123456', issuer_name: 'PROVEEDOR',
  full_number: 'NC100', issue_date: '2026-08-01', total: 595000,
  doc_type: 'nota_credito', ...over,
});

const contable = (over: Partial<RegistroContable>): RegistroContable => ({
  fila: 2, cufe: 'CUFE-1', nit: '900123456', numero: 'NC100',
  valor: 595000, fecha: '2026-08-01', ...over,
});

// Las dos convenciones que existen en los programas contables reales. Con
// cualquiera de las dos, la nota crédito tiene que quedar CONCILIADA: si una
// de ellas cae en "registrada por otra cifra", el contador recibe un hallazgo
// falso por cada nota crédito del mes y deja de leer el informe.
{
  const r = auditar([dian({})], [contable({ valor: -595000 })]);
  comprobar('nota crédito guardada en negativo → concilia', r.conciliados.length, 1);
  comprobar('nota crédito en negativo → sin diferencia', r.conDiferencia.length, 0);
}
{
  const r = auditar([dian({})], [contable({ valor: 595000 })]);
  comprobar('nota crédito guardada en positivo → concilia', r.conciliados.length, 1);
  comprobar('nota crédito en positivo → sin diferencia', r.conDiferencia.length, 0);
}

// Una diferencia REAL en una nota crédito tiene que seguir saltando: la
// tolerancia al signo no puede convertirse en tolerancia al error.
{
  const r = auditar([dian({})], [contable({ valor: -400000 })]);
  comprobar('diferencia real en nota crédito → se reporta', r.conDiferencia.length, 1);
  comprobar('la diferencia se mide en magnitud', r.conDiferencia[0]?.diferencia, 195000);
}

// En una factura corriente, un valor negativo en la contabilidad SÍ es un
// hallazgo. La regla del signo es sólo para el documento que reversa.
{
  const r = auditar(
    [dian({ id: 'f1', doc_type: 'factura', full_number: 'FE100', cufe: 'CUFE-F', total: 500000 })],
    [contable({ cufe: 'CUFE-F', numero: 'FE100', valor: -500000 })],
  );
  comprobar('factura con valor negativo → se reporta', r.conDiferencia.length, 1);
}

// El resumen tiene que ser comparable con la contabilidad del contador.
{
  const r = auditar(
    [
      dian({ id: 'f1', doc_type: 'factura', cufe: 'CUFE-F', full_number: 'FE1', total: 1000000 }),
      dian({ id: 'n1', doc_type: 'nota_credito', cufe: 'CUFE-N', full_number: 'NC1', total: 300000 }),
    ],
    [],
  );
  comprobar('el valor DIAN del periodo va neto', r.resumen.valorDian, 700000);
  comprobar('lo que falta en contabilidad va neto', r.resumen.valorFaltante, 700000);
}

console.log('');
if (fallos > 0) {
  console.log(`  ${pasadas} pasadas · ${fallos} FALLIDAS\n`);
  process.exit(1);
}
console.log(`  ${pasadas} comprobaciones, todas pasan\n`);
