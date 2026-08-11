// Variaciones por país de la carta de renuncia.
//
// La carta es la misma en todos los países; lo que cambia son las palabras
// que un empleador local espera leer. Escribir "cédula de ciudadanía" en
// México o "prestaciones sociales" en Chile delata de inmediato que la
// carta salió de una plantilla de otro país, y eso resta seriedad justo en
// el documento con el que alguien cierra una etapa laboral.
//
// El país NO aparece nombrado en el documento: sólo moldea el vocabulario.
// Ver getCountrySpecificResignation() al final.
//
// ── Sobre los plazos de preaviso ────────────────────────────────────────
// El plazo se toma del campo que llena el usuario, no de aquí. Lo que
// aporta este archivo es una NOTA con el plazo habitual del país, marcada
// como referencia y con la indicación de verificar el contrato o el
// convenio aplicable. Afirmar un plazo legal exacto por país sería
// arriesgado: cambia según el tipo de contrato, la antigüedad y el
// convenio colectivo, y una carta que invoca un plazo equivocado puede
// costarle dinero a quien la firma.

export interface VariacionPais {
  /** Cómo se llama el documento de identidad. */
  documento: string;
  /** Forma corta para la firma. */
  documentoCorto: string;
  /** Cómo se llama el pago final de la relación laboral. */
  liquidacion: string;
  /** Cómo se llama el certificado que acredita el trabajo. */
  certificado: string;
  /** Plazo de preaviso habitual, como referencia para el usuario. */
  preavisoHabitual: string;
}

export const PAISES_RENUNCIA: Record<string, VariacionPais> = {
  Colombia: {
    documento: 'cédula de ciudadanía',
    documentoCorto: 'C.C.',
    liquidacion: 'liquidación de prestaciones sociales',
    certificado: 'certificación laboral',
    preavisoHabitual: '30 días',
  },
  México: {
    documento: 'clave única de registro de población (CURP)',
    documentoCorto: 'CURP',
    liquidacion: 'finiquito',
    certificado: 'constancia de trabajo',
    preavisoHabitual: '15 días',
  },
  Chile: {
    documento: 'cédula de identidad (RUT)',
    documentoCorto: 'RUT',
    liquidacion: 'finiquito',
    certificado: 'certificado de trabajo',
    preavisoHabitual: '30 días',
  },
  Perú: {
    documento: 'documento nacional de identidad (DNI)',
    documentoCorto: 'DNI',
    liquidacion: 'liquidación de beneficios sociales',
    certificado: 'certificado de trabajo',
    preavisoHabitual: '30 días',
  },
  Argentina: {
    documento: 'documento nacional de identidad (DNI)',
    documentoCorto: 'DNI',
    liquidacion: 'liquidación final',
    certificado: 'certificado de trabajo',
    preavisoHabitual: '15 días',
  },
  Ecuador: {
    documento: 'cédula de identidad',
    documentoCorto: 'C.I.',
    liquidacion: 'liquidación de haberes',
    certificado: 'certificado laboral',
    preavisoHabitual: '15 días',
  },
  España: {
    documento: 'documento nacional de identidad (DNI)',
    documentoCorto: 'DNI',
    liquidacion: 'finiquito',
    certificado: 'certificado de empresa',
    preavisoHabitual: '15 días',
  },
  Panamá: {
    documento: 'cédula de identidad personal',
    documentoCorto: 'Cédula',
    liquidacion: 'liquidación',
    certificado: 'certificación laboral',
    preavisoHabitual: '30 días',
  },
  'Costa Rica': {
    documento: 'cédula de identidad',
    documentoCorto: 'Cédula',
    liquidacion: 'liquidación',
    certificado: 'carta de trabajo',
    preavisoHabitual: '30 días',
  },
  'República Dominicana': {
    documento: 'cédula de identidad y electoral',
    documentoCorto: 'Cédula',
    liquidacion: 'liquidación',
    certificado: 'certificación laboral',
    preavisoHabitual: '28 días',
  },
  Uruguay: {
    documento: 'cédula de identidad',
    documentoCorto: 'C.I.',
    liquidacion: 'liquidación final',
    certificado: 'certificado de trabajo',
    preavisoHabitual: '15 días',
  },
  Paraguay: {
    documento: 'cédula de identidad',
    documentoCorto: 'C.I.',
    liquidacion: 'liquidación',
    certificado: 'certificado de trabajo',
    preavisoHabitual: '30 días',
  },
  Bolivia: {
    documento: 'cédula de identidad',
    documentoCorto: 'C.I.',
    liquidacion: 'finiquito',
    certificado: 'certificado de trabajo',
    preavisoHabitual: '30 días',
  },
  Guatemala: {
    documento: 'documento personal de identificación (DPI)',
    documentoCorto: 'DPI',
    liquidacion: 'liquidación',
    certificado: 'constancia laboral',
    preavisoHabitual: '15 días',
  },
  Venezuela: {
    documento: 'cédula de identidad',
    documentoCorto: 'C.I.',
    liquidacion: 'liquidación de prestaciones sociales',
    certificado: 'constancia de trabajo',
    preavisoHabitual: '30 días',
  },
  'Estados Unidos': {
    documento: 'número de identificación',
    documentoCorto: 'ID',
    liquidacion: 'pago final',
    certificado: 'carta de verificación de empleo',
    preavisoHabitual: '2 semanas',
  },
  Otro: {
    documento: 'documento de identidad',
    documentoCorto: 'ID',
    liquidacion: 'liquidación final',
    certificado: 'certificado laboral',
    preavisoHabitual: '15 a 30 días',
  },
};

/** Los mismos datos en inglés, para cuando la interfaz está en ese idioma. */
export const PAISES_RENUNCIA_EN: Record<string, VariacionPais> = {
  'Estados Unidos': {
    documento: 'identification number',
    documentoCorto: 'ID',
    liquidacion: 'final paycheck',
    certificado: 'employment verification letter',
    preavisoHabitual: '2 weeks',
  },
  Otro: {
    documento: 'identification document',
    documentoCorto: 'ID',
    liquidacion: 'final settlement',
    certificado: 'employment certificate',
    preavisoHabitual: '2 to 4 weeks',
  },
};

export const LISTA_PAISES_RENUNCIA = Object.keys(PAISES_RENUNCIA);

/**
 * Adapta la carta al país elegido.
 *
 * Sustituye unos marcadores que el cuerpo de la plantilla deja puestos, en
 * vez de tener una plantilla por país: así el texto se mantiene en un solo
 * sitio y añadir un país es añadir una fila arriba.
 */
export function getCountrySpecificResignation(
  base: string,
  pais: string,
  language: 'en' | 'es' = 'es',
): string {
  const tabla = language === 'en'
    ? { ...PAISES_RENUNCIA, ...PAISES_RENUNCIA_EN }
    : PAISES_RENUNCIA;
  const v = tabla[pais] ?? tabla.Otro;

  return base
    .replace(/\{\{__documento\}\}/g, v.documento)
    .replace(/\{\{__documento_corto\}\}/g, v.documentoCorto)
    .replace(/\{\{__liquidacion\}\}/g, v.liquidacion)
    .replace(/\{\{__certificado\}\}/g, v.certificado)
    .replace(/\{\{__preaviso_habitual\}\}/g, v.preavisoHabitual);
}
