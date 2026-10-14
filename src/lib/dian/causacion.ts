/**
 * Causación contable a partir de los documentos electrónicos ya leídos.
 *
 * Convierte cada factura (de compra o de venta) en su asiento: débitos y
 * créditos a las cuentas del plan de cuentas del contador, con el tercero,
 * la base y el documento soporte. El asiento SIEMPRE cuadra — si por
 * redondeo quedara una diferencia de centavos, se lleva a la cuenta principal
 * del asiento (gasto o ingreso) y se avisa.
 *
 * ── Por qué es aritmética y no IA ───────────────────────────────────────
 * Igual que el auditor: un modelo de lenguaje se equivoca en números y un
 * asiento descuadrado no sirve. Todo aquí es determinista y verificable a
 * mano. Las cuentas sugeridas por palabras clave son eso, sugerencias: el
 * contador las confirma y quedan guardadas por tercero.
 *
 * ── Qué es compra y qué es venta ────────────────────────────────────────
 * Depende de la empresa que se está causando (su NIT):
 *   - Receptor = empresa            → compra (tercero = emisor)
 *   - Emisor = empresa              → venta  (tercero = receptor)
 *   - Documento soporte emitido por la empresa → compra a un no obligado a
 *     facturar (tercero = receptor, que en ese documento es el vendedor)
 * La nota crédito reversa: se invierten débitos y créditos.
 * Nómina, eventos y documentos sin identificar no se causan aquí.
 *
 * ── Los montos ──────────────────────────────────────────────────────────
 *   valorDocumento = total (PayableAmount) + anticipos ya aplicados
 *   Compra:  Db gasto/inventario = valorDocumento − IVA descontable
 *            Db IVA descontable
 *            Cr retenciones practicadas (fuente, IVA, ICA)
 *            Cr anticipos a proveedores (si el documento trae anticipo)
 *            Cr proveedores = total − retenciones
 *   Venta:   Db clientes = total − retenciones que nos practicaron
 *            Db anticipos de impuestos (retenciones que nos practicaron)
 *            Db anticipos de clientes (si trae anticipo)
 *            Cr IVA generado, INC/bolsas/otros por pagar
 *            Cr ingresos = valorDocumento − impuestos
 * En compras el INC, la bolsa y el ICA facturados son mayor valor del gasto
 * (no son descontables), por eso no tienen cuenta propia en ese lado.
 */

export type RolDocumento = 'compra' | 'venta';

export interface DocCausable {
  id: string;
  doc_type: string;
  cufe: string | null;
  full_number: string | null;
  issue_date: string | null;
  issuer_nit: string | null;
  issuer_dv?: string | null;
  issuer_name: string | null;
  receiver_nit: string | null;
  receiver_dv?: string | null;
  receiver_name: string | null;
  line_total: number;
  taxable_base?: number;
  discounts: number;
  charges?: number;
  prepaid?: number;
  total: number;
  tax_inclusive?: number;
  total_iva: number;
  total_inc: number;
  total_ica: number;
  total_bolsas: number;
  total_otros: number;
  total_rete_renta: number;
  total_rete_iva: number;
  total_rete_ica: number;
  status?: string;
}

export interface LineaCausable {
  document_id: string;
  description: string | null;
}

/** Las cuentas configurables de una empresa. */
export interface CuentasEmpresa {
  gasto_defecto: string;
  proveedores: string;
  iva_descontable: string;
  retefuente_compras: string;
  retefuente_servicios: string;
  retefuente_honorarios: string;
  retefuente_arrendamientos: string;
  reteiva_por_pagar: string;
  reteica_por_pagar: string;
  anticipo_proveedores: string;
  clientes: string;
  ingresos: string;
  iva_generado: string;
  otros_impuestos_por_pagar: string;
  anticipo_retefuente: string;
  anticipo_reteiva: string;
  anticipo_reteica: string;
  anticipo_clientes: string;
}

/** Valores de arranque. Son subcuentas habituales del PUC colombiano
 *  (Decreto 2650 de 1993); cada contador las ajusta a su plan de cuentas la
 *  primera vez y quedan guardadas por empresa. */
export const CUENTAS_POR_DEFECTO: CuentasEmpresa = {
  gasto_defecto: '519595',
  proveedores: '220505',
  iva_descontable: '240810',
  retefuente_compras: '236540',
  retefuente_servicios: '236525',
  retefuente_honorarios: '236515',
  retefuente_arrendamientos: '236530',
  reteiva_por_pagar: '236705',
  reteica_por_pagar: '236805',
  anticipo_proveedores: '133005',
  clientes: '130505',
  ingresos: '413595',
  iva_generado: '240805',
  otros_impuestos_por_pagar: '249595',
  anticipo_retefuente: '135515',
  anticipo_reteiva: '135517',
  anticipo_reteica: '135518',
  anticipo_clientes: '280505',
};

export const ETIQUETA_CUENTA: Record<keyof CuentasEmpresa, string> = {
  gasto_defecto: 'Gasto o costo por defecto (compras)',
  proveedores: 'Proveedores nacionales',
  iva_descontable: 'IVA descontable',
  retefuente_compras: 'Retención en la fuente por pagar — compras',
  retefuente_servicios: 'Retención en la fuente por pagar — servicios',
  retefuente_honorarios: 'Retención en la fuente por pagar — honorarios',
  retefuente_arrendamientos: 'Retención en la fuente por pagar — arrendamientos',
  reteiva_por_pagar: 'Retención de IVA por pagar',
  reteica_por_pagar: 'Retención de ICA por pagar',
  anticipo_proveedores: 'Anticipos a proveedores',
  clientes: 'Clientes nacionales',
  ingresos: 'Ingresos operacionales',
  iva_generado: 'IVA generado',
  otros_impuestos_por_pagar: 'INC, bolsas y otros impuestos por pagar',
  anticipo_retefuente: 'Anticipo de impuestos — retención en la fuente',
  anticipo_reteiva: 'Anticipo de impuestos — retención de IVA',
  anticipo_reteica: 'Anticipo de impuestos — retención de ICA',
  anticipo_clientes: 'Anticipos y avances recibidos de clientes',
};

export type ConceptoRetencion = 'ninguno' | 'compras' | 'servicios' | 'honorarios' | 'arrendamientos';

/** Tarifa sugerida al elegir el concepto. Son las tarifas generales para
 *  declarantes (art. 401 y ss. E.T. y Decreto 1625 de 2016); casos
 *  especiales (no declarantes, transporte, emolumentos…) se ajustan a mano.
 *  La base mínima en UVT NO se aplica sola: depende del UVT del año y de si
 *  el pago se acumula en el mes, y es una decisión del contador. */
export const TARIFA_SUGERIDA: Record<ConceptoRetencion, number> = {
  ninguno: 0,
  compras: 2.5,
  servicios: 4,
  honorarios: 11,
  arrendamientos: 3.5,
};

export interface ReglaTercero {
  tercero_nit: string;
  tercero_nombre?: string | null;
  cuenta?: string | null;
  centro_costo?: string | null;
  concepto_retencion?: ConceptoRetencion | null;
  retefuente_pct?: number | null;
  reteiva_pct?: number | null;
  reteica_xmil?: number | null;
  iva_al_gasto?: boolean;
}

export interface Movimiento {
  documentoId: string;
  comprobante: number;
  fecha: string;
  cuenta: string;
  nombreCuenta: string;
  terceroNit: string;
  terceroDv: string;
  terceroNombre: string;
  documento: string;
  detalle: string;
  debito: number;
  credito: number;
  base: number;
  centroCosto: string;
  cufe: string;
}

export interface Aviso {
  documentoId: string | null;
  documento: string;
  nivel: 'info' | 'revisar';
  mensaje: string;
}

export interface ResultadoCausacion {
  movimientos: Movimiento[];
  avisos: Aviso[];
  causados: number;
  omitidos: number;
  totalDebito: number;
  totalCredito: number;
}

const n = (v: unknown): number => {
  const x = Number(v ?? 0);
  return Number.isFinite(x) ? x : 0;
};
const r2 = (v: number): number => Math.round(v * 100) / 100;

/** NIT sin puntos, guiones ni dígito de verificación. */
export function normalizarNit(v: string | null | undefined): string {
  const limpio = String(v ?? '').replace(/[^0-9]/g, '');
  return limpio;
}

export function rolDelDocumento(d: DocCausable, empresaNit: string): { rol: RolDocumento; terceroNit: string; terceroNombre: string; terceroDv: string } | null {
  const emisor = normalizarNit(d.issuer_nit);
  const receptor = normalizarNit(d.receiver_nit);
  if (d.doc_type === 'documento_soporte' && emisor === empresaNit) {
    return { rol: 'compra', terceroNit: receptor, terceroNombre: d.receiver_name ?? '', terceroDv: d.receiver_dv ?? '' };
  }
  if (receptor === empresaNit) {
    return { rol: 'compra', terceroNit: emisor, terceroNombre: d.issuer_name ?? '', terceroDv: d.issuer_dv ?? '' };
  }
  if (emisor === empresaNit) {
    return { rol: 'venta', terceroNit: receptor, terceroNombre: d.receiver_name ?? '', terceroDv: d.receiver_dv ?? '' };
  }
  return null;
}

const CAUSABLES = new Set(['factura', 'nota_credito', 'nota_debito', 'documento_equivalente', 'documento_soporte']);

/** Las empresas que aparecen en los documentos, para que el contador elija
 *  cuál está causando sin tener que escribir el NIT. Se cuenta cuántas veces
 *  aparece cada NIT como receptor o emisor; la empresa del contador es la que
 *  más se repite, los proveedores aparecen pocas veces cada uno. */
export function empresasDetectadas(docs: DocCausable[]): Array<{ nit: string; nombre: string; documentos: number }> {
  const m = new Map<string, { nombre: string; documentos: number }>();
  const sumar = (nit: string, nombre: string | null) => {
    if (!nit) return;
    const e = m.get(nit) ?? { nombre: nombre ?? '', documentos: 0 };
    e.documentos++;
    if (!e.nombre && nombre) e.nombre = nombre;
    m.set(nit, e);
  };
  for (const d of docs) {
    if (!CAUSABLES.has(d.doc_type)) continue;
    sumar(normalizarNit(d.receiver_nit), d.receiver_name);
    sumar(normalizarNit(d.issuer_nit), d.issuer_name);
  }
  return [...m.entries()]
    .map(([nit, e]) => ({ nit, nombre: e.nombre, documentos: e.documentos }))
    .sort((a, b) => b.documentos - a.documentos);
}

/** Cuentas de gasto sugeridas por palabras en la descripción de los
 *  productos o en el nombre del proveedor. Sólo para COMPRAS. */
const SUGERENCIAS: Array<{ re: RegExp; cuenta: string; nombre: string; concepto: ConceptoRetencion }> = [
  { re: /arriend|arrendamiento|canon/i, cuenta: '512010', nombre: 'Arrendamientos — construcciones y edificaciones', concepto: 'arrendamientos' },
  { re: /honorari|asesor[ií]a|consultor[ií]a|revisor[ií]a fiscal|contabilidad|abogad/i, cuenta: '511095', nombre: 'Honorarios — otros', concepto: 'honorarios' },
  { re: /energ[ií]a|\benel\b|codensa|electrific/i, cuenta: '513530', nombre: 'Servicios — energía eléctrica', concepto: 'ninguno' },
  { re: /acueducto|alcantarillado|aseo urbano/i, cuenta: '513525', nombre: 'Servicios — acueducto y alcantarillado', concepto: 'ninguno' },
  { re: /\bgas natural\b|vanti|gases de occidente/i, cuenta: '513555', nombre: 'Servicios — gas', concepto: 'ninguno' },
  { re: /internet|telefon|telecomunicac|celular|plan de datos|\bclaro\b|movistar|\btigo\b|\betb\b|comcel/i, cuenta: '513535', nombre: 'Servicios — teléfono e internet', concepto: 'servicios' },
  { re: /transporte|flete|env[ií]o|mensajer|servientrega|coordinadora|interrapidisimo|domicilio/i, cuenta: '513550', nombre: 'Servicios — transporte, fletes y acarreos', concepto: 'servicios' },
  { re: /vigilancia|seguridad privada|\baseo\b|limpieza/i, cuenta: '513505', nombre: 'Servicios — aseo y vigilancia', concepto: 'servicios' },
  { re: /papeler[ií]a|resma|t[óo]ner|cartucho|[úu]tiles/i, cuenta: '519530', nombre: 'Útiles, papelería y fotocopias', concepto: 'compras' },
  { re: /combustible|gasolina|acpm|di[ée]sel|terpel|primax|biomax/i, cuenta: '519535', nombre: 'Combustibles y lubricantes', concepto: 'compras' },
  { re: /cafeter[ií]a|caf[ée]\b|elementos de aseo/i, cuenta: '519525', nombre: 'Elementos de aseo y cafetería', concepto: 'compras' },
  { re: /restaurante|almuerzo|alimentaci[óo]n/i, cuenta: '519520', nombre: 'Gastos de representación y relaciones públicas', concepto: 'compras' },
  { re: /p[óo]liza|seguro\b|seguros\b|aseguradora/i, cuenta: '513095', nombre: 'Seguros — otros', concepto: 'ninguno' },
  { re: /publicidad|pauta|marketing|propaganda/i, cuenta: '523560', nombre: 'Publicidad, propaganda y promoción', concepto: 'servicios' },
  { re: /software|licencia|hosting|dominio|suscripci[óo]n|nube|\bsaas\b/i, cuenta: '513595', nombre: 'Servicios — otros', concepto: 'servicios' },
  { re: /mantenimiento|reparaci[óo]n/i, cuenta: '514595', nombre: 'Mantenimiento y reparaciones — otros', concepto: 'servicios' },
];

export interface Sugerencia { cuenta: string; nombre: string; concepto: ConceptoRetencion; motivo: string }

export function sugerirCuenta(textos: string[]): Sugerencia | null {
  const unido = textos.filter(Boolean).join(' · ');
  for (const s of SUGERENCIAS) {
    const m = unido.match(s.re);
    if (m) return { cuenta: s.cuenta, nombre: s.nombre, concepto: s.concepto, motivo: `dice «${m[0]}»` };
  }
  return null;
}

/** Los terceros de esta empresa en el periodo, con lo que hace falta para
 *  configurarlos: rol, cuántos documentos, valor y cuenta sugerida. */
export interface TerceroResumen {
  nit: string;
  nombre: string;
  rol: RolDocumento;
  documentos: number;
  valor: number;
  sugerencia: Sugerencia | null;
  traeRetencionesEnXml: boolean;
}

export function tercerosDelPeriodo(docs: DocCausable[], lineas: LineaCausable[], empresaNit: string): TerceroResumen[] {
  const desc = new Map<string, string[]>();
  for (const l of lineas) {
    if (!l.description) continue;
    const a = desc.get(l.document_id) ?? [];
    if (a.length < 6) a.push(l.description);
    desc.set(l.document_id, a);
  }
  const m = new Map<string, TerceroResumen & { textos: string[] }>();
  for (const d of docs) {
    if (!CAUSABLES.has(d.doc_type)) continue;
    const rol = rolDelDocumento(d, empresaNit);
    if (!rol || !rol.terceroNit) continue;
    const k = `${rol.rol}|${rol.terceroNit}`;
    const t = m.get(k) ?? {
      nit: rol.terceroNit, nombre: rol.terceroNombre, rol: rol.rol, documentos: 0, valor: 0,
      sugerencia: null, traeRetencionesEnXml: false, textos: [rol.terceroNombre],
    };
    t.documentos++;
    t.valor += (d.doc_type === 'nota_credito' ? -1 : 1) * n(d.total);
    if (n(d.total_rete_renta) + n(d.total_rete_iva) + n(d.total_rete_ica) > 0) t.traeRetencionesEnXml = true;
    if (t.textos.length < 12) t.textos.push(...(desc.get(d.id) ?? []));
    m.set(k, t);
  }
  return [...m.values()]
    .map(({ textos, ...t }) => ({ ...t, sugerencia: t.rol === 'compra' ? sugerirCuenta(textos) : null }))
    .sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor));
}

function cuentaRetefuente(c: CuentasEmpresa, concepto: ConceptoRetencion | null | undefined): string {
  switch (concepto) {
    case 'servicios': return c.retefuente_servicios;
    case 'honorarios': return c.retefuente_honorarios;
    case 'arrendamientos': return c.retefuente_arrendamientos;
    default: return c.retefuente_compras;
  }
}

/**
 * El corazón: documentos → movimientos contables.
 *
 * `nombresCuenta` permite mostrar el nombre de las cuentas del plan del
 * contador cuando lo tenemos (por ahora, el de la configuración); si no, va
 * vacío y el programa contable lo completa al importar.
 */
export function causar(
  docs: DocCausable[],
  empresaNit: string,
  cuentas: CuentasEmpresa,
  reglas: Map<string, ReglaTercero>,
  opciones: { sugerencias?: Map<string, Sugerencia | null> } = {},
): ResultadoCausacion {
  const movimientos: Movimiento[] = [];
  const avisos: Aviso[] = [];
  let causados = 0;
  let omitidos = 0;
  let comprobante = 0;

  const nombreDe = (cuenta: string): string => {
    const k = (Object.keys(cuentas) as Array<keyof CuentasEmpresa>).find((x) => cuentas[x] === cuenta);
    return k ? ETIQUETA_CUENTA[k] : '';
  };

  const ordenados = [...docs].sort((a, b) =>
    String(a.issue_date ?? '').localeCompare(String(b.issue_date ?? '')) || String(a.full_number ?? '').localeCompare(String(b.full_number ?? '')),
  );

  for (const d of ordenados) {
    const numero = d.full_number ?? d.cufe?.slice(0, 12) ?? d.id.slice(0, 8);
    if (!CAUSABLES.has(d.doc_type)) {
      omitidos++;
      continue;
    }
    if (d.status === 'DUPLICATE' || d.status === 'INVALID' || d.status === 'ERROR') {
      omitidos++;
      avisos.push({ documentoId: d.id, documento: numero, nivel: 'info', mensaje: 'No se causó: está marcado como duplicado, inválido o con error.' });
      continue;
    }
    const rol = rolDelDocumento(d, empresaNit);
    if (!rol) {
      omitidos++;
      continue; // es de otra empresa del contador
    }

    const signo = d.doc_type === 'nota_credito' ? -1 : 1;
    const regla = reglas.get(rol.terceroNit);
    const total = n(d.total) > 0 ? n(d.total) : n(d.tax_inclusive);
    const anticipo = n(d.prepaid);
    const valorDocumento = total + anticipo;
    const iva = n(d.total_iva);
    const otrosImp = n(d.total_inc) + n(d.total_bolsas) + n(d.total_ica) + n(d.total_otros);
    const baseSinImpuestos = Math.max(0, n(d.line_total) - n(d.discounts) + n(d.charges));

    if (total <= 0) {
      omitidos++;
      avisos.push({ documentoId: d.id, documento: numero, nivel: 'revisar', mensaje: 'Valor total en cero: revisa el XML antes de causarlo.' });
      continue;
    }

    comprobante++;
    const fecha = d.issue_date ?? '';
    const tipoTxt = d.doc_type === 'nota_credito' ? 'NC' : d.doc_type === 'nota_debito' ? 'ND' : d.doc_type === 'documento_soporte' ? 'DS' : 'FV';
    const detalle = `${rol.rol === 'compra' ? 'Compra' : 'Venta'} ${tipoTxt} ${numero} — ${rol.terceroNombre}`.slice(0, 120);
    const filas: Movimiento[] = [];
    const mov = (cuenta: string, debito: number, credito: number, base = 0, cc = '') => {
      // La nota crédito reversa: lo que era débito pasa a crédito.
      const [db, cr] = signo < 0 ? [credito, debito] : [debito, credito];
      if (r2(db) === 0 && r2(cr) === 0) return;
      filas.push({
        documentoId: d.id, comprobante, fecha, cuenta, nombreCuenta: nombreDe(cuenta),
        terceroNit: rol.terceroNit, terceroDv: rol.terceroDv, terceroNombre: rol.terceroNombre,
        documento: numero, detalle, debito: r2(db), credito: r2(cr), base: r2(base), centroCosto: cc,
        cufe: d.cufe ?? '',
      });
    };

    if (rol.rol === 'compra') {
      // Retenciones: las del XML mandan; si el XML no las trae, las de la regla.
      const xmlFuente = n(d.total_rete_renta);
      const xmlIva = n(d.total_rete_iva);
      const xmlIca = n(d.total_rete_ica);
      const reteFuente = xmlFuente > 0 ? xmlFuente : r2(baseSinImpuestos * n(regla?.retefuente_pct) / 100);
      const reteIva = xmlIva > 0 ? xmlIva : r2(iva * n(regla?.reteiva_pct) / 100);
      const reteIca = xmlIca > 0 ? xmlIca : r2(baseSinImpuestos * n(regla?.reteica_xmil) / 1000);
      const retenciones = reteFuente + reteIva + reteIca;

      const ivaAlGasto = Boolean(regla?.iva_al_gasto);
      const ivaDescontable = ivaAlGasto ? 0 : iva;
      const cuentaGasto = regla?.cuenta || opciones.sugerencias?.get(rol.terceroNit)?.cuenta || cuentas.gasto_defecto;
      if (!regla?.cuenta) {
        avisos.push({
          documentoId: d.id, documento: numero, nivel: 'revisar',
          mensaje: `Proveedor ${rol.terceroNombre} sin cuenta confirmada: se usó ${cuentaGasto}${opciones.sugerencias?.get(rol.terceroNit) ? ' (sugerida)' : ' (por defecto)'}.`,
        });
      }

      const gasto = valorDocumento - ivaDescontable;
      mov(cuentaGasto, gasto, 0, baseSinImpuestos, regla?.centro_costo ?? '');
      if (ivaDescontable > 0) mov(cuentas.iva_descontable, ivaDescontable, 0, n(d.taxable_base) || baseSinImpuestos);
      if (reteFuente > 0) mov(cuentaRetefuente(cuentas, regla?.concepto_retencion), 0, reteFuente, baseSinImpuestos);
      if (reteIva > 0) mov(cuentas.reteiva_por_pagar, 0, reteIva, iva);
      if (reteIca > 0) mov(cuentas.reteica_por_pagar, 0, reteIca, baseSinImpuestos);
      if (anticipo > 0) mov(cuentas.anticipo_proveedores, 0, anticipo);
      mov(cuentas.proveedores, 0, total - retenciones);
    } else {
      const reteFuente = n(d.total_rete_renta) > 0 ? n(d.total_rete_renta) : r2(baseSinImpuestos * n(regla?.retefuente_pct) / 100);
      const reteIva = n(d.total_rete_iva) > 0 ? n(d.total_rete_iva) : r2(iva * n(regla?.reteiva_pct) / 100);
      const reteIca = n(d.total_rete_ica) > 0 ? n(d.total_rete_ica) : r2(baseSinImpuestos * n(regla?.reteica_xmil) / 1000);
      const retenciones = reteFuente + reteIva + reteIca;
      const cuentaIngreso = regla?.cuenta || cuentas.ingresos;

      mov(cuentas.clientes, total - retenciones, 0);
      if (reteFuente > 0) mov(cuentas.anticipo_retefuente, reteFuente, 0, baseSinImpuestos);
      if (reteIva > 0) mov(cuentas.anticipo_reteiva, reteIva, 0, iva);
      if (reteIca > 0) mov(cuentas.anticipo_reteica, reteIca, 0, baseSinImpuestos);
      if (anticipo > 0) mov(cuentas.anticipo_clientes, anticipo, 0);
      if (iva > 0) mov(cuentas.iva_generado, 0, iva, n(d.taxable_base) || baseSinImpuestos);
      if (otrosImp > 0) mov(cuentas.otros_impuestos_por_pagar, 0, otrosImp);
      mov(cuentaIngreso, 0, valorDocumento - iva - otrosImp, baseSinImpuestos, regla?.centro_costo ?? '');
    }

    // Cuadre: si por redondeo hay centavos de diferencia, van a la primera
    // fila de gasto/ingreso. Más de un peso es un dato raro en el XML.
    const sumaDb = r2(filas.reduce((a, f) => a + f.debito, 0));
    const sumaCr = r2(filas.reduce((a, f) => a + f.credito, 0));
    const dif = r2(sumaDb - sumaCr);
    if (dif !== 0 && filas.length > 0) {
      const principal = rol.rol === 'compra' ? filas[0] : filas[filas.length - 1];
      if (principal.debito > 0) principal.debito = r2(principal.debito - dif);
      else principal.credito = r2(principal.credito + dif);
      if (Math.abs(dif) > 1) {
        avisos.push({ documentoId: d.id, documento: numero, nivel: 'revisar', mensaje: `El asiento no cuadraba por $${dif.toLocaleString('es-CO')}; se ajustó en la cuenta principal. Revisa el XML.` });
      }
    }

    movimientos.push(...filas);
    causados++;
  }

  return {
    movimientos,
    avisos,
    causados,
    omitidos,
    totalDebito: r2(movimientos.reduce((a, m) => a + m.debito, 0)),
    totalCredito: r2(movimientos.reduce((a, m) => a + m.credito, 0)),
  };
}
