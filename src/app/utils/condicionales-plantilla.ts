/**
 * Resuelve los bloques `{{#if campo}} … {{else}} … {{/if}}` de las plantillas
 * integradas, incluidos los ANIDADOS.
 *
 * Antes cada pantalla lo hacía con
 * `/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/`, que corta en el PRIMER
 * `{{/if}}`: con un `{{#if}}` dentro de otro, el bloque de fuera se cerraba
 * antes de tiempo y su `{{/if}}` quedaba suelto en el documento (salía
 * «{{/if}}» impreso, o una raya en blanco en la vista previa). Y no entendía
 * `{{else}}`: «(d) {{#if lienholder_name}}hay un gravamen…{{else}}el vehículo
 * está libre…{{/if}}» quedaba en «(d) ;» si no había gravamen. Las plantillas
 * usan 236 bloques y 24 `{{else}}`.
 *
 * Se resuelve de dentro hacia fuera: cada vuelta toma los bloques que no
 * contienen otro `{{#if}}`, así el `{{/if}}` que cierra es siempre el suyo.
 */

/** Mismo criterio que ya usaban todas las pantallas. */
export function valorVerdadero(valor: unknown): boolean {
  if (valor === undefined || valor === null || valor === false) return false;
  const t = String(valor).trim();
  return t !== '' && t !== 'No' && t !== 'false';
}

const BLOQUE_INTERNO = /\{\{#if\s+([^}]+?)\s*\}\}((?:(?!\{\{#if\s)[\s\S])*?)\{\{\/if\}\}/g;

export function resolverCondicionales(
  plantilla: string,
  datos: Record<string, unknown>,
  esVerdadero: (valor: unknown) => boolean = valorVerdadero,
): string {
  let texto = plantilla;
  for (let vuelta = 0; vuelta < 20; vuelta++) {
    let cambio = false;
    texto = texto.replace(BLOQUE_INTERNO, (_m, campo: string, interior: string) => {
      cambio = true;
      const [siVerdadero, siFalso = ''] = interior.split(/\{\{else\}\}/);
      return esVerdadero(datos[campo.trim()]) ? siVerdadero : siFalso;
    });
    if (!cambio) break;
  }
  // Restos sin pareja (una plantilla mal cerrada): nunca se imprimen.
  return texto.replace(/\{\{#if\s+[^}]+\}\}|\{\{else\}\}|\{\{\/if\}\}/g, '');
}
