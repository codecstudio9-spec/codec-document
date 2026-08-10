/**
 * Armado del reporte Excel de documentos electrónicos.
 *
 * Cuatro hojas, con la estructura que un contador ya reconoce del flujo que
 * hace hoy a mano:
 *
 *   Reporte General       totales del periodo, una fila por tipo de impuesto
 *   Reporte Detallado     una fila por LÍNEA de producto
 *   Reporte Detallado 1   una fila por DOCUMENTO
 *   Reporte Retenciones   una fila por retención
 *
 * La hoja de retenciones existe aparte, y no como columnas de la de
 * documentos, porque una retención no es un impuesto que suma: resta, y el
 * contador la trabaja por separado. Sale de las filas con is_withholding.
 */

import { generarXlsx, type Hoja, type ValorCelda } from './xlsx';

export interface DocumentoReporte {
  id: string;
  doc_type: string;
  doc_type_code: string | null;
  cufe: string | null;
  prefix: string | null;
  number: string | null;
  full_number: string | null;
  issue_date: string | null;
  due_date: string | null;
  currency: string;
  payment_form: string | null;
  payment_method: string | null;
  issuer_nit: string | null;
  issuer_dv: string | null;
  issuer_name: string | null;
  issuer_trade_name: string | null;
  receiver_nit: string | null;
  receiver_name: string | null;
  line_total: number;
  taxable_base: number;
  total_iva: number;
  total_inc: number;
  total_ica: number;
  total_bolsas: number;
  total_otros: number;
  total_rete_renta: number;
  total_rete_iva: number;
  total_rete_ica: number;
  total_impuestos: number;
  total_retenciones: number;
  discounts: number;
  total: number;
  status: string;
  dian_validated: boolean;
}

export interface LineaReporte {
  document_id: string;
  line_no: number;
  seller_item_code: string | null;
  standard_item_code: string | null;
  description: string | null;
  quantity: number;
  unit_code: string | null;
  unit_price: number;
  discount: number;
  line_total: number;
  tax_total: number;
}

export interface ImpuestoReporte {
  document_id: string;
  scope: string;
  line_no: number | null;
  tax_code: string;
  tax_name: string | null;
  taxable_base: number;
  rate: number;
  amount: number;
  is_withholding: boolean;
}

const ETIQUETA_TIPO: Record<string, string> = {
  factura: 'Factura de venta',
  nota_credito: 'Nota crédito',
  nota_debito: 'Nota débito',
  documento_equivalente: 'Documento equivalente',
  documento_soporte: 'Documento soporte',
  nomina: 'Nómina electrónica',
  evento: 'Evento',
  desconocido: 'Sin identificar',
};

const ETIQUETA_ESTADO: Record<string, string> = {
  PROCESSED: 'Procesado',
  REVIEW_REQUIRED: 'Requiere revisión',
  DUPLICATE: 'Duplicado',
  INVALID: 'Inválido',
  ERROR: 'Error',
};

const n = (v: unknown): number => {
  const x = Number(v ?? 0);
  return Number.isFinite(x) ? x : 0;
};

function hojaGeneral(docs: DocumentoReporte[]): Hoja {
  const suma = (f: (d: DocumentoReporte) => number) => docs.reduce((a, d) => a + n(f(d)), 0);

  const conceptos: Array<[string, number]> = [
    ['Total BASE', suma((d) => d.line_total)],
    ['Base gravable', suma((d) => d.taxable_base)],
    ['Total IVA', suma((d) => d.total_iva)],
    ['Total INC', suma((d) => d.total_inc)],
    ['Total ICA', suma((d) => d.total_ica)],
    ['Total Bolsas', suma((d) => d.total_bolsas)],
    ['Total OTROS IMPUESTOS', suma((d) => d.total_otros)],
    ['Total RETE RENTA', suma((d) => d.total_rete_renta)],
    ['Total RETE IVA', suma((d) => d.total_rete_iva)],
    ['Total RETEICA', suma((d) => d.total_rete_ica)],
    ['Total descuentos', suma((d) => d.discounts)],
    ['TOTAL DOCUMENTOS', suma((d) => d.total)],
  ];

  const porTipo = new Map<string, { cantidad: number; total: number }>();
  for (const d of docs) {
    const k = ETIQUETA_TIPO[d.doc_type] ?? d.doc_type;
    const p = porTipo.get(k) ?? { cantidad: 0, total: 0 };
    p.cantidad++;
    p.total += n(d.total);
    porTipo.set(k, p);
  }

  const filas: ValorCelda[][] = [
    ['Documentos procesados', docs.length, ''],
    ['', '', ''],
    ['CONCEPTO', 'VALOR', ''],
    ...conceptos.map(([c, v]) => [c, v, ''] as ValorCelda[]),
    ['', '', ''],
    ['POR TIPO DE DOCUMENTO', 'CANTIDAD', 'TOTAL'],
    ...[...porTipo.entries()].map(([t, p]) => [t, p.cantidad, p.total] as ValorCelda[]),
  ];

  const porEstado = new Map<string, number>();
  for (const d of docs) {
    const k = ETIQUETA_ESTADO[d.status] ?? d.status;
    porEstado.set(k, (porEstado.get(k) ?? 0) + 1);
  }
  filas.push(['', '', ''], ['POR ESTADO', 'CANTIDAD', '']);
  for (const [e, c] of porEstado) filas.push([e, c, '']);

  return {
    nombre: 'Reporte General',
    encabezados: ['Resumen del periodo', '', ''],
    filas,
    anchos: [34, 18, 18],
  };
}

function hojaDetallado(docs: DocumentoReporte[], lineas: LineaReporte[], impuestos: ImpuestoReporte[]): Hoja {
  const porId = new Map(docs.map((d) => [d.id, d]));

  // Impuesto de línea, indexado por documento+línea. El contador espera ver
  // la tarifa y el nombre del impuesto en la misma fila del producto.
  const impPorLinea = new Map<string, ImpuestoReporte>();
  for (const i of impuestos) {
    if (i.scope !== 'line' || i.line_no === null || i.is_withholding) continue;
    impPorLinea.set(`${i.document_id}|${i.line_no}`, i);
  }

  const filas = lineas.map((l) => {
    const d = porId.get(l.document_id);
    const imp = impPorLinea.get(`${l.document_id}|${l.line_no}`);
    return [
      d ? ETIQUETA_TIPO[d.doc_type] ?? d.doc_type : '',
      d?.full_number ?? '',
      d?.issue_date ?? '',
      d?.issuer_nit ?? '',
      d?.issuer_name ?? '',
      l.line_no,
      l.seller_item_code ?? l.standard_item_code ?? '',
      l.description ?? '',
      n(l.quantity),
      l.unit_code ?? '',
      n(l.unit_price),
      n(l.discount),
      n(l.line_total),
      n(l.tax_total),
      imp ? n(imp.rate) : 0,
      imp?.tax_name ?? '',
      imp ? n(imp.taxable_base) : 0,
    ] as ValorCelda[];
  });

  return {
    nombre: 'Reporte Detallado',
    encabezados: [
      'Tipo Documento', 'Nro Documento', 'Fecha Emisión', 'Emisor - NIT', 'Emisor - Razón Social',
      'Línea', 'Código', 'Descripción', 'Cantidad', 'Unidad', 'Valor Unitario', 'Descuento',
      'Valor Antes Impuestos', 'Total Impuestos Línea', '% Impuesto', 'Nombre Impuesto', 'Base Gravable',
    ],
    filas,
    anchos: [20, 16, 13, 14, 30, 7, 16, 42, 10, 9, 15, 12, 20, 20, 12, 16, 16],
  };
}

function hojaDocumentos(docs: DocumentoReporte[]): Hoja {
  const filas = docs.map((d) => [
    d.cufe ?? '',
    d.full_number ?? '',
    ETIQUETA_TIPO[d.doc_type] ?? d.doc_type,
    d.issue_date ?? '',
    d.due_date ?? '',
    d.issuer_nit ?? '',
    d.issuer_dv ?? '',
    d.issuer_name ?? '',
    d.issuer_trade_name ?? '',
    d.receiver_nit ?? '',
    d.receiver_name ?? '',
    d.currency,
    d.payment_form ?? '',
    d.payment_method ?? '',
    n(d.line_total),
    n(d.taxable_base),
    n(d.total_iva),
    n(d.total_inc),
    n(d.total_bolsas),
    n(d.total_otros),
    n(d.total_retenciones),
    n(d.discounts),
    n(d.total),
    ETIQUETA_ESTADO[d.status] ?? d.status,
    d.dian_validated ? 'Sí' : 'No',
  ] as ValorCelda[]);

  return {
    nombre: 'Reporte Detallado 1',
    encabezados: [
      'CUFE/CUDE', 'Nro Documento', 'Tipo Documento', 'Fecha Emisión', 'Fecha Vencimiento',
      'Emisor - NIT', 'Emisor - DV', 'Emisor - Razón Social', 'Emisor - Nombre Comercial',
      'Receptor - NIT', 'Receptor - Razón Social', 'Moneda', 'Forma Pago', 'Medio Pago',
      'Subtotal', 'Base Gravable', 'IVA', 'INC', 'Bolsas', 'Otros Impuestos',
      'Retenciones', 'Descuentos', 'Total', 'Estado', 'Validado DIAN',
    ],
    filas,
    anchos: [40, 16, 20, 13, 15, 13, 8, 32, 26, 13, 32, 8, 11, 11, 15, 15, 14, 12, 12, 15, 14, 12, 15, 17, 13],
  };
}

function hojaRetenciones(docs: DocumentoReporte[], impuestos: ImpuestoReporte[]): Hoja {
  const porId = new Map(docs.map((d) => [d.id, d]));

  const filas = impuestos
    .filter((i) => i.is_withholding && i.scope === 'document')
    .map((i) => {
      const d = porId.get(i.document_id);
      return [
        d?.cufe ?? '',
        d?.full_number ?? '',
        d ? ETIQUETA_TIPO[d.doc_type] ?? d.doc_type : '',
        d?.issue_date ?? '',
        d?.issuer_nit ?? '',
        d?.issuer_name ?? '',
        d?.issuer_trade_name ?? '',
        d?.receiver_nit ?? '',
        d?.receiver_name ?? '',
        i.tax_code,
        i.tax_name ?? '',
        n(i.taxable_base),
        n(i.rate),
        n(i.amount),
      ] as ValorCelda[];
    });

  return {
    nombre: 'Reporte Retenciones',
    encabezados: [
      'CUFE/CUDE', 'Nro Documento', 'Tipo Documento', 'Fecha Emisión',
      'Emisor - NIT', 'Emisor - Razón Social', 'Emisor - Nombre Comercial',
      'Receptor - NIT', 'Receptor - Razón Social',
      'Código', 'Retención', 'Base', '% Tarifa', 'Valor Retenido',
    ],
    filas,
    anchos: [40, 16, 20, 13, 13, 32, 26, 13, 32, 9, 16, 15, 10, 15],
  };
}

export function construirReporte(
  docs: DocumentoReporte[],
  lineas: LineaReporte[],
  impuestos: ImpuestoReporte[],
): Uint8Array {
  return generarXlsx([
    hojaGeneral(docs),
    hojaDetallado(docs, lineas, impuestos),
    hojaDocumentos(docs),
    hojaRetenciones(docs, impuestos),
  ]);
}
