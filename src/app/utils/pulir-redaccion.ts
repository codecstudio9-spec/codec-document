/**
 * Pule la redacción de un documento generado desde una plantilla Word
 * ANTES de maquetarlo en PDF, sin tocar la plantilla.
 *
 * Al rellenar campos sueltos la plantilla deja costuras que en un documento
 * profesional no se aceptan:
 *   «el ENERO / 25 / 2027»      → «el 25 de enero de 2027»
 *   «el día 25 / enero / 2027»  → «el día 25 de enero de 2027»
 *   «el 2027-01-25»             → «el 25 de enero de 2027»   (valor de un <input type="date">)
 *   «Bogota , el día»           → «Bogota, el día»           (espacio antes de puntuación)
 *   «de   tipo»                 → «de tipo»                  (espacios repetidos)
 *
 * Trabaja carácter a carácter sobre los «runs» del párrafo para conservar
 * qué partes van en negrita: el texto que reemplaza a un tramo hereda el
 * formato del primer carácter de ese tramo.
 */
import type { DocxParagraph, DocxRun } from '../../lib/docxTemplateEngine';

type Idioma = 'es' | 'en';

const MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Nombre de mes (español o inglés, con o sin tilde/mayúsculas) → 0..11. */
function indiceDeMes(nombre: string): number {
  const n = nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const es = MESES_ES.findIndex((m) => m === n || (n === 'setiembre' && m === 'septiembre'));
  if (es >= 0) return es;
  return MESES_EN.findIndex((m) => m.toLowerCase() === n);
}

function fechaLarga(dia: number, mes: number, anio: string, idioma: Idioma): string | null {
  if (mes < 0 || mes > 11 || dia < 1 || dia > 31) return null;
  return idioma === 'en'
    ? `${MESES_EN[mes]} ${dia}, ${anio}`
    : `${dia} de ${MESES_ES[mes]} de ${anio}`;
}

const NOMBRE_MES = '(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|january|february|march|april|may|june|july|august|september|october|november|december)';
const SEP = '\\s*[\\/\\-.]\\s*';

interface Regla {
  re: RegExp;
  reemplazo: (m: RegExpExecArray, idioma: Idioma) => string | null;
}

const REGLAS: Regla[] = [
  // 25 / enero / 2027
  {
    re: new RegExp(`\\b(\\d{1,2})${SEP}${NOMBRE_MES}${SEP}(\\d{4})\\b`, 'giu'),
    reemplazo: (m, idioma) => fechaLarga(Number(m[1]), indiceDeMes(m[2]), m[3], idioma),
  },
  // ENERO / 25 / 2027
  {
    re: new RegExp(`\\b${NOMBRE_MES}${SEP}(\\d{1,2})${SEP}(\\d{4})\\b`, 'giu'),
    reemplazo: (m, idioma) => fechaLarga(Number(m[2]), indiceDeMes(m[1]), m[3], idioma),
  },
  // 2027-01-25 (lo que guarda un campo de fecha del navegador)
  {
    re: /\b(\d{4})-(\d{2})-(\d{2})\b/g,
    reemplazo: (m, idioma) => fechaLarga(Number(m[3]), Number(m[2]) - 1, m[1], idioma),
  },
  // Espacio antes de coma, punto, punto y coma o dos puntos.
  { re: /[ \t ]+([,;:.])(?=\s|$)/g, reemplazo: (m) => m[1] },
  // Espacios repetidos dentro de una frase (no toca tabulaciones convertidas).
  { re: /(\S) {2,3}(?=\S)/g, reemplazo: (m) => `${m[1]} ` },
];

type Car = { ch: string; bold: boolean; sizePt?: number };

function aCaracteres(runs: DocxRun[]): Car[] {
  const out: Car[] = [];
  for (const r of runs) for (const ch of r.text) out.push({ ch, bold: r.bold, sizePt: r.sizePt });
  return out;
}

function aRuns(cars: Car[]): DocxRun[] {
  const runs: DocxRun[] = [];
  for (const c of cars) {
    const last = runs[runs.length - 1];
    if (last && last.bold === c.bold && last.sizePt === c.sizePt) last.text += c.ch;
    else runs.push({ text: c.ch, bold: c.bold, sizePt: c.sizePt });
  }
  return runs;
}

/** Aplica una regla sobre la lista de caracteres, conservando el formato. */
function aplicarRegla(cars: Car[], regla: Regla, idioma: Idioma): Car[] {
  // Los índices de String son unidades UTF-16; se trabaja con un array de
  // unidades para que coincidan con los de la expresión regular.
  const unidades: Car[] = [];
  for (const c of cars) for (const u of c.ch.split('')) unidades.push({ ...c, ch: u });
  const texto = unidades.map((u) => u.ch).join('');

  regla.re.lastIndex = 0;
  const salida: Car[] = [];
  let cursor = 0;
  let m: RegExpExecArray | null;
  while ((m = regla.re.exec(texto))) {
    if (m[0].length === 0) { regla.re.lastIndex++; continue; }
    const nuevo = regla.reemplazo(m, idioma);
    if (nuevo === null) continue;
    salida.push(...unidades.slice(cursor, m.index));
    const formato = unidades[m.index];
    for (const ch of nuevo) salida.push({ ch, bold: formato.bold, sizePt: formato.sizePt });
    cursor = m.index + m[0].length;
  }
  salida.push(...unidades.slice(cursor));
  return salida;
}

export function pulirRunsDeParrafo(runs: DocxRun[], idioma: Idioma = 'es'): DocxRun[] {
  if (runs.length === 0) return runs;
  let cars = aCaracteres(runs);
  for (const regla of REGLAS) cars = aplicarRegla(cars, regla, idioma);
  return aRuns(cars);
}

export function pulirParrafos(parrafos: DocxParagraph[], idioma: Idioma = 'es'): DocxParagraph[] {
  return parrafos.map((p) => ({ ...p, runs: pulirRunsDeParrafo(p.runs, idioma) }));
}
