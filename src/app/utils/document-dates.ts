import { DocumentData } from '../types/document';
import { getFieldOptionTranslation } from '../data/field-translations';

type Language = 'en' | 'es';

const monthNamesEN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthNamesES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function addYears(baseDate: Date, years: number): Date {
  const d = new Date(baseDate);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function addMonths(baseDate: Date, months: number): Date {
  const d = new Date(baseDate);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatDateLong(date: Date, language: Language): string {
  return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatFormalEffectiveDate(date: Date, language: Language): string {
  const day = date.getDate();
  const month = language === 'es' ? monthNamesES[date.getMonth()] : monthNamesEN[date.getMonth()];
  const year = date.getFullYear();
  return language === 'es'
    ? `este ${day} de ${month} de ${year}`
    : `this ${day} day of ${month}, ${year}`;
}

function getNdaTermDescription(data: DocumentData, language: Language, baseDate: Date): string {
  const termType = String(data.term_type || '').toLowerCase();
  const customYears = Number(data.custom_term_years || 0);

  const build = (years: number) => {
    const endDate = addYears(baseDate, years);
    const endDateText = formatDateLong(endDate, language);
    return language === 'es'
      ? `${years} año(s) desde la Fecha Efectiva, finalizando el ${endDateText}.`
      : `${years} year(s) from the Effective Date, ending on ${endDateText}.`;
  };

  if (termType.includes('1 year') || termType.includes('1 año')) return build(1);
  if (termType.includes('2 year') || termType.includes('2 año')) return build(2);
  if (termType.includes('3 year') || termType.includes('3 año')) return build(3);
  if (termType.includes('5 year') || termType.includes('5 año')) return build(5);

  if (termType.includes('custom') || termType.includes('personalizada')) {
    if (customYears > 0) return build(customYears);
    return language === 'es'
      ? 'Duración personalizada desde la Fecha Efectiva (la duración final debe especificarse).'
      : 'Custom duration from the Effective Date (final duration must be specified).';
  }

  if (termType.includes('indefinite') || termType.includes('indefinido')) {
    return language === 'es'
      ? 'Indefinido (hasta que la información se vuelva pública o deje de ser confidencial por ley).'
      : 'Indefinite (until information becomes public or is no longer confidential by law).';
  }

  return language === 'es'
    ? 'Según el plazo de confidencialidad acordado por las Partes.'
    : 'As per the confidentiality term agreed by the Parties.';
}

/**
 * Convierte las fechas que el usuario eligió en el calendario a la forma en
 * que se escriben en un documento.
 *
 * Los campos `type: 'date'` llegan como `2020-03-15`, y así es como salían
 * impresas: «trabajo aquí desde 2020-03-15» no es lenguaje de una carta
 * formal, y en países que escriben día/mes se lee además como una fecha
 * distinta a la elegida.
 *
 * Sólo se tocan los valores con forma exacta de fecha ISO. Un número de
 * cédula, un importe o un texto libre no coinciden con ese patrón y pasan
 * intactos. Se construye con `new Date(a, m-1, d)` y no parseando la cadena:
 * `new Date('2020-03-15')` es medianoche UTC, que al oeste de Greenwich cae
 * en el día anterior y restaría un día a cada fecha.
 */
function humanizarFechasISO(data: DocumentData, language: Language): DocumentData {
  const salida: DocumentData = { ...data };
  for (const [clave, valor] of Object.entries(salida)) {
    if (typeof valor !== 'string') continue;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor.trim());
    if (!m) continue;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (Number.isNaN(d.getTime())) continue;
    salida[clave] = formatDateLong(d, language);
  }
  return salida;
}

/**
 * Pasa al idioma del documento los valores que salieron de un desplegable.
 *
 * El formulario guarda la opción en su forma canónica, que está en inglés —
 * tiene que ser así, porque es el valor que el `<select>` compara y el que los
 * condicionales `{{#if}}` de la plantilla esperan. Lo que se traduce es sólo lo
 * que se ve en la lista.
 *
 * Al imprimir, en cambio, ese valor se sustituye tal cual, así que un contrato
 * en español salía con frases enteras en inglés en mitad de una cláusula:
 * «Gastos de viaje… quedan así: Paid by the client, on top of the fee».
 * Aquí se traduce sólo para el texto final; lo guardado no se toca.
 *
 * Necesita el id de la plantilla porque la traducción está indexada por
 * plantilla y campo. Sin él —cuando quien llama no lo tiene— se devuelven los
 * datos intactos, que es el comportamiento de antes.
 */
function traducirOpciones(data: DocumentData, language: Language, templateId?: string): DocumentData {
  if (!templateId) return data;
  const salida: DocumentData = { ...data };
  for (const [campo, valor] of Object.entries(salida)) {
    if (typeof valor !== 'string' || !valor) continue;
    const traducido = getFieldOptionTranslation(templateId, campo, valor, language);
    if (traducido && traducido !== valor) salida[campo] = traducido;
  }
  return salida;
}

/**
 * Por cada campo de texto, una versión en mayúsculas con el sufijo `_mayus`.
 *
 * En una carta formal el destinatario va en mayúsculas —«Señores / CENTRO DE
 * IDIOMAS UNIVERSAL»— mientras que en el cuerpo esa misma empresa se nombra
 * con su grafía normal. Es el mismo dato escrito de dos maneras según dónde
 * aparece, así que la plantilla pide `{{company_name_mayus}}` arriba y
 * `{{company_name}}` en el texto, y quien rellena el formulario lo escribe
 * una sola vez.
 *
 * Sólo añade claves; ninguna existente se toca. Y no colisiona con la
 * sustitución normal porque `{{company_name}}` exige las llaves justo después
 * del nombre, así que nunca coincide dentro de `{{company_name_mayus}}`.
 */
function agregarMayusculas(data: DocumentData): DocumentData {
  const salida: DocumentData = { ...data };
  for (const [clave, valor] of Object.entries(data)) {
    if (typeof valor !== 'string' || !valor.trim()) continue;
    if (clave.endsWith('_mayus')) continue;
    salida[`${clave}_mayus`] = valor.toLocaleUpperCase('es');
  }
  return salida;
}

export function enrichDocumentDataWithDates(
  data: DocumentData,
  language: Language,
  /** Id de la plantilla. Al pasarlo, las opciones de los desplegables se
   *  imprimen en el idioma del documento en vez de en su forma canónica. */
  templateId?: string,
): DocumentData {
  const now = new Date();
  const day = now.getDate();
  const month = language === 'es' ? monthNamesES[now.getMonth()] : monthNamesEN[now.getMonth()];
  const year = now.getFullYear();

  const leaseStartRaw = String(data.lease_start || '').trim();
  const leaseTermMonths = Number(data.lease_term || 0);
  let leaseEndDate = '';
  if (leaseStartRaw && leaseTermMonths > 0) {
    const parsed = new Date(leaseStartRaw);
    if (!Number.isNaN(parsed.getTime())) {
      leaseEndDate = formatDateLong(addMonths(parsed, leaseTermMonths), language);
    }
  }

  return {
    ...agregarMayusculas(humanizarFechasISO(traducirOpciones(data, language, templateId), language)),
    current_day: String(day),
    current_month: month,
    current_year: String(year),
    // La fecha de hoy escrita entera. Sin esto, toda plantilla con
    // {{current_date}} —la carta de renuncia entre ellas— se imprimía con la
    // ciudad y una coma suelta, sin fecha, porque los marcadores que no se
    // resuelven se sustituyen por nada.
    current_date: formatDateLong(now, language),
    effective_date: formatDateLong(now, language),
    effective_date_formal: formatFormalEffectiveDate(now, language),
    term_description: getNdaTermDescription(data, language, now),
    lease_end_date: leaseEndDate,
  };
}
