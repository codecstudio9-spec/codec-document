/**
 * Datos que se llenan solos a partir de otros datos del formulario.
 *
 * Caso que lo motivó (2026-10-20): el anexo de la matrícula de Centro de
 * Idiomas Universal repite la ciudad, la fecha y el valor adeudado que ya se
 * escribieron arriba. El dueño quitó esas casillas del formulario para no
 * pedirlas dos veces y el anexo salía con «__________». Ahora cada campo
 * puede decir de dónde sale (`DetectedField.fuente`) y se completa al crear
 * el documento, antes de enviarlo a firmar: lo que firma la persona ya va
 * lleno.
 */
import type { DetectedField, FuenteCampo } from './docxTemplateEngine';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** «$ 610.000», «610000», «1.250.000,50» → número. */
export function leerNumero(texto: string | undefined): number | null {
  if (!texto) return null;
  let t = String(texto).replace(/[^\d.,-]/g, '');
  if (!t) return null;
  const ultimoPunto = t.lastIndexOf('.');
  const ultimaComa = t.lastIndexOf(',');
  if (ultimoPunto > -1 && ultimaComa > -1) {
    // El separador que va de último es el decimal.
    t = ultimaComa > ultimoPunto ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  } else if (ultimaComa > -1) {
    t = /,\d{3}$/.test(t) ? t.replace(/,/g, '') : t.replace(',', '.');
  } else if (ultimoPunto > -1) {
    // «610.000» en Colombia son miles, no decimales.
    t = /\.\d{3}$/.test(t) ? t.replace(/\./g, '') : t;
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function formatearNumero(n: number): string {
  return n.toLocaleString('es-CO', { maximumFractionDigits: 2 });
}

/** «2026-10-20», «20/10/2026» → Date (a mediodía, sin líos de zona horaria). */
function leerFecha(texto: string | undefined): Date | null {
  if (!texto) return null;
  const t = texto.trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12);
  return null;
}

function calcular(fuente: FuenteCampo, v: Record<string, string>): string {
  if (fuente.tipo === 'copiar') {
    return fuente.campos.filter(Boolean).map((k) => (v[k] ?? '').trim()).filter(Boolean).join(' ');
  }
  if (fuente.tipo === 'restar') {
    const base = leerNumero(v[fuente.campo]);
    if (base === null) return '';
    const resta = fuente.menos.filter(Boolean).reduce((acc, k) => acc + (leerNumero(v[k]) ?? 0), 0);
    return formatearNumero(base - resta);
  }
  const fecha = leerFecha(v[fuente.campo]);
  if (!fecha) return '';
  const meses = fuente.sumarMesesDe ? Math.round(leerNumero(v[fuente.sumarMesesDe]) ?? 0) : 0;
  if (meses) {
    const dia = fecha.getDate();
    fecha.setDate(1);
    fecha.setMonth(fecha.getMonth() + meses);
    const ultimo = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
    fecha.setDate(Math.min(dia, ultimo));
  }
  switch (fuente.parte) {
    case 'dia': return String(fecha.getDate());
    case 'mes': return MESES[fecha.getMonth()];
    case 'mesNumero': return String(fecha.getMonth() + 1);
    case 'anio': return String(fecha.getFullYear());
    case 'anio2': return String(fecha.getFullYear()).slice(-2);
    default: {
      if (!meses) return v[fuente.campo].trim();
      const mm = String(fecha.getMonth() + 1).padStart(2, '0');
      const dd = String(fecha.getDate()).padStart(2, '0');
      return `${fecha.getFullYear()}-${mm}-${dd}`;
    }
  }
}

/** Una fuente a medio configurar (sin elegir de qué dato sale) no cuenta:
 *  ese campo se sigue pidiendo en el formulario. */
export function fuenteCompleta(fuente: FuenteCampo | undefined): boolean {
  if (!fuente) return false;
  if (fuente.tipo === 'copiar') return fuente.campos.some(Boolean);
  return Boolean(fuente.campo);
}

/**
 * Devuelve los valores con los datos automáticos ya puestos. Lo que el
 * usuario sí escribió a mano nunca se pisa. Se resuelve en varias pasadas por
 * si un dato automático sale de otro dato automático.
 */
export function completarDerivados(values: Record<string, string>, fields: DetectedField[] | undefined): Record<string, string> {
  const derivados = (fields ?? []).filter((f) => fuenteCompleta(f.fuente) && f.type !== 'section');
  if (!derivados.length) return values;
  const out = { ...values };
  for (let pasada = 0; pasada < 3; pasada++) {
    for (const f of derivados) {
      if ((values[f.key] ?? '').trim()) continue;
      const valor = calcular(f.fuente!, out);
      if (valor) out[f.key] = valor;
    }
  }
  return out;
}

/** Texto corto para mostrar en el editor de qué se arma un dato automático. */
export function describirFuente(fuente: FuenteCampo, fields: DetectedField[], language: 'en' | 'es'): string {
  const nombre = (k: string) => fields.find((f) => f.key === k)?.label ?? k;
  if (fuente.tipo === 'copiar') return fuente.campos.map(nombre).join(' + ');
  if (fuente.tipo === 'restar') return `${nombre(fuente.campo)} − ${fuente.menos.map(nombre).join(' − ')}`;
  const partes: Record<string, [string, string]> = {
    completa: ['Fecha', 'Date'], dia: ['Día', 'Day'], mes: ['Mes', 'Month'], mesNumero: ['Mes (número)', 'Month (number)'],
    anio: ['Año', 'Year'], anio2: ['Año (2 cifras)', 'Year (2 digits)'],
  };
  const parte = partes[fuente.parte][language === 'en' ? 1 : 0];
  const mas = fuente.sumarMesesDe ? (language === 'en' ? ` + months in «${nombre(fuente.sumarMesesDe)}»` : ` + meses de «${nombre(fuente.sumarMesesDe)}»`) : '';
  return `${parte}: ${nombre(fuente.campo)}${mas}`;
}
