/**
 * Nombre visible e icono de cada categoría de plantillas.
 *
 * Las categorías viven en inglés dentro de cada plantilla (es la clave con
 * la que se filtra, y cambiarla rompería el catálogo entero). Aquí se les
 * pone la cara: cómo se llaman en pantalla y con qué icono se reconocen.
 *
 * Al añadir una categoría hay que registrarla en los DOS sitios: en
 * `categories` de templates.ts, que decide si aparece como filtro, y aquí,
 * que decide cómo se ve. Sin lo primero queda invisible; sin lo segundo
 * sale con su nombre en inglés.
 */

import {
  Briefcase, Home, FileSignature, Landmark, Scale, Building2, Globe, PartyPopper,
  type LucideIcon,
} from 'lucide-react';

export interface CategoriaMeta {
  /** Clave real, la que trae cada plantilla en su campo `category`. */
  id: string;
  es: string;
  en: string;
  icono: LucideIcon;
  /** Color de acento del botón. */
  color: string;
}

export const CATEGORIAS: CategoriaMeta[] = [
  // Bodas, quince años, grados. No es «contratos comerciales»: quien busca un
  // contrato para su boda no entra a mirar ahí, y quien busca uno de negocios
  // no quiere tropezarse con el de la boda.
  { id: 'Events & Celebrations', es: 'Eventos y Celebraciones', en: 'Events & Celebrations', icono: PartyPopper, color: '#DB2777' },
  { id: 'Employment & HR', es: 'Empleo y RR. HH.', en: 'Employment & HR', icono: Briefcase, color: '#0891B2' },
  { id: 'Real Estate & Property', es: 'Inmobiliaria', en: 'Real Estate', icono: Home, color: '#2563EB' },
  { id: 'Business Contracts', es: 'Contratos', en: 'Contracts', icono: FileSignature, color: '#7C3AED' },
  { id: 'Financial & Lending', es: 'Financiero', en: 'Financial', icono: Landmark, color: '#059669' },
  { id: 'Estate Planning & Personal', es: 'Personal y Sucesiones', en: 'Estate & Personal', icono: Scale, color: '#B45309' },
  { id: 'Business Formation', es: 'Crear Empresa', en: 'Business Formation', icono: Building2, color: '#DC2626' },
  { id: 'Digital & Website', es: 'Digital y Web', en: 'Digital & Web', icono: Globe, color: '#0D9488' },
];

/** La categoría tal como debe verse. Si no está registrada, se devuelve su
 *  clave: es preferible mostrar el nombre en inglés que dejar un hueco. */
export function nombreCategoria(id: string, language: 'en' | 'es'): string {
  const c = CATEGORIAS.find((x) => x.id === id);
  if (!c) return id;
  return language === 'es' ? c.es : c.en;
}

export function metaCategoria(id: string): CategoriaMeta | undefined {
  return CATEGORIAS.find((x) => x.id === id);
}

/** Traduce la categoría de las plantillas en español, que la traen ya
 *  traducida en su propio archivo, a la clave en inglés con la que se
 *  filtra. Sin esto, una plantilla ES quedaría fuera de su propio filtro. */
const ALIAS_ES: Record<string, string> = {
  'Eventos y Celebraciones': 'Events & Celebrations',
  'Empleo y Recursos Humanos': 'Employment & HR',
  'Inmobiliaria y Propiedad': 'Real Estate & Property',
  'Contratos Comerciales': 'Business Contracts',
  'Financiero y Legal': 'Financial & Lending',
  'Financiero y Préstamos': 'Financial & Lending',
  'Planificación Patrimonial y Personal': 'Estate Planning & Personal',
  'Constitución de Empresas': 'Business Formation',
  'Digital y Sitio Web': 'Digital & Website',
};

export function claveCategoria(categoria: string): string {
  return ALIAS_ES[categoria] ?? categoria;
}
