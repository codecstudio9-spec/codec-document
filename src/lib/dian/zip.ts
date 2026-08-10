/**
 * Lectura segura de los ZIP que entrega el portal de la DIAN.
 *
 * El archivo lo aporta un tercero desconocido, así que el objetivo no es
 * sólo extraer los XML: es no dejar que un ZIP hostil agote la memoria del
 * navegador o del worker.
 *
 * ── Defensas ────────────────────────────────────────────────────────────
 *  · Tope de entradas          — un ZIP con un millón de archivos vacíos
 *  · Tope de tamaño acumulado  — se aborta a mitad, no al final
 *  · Tope por archivo          — un XML de 500 MB dentro de un ZIP de 1 MB
 *  · Ratio de compresión       — la firma clásica de una bomba ZIP
 *  · Se ignora la ruta interna — un nombre "../../etc/passwd" no puede
 *    escapar porque nunca se usa como ruta: sólo se conserva el nombre
 *    base, y el archivo se guarda con un UUID.
 *
 * Se descomprime de una en una y llevando la cuenta: un ZIP bomba clásico
 * declara tamaños pequeños y explota al expandir, así que comprobar sólo
 * la cabecera no sirve de nada.
 */

import PizZip from 'pizzip';

export interface LimitesZip {
  maxEntradas: number;
  maxBytesTotales: number;
  maxBytesPorArchivo: number;
  maxRatioCompresion: number;
}

export const LIMITES_ZIP: LimitesZip = {
  // Una importación real ronda los 5.000 documentos; 20.000 deja margen sin
  // permitir un archivo absurdo.
  maxEntradas: 20_000,
  // 5.000 XML de ~50 KB son ~250 MB. 600 MB deja el doble de margen.
  maxBytesTotales: 600 * 1024 * 1024,
  maxBytesPorArchivo: 12 * 1024 * 1024,
  // Un XML comprime ~10:1. Por encima de 200:1 no es un documento, es una
  // bomba.
  maxRatioCompresion: 200,
};

export class ZipError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'DEMASIADAS_ENTRADAS'
      | 'DEMASIADO_GRANDE'
      | 'ARCHIVO_DEMASIADO_GRANDE'
      | 'POSIBLE_BOMBA'
      | 'ZIP_ILEGIBLE'
      | 'SIN_XML',
  ) {
    super(message);
    this.name = 'ZipError';
  }
}

export interface EntradaZip {
  /** Nombre base, sin ninguna parte de la ruta interna del ZIP. */
  nombre: string;
  contenido: string;
  bytes: number;
}

export interface ResultadoZip {
  entradas: EntradaZip[];
  /** Archivos ignorados por no ser XML (PDF de representación gráfica,
   *  carpetas, ficheros de sistema). No es un error: el ZIP de la DIAN los
   *  trae y el contador no tiene por qué saberlo. */
  ignorados: number;
  bytesTotales: number;
}

const esXml = (nombre: string): boolean => /\.xml$/i.test(nombre);

/** Sólo el nombre base: la ruta interna del ZIP es el vector clásico de
 *  path traversal, y además suele llevar el NIT dentro. */
const nombreBase = (ruta: string): string => ruta.split(/[/\\]/).pop() ?? ruta;

/** Descarta lo que ningún ZIP legítimo necesita: metadatos de macOS,
 *  miniaturas de Windows, archivos ocultos. */
function esRuido(ruta: string): boolean {
  const base = nombreBase(ruta);
  return (
    ruta.startsWith('__MACOSX/') ||
    base === '.DS_Store' ||
    base === 'Thumbs.db' ||
    base.startsWith('._')
  );
}

export function leerZipSeguro(
  datos: ArrayBuffer | Uint8Array,
  limites: LimitesZip = LIMITES_ZIP,
): ResultadoZip {
  const bytesComprimidos = datos instanceof ArrayBuffer ? datos.byteLength : datos.length;

  let zip: PizZip;
  try {
    zip = new PizZip(datos);
  } catch (e) {
    throw new ZipError(
      `No se pudo abrir el archivo comprimido: ${(e as Error).message}`,
      'ZIP_ILEGIBLE',
    );
  }

  const nombres = Object.keys(zip.files);
  if (nombres.length > limites.maxEntradas) {
    throw new ZipError(
      `El comprimido tiene ${nombres.length} archivos y el máximo es ${limites.maxEntradas}`,
      'DEMASIADAS_ENTRADAS',
    );
  }

  const entradas: EntradaZip[] = [];
  let bytesTotales = 0;
  let ignorados = 0;

  for (const ruta of nombres) {
    const archivo = zip.files[ruta];
    if (archivo.dir || esRuido(ruta)) { ignorados++; continue; }
    if (!esXml(ruta)) { ignorados++; continue; }

    // Se descomprime de una en una: un ZIP bomba declara tamaños pequeños
    // en la cabecera y sólo se delata al expandir.
    let contenido: string;
    try {
      contenido = archivo.asText();
    } catch {
      ignorados++;
      continue;
    }

    const bytes = contenido.length;

    if (bytes > limites.maxBytesPorArchivo) {
      throw new ZipError(
        `El archivo ${nombreBase(ruta)} pesa ${bytes} bytes descomprimido y el máximo por archivo es ${limites.maxBytesPorArchivo}`,
        'ARCHIVO_DEMASIADO_GRANDE',
      );
    }

    bytesTotales += bytes;

    if (bytesTotales > limites.maxBytesTotales) {
      throw new ZipError(
        `El contenido descomprimido supera ${limites.maxBytesTotales} bytes`,
        'DEMASIADO_GRANDE',
      );
    }

    // El ratio se comprueba sobre el acumulado y no archivo por archivo:
    // un XML pequeño y muy repetitivo puede comprimir 300:1 de forma
    // legítima, pero el conjunto no.
    if (bytesComprimidos > 0 && bytesTotales / bytesComprimidos > limites.maxRatioCompresion) {
      throw new ZipError(
        'La proporción de compresión es anómala; el archivo podría estar manipulado',
        'POSIBLE_BOMBA',
      );
    }

    entradas.push({ nombre: nombreBase(ruta), contenido, bytes });
  }

  if (entradas.length === 0) {
    throw new ZipError('El comprimido no contiene ningún archivo XML', 'SIN_XML');
  }

  return { entradas, ignorados, bytesTotales };
}

/** SHA-256 en hexadecimal. Usa Web Crypto, disponible igual en el navegador
 *  y en Deno — nada de `node:crypto`, que rompería la portabilidad del
 *  motor. Es el primer nivel de deduplicación: mismo archivo byte a byte. */
export async function sha256Hex(texto: string): Promise<string> {
  const datos = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest('SHA-256', datos);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
