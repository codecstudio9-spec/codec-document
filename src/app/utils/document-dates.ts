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
 * Cuánto duró la relación laboral, en años, meses y días.
 *
 * Es un dato que se pedía a mano —«Tiempo que llevas en la empresa»— y que se
 * puede calcular exactamente a partir de dos fechas que el formulario ya
 * tiene. Pedirlo era, además, dónde se colaba el error: al dictar, la carta
 * acabó diciendo «completando a la fecha 1022925002 de servicio», que era el
 * número de cédula.
 *
 * Se cuenta como se cuenta el tiempo entre dos fechas del calendario, no
 * dividiendo días entre 30: del 12 de febrero al 8 de agosto son 5 meses y 27
 * días, porque desde el 12 de julio hasta el 8 de agosto faltan 27 días
 * contando los 31 de julio. Dividir daría 5 meses y 26, o 5,9 meses.
 */
function duracionEntreFechas(desde: string, hasta: string, language: Language): string {
  const leer = (v: string): Date | null => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v ?? '').trim());
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const a = leer(desde);
  const b = leer(hasta);
  if (!a || !b || b <= a) return '';

  // Primero cuántos meses completos caben, y luego los días sueltos medidos
  // sobre el calendario de verdad.
  //
  // Restar los días y corregir de una pasada no basta: del 31 de enero al 1 de
  // marzo hay que retroceder al 31 de febrero, que no existe. Ese cálculo
  // quedaba con días negativos, y como sólo se imprimen los días positivos el
  // resultado salía como «1 mes», perdiendo un día sin avisar.
  let anios = b.getFullYear() - a.getFullYear();
  let meses = b.getMonth() - a.getMonth();
  if (b.getDate() < a.getDate()) meses--; // el último mes no se completó
  if (meses < 0) { anios--; meses += 12; }

  // El ancla es la fecha de inicio avanzada esos años y meses. Se recorta al
  // último día del mes cuando el día no existe ahí —31 de enero + 1 mes es el
  // 28 de febrero, no el 3 de marzo, que es lo que haría Date por su cuenta—.
  const mesAncla = new Date(a.getFullYear() + anios, a.getMonth() + meses, 1);
  const ultimoDelMes = new Date(mesAncla.getFullYear(), mesAncla.getMonth() + 1, 0).getDate();
  const ancla = new Date(mesAncla.getFullYear(), mesAncla.getMonth(), Math.min(a.getDate(), ultimoDelMes));

  // Redondeado, no truncado: un cambio de horario de verano entre las dos
  // fechas deja la diferencia en 26,96 días en vez de 27.
  const dias = Math.round((b.getTime() - ancla.getTime()) / 86_400_000);

  const es = language === 'es';
  const partes: string[] = [];
  if (anios > 0) partes.push(es ? `${anios} ${anios === 1 ? 'año' : 'años'}` : `${anios} ${anios === 1 ? 'year' : 'years'}`);
  if (meses > 0) partes.push(es ? `${meses} ${meses === 1 ? 'mes' : 'meses'}` : `${meses} ${meses === 1 ? 'month' : 'months'}`);
  if (dias > 0) partes.push(es ? `${dias} ${dias === 1 ? 'día' : 'días'}` : `${dias} ${dias === 1 ? 'day' : 'days'}`);

  if (partes.length === 0) return '';
  if (partes.length === 1) return partes[0];
  const union = es ? ' y ' : ' and ';
  return partes.slice(0, -1).join(', ') + union + partes[partes.length - 1];
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

  // Se calcula ANTES de humanizar las fechas: aquí `start_date` todavía es
  // «2026-02-12», que es lo que la función sabe leer. Después ya sería
  // «12 de febrero de 2026».
  const tiempoServicio = duracionEntreFechas(
    String(data.start_date ?? ''),
    String(data.last_day ?? ''),
    language,
  );

  // Sólo la cláusula de identificación de las partes cambia de singular a
  // plural cuando hay pareja — el resto del contrato sigue usando "EL
  // CLIENTE" como nombre de la parte contratante (igual que muchos contratos
  // bilaterales lo hacen aun con dos firmantes), para no arriesgar la
  // concordancia verbal de cada cláusula sin poder probar el resultado en
  // vivo. Ver la petición del 2026-08-26: pidieron el plural puntualmente
  // "en la cláusula de identificación de las partes".
  const clienteDenominacion = templateId === 'wedding-planner'
    ? (String(data.client_partner_name ?? '').trim()
        ? (language === 'es' ? 'quienes en adelante se denominarán LOS CLIENTES' : 'hereinafter jointly referred to as THE CLIENTS')
        : (language === 'es' ? 'quien en adelante se denominará EL CLIENTE' : 'hereinafter THE CLIENT'))
    : undefined;

  return {
    ...humanizarFechasISO(traducirOpciones(data, language, templateId), language),
    ...(tiempoServicio ? { tiempo_servicio: tiempoServicio } : {}),
    ...(clienteDenominacion ? { client_denomination: clienteDenominacion } : {}),
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
