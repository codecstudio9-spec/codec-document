/**
 * Treinta páginas en español para Colombia: firma electrónica, las funciones
 * nuevas (firmar desde el celular, por WhatsApp, en persona con QR, plantillas
 * desde Word, reconocimiento facial) y los documentos que más se buscan.
 *
 * ── De dónde salen los temas ─────────────────────────────────────────────
 *
 * De las sugerencias de búsqueda de Google para Colombia (octubre de 2026):
 * «contrato laboral a término fijo / indefinido / obra o labor», «cuenta de
 * cobro formato», «contrato de arrendamiento de vivienda urbana / local
 * comercial», «pagaré en blanco y carta de instrucciones», «otrosí»,
 * «poder especial amplio y suficiente», «autorización tratamiento de datos»,
 * «firmar documentos desde el celular», «cómo firmar un documento en Word»,
 * «firma electrónica para contratos de trabajo / de arriendo». Ninguno tenía
 * página propia; las que ya existían (firma digital gratis por ciudad,
 * profesiones, DIAN) no se tocan para no competir consigo mismas.
 *
 * ── Fuentes legales verificadas ──────────────────────────────────────────
 *
 *   · Ley 527 de 1999 (arts. 2, 5, 6, 7, 8, 28) y Decreto 2364 de 2012,
 *     compilado en el DUR 1074 de 2015 (art. 2.2.2.47.4: confiabilidad).
 *   · Ley 2466 de 2025 (reforma laboral): indefinido como regla general
 *     (art. 47 CST), término fijo escrito y máximo 4 años (art. 46 CST), obra
 *     o labor escrita y detallada, aprendizaje laboral especial a término fijo
 *     ≤ 3 años (art. 81 CST), contrato escrito en trabajo doméstico (art. 33).
 *     Circulares 0057 de 2026 y 0083 de 2025 del Ministerio del Trabajo.
 *   · Ley 820 de 2003 (arts. 3, 16, 18, 20); IPC 2025 = 5,10 % (DANE).
 *   · Código de Comercio: arts. 518-524 (local), 621, 622, 671, 709, 789.
 *   · Código Civil: arts. 1602, 1849, 1857, 2142, 2200, 2220; Ley 153 de
 *     1887 art. 89 (promesa).
 *   · Ley 2213 de 2022 art. 5 (poderes judiciales por mensaje de datos); CGP
 *     arts. 74 y 247.
 *   · Estatuto Tributario arts. 616-2 y 771-2 (cuenta de cobro y documento
 *     soporte). Ley 256 de 1996 art. 16 y Decisión 486 CAN arts. 260-266.
 *   · Ley 1581 de 2012 (arts. 9 y 12) y Decreto 1377 de 2013.
 *   · RUNT: traspaso en 60 días hábiles; fin del traspaso a persona
 *     indeterminada desde febrero de 2026.
 *
 * Donde la ley no está asentada (mérito ejecutivo del pagaré electrónico),
 * la página lo dice en vez de prometer.
 *
 * ── Por qué en varios archivos ───────────────────────────────────────────
 *
 * COIntentLanding carga sólo el archivo del grupo que se está viendo (ver
 * co-pages-index.generated.ts). Este agregador lo usan los scripts de build
 * y el validador, nunca el navegador.
 */
import { PAGINAS_CO_FIRMA } from './co-paginas-firma';
import { PAGINAS_CO_LABORAL } from './co-paginas-laboral';
import { PAGINAS_CO_NEGOCIOS } from './co-paginas-negocios';
import { PAGINAS_CO_DINERO } from './co-paginas-dinero';

export type GrupoCO = 'firma' | 'laboral' | 'independientes' | 'inmuebles' | 'dinero' | 'tramites';

export interface PaginaCO {
  slug: string;
  /** ≤ 60 caracteres: Google corta ahí. */
  titleTag: string;
  /** ≤ 155 caracteres. */
  metaDescription: string;
  h1: string;
  grupo: GrupoCO;
  intro: string;
  problema: { titulo: string; texto: string };
  puntos: Array<{ titulo: string; texto: string }>;
  ley: { titulo: string; texto: string };
  caso: { titulo: string; texto: string };
  /** Lo que el documento debe incluir: contenido práctico y propio. */
  checklist?: { titulo: string; items: string[] };
  faq: Array<{ q: string; a: string }>;
  fotos: [string, string, string];
  cta: string;
  /** A dónde lleva el botón principal: la herramienta que de verdad sirve
   *  (Plantillas para subir el modelo propio, Firmas para firmar). */
  ctaTo: string;
}

/** Archivo en el que vive cada grupo: COIntentLanding carga sólo ese. */
export type ModuloCO = 'firma' | 'laboral' | 'negocios' | 'dinero';

export const PAGINAS_CO: PaginaCO[] = [
  ...PAGINAS_CO_FIRMA,
  ...PAGINAS_CO_LABORAL,
  ...PAGINAS_CO_NEGOCIOS,
  ...PAGINAS_CO_DINERO,
];

export const MODULO_CO: Record<string, ModuloCO> = Object.fromEntries([
  ...PAGINAS_CO_FIRMA.map((p) => [p.slug, 'firma']),
  ...PAGINAS_CO_LABORAL.map((p) => [p.slug, 'laboral']),
  ...PAGINAS_CO_NEGOCIOS.map((p) => [p.slug, 'negocios']),
  ...PAGINAS_CO_DINERO.map((p) => [p.slug, 'dinero']),
]);

export const PAGINA_CO_POR_SLUG = new Map(PAGINAS_CO.map((p) => [p.slug, p]));

/** Página de Colombia que hace de eje del grupo: todas enlazan a ella y ella
 *  las lista todas (CountrySignatureLanding con country = colombia). */
export const HUB_CO = { path: '/firma-electronica-colombia', label: 'Firma electrónica en Colombia' };

/** Hermanas del mismo grupo primero, empezando por la siguiente y dando la
 *  vuelta, para que todas reciban enlaces y no siempre las tres primeras. */
export function hermanasCO(slug: string, maximo = 3): PaginaCO[] {
  const actual = PAGINA_CO_POR_SLUG.get(slug);
  if (!actual) return [];
  const grupo = PAGINAS_CO.filter((p) => p.grupo === actual.grupo);
  const i = grupo.findIndex((p) => p.slug === slug);
  const mismas = [...grupo.slice(i + 1), ...grupo.slice(0, i)];
  const otras = PAGINAS_CO.filter((p) => p.grupo !== actual.grupo);
  return [...mismas, ...otras].slice(0, maximo);
}
