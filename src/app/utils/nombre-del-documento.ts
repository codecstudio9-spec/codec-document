/**
 * Cómo se llama un documento generado, y cómo se llama su archivo.
 *
 * Un documento que se descarga como «Matricula.pdf» es indistinguible del
 * anterior en cuanto hay dos. Quien matricula a treinta estudiantes acaba con
 * treinta «Matricula (1).pdf», «Matricula (2).pdf» y ninguna forma de saber
 * cuál es cuál sin abrirlos. El nombre de la persona es el único dato que los
 * distingue, y ya está escrito en el formulario.
 *
 * Aquí se decide QUÉ campo del formulario es esa persona, entre todos los que
 * pueda tener una plantilla arbitraria.
 */

export interface CampoConEtiqueta {
  /** La clave del campo: `nombre_estudiante`, `client_name`… */
  key: string;
  label: string;
}

/**
 * Pistas para encontrar a la persona, de más específica a más genérica.
 *
 * El orden importa y no es decorativo. Una plantilla de matrícula puede tener
 * «Nombre del estudiante» y «Nombre del acudiente»: las dos encajan con
 * «nombre», así que ganaría la que aparezca primero en el formulario, que no
 * tiene por qué ser la correcta. Buscando antes «estudiante» se acierta.
 *
 * Y el titular va antes que el genérico por la misma razón: en un contrato con
 * «Nombre de la empresa» y «Nombre del contratante», el segundo es la persona.
 */
const PISTAS: RegExp[] = [
  /\b(estudiante|alumn[oa]|aprendiz|student|pupil)\b/i,
  /\b(nombre\s+completo|full\s*name|nombre\s+y\s+apellidos)\b/i,
  /\b(contratante|titular|beneficiari[oa]|afiliad[oa]|paciente|patient|holder)\b/i,
  /\b(cliente|client|comprador|buyer|arrendatari[oa]|tenant|deudor|borrower)\b/i,
  /\b(emplead[oa]|trabajador|employee|worker|candidat[oa]|aspirante)\b/i,
  /\b(firmante|signer|signatory|destinatari[oa])\b/i,
  /\bnombre\b|\bname\b/i,
];

/** Campos que llevan «nombre» pero no son de una persona. Sin esto, «Nombre
 *  de la empresa» ganaría en plantillas donde va antes que el del cliente. */
const NO_ES_PERSONA = /\b(empresa|compañ[ií]a|company|raz[óo]n\s+social|instituci[óo]n|colegio|entidad|banco|marca|brand|producto|proyecto|project|archivo|file|documento|document|plantilla|template|curso|programa|sede|ciudad|city|pa[íi]s|country)\b/i;

/** ¿Este valor puede ser el nombre de una persona? */
function pareceNombre(valor: string): boolean {
  const v = valor.trim();
  if (v.length < 3 || v.length > 60) return false;
  if (v.includes('@')) return false;            // un correo, no un nombre
  if (/\d/.test(v)) return false;               // cédulas, fechas, importes
  // Al menos dos letras seguidas: descarta iniciales sueltas y símbolos.
  return /\p{L}{2,}/u.test(v);
}

/**
 * El nombre de la persona del documento, buscado entre los valores del
 * formulario. Devuelve cadena vacía si ninguno encaja — mejor sin nombre que
 * con el dato equivocado en el título del archivo.
 */
export function nombrePersonaDeValores(
  valores: Record<string, string | number | boolean>,
  campos?: CampoConEtiqueta[],
): string {
  // Se busca por la etiqueta que ve el usuario y por la clave interna: una
  // plantilla puede tener la clave en inglés y la etiqueta en español, o al
  // revés, y cualquiera de las dos sirve para reconocer el campo.
  const candidatos = campos?.length
    ? campos.map((c) => ({ clave: c.key, texto: `${c.label} ${c.key}` }))
    : Object.keys(valores).map((k) => ({ clave: k, texto: k.replace(/[_-]+/g, ' ') }));

  for (const pista of PISTAS) {
    for (const { clave, texto } of candidatos) {
      if (NO_ES_PERSONA.test(texto)) continue;
      if (!pista.test(texto)) continue;
      const valor = String(valores[clave] ?? '').trim();
      if (pareceNombre(valor)) return valor;
    }
  }
  return '';
}

/**
 * El título del documento: el de la plantilla, y de quién es.
 *
 * Si no se identificó a nadie se devuelve el nombre de la plantilla a secas.
 * Un título a medias —«Matrícula de »— sería peor que el genérico.
 */
export function tituloDeDocumento(
  nombrePlantilla: string,
  nombrePersona: string,
  language: 'en' | 'es',
): string {
  const base = nombrePlantilla.trim() || (language === 'en' ? 'Document' : 'Documento');
  const persona = nombrePersona.trim();
  if (!persona) return base;
  return language === 'en' ? `${base} - ${persona}` : `${base} de ${persona}`;
}

/**
 * El título convertido en nombre de archivo.
 *
 * Se conservan las tildes y la eñe. La limpieza anterior era
 * `replace(/[^a-z0-9]+/gi, '-')`, que borra todo lo que no sea ASCII: «Matrícula
 * de Valentina Gómez» se descargaba como «Matr-cula-de-Valentina-G-mez.pdf».
 * Windows, macOS y Linux aceptan tildes en los nombres de archivo desde hace
 * décadas; lo que no aceptan es este puñado de caracteres reservados.
 */
export function nombreDeArchivo(titulo: string, extension = 'pdf'): string {
  const RESERVADOS = new Set(['\\', '/', ':', '*', '?', '"', '<', '>', '|']);

  let limpio = '';
  for (const c of titulo) {
    // Los caracteres de control se descartan comparando su código, no con un
    // rango dentro de una expresión regular: escribir ese rango a mano deja
    // bytes de control literales en el archivo fuente.
    if (c.charCodeAt(0) < 32) continue;
    limpio += RESERVADOS.has(c) ? ' ' : c;
  }

  limpio = limpio
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
    // Windows tampoco admite un punto final: «Doc..pdf» quedaría inválido.
    .replace(/\.+$/, '')
    .trim();

  return `${limpio || 'documento'}.${extension}`;
}
