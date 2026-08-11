/**
 * Auditor: cruza lo que está en la DIAN contra lo que el contador registró
 * en su contabilidad.
 *
 * ── Por qué esto NO lo hace un modelo de lenguaje ───────────────────────
 * Es emparejamiento exacto y aritmética. Un modelo se equivoca en números,
 * y un contador que presenta a la DIAN con una cifra inventada tiene un
 * problema serio. El cruce se hace aquí, es determinista y auditable: dado
 * el mismo par de archivos, siempre da el mismo resultado y se puede
 * comprobar a mano.
 *
 * La IA tiene su sitio DESPUÉS: redactar el hallazgo, priorizarlo y sugerir
 * la causa probable. Nunca calcularlo.
 *
 * ── Cómo empareja ───────────────────────────────────────────────────────
 * En tres pasadas, de más fiable a menos, y cada documento se empareja una
 * sola vez:
 *
 *   1. CUFE            — identificador único, no admite discusión
 *   2. NIT + número    — cuando la contabilidad no guarda el CUFE, que es
 *                        lo normal en la mayoría de los programas
 *   3. NIT + valor     — último recurso, con tolerancia, para cazar el
 *                        caso de un número tecleado distinto
 *
 * El orden importa: si se empezara por el valor, dos facturas del mismo
 * proveedor por el mismo monto se cruzarían al azar.
 */

export interface RegistroContable {
  /** Fila original, para poder mostrarla tal cual la subió. */
  fila: number;
  cufe: string;
  nit: string;
  numero: string;
  valor: number;
  fecha: string;
}

export interface DocumentoDian {
  id: string;
  cufe: string;
  issuer_nit: string;
  issuer_name: string;
  full_number: string;
  issue_date: string;
  total: number;
  doc_type: string;
}

export type MotivoCruce = 'cufe' | 'numero' | 'valor';

export interface Emparejado {
  dian: DocumentoDian;
  contable: RegistroContable;
  motivo: MotivoCruce;
  /** Diferencia de valor, en pesos. 0 cuando cuadra. */
  diferencia: number;
}

export interface ResultadoAuditoria {
  /** Cruzaron y el valor coincide. */
  conciliados: Emparejado[];
  /** Cruzaron pero el valor NO coincide. Es el hallazgo más delicado:
   *  el documento está registrado, pero por otra cifra. */
  conDiferencia: Emparejado[];
  /** Está en la DIAN y no aparece en la contabilidad. Costo fiscal
   *  directo: IVA que no se descontó. */
  faltanEnContabilidad: DocumentoDian[];
  /** Está en la contabilidad y no en la DIAN. O falta importarlo, o se
   *  registró algo que la DIAN no respalda. */
  sobranEnContabilidad: RegistroContable[];
  resumen: {
    totalDian: number;
    totalContable: number;
    valorDian: number;
    valorContable: number;
    valorFaltante: number;
    valorSobrante: number;
  };
}

/** Tolerancia al comparar importes, en pesos.
 *
 *  Los programas contables redondean distinto y una diferencia de un peso
 *  no es un hallazgo: es ruido. Marcarla llenaría el informe de falsos
 *  positivos y el contador dejaría de mirarlo, que es el único fallo
 *  imperdonable en una herramienta de excepciones. */
export const TOLERANCIA_VALOR = 100;

const soloDigitos = (s: string): string => (s ?? '').replace(/\D/g, '');

/** Normaliza un número de documento para comparar.
 *
 *  Un mismo documento aparece como "FE-1234", "FE 1234", "fe1234" o
 *  incluso "1234" según quién lo tecleó. Se comparan las letras en
 *  minúscula sin separadores, y también solo los dígitos, porque muchos
 *  programas guardan el consecutivo sin el prefijo. */
function clavesNumero(numero: string): string[] {
  const limpio = (numero ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const digitos = soloDigitos(numero).replace(/^0+/, '');
  const claves = [limpio];
  if (digitos && digitos !== limpio) claves.push(digitos);
  return claves.filter(Boolean);
}

/** Convierte a número aceptando los formatos que salen de un Excel
 *  colombiano.
 *
 *  El punto y la coma cambian de papel según cómo esté configurado el
 *  equipo de quien exportó el archivo, y en un mismo lote conviven los dos
 *  estilos. Equivocarse aquí multiplica o divide por mil los importes y
 *  deja la conciliación entera sin valor, así que la regla es explícita:
 *
 *    1.234.567,89  → dos separadores: el de más a la derecha es el decimal
 *    81,360.00     → idem, al revés
 *    81.360        → punto solo con TRES cifras detrás: es de miles
 *    81.36         → punto solo con una o dos cifras: es decimal
 *    12,5          → coma sola con una o dos cifras: es decimal
 *    1.234.567     → varios puntos: todos de miles
 *
 *  La regla de las tres cifras es la que salva el caso colombiano típico:
 *  "$ 81.360" son ochenta y un mil trescientos sesenta, no ochenta y uno
 *  con treinta y seis. Un importe en pesos con tres decimales no existe. */
export function aNumero(v: string | number | null | undefined): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (!v) return 0;

  const negativo = /^\s*[-(]/.test(String(v));
  let s = String(v).trim().replace(/[^\d,.]/g, '');
  if (!s) return 0;

  const puntos = (s.match(/\./g) ?? []).length;
  const comas = (s.match(/,/g) ?? []).length;
  const ultimaComa = s.lastIndexOf(',');
  const ultimoPunto = s.lastIndexOf('.');

  if (puntos > 0 && comas > 0) {
    // El separador decimal es el que aparece más a la derecha.
    if (ultimaComa > ultimoPunto) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (comas > 1) {
    s = s.replace(/,/g, '');
  } else if (comas === 1) {
    s = s.length - ultimaComa - 1 <= 2 ? s.replace(',', '.') : s.replace(/,/g, '');
  } else if (puntos > 1) {
    s = s.replace(/\./g, '');
  } else if (puntos === 1) {
    // Tres cifras detrás: separador de miles, no decimal.
    s = s.length - ultimoPunto - 1 === 3 ? s.replace('.', '') : s;
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  return negativo ? -n : n;
}

export function auditar(
  documentos: DocumentoDian[],
  contables: RegistroContable[],
): ResultadoAuditoria {
  const usadosDian = new Set<string>();
  const usadosContables = new Set<number>();
  const emparejados: Emparejado[] = [];

  const emparejar = (d: DocumentoDian, c: RegistroContable, motivo: MotivoCruce) => {
    usadosDian.add(d.id);
    usadosContables.add(c.fila);
    emparejados.push({
      dian: d,
      contable: c,
      motivo,
      diferencia: Math.round((Number(d.total) - c.valor) * 100) / 100,
    });
  };

  // ── Pasada 1: CUFE ──────────────────────────────────────────────────
  const porCufe = new Map<string, RegistroContable>();
  for (const c of contables) {
    if (c.cufe) porCufe.set(c.cufe.toLowerCase(), c);
  }
  for (const d of documentos) {
    if (!d.cufe) continue;
    const c = porCufe.get(d.cufe.toLowerCase());
    if (c && !usadosContables.has(c.fila)) emparejar(d, c, 'cufe');
  }

  // ── Pasada 2: NIT + número ──────────────────────────────────────────
  const porNumero = new Map<string, RegistroContable[]>();
  for (const c of contables) {
    if (usadosContables.has(c.fila)) continue;
    const nit = soloDigitos(c.nit);
    for (const k of clavesNumero(c.numero)) {
      const clave = `${nit}|${k}`;
      if (!porNumero.has(clave)) porNumero.set(clave, []);
      porNumero.get(clave)!.push(c);
    }
  }
  for (const d of documentos) {
    if (usadosDian.has(d.id)) continue;
    const nit = soloDigitos(d.issuer_nit);
    for (const k of clavesNumero(d.full_number)) {
      const cand = (porNumero.get(`${nit}|${k}`) ?? []).find((c) => !usadosContables.has(c.fila));
      if (cand) { emparejar(d, cand, 'numero'); break; }
    }
  }

  // ── Pasada 3: NIT + valor ───────────────────────────────────────────
  // Última red. Va al final a propósito: si se hiciera primero, dos
  // facturas del mismo proveedor por el mismo monto se cruzarían al azar.
  for (const d of documentos) {
    if (usadosDian.has(d.id)) continue;
    const nit = soloDigitos(d.issuer_nit);
    const cand = contables.find(
      (c) => !usadosContables.has(c.fila)
        && soloDigitos(c.nit) === nit
        && Math.abs(c.valor - Number(d.total)) <= TOLERANCIA_VALOR,
    );
    if (cand) emparejar(d, cand, 'valor');
  }

  const conciliados = emparejados.filter((e) => Math.abs(e.diferencia) <= TOLERANCIA_VALOR);
  const conDiferencia = emparejados.filter((e) => Math.abs(e.diferencia) > TOLERANCIA_VALOR);
  const faltanEnContabilidad = documentos.filter((d) => !usadosDian.has(d.id));
  const sobranEnContabilidad = contables.filter((c) => !usadosContables.has(c.fila));

  const suma = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) * 100) / 100;

  return {
    conciliados,
    conDiferencia,
    faltanEnContabilidad,
    sobranEnContabilidad,
    resumen: {
      totalDian: documentos.length,
      totalContable: contables.length,
      valorDian: suma(documentos.map((d) => Number(d.total))),
      valorContable: suma(contables.map((c) => c.valor)),
      valorFaltante: suma(faltanEnContabilidad.map((d) => Number(d.total))),
      valorSobrante: suma(sobranEnContabilidad.map((c) => c.valor)),
    },
  };
}

/** Campos que el contador tiene que señalar en su archivo. El CUFE es
 *  opcional porque la mayoría de programas contables no lo guardan; sin él
 *  el cruce sigue funcionando por número y por valor. */
export const CAMPOS_CONTABLES = [
  { id: 'numero', etiqueta: 'Número del documento', requerido: true,
    alias: ['numero', 'nrodocumento', 'numerodocumento', 'documento', 'factura', 'nrofactura', 'nrodoc', 'consecutivo', 'referencia'] },
  { id: 'nit', etiqueta: 'NIT del tercero', requerido: true,
    alias: ['nit', 'nittercero', 'identificacion', 'tercero', 'codtercero', 'documentotercero', 'cedulanit'] },
  { id: 'valor', etiqueta: 'Valor total', requerido: true,
    alias: ['total', 'valortotal', 'valor', 'vlrtotal', 'totalfactura', 'debito', 'importe', 'neto'] },
  { id: 'fecha', etiqueta: 'Fecha', requerido: false,
    alias: ['fecha', 'fechaemision', 'fechadocumento', 'fecdoc'] },
  { id: 'cufe', etiqueta: 'CUFE (si tu programa lo guarda)', requerido: false,
    alias: ['cufe', 'cude', 'cufecude'] },
] as const;
