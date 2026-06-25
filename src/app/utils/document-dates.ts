import { DocumentData } from '../types/document';

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

export function enrichDocumentDataWithDates(data: DocumentData, language: Language): DocumentData {
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
    ...data,
    current_day: String(day),
    current_month: month,
    current_year: String(year),
    effective_date: formatDateLong(now, language),
    effective_date_formal: formatFormalEffectiveDate(now, language),
    term_description: getNdaTermDescription(data, language, now),
    lease_end_date: leaseEndDate,
  };
}
