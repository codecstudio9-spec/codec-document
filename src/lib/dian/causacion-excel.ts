/**
 * El Excel de la causación.
 *
 *   Comprobante   una fila por movimiento (cuenta, tercero, débito, crédito)
 *                 — el formato que se importa o se transcribe al programa
 *   Por cuenta    la suma del periodo por cuenta: lo primero que el contador
 *                 compara contra su balance
 *   Cuadre        un renglón por documento con débitos, créditos y diferencia
 *   Revisar       lo que el motor no pudo decidir solo
 */

import { generarXlsx, type Hoja, type ValorCelda } from './xlsx';
import type { ResultadoCausacion } from './causacion';

export function construirExcelCausacion(
  r: ResultadoCausacion,
  empresa: { nit: string; nombre: string },
  prefijoComprobante = 'CC',
): Uint8Array {
  const comprobante: Hoja = {
    nombre: 'Comprobante',
    encabezados: [
      'Tipo comprobante', 'Número', 'Fecha', 'Cuenta', 'Nombre cuenta', 'NIT tercero', 'DV',
      'Nombre tercero', 'Documento soporte', 'Detalle', 'Débito', 'Crédito', 'Base', 'Centro de costo', 'CUFE/CUDE',
    ],
    filas: r.movimientos.map((m) => [
      prefijoComprobante, m.comprobante, m.fecha, m.cuenta, m.nombreCuenta, m.terceroNit, m.terceroDv,
      m.terceroNombre, m.documento, m.detalle, m.debito, m.credito, m.base, m.centroCosto, m.cufe,
    ] as ValorCelda[]),
    anchos: [10, 8, 12, 10, 34, 13, 4, 32, 16, 44, 15, 15, 15, 12, 40],
  };
  comprobante.filas.push(
    ['', '', '', '', '', '', '', '', '', 'TOTALES', r.totalDebito, r.totalCredito, '', '', ''],
  );

  const porCuenta = new Map<string, { nombre: string; db: number; cr: number }>();
  for (const m of r.movimientos) {
    const c = porCuenta.get(m.cuenta) ?? { nombre: m.nombreCuenta, db: 0, cr: 0 };
    c.db += m.debito;
    c.cr += m.credito;
    porCuenta.set(m.cuenta, c);
  }
  const resumen: Hoja = {
    nombre: 'Por cuenta',
    encabezados: ['Cuenta', 'Nombre', 'Débitos', 'Créditos', 'Saldo (Db − Cr)'],
    filas: [...porCuenta.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([cuenta, c]) => [cuenta, c.nombre, round(c.db), round(c.cr), round(c.db - c.cr)] as ValorCelda[]),
    anchos: [12, 44, 18, 18, 18],
  };
  resumen.filas.unshift([`Empresa: ${empresa.nombre} — NIT ${empresa.nit}`, '', '', '', '']);
  resumen.filas.push(['TOTAL', '', r.totalDebito, r.totalCredito, round(r.totalDebito - r.totalCredito)]);

  const porDoc = new Map<number, { doc: string; fecha: string; tercero: string; db: number; cr: number }>();
  for (const m of r.movimientos) {
    const c = porDoc.get(m.comprobante) ?? { doc: m.documento, fecha: m.fecha, tercero: m.terceroNombre, db: 0, cr: 0 };
    c.db += m.debito;
    c.cr += m.credito;
    porDoc.set(m.comprobante, c);
  }
  const cuadre: Hoja = {
    nombre: 'Cuadre',
    encabezados: ['Número', 'Documento', 'Fecha', 'Tercero', 'Débitos', 'Créditos', 'Diferencia', '¿Cuadra?'],
    filas: [...porDoc.entries()].map(([num, c]) => {
      const dif = round(c.db - c.cr);
      return [num, c.doc, c.fecha, c.tercero, round(c.db), round(c.cr), dif, dif === 0 ? 'Sí' : 'NO'] as ValorCelda[];
    }),
    anchos: [8, 18, 12, 36, 16, 16, 12, 9],
  };

  const revisar: Hoja = {
    nombre: 'Revisar',
    encabezados: ['Documento', 'Nivel', 'Qué pasó'],
    filas: r.avisos.length
      ? r.avisos.map((a) => [a.documento, a.nivel === 'revisar' ? 'Revisar' : 'Información', a.mensaje] as ValorCelda[])
      : [['—', 'Información', 'Todos los documentos se causaron con cuentas confirmadas.']],
    anchos: [18, 12, 100],
  };

  return generarXlsx([comprobante, resumen, cuadre, revisar]);
}

const round = (v: number) => Math.round(v * 100) / 100;
