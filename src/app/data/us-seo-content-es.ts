/**
 * Versión en español de las páginas de Estados Unidos, para quien pulsa ES.
 *
 * ── Por qué existe ───────────────────────────────────────────────────────
 *
 * Las páginas de EE. UU. son en inglés por defecto y así deben seguir para
 * los buscadores (CLAUDE.md: el idioma de una URL no puede depender de la IP).
 * Pero mucha gente que las visita —contratistas, wedding planners, dueños de
 * negocios latinos en EE. UU.— prefiere leer en español, y al pulsar ES sólo
 * se traducían el menú y el pie: el cuerpo seguía en inglés. El traductor de
 * Chrome tampoco sirve, porque el sitio lo desactiva (translate="no") para
 * que no rompa React.
 *
 * El título, la meta descripción y los datos estructurados NO se traducen:
 * son el contenido por defecto de la URL, el que indexa Google. Esto sólo
 * cambia lo que ve una persona que elige español.
 *
 * Las citas legales conservan el nombre original de la ley (ESIGN Act,
 * 15 U.S.C. § 7001…) porque es lo que alguien tendría que buscar.
 */

import type { PaginaUS } from './us-intent-seo-content';
import { TRADUCCIONES_SECTORES_ES } from './us-industry-seo-content-es';

export type ContenidoEs = Partial<Pick<PaginaUS,
  'h1' | 'intro' | 'metaDescription' | 'problema' | 'puntos' | 'ley' | 'caso' | 'faq' | 'cta' | 'audiencia' | 'checklist'>>;

const TRADUCCIONES: Record<string, ContenidoEs> = {
  ...TRADUCCIONES_SECTORES_ES,
};

/** La página con su contenido en español si existe; si no, la misma página. */
export function enEspanol(p: PaginaUS): PaginaUS {
  const t = TRADUCCIONES[p.slug];
  return t ? { ...p, ...t } : p;
}

export const tieneEspanol = (slug: string) => slug in TRADUCCIONES;

const DOCUMENTOS_ES: Record<string, string> = {
  '/business-estimate-generator': 'Generador de estimados',
  '/quote-generator': 'Generador de cotizaciones',
  '/proposal-generator': 'Generador de propuestas',
  '/professional-quote-template': 'Plantilla de cotización profesional',
  '/service-agreement-template': 'Contrato de servicios',
  '/subcontractor-agreement-template': 'Contrato de subcontratista',
  '/independent-contractor-agreement-template': 'Contrato de contratista independiente',
  '/consulting-agreement-template': 'Contrato de consultoría',
  '/vendor-agreement-template': 'Contrato con proveedores',
  '/nda-template': 'Acuerdo de confidencialidad (NDA)',
  '/employee-confidentiality-agreement': 'Confidencialidad para empleados',
  '/free-lease-agreement-template': 'Contrato de arrendamiento',
  '/online-lease-agreement': 'Arrendamiento en línea',
  '/promissory-note-template': 'Pagaré',
  '/vehicle-bill-of-sale': 'Contrato de compraventa de vehículo',
  '/vehicle-bill-of-sale-requirements-by-state': 'Requisitos de compraventa por estado',
  '/wedding-planner-california': 'Contrato de wedding planner',
  '/bulk-document-signing-for-teams': 'Firma masiva para equipos',
  '/white-label-electronic-signature': 'Firma electrónica con tu marca',
  '/how-to-sign-a-pdf-online-free': 'Firmar un PDF gratis',
  '/is-an-electronic-signature-legally-binding': '¿La firma electrónica es válida?',
  '/letter-of-intent': 'Carta de intención',
  '/electronic-signature-for-realtors': 'Firma electrónica para agentes inmobiliarios',
  '/child-travel-consent-form': 'Permiso de viaje de menores',
  '/resignation-letter-template': 'Carta de renuncia',
  '/power-of-attorney-template': 'Poder notarial',
  '/electronic-signature-api-for-developers': 'API de firma electrónica',
};

export const etiquetaDocumentoEs = (d: { to: string; label: string }) => DOCUMENTOS_ES[d.to] ?? d.label;

export { TEXTOS_US } from './us-seo-textos';

/** Resumen en español de una página, para las tarjetas de páginas
 *  relacionadas (que sólo tienen el índice, no la página completa). */
export function resumenEs(slug: string): { h1?: string; metaDescription?: string; audiencia?: string } {
  const t = TRADUCCIONES[slug];
  return t ? { h1: t.h1, metaDescription: t.metaDescription, audiencia: t.audiencia } : {};
}

