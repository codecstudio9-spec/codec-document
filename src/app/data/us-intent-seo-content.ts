/**
 * Veinte páginas en inglés para el mercado de Estados Unidos.
 *
 * ── De dónde salen estos veinte temas ────────────────────────────────────
 *
 * No de una lluvia de ideas: de Search Console, 12 meses. Estados Unidos
 * generaba 205 impresiones y CERO clics en posición media 40 — es decir, la
 * gente ya nos ve, pero en la cuarta página y para consultas que no teníamos
 * cubiertas con una página propia. Los grupos, por volumen real medido:
 *
 *   · Letter of Intent — 53 impresiones repartidas en siete consultas
 *     («loi letter of intent», «carta de intenciones», «letter of intent
 *     compraventa»…). Es el grupo más grande del sitio y no existía ni una
 *     página dedicada: sólo un artículo de blog en posición 52.
 *   · ESIGN Act / UETA — 16 impresiones en consultas legales, más 78
 *     impresiones del artículo de blog en posición 52 sin un solo clic.
 *   · Bancos y servicios financieros — 14 impresiones.
 *   · Agentes inmobiliarios — 7 impresiones, más las consultas de «docusign
 *     lease agreement» y «docusign rental agreement template».
 *   · Alternativa a DocuSign — consultas de marca de la competencia, que son
 *     las de mayor intención de compra que existen.
 *
 * ── Por qué el texto es largo y concreto ─────────────────────────────────
 *
 * Ver el estándar de CLAUDE.md: una página de aterrizaje que sólo cambia un
 * nombre dentro de una plantilla se lee como lo que es. Cada una lleva su
 * dolor concreto, una cita legal real y verificable, un caso reconocible y
 * sus propias preguntas frecuentes. Es lo que separa un grupo de páginas
 * deliberado de un montón de páginas hiladas.
 */

import { PAGINAS_US_SECTORES } from './us-industry-seo-content';
import { PAGINAS_US_BASE } from './us-paginas-base';
import { PAGINAS_US_PRODUCTO } from './us-paginas-producto';
import { PAGINAS_US_PROPIETARIOS } from './us-paginas-propietarios';

export interface PaginaUS {
  slug: string;
  /** ≤ 60 caracteres: Google corta ahí. */
  titleTag: string;
  /** ≤ 155 caracteres. */
  metaDescription: string;
  h1: string;
  /** El grupo temático, para enlazar entre hermanas. */
  grupo: 'loi' | 'legal' | 'finance' | 'realestate' | 'compare' | 'family' | 'money' | 'lease'
    | 'poa' | 'will' | 'resignation' | 'travel' | 'b2b' | 'free' | 'industry'
    | 'howto' | 'release';
  /** Sólo en las páginas por profesión: el nombre corto del público
   *  («Contractors»), para el índice /industries y las tarjetas hermanas. */
  audiencia?: string;
  /** Documentos que ese público usa de verdad, enlazados a páginas que ya
   *  existen: es lo que convierte una página por profesión en parte de un
   *  grupo temático en vez de una hoja suelta. */
  documentos?: Array<{ to: string; label: string }>;
  /** Sólo en las páginas por profesión: lo que ese público debería dejar por
   *  escrito antes de empezar. Contenido práctico y propio de cada sector. */
  checklist?: { titulo: string; items: string[] };
  intro: string;
  problema: { titulo: string; texto: string };
  puntos: Array<{ titulo: string; texto: string }>;
  ley: { titulo: string; texto: string };
  caso: { titulo: string; texto: string };
  faq: Array<{ q: string; a: string }>;
  fotos: [string, string, string];
  cta: string;
  /** A dónde lleva el botón principal. Sin él, a la portada (las primeras
   *  páginas). Las de octubre de 2026 llevan a la herramienta que sirve:
   *  Plantillas, Firmas o el generador del documento. */
  ctaTo?: string;
}


/** Las páginas por profesión viven en su propio archivo (son treinta y muy
 *  largas); aquí se suman para que rutas, manifiesto SEO y sitemap las
 *  recojan sin tocar nada más. */
export const PAGINAS_US: PaginaUS[] = [
  ...PAGINAS_US_BASE, ...PAGINAS_US_SECTORES, ...PAGINAS_US_PRODUCTO, ...PAGINAS_US_PROPIETARIOS,
];

/** En qué archivo vive cada página: USIntentLanding carga sólo ese, en vez
 *  del texto de todas las páginas a la vez (~240 KB antes de partirlo). */
export type ModuloUS = 'base' | 'sectores' | 'producto' | 'propietarios';
export const MODULO_US: Record<string, ModuloUS> = Object.fromEntries([
  ...PAGINAS_US_BASE.map((p) => [p.slug, 'base']),
  ...PAGINAS_US_SECTORES.map((p) => [p.slug, 'sectores']),
  ...PAGINAS_US_PRODUCTO.map((p) => [p.slug, 'producto']),
  ...PAGINAS_US_PROPIETARIOS.map((p) => [p.slug, 'propietarios']),
]);

/** Índice por slug, para resolver la página desde la ruta. */
export const PAGINA_US_POR_SLUG = new Map(PAGINAS_US.map((p) => [p.slug, p]));

/** Hermanas del mismo grupo, para el enlazado interno.
 *
 *  El grupo importa: enlazar una página de prenupciales con una de bancos no
 *  ayuda a nadie y le dice a Google que el sitio no tiene estructura. */
export function hermanasDe(slug: string, maximo = 3): PaginaUS[] {
  const actual = PAGINA_US_POR_SLUG.get(slug);
  if (!actual) return [];
  // Se empieza por la página siguiente y se da la vuelta, en vez de tomar
  // siempre las primeras del grupo: con treinta páginas por profesión, todas
  // enlazarían a las mismas tres y las demás no recibirían ningún enlace.
  const grupo = PAGINAS_US.filter((p) => p.grupo === actual.grupo);
  const i = grupo.findIndex((p) => p.slug === slug);
  const mismas = [...grupo.slice(i + 1), ...grupo.slice(0, i)];
  const otras = PAGINAS_US.filter((p) => p.grupo !== actual.grupo);
  return [...mismas, ...otras].slice(0, maximo);
}
