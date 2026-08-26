// Parte el texto plano de un contrato en "cajas" por cláusula, para el editor
// manual de preview-page.tsx ("Editar Contrato"). Antes todo el documento era
// un único <textarea> gigante; esto lo corta en tarjetas plegables por
// cláusula para que se pueda abrir sólo la que se quiere revisar o editar.
//
// La detección es deliberadamente conservadora: sólo reconoce como
// encabezado de cláusula una línea, rodeada de líneas en blanco, TODA en
// mayúsculas y con un guion largo ("—") en medio — el patrón "PRIMERA —
// OBJETO" / "ONE — PURPOSE" que usan todas las plantillas de este proyecto.
// Eso evita dos falsos positivos ya vistos en la plantilla de wedding
// planner: "LA PLANNER" y "EL CLIENTE" antes de cada firma también están
// solas, en mayúsculas y rodeadas de líneas en blanco, pero no llevan guion.
//
// Si el texto no tiene al menos dos encabezados reconocibles (un documento
// sin este patrón, o ya editado a mano hasta perder la forma), `splitIntoClauses`
// devuelve `null` y quien la llama debe caer de vuelta al editor de texto
// plano de siempre — nunca romper la edición porque el patrón no calzó.

export interface ClauseSegment {
  /** null sólo para el primer tramo: título del documento + identificación
   *  de las partes, antes de la primera cláusula. */
  heading: string | null;
  /** Líneas en blanco originales antes del encabezado — se preservan tal
   *  cual para que guardar sin tocar nada no mueva ni un salto de línea. */
  separatorBefore: string;
  /** Líneas en blanco originales entre el encabezado y el cuerpo. */
  separatorAfter: string;
  body: string;
}

// Letra mayúscula latina, con acentos españoles y diéresis — hace falta para
// que "SÉPTIMA", "CLÁUSULA", "PROPORCIÓN" no rompan el reconocimiento.
const MAYUS = 'A-ZÁÉÍÓÚÑÜ';

const HEADING_RE = new RegExp(
  `\\n\\n+([${MAYUS}0-9][${MAYUS}0-9.,()'/ ]{1,40}—[${MAYUS}0-9.,()'/ ]{2,90})\\n\\n+`,
  'g',
);

export function splitIntoClauses(text: string): ClauseSegment[] | null {
  const encontrados: { heading: string; before: string; after: string; matchStart: number; bodyStart: number }[] = [];

  HEADING_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = HEADING_RE.exec(text)) !== null) {
    const full = m[0];
    const heading = m[1];
    const headingIdx = full.indexOf(heading);
    encontrados.push({
      heading,
      before: full.slice(0, headingIdx),
      after: full.slice(headingIdx + heading.length),
      matchStart: m.index,
      bodyStart: m.index + full.length,
    });
  }

  // Con 0 o 1 encabezado no vale la pena partir en cajas — el editor de
  // texto plano de siempre sigue siendo la mejor opción.
  if (encontrados.length < 2) return null;

  const partes: ClauseSegment[] = [
    { heading: null, separatorBefore: '', separatorAfter: '', body: text.slice(0, encontrados[0].matchStart) },
  ];

  for (let i = 0; i < encontrados.length; i++) {
    const fin = i + 1 < encontrados.length ? encontrados[i + 1].matchStart : text.length;
    partes.push({
      heading: encontrados[i].heading,
      separatorBefore: encontrados[i].before,
      separatorAfter: encontrados[i].after,
      body: text.slice(encontrados[i].bodyStart, fin),
    });
  }

  return partes;
}

/** Inversa exacta de `splitIntoClauses`: si nada se editó, devuelve el mismo
 *  string original, carácter por carácter. */
export function joinClauses(partes: ClauseSegment[]): string {
  return partes
    .map((s) => (s.heading !== null ? s.separatorBefore + s.heading + s.separatorAfter + s.body : s.body))
    .join('');
}
