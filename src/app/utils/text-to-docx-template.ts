/**
 * Convierte el documento de «Crea un documento nuevo» en un Word (.docx) que
 * se guarda como plantilla en «Mis plantillas».
 *
 * Así lo que alguien redactó una vez —pegado de Word, de un correo o de un
 * chat de IA— deja de ser un documento de un solo uso: queda como plantilla
 * con enlace público, formulario, dictado y firma, igual que las que se suben
 * en Word.
 *
 * Los huecos se vuelven campos rellenables:
 *   [Nombre del cliente]  → {{nombre_del_cliente}}  (lo que escriben las IAs)
 *   {{cedula}}            → se respeta tal cual
 *   ________              → {{campo_1}}, {{campo_2}}…  (lo que deja un Word)
 * Los títulos del documento salen en negrita, que es lo que
 * inferSectionsFromDocx reconoce como sección: el formulario queda agrupado
 * igual que el documento.
 *
 * El .docx se arma a mano con PizZip (ya está en el proyecto por
 * docxtemplater): son cuatro archivos XML, no hace falta otra librería.
 */

import PizZip from 'pizzip';

const escXml = (t: string) => t
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function claveDe(texto: string): string {
  return texto
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'campo';
}

/** Cambia los huecos del texto por variables {{clave}}. Devuelve el texto y
 *  cuántos campos distintos quedaron. */
export function convertirHuecosEnVariables(texto: string, contador = { n: 0 }): string {
  return texto
    // [Nombre del cliente] — corchetes con texto corto y sin saltos de línea.
    .replace(/\[([^\[\]\n]{2,60})\]/g, (_, etiqueta: string) => `{{${claveDe(etiqueta)}}}`)
    // ____ — cuatro o más guiones bajos seguidos.
    .replace(/_{4,}/g, () => `{{campo_${++contador.n}}}`);
}

/** Un título de bloque: corto, sin huecos, y en mayúsculas o con forma de
 *  encabezado legal («Cláusula primera», «Artículo 3»). Las mismas reglas que
 *  usa parse-pasted-document para la vista previa. */
function esTitulo(linea: string): boolean {
  const t = linea.trim();
  if (t.length < 3 || t.length > 90 || /[:：]$/.test(t)) return false;
  if (/\[[^\]]+\]|_{4,}|\{\{/.test(t)) return false;
  if (/^#{1,6}\s+\S/.test(t)) return true;
  if (/^(cl[aá]usula|art[ií]culo|cap[ií]tulo|secci[oó]n|anexo|t[ií]tulo|par[aá]grafo|article|clause|chapter|section|appendix)\s+\S/i.test(t)) return true;
  return /^[A-ZÁÉÍÓÚÑÜ0-9][A-ZÁÉÍÓÚÑÜ0-9 .,;()°ª/-]{2,89}$/.test(t);
}

/** Cuántos campos distintos saldrían de este texto. */
export function contarCampos(textoOriginal: string): number {
  const convertido = convertirHuecosEnVariables(textoOriginal, { n: 0 });
  return new Set([...convertido.matchAll(/\{\{\s*([^}:]+?)\s*(?::[^}]*)?\}\}/g)].map((m) => m[1])).size;
}

function parrafo(texto: string, { negrita = false, centrado = false, tamano }: { negrita?: boolean; centrado?: boolean; tamano?: number } = {}): string {
  const pPr = centrado ? '<w:pPr><w:jc w:val="center"/></w:pPr>' : '';
  const rPr = negrita || tamano
    ? `<w:rPr>${negrita ? '<w:b/>' : ''}${tamano ? `<w:sz w:val="${tamano * 2}"/>` : ''}</w:rPr>`
    : '';
  // Un solo run por párrafo: las variables {{…}} nunca quedan partidas entre
  // runs, que es lo que rompe la detección cuando se escribe en Word a mano.
  return `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${escXml(texto)}</w:t></w:r></w:p>`;
}

/**
 * Arma el .docx desde el texto ORIGINAL, línea por línea. No desde el
 * documento ya formateado de la vista previa: ése junta las líneas de cada
 * párrafo, y un título seguido de sus campos sin línea en blanco
 * («DATOS DEL ESTUDIANTE» / «Nombre: [Nombre]») quedaba pegado al primer
 * campo y el formulario perdía sus secciones.
 */
export function textoADocx(textoOriginal: string): ArrayBuffer {
  const contador = { n: 0 };
  const lineas = textoOriginal.replace(/\r\n?/g, '\n').trim().split('\n');
  const cuerpo: string[] = [];
  lineas.forEach((linea, i) => {
    const t = linea.trim().replace(/^#{1,6}\s+/, '');
    if (!t) { cuerpo.push('<w:p/>'); return; }
    const texto = convertirHuecosEnVariables(t, contador);
    if (i === 0 && t.length <= 120 && !/[,:]$/.test(t)) cuerpo.push(parrafo(texto, { negrita: true, centrado: true, tamano: 14 }));
    else if (esTitulo(linea)) cuerpo.push(parrafo(texto, { negrita: true }));
    else cuerpo.push(parrafo(texto));
  });
  const zip = new PizZip();
  zip.file('[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    + '</Types>');
  zip.file('_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
    + '</Relationships>');
  zip.file('word/_rels/document.xml.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>');
  zip.file('word/document.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
    + cuerpo.join('')
    + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>'
    + '</w:body></w:document>');
  return zip.generate({ type: 'arraybuffer' }) as ArrayBuffer;
}
