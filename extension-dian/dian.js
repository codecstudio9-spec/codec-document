// Lógica compartida entre background.js y popup.js.
//
// Deliberadamente calcada de supabase/functions/dian-descargar/index.ts:
// mismo regex de CUFE, misma lista blanca de hosts, misma forma de construir
// la URL de descarga a partir de la que pega el contador. No hay razón para
// que estas reglas diverjan entre el proxy (que ya no puede autenticar) y la
// extensión (que lo reemplaza) — son la misma pieza de dominio en dos sitios.

export const CUFE_RE = /^[0-9a-fA-F]{90,100}$/;

export const HOSTS_PERMITIDOS = [
  'catalogo-vpfe.dian.gov.co',
  'catalogo-vpfe-hab.dian.gov.co',
  'vpfe.dian.gov.co',
  'vpfe-hab.dian.gov.co',
];

export function validarHost(url) {
  if (url.protocol !== 'https:') return 'Solo se permiten direcciones https.';
  if (!HOSTS_PERMITIDOS.includes(url.hostname)) {
    return `Solo se permiten direcciones de la DIAN. Recibí "${url.hostname}".`;
  }
  return null;
}

/**
 * Construye la URL de descarga de un CUFE a partir de la que pegó el
 * contador. Tres casos, del más explícito al más general — ver el
 * comentario original en dian-descargar/index.ts para el porqué.
 */
export function construirUrl(base, cufe, nombreParam) {
  if (base.includes('{CUFE}')) {
    return new URL(base.replaceAll('{CUFE}', cufe));
  }
  const url = new URL(base);
  for (const [clave, valor] of url.searchParams.entries()) {
    if (CUFE_RE.test(valor)) {
      url.searchParams.set(clave, cufe);
      return url;
    }
  }
  url.searchParams.set(nombreParam || 'documentKey', cufe);
  return url;
}

export function cufesDeTexto(texto) {
  const vistos = new Set();
  for (const c of texto.split(/[\s,;]+/)) {
    const t = c.trim().toLowerCase();
    if (CUFE_RE.test(t)) vistos.add(t);
  }
  return [...vistos];
}

export const ENDPOINT_POR_DEFECTO = 'https://catalogo-vpfe.dian.gov.co/Document/DownloadZipFile?trackId={CUFE}';
