/**
 * Traduce lo que produce el parser (DocumentoNormalizado) a las filas que
 * guardan las tablas ed_* — ver
 * supabase/migrations/20260810120000_add_dian_document_engine.sql.
 *
 * Es una capa aparte y no un método del parser a propósito: el parser no
 * debe saber nada de la base de datos. Eso es lo que le permite correr
 * dentro de un Web Worker del navegador, donde no hay conexión a Postgres,
 * exactamente igual que en una Edge Function.
 *
 * Aquí no se escribe nada: sólo se construyen los objetos. Quien inserte
 * decide la transacción, el orden y qué hacer ante un duplicado.
 */

import type {
  DocumentoNormalizado, Excepcion, Impuesto, LineaDocumento,
} from './types';

/** Fila de ed_documents. Las columnas de resumen ya vienen calculadas: son
 *  caché de lectura para que el dashboard y el Excel salgan de una consulta
 *  con sumas, sin recorrer millones de filas de impuestos. */
export interface FilaDocumento {
  fiscal_entity_id: string | null;
  import_id: string | null;

  doc_type: string;
  doc_type_code: string | null;
  direction: string;

  cufe: string | null;
  cufe_scheme: string | null;
  prefix: string | null;
  number: string | null;
  full_number: string | null;

  issue_date: string | null;
  issue_time: string | null;
  due_date: string | null;

  currency: string;
  payment_form: string | null;
  payment_method: string | null;

  issuer_nit: string | null;
  issuer_dv: string | null;
  issuer_name: string | null;
  issuer_trade_name: string | null;
  receiver_nit: string | null;
  receiver_dv: string | null;
  receiver_name: string | null;

  line_total: number;
  taxable_base: number;
  tax_inclusive: number;
  discounts: number;
  charges: number;
  prepaid: number;
  rounding: number;
  total: number;

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
  base_iva_por_tarifa: Record<string, number>;

  dian_resolution: string | null;
  dian_valid_from: string | null;
  dian_valid_to: string | null;
  dian_range_from: string | null;
  dian_range_to: string | null;
  dian_provider_nit: string | null;
  dian_software_id: string | null;
  dian_qr: string | null;
  dian_validated: boolean;
  dian_validated_at: string | null;

  notes: string[];
  reference_number: string | null;
  reference_cufe: string | null;
  reference_date: string | null;

  status: string;
  engine_version: string;
  parse_ms: number | null;
}

export interface FilaLinea {
  line_no: number;
  seller_item_code: string | null;
  standard_item_code: string | null;
  description: string | null;
  note: string | null;
  quantity: number;
  unit_code: string | null;
  unit_price: number;
  discount: number;
  charge: number;
  line_total: number;
  tax_total: number;
}

export interface FilaImpuesto {
  scope: 'document' | 'line';
  line_no: number | null;
  tax_code: string;
  tax_name: string | null;
  taxable_base: number;
  rate: number;
  amount: number;
  is_withholding: boolean;
  units: number | null;
}

export interface FilaExcepcion {
  code: string;
  severity: string;
  message: string;
  field: string | null;
  expected: string | null;
  found: string | null;
}

export interface FilaTercero {
  nit: string;
  dv: string | null;
  razon_social: string | null;
  nombre_comercial: string | null;
  regimen: string | null;
  ciudad: string | null;
  departamento: string | null;
  email: string | null;
  telefono: string | null;
}

export interface PayloadDocumento {
  documento: FilaDocumento;
  lineas: FilaLinea[];
  impuestos: FilaImpuesto[];
  excepciones: FilaExcepcion[];
  /** Emisor y receptor, para poblar ed_parties con upsert por NIT. */
  terceros: FilaTercero[];
}

/** Postgres rechaza '' donde espera date. Un campo de fecha vacío en el XML
 *  tiene que llegar como NULL, no como cadena vacía. */
const fecha = (v: string): string | null => {
  const s = v?.trim();
  if (!s) return null;
  // Se acepta 'YYYY-MM-DD' y también 'YYYY-MM-DDTHH:mm:ss', quedándose con
  // la parte de fecha.
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
};

const txt = (v: string | undefined): string | null => {
  const s = v?.trim();
  return s ? s : null;
};

function filaImpuesto(i: Impuesto): FilaImpuesto {
  return {
    // El modelo del parser habla español ('documento'/'linea') y las
    // columnas de la base, inglés, como el resto del esquema. La traducción
    // vive aquí, que es precisamente el trabajo de esta capa.
    scope: i.alcance === 'linea' ? 'line' : 'document',
    line_no: i.linea,
    tax_code: i.codigo || 'SIN_CODIGO',
    tax_name: txt(i.nombre),
    taxable_base: i.baseGravable,
    rate: i.tarifa,
    amount: i.valor,
    is_withholding: i.esRetencion,
    units: i.unidades,
  };
}

function filaLinea(l: LineaDocumento): FilaLinea {
  return {
    line_no: l.numero,
    seller_item_code: txt(l.codigoVendedor),
    standard_item_code: txt(l.codigoEstandar),
    description: txt(l.descripcion),
    note: txt(l.nota),
    quantity: l.cantidad,
    unit_code: txt(l.unidadMedida),
    unit_price: l.precioUnitario,
    discount: l.descuento,
    charge: l.recargo,
    line_total: l.valorBruto,
    tax_total: l.totalImpuestos,
  };
}

/** Deriva el estado del documento a partir de sus excepciones. Un error
 *  deja el documento INVALID; cualquier otra observación lo manda a la
 *  bandeja de revisión, que es donde el contador realmente trabaja. */
export function estadoDesdeExcepciones(excepciones: Excepcion[]): string {
  if (excepciones.some((e) => e.severidad === 'error')) return 'INVALID';
  if (excepciones.some((e) => e.severidad === 'revision')) return 'REVIEW_REQUIRED';
  return 'PROCESSED';
}

export interface OpcionesMapeo {
  fiscalEntityId?: string | null;
  importId?: string | null;
  parseMs?: number | null;
  validacionDian?: { validado: boolean; fecha: string } | null;
}

export function mapearDocumento(
  doc: DocumentoNormalizado,
  excepciones: Excepcion[],
  opciones: OpcionesMapeo = {},
): PayloadDocumento {
  const r = doc.resumen;

  const documento: FilaDocumento = {
    fiscal_entity_id: opciones.fiscalEntityId ?? null,
    import_id: opciones.importId ?? null,

    doc_type: doc.tipo,
    doc_type_code: txt(doc.tipoCodigo),
    direction: doc.direccion,

    cufe: txt(doc.cufe),
    cufe_scheme: txt(doc.cufeEsquema),
    prefix: txt(doc.prefijo),
    number: txt(doc.numero),
    full_number: txt(doc.numeroCompleto),

    issue_date: fecha(doc.fechaEmision),
    issue_time: txt(doc.horaEmision),
    due_date: fecha(doc.fechaVencimiento),

    currency: doc.moneda || 'COP',
    payment_form: txt(doc.formaPago),
    payment_method: txt(doc.medioPago),

    issuer_nit: txt(doc.emisor.nit),
    issuer_dv: txt(doc.emisor.dv),
    issuer_name: txt(doc.emisor.razonSocial),
    issuer_trade_name: txt(doc.emisor.nombreComercial),
    receiver_nit: txt(doc.receptor.nit),
    receiver_dv: txt(doc.receptor.dv),
    receiver_name: txt(doc.receptor.razonSocial),

    line_total: doc.totales.brutoLineas,
    taxable_base: doc.totales.baseImponible,
    tax_inclusive: doc.totales.totalConImpuestos,
    discounts: doc.totales.descuentos,
    charges: doc.totales.recargos,
    prepaid: doc.totales.anticipos,
    rounding: doc.totales.redondeo,
    total: doc.totales.total,

    total_iva: r.iva,
    total_inc: r.inc,
    total_ica: r.ica,
    total_bolsas: r.bolsas,
    total_otros: r.otros,
    total_rete_renta: r.reteRenta,
    total_rete_iva: r.reteIva,
    total_rete_ica: r.reteIca,
    total_impuestos: r.totalImpuestos,
    total_retenciones: r.totalRetenciones,
    base_iva_por_tarifa: r.baseIvaPorTarifa,

    dian_resolution: txt(doc.autorizacion.resolucion),
    dian_valid_from: fecha(doc.autorizacion.vigenciaDesde),
    dian_valid_to: fecha(doc.autorizacion.vigenciaHasta),
    dian_range_from: txt(doc.autorizacion.rangoDesde),
    dian_range_to: txt(doc.autorizacion.rangoHasta),
    dian_provider_nit: txt(doc.autorizacion.proveedorTecnologicoNit),
    dian_software_id: txt(doc.autorizacion.softwareId),
    dian_qr: txt(doc.autorizacion.qr),
    dian_validated: opciones.validacionDian?.validado ?? false,
    dian_validated_at: fecha(opciones.validacionDian?.fecha ?? ''),

    notes: doc.notas,
    reference_number: txt(doc.documentoReferencia?.numero),
    reference_cufe: txt(doc.documentoReferencia?.cufe),
    reference_date: fecha(doc.documentoReferencia?.fecha ?? ''),

    status: estadoDesdeExcepciones(excepciones),
    engine_version: doc.versionMotor,
    parse_ms: opciones.parseMs ?? null,
  };

  const terceros: FilaTercero[] = [];
  for (const t of [doc.emisor, doc.receptor]) {
    if (!t.nit) continue;
    terceros.push({
      nit: t.nit,
      dv: txt(t.dv),
      razon_social: txt(t.razonSocial),
      nombre_comercial: txt(t.nombreComercial),
      regimen: txt(t.regimen),
      ciudad: txt(t.ciudad),
      departamento: txt(t.departamento),
      email: txt(t.email),
      telefono: txt(t.telefono),
    });
  }

  return {
    documento,
    lineas: doc.lineas.map(filaLinea),
    impuestos: doc.impuestos.map(filaImpuesto),
    excepciones: excepciones.map((e) => ({
      code: e.codigo,
      severity: e.severidad,
      message: e.mensaje,
      field: txt(e.campo),
      expected: txt(e.esperado),
      found: txt(e.encontrado),
    })),
    terceros,
  };
}
