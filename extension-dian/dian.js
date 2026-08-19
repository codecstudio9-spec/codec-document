// Lógica compartida entre background.js y popup.js.
//
// El regex de CUFE y la lista blanca de hosts están calcados a propósito de
// supabase/functions/dian-descargar/index.ts — no hay razón para que estas
// reglas diverjan entre el proxy (que ya no puede autenticar) y la extensión
// (que lo reemplaza). La descarga en sí ya NO se arma como una URL adivinada
// aquí: se automatiza el buscador real del portal (ver background.js).

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

export function cufesDeTexto(texto) {
  const vistos = new Set();
  for (const c of texto.split(/[\s,;]+/)) {
    const t = c.trim().toLowerCase();
    if (CUFE_RE.test(t)) vistos.add(t);
  }
  return [...vistos];
}
