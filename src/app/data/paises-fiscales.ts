/**
 * Los países donde opera la plataforma y cómo se llama en cada uno el número
 * de identificación fiscal de una empresa.
 *
 * Nace de un desajuste concreto: Configuración pedía «EIN / Tax ID» con el
 * ejemplo «XX-XXXXXXX», y el PDF imprimía literalmente «EIN/Tax ID: 900.123.456»
 * en documentos colombianos. El EIN es el número federal estadounidense; en
 * Colombia eso es el NIT, en México el RFC, en Chile el RUT. Escribir el NIT de
 * una empresa colombiana detrás de la etiqueta «EIN» no es un detalle de
 * traducción: es un dato mal rotulado en un documento que alguien firma.
 *
 * Estados Unidos sigue primero en la lista a propósito — es el mercado
 * principal — pero ya no es el único que el formulario contempla.
 *
 * El país se guarda por su CÓDIGO ISO, no por su nombre. El campo era texto
 * libre, así que hay perfiles antiguos con «Colombia», «COLOMBIA», «Estados
 * Unidos» o «USA» escritos a mano; `resolverPais()` los reconoce para que un
 * perfil ya guardado no se quede sin país al abrir la pantalla.
 */

export interface PaisFiscal {
  code: string;
  nameEs: string;
  nameEn: string;
  flag: string;
  /** Cómo se llama ahí el identificador fiscal de una empresa. */
  fiscalLabel: string;
  /** Ejemplo con el formato real del país. */
  fiscalPlaceholder: string;
}

export const PAISES_FISCALES: PaisFiscal[] = [
  { code: 'US', nameEs: 'Estados Unidos', nameEn: 'United States', flag: '🇺🇸', fiscalLabel: 'EIN / Tax ID', fiscalPlaceholder: '12-3456789' },
  { code: 'CO', nameEs: 'Colombia', nameEn: 'Colombia', flag: '🇨🇴', fiscalLabel: 'NIT', fiscalPlaceholder: '900.123.456-7' },
  { code: 'MX', nameEs: 'México', nameEn: 'Mexico', flag: '🇲🇽', fiscalLabel: 'RFC', fiscalPlaceholder: 'ABC010203XY1' },
  { code: 'CL', nameEs: 'Chile', nameEn: 'Chile', flag: '🇨🇱', fiscalLabel: 'RUT', fiscalPlaceholder: '76.123.456-7' },
  { code: 'PE', nameEs: 'Perú', nameEn: 'Peru', flag: '🇵🇪', fiscalLabel: 'RUC', fiscalPlaceholder: '20123456789' },
  { code: 'AR', nameEs: 'Argentina', nameEn: 'Argentina', flag: '🇦🇷', fiscalLabel: 'CUIT', fiscalPlaceholder: '30-12345678-9' },
  { code: 'EC', nameEs: 'Ecuador', nameEn: 'Ecuador', flag: '🇪🇨', fiscalLabel: 'RUC', fiscalPlaceholder: '1790012345001' },
];

const POR_CODIGO = new Map(PAISES_FISCALES.map((p) => [p.code, p]));

/** Nombres escritos a mano que hay que seguir reconociendo, porque el campo
 *  fue texto libre antes de ser una lista. */
const ALIAS: Record<string, string> = {
  'estados unidos': 'US', 'united states': 'US', 'usa': 'US', 'us': 'US',
  'eeuu': 'US', 'ee.uu.': 'US', 'ee. uu.': 'US', 'united states of america': 'US',
  'colombia': 'CO', 'mexico': 'MX', 'méxico': 'MX', 'chile': 'CL',
  'peru': 'PE', 'perú': 'PE', 'argentina': 'AR', 'ecuador': 'EC',
};

/** Devuelve el país guardado, sea un código ISO o un nombre escrito a mano. */
export function resolverPais(valor: string | null | undefined): PaisFiscal | null {
  const bruto = (valor ?? '').trim();
  if (!bruto) return null;
  const porCodigo = POR_CODIGO.get(bruto.toUpperCase());
  if (porCodigo) return porCodigo;
  const code = ALIAS[bruto.toLowerCase()];
  return code ? POR_CODIGO.get(code) ?? null : null;
}

/**
 * La etiqueta del identificador fiscal para el país guardado.
 *
 * Sin país reconocido devuelve «Tax ID», que es lo genérico y honesto: mejor
 * una etiqueta neutra que afirmar «EIN» sobre un número que no lo es.
 */
export function etiquetaFiscal(pais: string | null | undefined, language: 'en' | 'es' = 'es'): string {
  const p = resolverPais(pais);
  if (p) return p.fiscalLabel;
  return language === 'en' ? 'Tax ID' : 'Identificación fiscal';
}

export function placeholderFiscal(pais: string | null | undefined): string {
  return resolverPais(pais)?.fiscalPlaceholder ?? '';
}

/** El nombre para mostrar, en el idioma de la interfaz. */
export function nombrePais(pais: string | null | undefined, language: 'en' | 'es' = 'es'): string {
  const p = resolverPais(pais);
  if (!p) return (pais ?? '').trim();
  return language === 'en' ? p.nameEn : p.nameEs;
}
