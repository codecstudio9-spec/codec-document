/**
 * Reportes contables a partir de los saldos (cont_saldos) y los movimientos.
 *
 * Todo es aritmética pura y verificable a mano, como la causación: ningún
 * número de un estado financiero sale de un modelo de lenguaje.
 *
 * Convención: en la base los saldos van como Débito − Crédito. Para
 * mostrarlos se pasan a «saldo natural» (positivo cuando la cuenta tiene el
 * saldo que le corresponde por su naturaleza), que es como los lee el
 * contador en cualquier programa contable colombiano.
 */

import { nombreCuenta, naturalezaDe, type Cuenta } from './puc';
import type { Hoja, ValorCelda } from '../dian/xlsx';

export interface FilaSaldo {
  cuenta: string;
  tercero_nit: string;
  tercero_nombre: string | null;
  anterior: number;
  debitos: number;
  creditos: number;
}

export interface FilaBalance {
  codigo: string;
  nombre: string;
  nivel: number;
  anterior: number;
  debitos: number;
  creditos: number;
  final: number;
}

const r2 = (v: number) => Math.round(v * 100) / 100;
const natural = (codigo: string, dbMenosCr: number) => (naturalezaDe(codigo) === 'D' ? dbMenosCr : -dbMenosCr);

/** Los prefijos que forman la jerarquía de un código: 1, 11, 1105, 110505… */
function ancestros(codigo: string): string[] {
  const cortes = [1, 2, 4, 6, 8, 10, 12].filter((n) => n <= codigo.length);
  if (cortes[cortes.length - 1] !== codigo.length) cortes.push(codigo.length);
  return cortes.map((n) => codigo.slice(0, n));
}

/** Balance de prueba hasta el nivel pedido (1 clase … 6 subcuenta, 0 todo). */
export function balanceDePrueba(saldos: FilaSaldo[], plan: Map<string, Cuenta>, nivelMax = 0): FilaBalance[] {
  const acc = new Map<string, { anterior: number; debitos: number; creditos: number }>();
  for (const s of saldos) {
    for (const cod of ancestros(s.cuenta)) {
      if (nivelMax && cod.length > nivelMax) continue;
      const a = acc.get(cod) ?? { anterior: 0, debitos: 0, creditos: 0 };
      a.anterior += Number(s.anterior);
      a.debitos += Number(s.debitos);
      a.creditos += Number(s.creditos);
      acc.set(cod, a);
    }
  }
  return [...acc.entries()]
    .filter(([, a]) => a.anterior !== 0 || a.debitos !== 0 || a.creditos !== 0)
    .sort(([x], [y]) => x.localeCompare(y))
    .map(([codigo, a]) => ({
      codigo,
      nombre: nombreCuenta(codigo, plan),
      nivel: codigo.length,
      anterior: r2(natural(codigo, a.anterior)),
      debitos: r2(a.debitos),
      creditos: r2(a.creditos),
      final: r2(natural(codigo, a.anterior + a.debitos - a.creditos)),
    }));
}

export function totalesBalance(saldos: FilaSaldo[]) {
  let debitos = 0;
  let creditos = 0;
  for (const s of saldos) { debitos += Number(s.debitos); creditos += Number(s.creditos); }
  return { debitos: r2(debitos), creditos: r2(creditos), cuadra: Math.abs(debitos - creditos) < 0.01 };
}

/** Saldo final natural de todo lo que empieza por un prefijo. */
function saldoFinal(saldos: FilaSaldo[], prefijo: string): number {
  let v = 0;
  for (const s of saldos) if (s.cuenta.startsWith(prefijo)) v += Number(s.anterior) + Number(s.debitos) - Number(s.creditos);
  return r2(natural(prefijo, v));
}

/** Movimiento del periodo (sin saldo anterior), en saldo natural. */
function movimientoPeriodo(saldos: FilaSaldo[], prefijo: string): number {
  let v = 0;
  for (const s of saldos) if (s.cuenta.startsWith(prefijo)) v += Number(s.debitos) - Number(s.creditos);
  return r2(natural(prefijo, v));
}

export interface LineaEstado {
  codigo?: string;
  nombre: string;
  valor: number;
  tipo: 'titulo' | 'grupo' | 'cuenta' | 'total' | 'resultado';
}

function detallePorNivel(saldos: FilaSaldo[], plan: Map<string, Cuenta>, clase: string, usarPeriodo: boolean): LineaEstado[] {
  const filas = balanceDePrueba(saldos.filter((s) => s.cuenta.startsWith(clase)), plan, 4);
  const valor = (f: FilaBalance) => (usarPeriodo ? movimientoPeriodo(saldos, f.codigo) : f.final);
  return filas
    .filter((f) => f.nivel === 2 || f.nivel === 4)
    .map((f) => ({ codigo: f.codigo, nombre: f.nombre, valor: valor(f), tipo: f.nivel === 2 ? 'grupo' as const : 'cuenta' as const }))
    .filter((l) => l.valor !== 0);
}

/** Estado de resultados del periodo. */
export function estadoDeResultados(saldos: FilaSaldo[], plan: Map<string, Cuenta>) {
  const ingresosOp = movimientoPeriodo(saldos, '41');
  const costos = movimientoPeriodo(saldos, '6') + movimientoPeriodo(saldos, '7');
  const gastosAdmin = movimientoPeriodo(saldos, '51');
  const gastosVentas = movimientoPeriodo(saldos, '52');
  const ingresosNoOp = movimientoPeriodo(saldos, '42');
  const gastosNoOp = movimientoPeriodo(saldos, '53');
  const renta = movimientoPeriodo(saldos, '54');
  const bruta = r2(ingresosOp - costos);
  const operacional = r2(bruta - gastosAdmin - gastosVentas);
  const antesImpuestos = r2(operacional + ingresosNoOp - gastosNoOp);
  const neta = r2(antesImpuestos - renta);

  const lineas: LineaEstado[] = [
    { nombre: 'Ingresos', valor: r2(ingresosOp + ingresosNoOp), tipo: 'titulo' },
    ...detallePorNivel(saldos, plan, '4', true),
    { nombre: 'Costos de ventas y producción', valor: r2(costos), tipo: 'titulo' },
    ...detallePorNivel(saldos, plan, '6', true),
    ...detallePorNivel(saldos, plan, '7', true),
    { nombre: 'Utilidad bruta', valor: bruta, tipo: 'resultado' },
    { nombre: 'Gastos', valor: r2(gastosAdmin + gastosVentas + gastosNoOp + renta), tipo: 'titulo' },
    ...detallePorNivel(saldos, plan, '5', true),
    { nombre: 'Utilidad operacional', valor: operacional, tipo: 'resultado' },
    { nombre: 'Utilidad antes de impuestos', valor: antesImpuestos, tipo: 'resultado' },
    { nombre: 'Utilidad neta del periodo', valor: neta, tipo: 'total' },
  ];
  return { lineas, neta, ingresos: r2(ingresosOp + ingresosNoOp), costos: r2(costos), gastos: r2(gastosAdmin + gastosVentas + gastosNoOp + renta) };
}

/** Estado de situación financiera al corte. El resultado del ejercicio que
 *  todavía no se cerró a la cuenta 36 se muestra dentro del patrimonio, si no
 *  la ecuación no cuadraría hasta el cierre del año. */
export function estadoDeSituacion(saldos: FilaSaldo[], plan: Map<string, Cuenta>) {
  const activo = saldoFinal(saldos, '1');
  const pasivo = saldoFinal(saldos, '2');
  const patrimonio = saldoFinal(saldos, '3');
  const resultado = r2(saldoFinal(saldos, '4') - saldoFinal(saldos, '5') - saldoFinal(saldos, '6') - saldoFinal(saldos, '7'));
  const lineas: LineaEstado[] = [
    { nombre: 'Activo', valor: activo, tipo: 'titulo' },
    ...detallePorNivel(saldos, plan, '1', false),
    { nombre: 'Total activo', valor: activo, tipo: 'total' },
    { nombre: 'Pasivo', valor: pasivo, tipo: 'titulo' },
    ...detallePorNivel(saldos, plan, '2', false),
    { nombre: 'Total pasivo', valor: pasivo, tipo: 'total' },
    { nombre: 'Patrimonio', valor: r2(patrimonio + resultado), tipo: 'titulo' },
    ...detallePorNivel(saldos, plan, '3', false),
    { nombre: 'Resultado del ejercicio (sin cerrar)', valor: resultado, tipo: 'cuenta' },
    { nombre: 'Total patrimonio', valor: r2(patrimonio + resultado), tipo: 'total' },
    { nombre: 'Total pasivo + patrimonio', valor: r2(pasivo + patrimonio + resultado), tipo: 'resultado' },
  ];
  return { lineas, activo, pasivo, patrimonio: r2(patrimonio + resultado), cuadra: Math.abs(activo - pasivo - patrimonio - resultado) < 1 };
}

export interface FilaTercero {
  nit: string;
  nombre: string;
  cuentas: string[];
  saldo: number;
}

/** Cartera (13…) o proveedores (22…): saldo final por tercero. */
export function saldosPorTercero(saldosTercero: FilaSaldo[], prefijos: string[]): FilaTercero[] {
  const m = new Map<string, FilaTercero>();
  for (const s of saldosTercero) {
    if (!prefijos.some((p) => s.cuenta.startsWith(p))) continue;
    const nit = s.tercero_nit || 'Sin tercero';
    const f = m.get(nit) ?? { nit, nombre: s.tercero_nombre ?? '', cuentas: [], saldo: 0 };
    f.saldo += natural(prefijos[0], Number(s.anterior) + Number(s.debitos) - Number(s.creditos));
    if (!f.cuentas.includes(s.cuenta)) f.cuentas.push(s.cuenta);
    if (!f.nombre && s.tercero_nombre) f.nombre = s.tercero_nombre;
    m.set(nit, f);
  }
  return [...m.values()].map((f) => ({ ...f, saldo: r2(f.saldo) })).filter((f) => f.saldo !== 0).sort((a, b) => b.saldo - a.saldo);
}

/** Resumen de impuestos del periodo para preparar declaraciones. */
export function resumenImpuestos(saldos: FilaSaldo[]) {
  const sumaCr = (p: string) => r2(saldos.filter((s) => s.cuenta.startsWith(p)).reduce((v, s) => v + Number(s.creditos) - Number(s.debitos), 0));
  const sumaDb = (p: string) => r2(saldos.filter((s) => s.cuenta.startsWith(p)).reduce((v, s) => v + Number(s.debitos) - Number(s.creditos), 0));
  const ivaGenerado = sumaCr('240805');
  const ivaDescontable = sumaDb('240810');
  return [
    { concepto: 'IVA generado en ventas', cuenta: '240805', valor: ivaGenerado },
    { concepto: 'IVA descontable en compras', cuenta: '240810', valor: ivaDescontable },
    { concepto: 'IVA neto a pagar (o saldo a favor si es negativo)', cuenta: '2408', valor: r2(ivaGenerado - ivaDescontable) },
    { concepto: 'Retención en la fuente por pagar', cuenta: '2365', valor: sumaCr('2365') },
    { concepto: 'ReteIVA por pagar', cuenta: '2367', valor: sumaCr('2367') },
    { concepto: 'ReteICA por pagar', cuenta: '2368', valor: sumaCr('2368') },
    { concepto: 'Retenciones que le practicaron (anticipos)', cuenta: '1355', valor: sumaDb('1355') },
    { concepto: 'Impuesto al consumo y otros por pagar', cuenta: '2424/2495', valor: r2(sumaCr('2424') + sumaCr('2495')) },
  ];
}

// ── Excel ─────────────────────────────────────────────────────────────────

export function hojaBalance(nombre: string, filas: FilaBalance[], empresa: string): Hoja {
  return {
    nombre,
    encabezados: ['Código', 'Cuenta', 'Saldo anterior', 'Débitos', 'Créditos', 'Saldo final'],
    filas: [
      [empresa, '', '', '', '', ''],
      ...filas.map((f) => [f.codigo, f.nombre, f.anterior, f.debitos, f.creditos, f.final] as ValorCelda[]),
    ],
    anchos: [12, 46, 18, 18, 18, 18],
  };
}

export function hojaEstado(nombre: string, lineas: LineaEstado[], empresa: string): Hoja {
  return {
    nombre,
    encabezados: ['Código', 'Concepto', 'Valor'],
    filas: [
      [empresa, '', ''],
      ...lineas.map((l) => [l.codigo ?? '', l.tipo === 'cuenta' ? `   ${l.nombre}` : l.nombre.toUpperCase(), l.valor] as ValorCelda[]),
    ],
    anchos: [12, 52, 20],
  };
}
