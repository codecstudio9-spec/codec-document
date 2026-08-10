/**
 * Generador mínimo de archivos .xlsx.
 *
 * ── Por qué no una librería ─────────────────────────────────────────────
 * Un .xlsx es un ZIP con unos cuantos XML dentro, y este proyecto ya empaqueta
 * pizzip para el motor de plantillas .docx. Traer exceljs o SheetJS sumaría
 * varios cientos de kilobytes al bundle de una SPA que ya tiene chunks por
 * encima de 700 KB — y este archivo lo genera el navegador del contador.
 *
 * Lo que hace falta aquí es tabular: encabezados, texto, números y fechas en
 * varias hojas. Eso son ~150 líneas. Formato condicional, fórmulas o gráficos
 * no entran, y si algún día hacen falta, entonces sí se justifica la
 * dependencia.
 *
 * Portable a propósito: sólo pizzip, sin APIs de Node ni del DOM, para que
 * funcione igual en el navegador, en Deno y en Codec POS.
 */

import PizZip from 'pizzip';

export type ValorCelda = string | number | boolean | null | undefined;

export interface Hoja {
  /** Máximo 31 caracteres y sin : \ / ? * [ ] — lo impone Excel. */
  nombre: string;
  encabezados: string[];
  filas: ValorCelda[][];
  /** Ancho de cada columna en caracteres. Sin esto Excel deja todo en 8,43
   *  y el contador abre el archivo viendo ##### en cada importe. */
  anchos?: number[];
}

const escapar = (s: string): string =>
  s.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // Excel rechaza el archivo entero si encuentra un carácter de control.
    // Vienen en descripciones de producto de más de un emisor.
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

/** Índice de columna a letras: 0 → A, 25 → Z, 26 → AA. */
function columna(n: number): string {
  let s = '';
  let i = n;
  do {
    s = String.fromCharCode(65 + (i % 26)) + s;
    i = Math.floor(i / 26) - 1;
  } while (i >= 0);
  return s;
}

/** Excel sólo admite 31 caracteres y prohíbe : \ / ? * [ ] en el nombre. */
function nombreValido(nombre: string, indice: number): string {
  const limpio = nombre.replace(/[:\\/?*[\]]/g, '-').slice(0, 31).trim();
  return limpio || `Hoja${indice + 1}`;
}

function celda(ref: string, valor: ValorCelda, estilo: number): string {
  if (valor === null || valor === undefined || valor === '') return '';

  if (typeof valor === 'number' && Number.isFinite(valor)) {
    return `<c r="${ref}" s="${estilo}"><v>${valor}</v></c>`;
  }
  if (typeof valor === 'boolean') {
    return `<c r="${ref}" s="${estilo}" t="b"><v>${valor ? 1 : 0}</v></c>`;
  }
  // Cadenas en línea: evita construir la tabla de sharedStrings, que para un
  // archivo de un solo uso no aporta nada.
  return `<c r="${ref}" s="${estilo}" t="inlineStr"><is><t xml:space="preserve">${escapar(String(valor))}</t></is></c>`;
}

function xmlHoja(hoja: Hoja): string {
  const cols = hoja.anchos?.length
    ? `<cols>${hoja.anchos.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
    : '';

  const encabezado = `<row r="1">${hoja.encabezados
    .map((h, i) => celda(`${columna(i)}1`, h, 1))
    .join('')}</row>`;

  const cuerpo = hoja.filas
    .map((fila, f) => {
      const celdas = fila
        .map((v, i) => celda(`${columna(i)}${f + 2}`, v, typeof v === 'number' ? 2 : 0))
        .join('');
      return `<row r="${f + 2}">${celdas}</row>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${encabezado}${cuerpo}</sheetData></worksheet>`;
}

// Tres estilos: 0 normal, 1 encabezado (negrita sobre gris), 2 número con
// separador de miles y dos decimales — que es como un contador espera ver
// un importe en pesos.
const ESTILOS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts>
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEDEFEE"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="3">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

/** Construye el .xlsx y lo devuelve como Uint8Array. */
export function generarXlsx(hojas: Hoja[]): Uint8Array {
  if (hojas.length === 0) throw new Error('El libro necesita al menos una hoja');

  const nombres = hojas.map((h, i) => nombreValido(h.nombre, i));
  const zip = new PizZip();

  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${hojas.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}
</Types>`);

  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);

  zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${nombres.map((n, i) => `<sheet name="${escapar(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>
</workbook>`);

  zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${hojas.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}
<Relationship Id="rId${hojas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

  zip.file('xl/styles.xml', ESTILOS);
  hojas.forEach((h, i) => zip.file(`xl/worksheets/sheet${i + 1}.xml`, xmlHoja(h)));

  return zip.generate({ type: 'uint8array', compression: 'DEFLATE' });
}
