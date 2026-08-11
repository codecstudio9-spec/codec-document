/**
 * Lectura y relleno de archivos .xlsx que aporta el usuario.
 *
 * ── Por qué esto existe ─────────────────────────────────────────────────
 * Cada programa contable (Siigo, Alegra, World Office, Helisa y los que no
 * conocemos) espera su propia plantilla: nombres de columna exactos, en
 * orden exacto, a veces con hojas de configuración y validaciones dentro.
 * Adivinar esos formatos y equivocarse es peor que no ofrecer la función:
 * el contador lo intenta, su programa lo rechaza, y deja de confiar en
 * toda la herramienta.
 *
 * La solución es que suba SU plantilla vacía y le devolvamos ESE MISMO
 * archivo con los datos dentro. Así funciona con cualquier programa,
 * incluidos los que nunca hemos visto.
 *
 * ── Por qué no se reconstruye el archivo ────────────────────────────────
 * Generar un libro nuevo con sus encabezados sería mucho más fácil, pero
 * perdería lo que su programa necesita: macros, formatos de celda, listas
 * de validación, hojas auxiliares con catálogos. Por eso aquí se abre el
 * ZIP original, se toca únicamente el <sheetData> de la hoja elegida, y
 * todo lo demás vuelve a salir byte por byte igual que entró.
 *
 * Las celdas nuevas se escriben como cadenas en línea (inlineStr), lo que
 * evita tener que tocar xl/sharedStrings.xml — modificar esa tabla
 * obligaría a reindexar las referencias de todo el libro, que es
 * exactamente donde se rompen estas cosas.
 */

import PizZip from 'pizzip';
import type { ValorCelda } from './xlsx';

export interface HojaDetectada {
  nombre: string;
  /** Ruta interna dentro del ZIP: 'xl/worksheets/sheet1.xml'. */
  ruta: string;
  /** Encabezados de la primera fila con contenido. */
  encabezados: string[];
  /** Número de fila (1-based) donde están esos encabezados. */
  filaEncabezados: number;
  /** Filas con datos que ya trae la plantilla, sin contar el encabezado. */
  filasConDatos: number;
}

export class XlsxRellenoError extends Error {
  constructor(message: string, readonly code: 'NO_ES_XLSX' | 'SIN_HOJAS' | 'SIN_ENCABEZADOS' | 'HOJA_NO_ENCONTRADA') {
    super(message);
    this.name = 'XlsxRellenoError';
  }
}

const desescapar = (s: string): string =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_m, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&');

const escapar = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // Un carácter de control hace que Excel rechace el archivo entero, y
    // vienen en descripciones de producto de más de un emisor.
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

/** Índice de columna a letras: 0 → A, 25 → Z, 26 → AA. */
export function columnaALetra(n: number): string {
  let s = '';
  let i = n;
  do {
    s = String.fromCharCode(65 + (i % 26)) + s;
    i = Math.floor(i / 26) - 1;
  } while (i >= 0);
  return s;
}

/** Letras de columna a índice: A → 0, AA → 26. */
function letraAColumna(ref: string): number {
  const letras = ref.match(/^[A-Z]+/)?.[0] ?? 'A';
  let n = 0;
  for (const c of letras) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

/** Tabla de cadenas compartidas. Los encabezados de una plantilla real casi
 *  siempre viven aquí, no en línea, así que sin resolverla se leerían como
 *  números sueltos. */
function leerSharedStrings(zip: PizZip): string[] {
  const archivo = zip.file('xl/sharedStrings.xml');
  if (!archivo) return [];
  const xml = archivo.asText();
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    // Una <si> puede venir partida en varios <t> por formato enriquecido;
    // se concatenan todos.
    [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => desescapar(t[1])).join(''),
  );
}

interface CeldaLeida { col: number; valor: string }

function leerFila(filaXml: string, compartidas: string[]): CeldaLeida[] {
  const celdas: CeldaLeida[] = [];
  for (const m of filaXml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>|<c\b([^>]*)\/>/g)) {
    const attrs = m[1] ?? m[3] ?? '';
    const cuerpo = m[2] ?? '';
    const ref = attrs.match(/r="([A-Z]+\d+)"/)?.[1];
    if (!ref) continue;
    const tipo = attrs.match(/t="([^"]+)"/)?.[1];

    let valor = '';
    if (tipo === 's') {
      const idx = Number(cuerpo.match(/<v>(\d+)<\/v>/)?.[1] ?? -1);
      valor = compartidas[idx] ?? '';
    } else if (tipo === 'inlineStr') {
      valor = [...cuerpo.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => desescapar(t[1])).join('');
    } else {
      valor = desescapar(cuerpo.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? '');
    }

    if (valor.trim()) celdas.push({ col: letraAColumna(ref), valor: valor.trim() });
  }
  return celdas;
}

/**
 * Abre un .xlsx y describe sus hojas y encabezados.
 *
 * Busca la primera fila con dos o más celdas con texto: una plantilla real
 * suele traer arriba un título, un logo o instrucciones, y tomar la fila 1
 * a ciegas daría encabezados falsos.
 */
export function analizarPlantilla(datos: ArrayBuffer | Uint8Array): HojaDetectada[] {
  let zip: PizZip;
  try {
    zip = new PizZip(datos);
  } catch {
    throw new XlsxRellenoError(
      'No pude abrir el archivo. Asegúrate de que sea un Excel (.xlsx) y no un .xls antiguo ni un PDF.',
      'NO_ES_XLSX',
    );
  }

  const wb = zip.file('xl/workbook.xml');
  if (!wb) throw new XlsxRellenoError('El archivo no parece un Excel válido.', 'NO_ES_XLSX');

  const rels = zip.file('xl/_rels/workbook.xml.rels')?.asText() ?? '';
  const mapaRels = new Map<string, string>();
  for (const m of rels.matchAll(/<Relationship\b([^>]*)\/>/g)) {
    const id = m[1].match(/Id="([^"]+)"/)?.[1];
    const target = m[1].match(/Target="([^"]+)"/)?.[1];
    if (id && target) mapaRels.set(id, target.replace(/^\/?xl\//, '').replace(/^\//, ''));
  }

  const compartidas = leerSharedStrings(zip);
  const hojas: HojaDetectada[] = [];

  for (const m of wb.asText().matchAll(/<sheet\b([^>]*)\/>/g)) {
    const nombre = desescapar(m[1].match(/name="([^"]*)"/)?.[1] ?? '');
    const rid = m[1].match(/r:id="([^"]+)"/)?.[1] ?? '';
    const destino = mapaRels.get(rid);
    if (!destino) continue;

    const ruta = destino.startsWith('worksheets/') ? `xl/${destino}` : `xl/${destino}`;
    const archivo = zip.file(ruta);
    if (!archivo) continue;

    const xml = archivo.asText();
    const filas = [...xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)];

    let encabezados: string[] = [];
    let filaEncabezados = 0;
    let indiceEncontrado = -1;

    for (let i = 0; i < filas.length; i++) {
      const celdas = leerFila(filas[i][2], compartidas);
      // Dos o más celdas con texto: así se salta un título suelto arriba.
      if (celdas.length < 2) continue;
      const maxCol = Math.max(...celdas.map((c) => c.col));
      encabezados = new Array(maxCol + 1).fill('');
      for (const c of celdas) encabezados[c.col] = c.valor;
      filaEncabezados = Number(filas[i][1].match(/r="(\d+)"/)?.[1] ?? i + 1);
      indiceEncontrado = i;
      break;
    }

    hojas.push({
      nombre,
      ruta,
      encabezados,
      filaEncabezados,
      filasConDatos: indiceEncontrado === -1 ? 0 : filas.length - indiceEncontrado - 1,
    });
  }

  if (hojas.length === 0) throw new XlsxRellenoError('El archivo no tiene hojas legibles.', 'SIN_HOJAS');
  return hojas;
}

function celdaXml(ref: string, valor: ValorCelda): string {
  if (valor === null || valor === undefined || valor === '') return '';
  if (typeof valor === 'number' && Number.isFinite(valor)) return `<c r="${ref}"><v>${valor}</v></c>`;
  if (typeof valor === 'boolean') return `<c r="${ref}" t="b"><v>${valor ? 1 : 0}</v></c>`;
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapar(String(valor))}</t></is></c>`;
}

/**
 * Escribe las filas dentro de la plantilla y devuelve el archivo completo.
 *
 * Se conserva todo lo que el usuario subió — macros, formatos, hojas
 * auxiliares — y sólo se añaden filas al <sheetData> de la hoja indicada,
 * justo debajo de lo que ya hubiera.
 */
export function rellenarPlantilla(
  datos: ArrayBuffer | Uint8Array,
  rutaHoja: string,
  filas: ValorCelda[][],
): Uint8Array {
  const zip = new PizZip(datos);
  const archivo = zip.file(rutaHoja);
  if (!archivo) throw new XlsxRellenoError('No encontré la hoja dentro del archivo.', 'HOJA_NO_ENCONTRADA');

  let xml = archivo.asText();

  // Última fila usada: las nuevas se añaden debajo, sin pisar nada.
  let ultima = 0;
  for (const m of xml.matchAll(/<row\b[^>]*r="(\d+)"/g)) {
    ultima = Math.max(ultima, Number(m[1]));
  }

  const nuevas = filas
    .map((fila, i) => {
      const r = ultima + 1 + i;
      const celdas = fila.map((v, c) => celdaXml(`${columnaALetra(c)}${r}`, v)).join('');
      return `<row r="${r}">${celdas}</row>`;
    })
    .join('');

  if (/<sheetData\s*\/>/.test(xml)) {
    // Hoja completamente vacía: <sheetData/> se convierte en un par abierto.
    xml = xml.replace(/<sheetData\s*\/>/, `<sheetData>${nuevas}</sheetData>`);
  } else if (xml.includes('</sheetData>')) {
    xml = xml.replace('</sheetData>', `${nuevas}</sheetData>`);
  } else {
    throw new XlsxRellenoError('La hoja no tiene una sección de datos reconocible.', 'HOJA_NO_ENCONTRADA');
  }

  // La dimensión declarada deja de ser válida al añadir filas. Excel la
  // recalcula solo si no está, pero si está y miente, avisa de archivo
  // dañado — así que se quita.
  xml = xml.replace(/<dimension\b[^>]*\/>/, '');

  zip.file(rutaHoja, xml);
  return zip.generate({ type: 'uint8array', compression: 'DEFLATE' });
}


// ── Base64 ────────────────────────────────────────────────────────────────
//
// La plantilla del contador se guarda en la base como texto. Estas dos
// funciones viven en el motor y no en la capa de servicio porque son puras:
// asi se pueden probar sin levantar Supabase, y siguen la regla de que
// src/lib/dian/ no importa nada de la aplicacion.

export function bytesABase64(bytes: Uint8Array): string {
  let bin = '';
  // Por trozos: pasarle 30.000 argumentos a apply/spread revienta la pila.
  const trozo = 0x8000;
  for (let i = 0; i < bytes.length; i += trozo) {
    bin += String.fromCharCode(...bytes.subarray(i, i + trozo));
  }
  return btoa(bin);
}

export function base64ABytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
