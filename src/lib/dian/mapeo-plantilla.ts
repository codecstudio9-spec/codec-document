/**
 * Emparejamiento entre las columnas de la plantilla del contador y los
 * datos que Codec extrajo de los XML.
 *
 * El contador sube su plantilla vacía; nosotros leemos sus encabezados e
 * intentamos adivinar qué va en cada uno. Lo que no se pueda adivinar lo
 * corrige él una vez, y el emparejamiento queda guardado: el mes siguiente
 * elige el perfil y descarga sin configurar nada.
 *
 * Ese guardado es lo que convierte la función en una razón para volver
 * cada mes, no en un formulario que hay que rellenar otra vez.
 */

export type Granularidad = 'documento' | 'linea';

export interface CampoDisponible {
  id: string;
  etiqueta: string;
  grupo: string;
  /** 'linea' sólo aparece cuando se exporta una fila por línea. */
  nivel: 'documento' | 'linea';
  tipo: 'texto' | 'numero' | 'fecha';
  /** Nombres de columna que suelen corresponder a este campo, ya
   *  normalizados. Salen de cómo los nombran los programas contables
   *  colombianos, no de una traducción literal. */
  alias: string[];
}

export const CAMPOS: CampoDisponible[] = [
  // ── Documento ──────────────────────────────────────────────────────────
  { id: 'issue_date', etiqueta: 'Fecha de emisión', grupo: 'Documento', nivel: 'documento', tipo: 'fecha',
    alias: ['fecha', 'fechaemision', 'fechadocumento', 'fechafactura', 'fechaelaboracion', 'fechadeemision', 'fecemision', 'fecdoc', 'fecfactura', 'fecha1'] },
  { id: 'due_date', etiqueta: 'Fecha de vencimiento', grupo: 'Documento', nivel: 'documento', tipo: 'fecha',
    alias: ['fechavencimiento', 'vencimiento', 'fechavence', 'fechadevencimiento', 'fecvencimiento', 'fecvence'] },
  { id: 'full_number', etiqueta: 'Número del documento', grupo: 'Documento', nivel: 'documento', tipo: 'texto',
    alias: ['numero', 'nrodocumento', 'numerodocumento', 'documento', 'factura', 'nrofactura', 'numerofactura', 'consecutivo', 'numdoc', 'nro'] },
  { id: 'prefix', etiqueta: 'Prefijo', grupo: 'Documento', nivel: 'documento', tipo: 'texto',
    alias: ['prefijo', 'serie'] },
  { id: 'number', etiqueta: 'Consecutivo (sin prefijo)', grupo: 'Documento', nivel: 'documento', tipo: 'texto',
    alias: ['folio', 'consecutivosinprefijo'] },
  { id: 'doc_type', etiqueta: 'Tipo de documento', grupo: 'Documento', nivel: 'documento', tipo: 'texto',
    alias: ['tipo', 'tipodocumento', 'tipodedocumento', 'clasedocumento', 'tipocomprobante'] },
  { id: 'cufe', etiqueta: 'CUFE / CUDE', grupo: 'Documento', nivel: 'documento', tipo: 'texto',
    alias: ['cufe', 'cude', 'cufecude', 'codigounico'] },
  { id: 'currency', etiqueta: 'Moneda', grupo: 'Documento', nivel: 'documento', tipo: 'texto',
    alias: ['moneda', 'divisa'] },
  { id: 'payment_method', etiqueta: 'Medio de pago', grupo: 'Documento', nivel: 'documento', tipo: 'texto',
    alias: ['mediopago', 'formapago', 'formadepago', 'metodopago'] },
  { id: 'notes_join', etiqueta: 'Observaciones', grupo: 'Documento', nivel: 'documento', tipo: 'texto',
    alias: ['observaciones', 'nota', 'notas', 'detalle', 'concepto', 'glosa', 'descripcionmovimiento'] },

  // ── Tercero ────────────────────────────────────────────────────────────
  { id: 'issuer_nit', etiqueta: 'NIT del proveedor', grupo: 'Tercero', nivel: 'documento', tipo: 'texto',
    alias: ['nit', 'nittercero', 'identificacion', 'identificaciontercero', 'documentotercero', 'cedulanit', 'nitproveedor', 'codtercero', 'codigotercero', 'tercero', 'numeroidentificacion'] },
  { id: 'issuer_dv', etiqueta: 'Dígito de verificación', grupo: 'Tercero', nivel: 'documento', tipo: 'texto',
    alias: ['dv', 'digitoverificacion', 'digitodeverificacion'] },
  { id: 'issuer_name', etiqueta: 'Razón social del proveedor', grupo: 'Tercero', nivel: 'documento', tipo: 'texto',
    alias: ['razonsocial', 'nombretercero', 'proveedor', 'nombreproveedor', 'nombre', 'razonsocialtercero', 'beneficiario', 'raznsocial', 'nomtercero'] },
  { id: 'issuer_trade_name', etiqueta: 'Nombre comercial del proveedor', grupo: 'Tercero', nivel: 'documento', tipo: 'texto',
    alias: ['nombrecomercial'] },
  { id: 'receiver_nit', etiqueta: 'NIT del receptor', grupo: 'Tercero', nivel: 'documento', tipo: 'texto',
    alias: ['nitreceptor', 'nitcliente', 'nitadquiriente', 'nitempresa'] },
  { id: 'receiver_name', etiqueta: 'Razón social del receptor', grupo: 'Tercero', nivel: 'documento', tipo: 'texto',
    alias: ['razonsocialreceptor', 'cliente', 'adquiriente', 'nombrecliente'] },

  // ── Valores ────────────────────────────────────────────────────────────
  { id: 'line_total', etiqueta: 'Subtotal (antes de impuestos)', grupo: 'Valores', nivel: 'documento', tipo: 'numero',
    alias: ['subtotal', 'valorbruto', 'base', 'valorantesimpuestos', 'valorbase', 'totalbase', 'bruto', 'valor'] },
  { id: 'taxable_base', etiqueta: 'Base gravable', grupo: 'Valores', nivel: 'documento', tipo: 'numero',
    alias: ['basegravable', 'baseimponible', 'basegravada'] },
  { id: 'total_iva', etiqueta: 'IVA', grupo: 'Valores', nivel: 'documento', tipo: 'numero',
    alias: ['iva', 'valoriva', 'impuestoiva', 'totaliva'] },
  { id: 'total_inc', etiqueta: 'INC (impuesto al consumo)', grupo: 'Valores', nivel: 'documento', tipo: 'numero',
    alias: ['inc', 'impoconsumo', 'impuestoconsumo', 'totalinc'] },
  { id: 'total_ica', etiqueta: 'ICA', grupo: 'Valores', nivel: 'documento', tipo: 'numero',
    alias: ['ica', 'totalica'] },
  { id: 'total_bolsas', etiqueta: 'Impuesto a las bolsas', grupo: 'Valores', nivel: 'documento', tipo: 'numero',
    alias: ['bolsas', 'impuestobolsas'] },
  { id: 'total_otros', etiqueta: 'Otros impuestos', grupo: 'Valores', nivel: 'documento', tipo: 'numero',
    alias: ['otrosimpuestos', 'otros'] },
  { id: 'total_rete_renta', etiqueta: 'Retención en la fuente', grupo: 'Valores', nivel: 'documento', tipo: 'numero',
    alias: ['retefuente', 'reterenta', 'retencionfuente', 'retencionenlafuente', 'retefte'] },
  { id: 'total_rete_iva', etiqueta: 'ReteIVA', grupo: 'Valores', nivel: 'documento', tipo: 'numero',
    alias: ['reteiva', 'retencioniva'] },
  { id: 'total_rete_ica', etiqueta: 'ReteICA', grupo: 'Valores', nivel: 'documento', tipo: 'numero',
    alias: ['reteica', 'retencionica'] },
  { id: 'total_retenciones', etiqueta: 'Total retenciones', grupo: 'Valores', nivel: 'documento', tipo: 'numero',
    alias: ['totalretenciones', 'retenciones'] },
  { id: 'discounts', etiqueta: 'Descuentos', grupo: 'Valores', nivel: 'documento', tipo: 'numero',
    alias: ['descuento', 'descuentos', 'valordescuento'] },
  { id: 'total', etiqueta: 'Total del documento', grupo: 'Valores', nivel: 'documento', tipo: 'numero',
    alias: ['total', 'valortotal', 'totalfactura', 'totaldocumento', 'grantotal', 'totalapagar', 'neto', 'vlrtotal'] },

  // ── Línea ──────────────────────────────────────────────────────────────
  { id: 'l_line_no', etiqueta: 'Número de línea', grupo: 'Línea', nivel: 'linea', tipo: 'numero',
    alias: ['linea', 'item', 'nrolinea', 'numerolinea'] },
  { id: 'l_description', etiqueta: 'Descripción del producto', grupo: 'Línea', nivel: 'linea', tipo: 'texto',
    alias: ['descripcion', 'producto', 'articulo', 'descripcionproducto', 'nombreproducto', 'detalleproducto'] },
  { id: 'l_code', etiqueta: 'Código del producto', grupo: 'Línea', nivel: 'linea', tipo: 'texto',
    alias: ['codigo', 'codigoproducto', 'referencia', 'codproducto', 'sku', 'codigoarticulo'] },
  { id: 'l_quantity', etiqueta: 'Cantidad', grupo: 'Línea', nivel: 'linea', tipo: 'numero',
    alias: ['cantidad', 'cant', 'unidades'] },
  { id: 'l_unit_price', etiqueta: 'Valor unitario', grupo: 'Línea', nivel: 'linea', tipo: 'numero',
    alias: ['valorunitario', 'precio', 'preciounitario', 'vrunitario'] },
  { id: 'l_line_total', etiqueta: 'Valor de la línea', grupo: 'Línea', nivel: 'linea', tipo: 'numero',
    alias: ['valorlinea', 'totallinea', 'subtotallinea'] },
  { id: 'l_tax_total', etiqueta: 'Impuesto de la línea', grupo: 'Línea', nivel: 'linea', tipo: 'numero',
    alias: ['impuestolinea', 'totalimpuestoslinea'] },
];

/** Quita tildes, espacios, signos y mayúsculas: 'Nº Doc.' y 'nro doc'
 *  tienen que colisionar para que el auto-mapeo sirva de algo. */
export function normalizar(s: string): string {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    // "Nº", "N°" y "No." son la abreviatura corriente de "número" en las
    // plantillas colombianas. Sin esto, "Nº Doc." queda en "ndoc" y deja de
    // parecerse a "nrodocumento", que es justo lo que hay que emparejar.
    .replace(/n[º°]\s*/g, 'nro')
    .replace(/\bno\.\s*/g, 'nro')
    .replace(/[^a-z0-9]/g, '');
}

export interface Emparejamiento {
  /** Índice de la columna en la plantilla. */
  columna: number;
  encabezado: string;
  /** id del campo, o '' si el contador decidió dejarla vacía. */
  campo: string;
  /** true si lo adivinó el sistema; false si lo eligió el usuario. */
  automatico: boolean;
}

/**
 * Adivina qué campo va en cada columna de la plantilla.
 *
 * Primero exacto sobre el nombre normalizado, luego por alias, y por
 * último por contención — 'vlrbaseiva' contiene 'baseiva'. Se busca de
 * alias más largo a más corto para que 'basegravable' gane sobre 'base'.
 */
export function emparejarAutomatico(encabezados: string[], granularidad: Granularidad): Emparejamiento[] {
  const candidatos = CAMPOS.filter((c) => granularidad === 'linea' || c.nivel === 'documento');

  const porAlias = new Map<string, string>();
  for (const campo of candidatos) {
    porAlias.set(normalizar(campo.etiqueta), campo.id);
    for (const a of campo.alias) porAlias.set(normalizar(a), campo.id);
  }
  const aliasOrdenados = [...porAlias.keys()].sort((a, b) => b.length - a.length);

  const usados = new Set<string>();

  return encabezados.map((enc, columna) => {
    const n = normalizar(enc);
    let campo = '';

    if (n) {
      if (porAlias.has(n)) {
        campo = porAlias.get(n)!;
      } else {
        for (const alias of aliasOrdenados) {
          // Alias de menos de 3 caracteres solo valen exactos: 'dv' dentro
          // de 'division' sería un falso positivo.
          if (alias.length < 3) continue;
          if (n.includes(alias)) { campo = porAlias.get(alias)!; break; }
        }
      }
    }

    // Un mismo campo no se asigna a dos columnas: si la plantilla trae
    // 'Valor' y 'Valor Total', la segunda coincidencia se deja para que el
    // contador la elija a mano en vez de duplicar el dato en silencio.
    if (campo && usados.has(campo)) campo = '';
    if (campo) usados.add(campo);

    return { columna, encabezado: enc, campo, automatico: Boolean(campo) };
  });
}

// ── Extracción de valores ────────────────────────────────────────────────

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

export interface OpcionesFormato {
  /** 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' */
  formatoFecha: string;
}

function formatearFecha(iso: string | null, formato: string): string {
  if (!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  const [, a, mes, d] = m;
  if (formato === 'DD/MM/YYYY') return `${d}/${mes}/${a}`;
  if (formato === 'MM/DD/YYYY') return `${mes}/${d}/${a}`;
  return `${a}-${mes}-${d}`;
}

type Fila = Record<string, unknown>;

/** Obtiene el valor de un campo para un documento y, si aplica, su línea. */
export function valorDeCampo(
  campo: string,
  doc: Fila,
  linea: Fila | null,
  opciones: OpcionesFormato,
): string | number | '' {
  if (!campo) return '';

  if (campo.startsWith('l_')) {
    if (!linea) return '';
    switch (campo) {
      case 'l_line_no': return Number(linea.line_no ?? 0);
      case 'l_description': return String(linea.description ?? '');
      case 'l_code': return String(linea.seller_item_code ?? linea.standard_item_code ?? '');
      case 'l_quantity': return Number(linea.quantity ?? 0);
      case 'l_unit_price': return Number(linea.unit_price ?? 0);
      case 'l_line_total': return Number(linea.line_total ?? 0);
      case 'l_tax_total': return Number(linea.tax_total ?? 0);
      default: return '';
    }
  }

  switch (campo) {
    case 'issue_date': return formatearFecha(doc.issue_date as string, opciones.formatoFecha);
    case 'due_date': return formatearFecha(doc.due_date as string, opciones.formatoFecha);
    case 'doc_type': return ETIQUETA_TIPO[String(doc.doc_type)] ?? String(doc.doc_type ?? '');
    case 'notes_join': return Array.isArray(doc.notes) ? (doc.notes as string[]).join(' · ') : '';
    default: {
      const v = doc[campo];
      if (v === null || v === undefined) return '';
      if (typeof v === 'number') return v;
      // Las columnas de valores llegan como texto desde PostgREST (numeric);
      // se convierten para que Excel las trate como números y el programa
      // contable no rechace la carga por recibir una cadena.
      const campoDef = CAMPOS.find((c) => c.id === campo);
      if (campoDef?.tipo === 'numero') {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      }
      return String(v);
    }
  }
}

/** Construye las filas a escribir en la plantilla. */
export function construirFilas(
  documentos: Fila[],
  lineas: Fila[],
  emparejamientos: Emparejamiento[],
  granularidad: Granularidad,
  opciones: OpcionesFormato,
): Array<Array<string | number | ''>> {
  const ancho = Math.max(...emparejamientos.map((e) => e.columna), 0) + 1;
  const porColumna = new Map(emparejamientos.map((e) => [e.columna, e.campo]));

  const armar = (doc: Fila, linea: Fila | null) => {
    const fila: Array<string | number | ''> = new Array(ancho).fill('');
    for (let c = 0; c < ancho; c++) {
      fila[c] = valorDeCampo(porColumna.get(c) ?? '', doc, linea, opciones);
    }
    return fila;
  };

  if (granularidad === 'documento') return documentos.map((d) => armar(d, null));

  const porDoc = new Map<string, Fila[]>();
  for (const l of lineas) {
    const k = String(l.document_id);
    if (!porDoc.has(k)) porDoc.set(k, []);
    porDoc.get(k)!.push(l);
  }

  const filas: Array<Array<string | number | ''>> = [];
  for (const d of documentos) {
    const suyas = porDoc.get(String(d.id)) ?? [];
    // Un documento sin líneas igual tiene que aparecer: si no, el total del
    // Excel no cuadraría con el de la herramienta y el contador perdería la
    // tarde buscando la diferencia.
    if (suyas.length === 0) filas.push(armar(d, null));
    else for (const l of suyas) filas.push(armar(d, l));
  }
  return filas;
}
