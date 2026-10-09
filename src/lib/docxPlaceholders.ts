/**
 * Convierte un Word "normal" en plantilla sin que el cliente aprenda ninguna
 * sintaxis.
 *
 * Antes, subir un Word exigía haber escrito {{llaves_dobles}} en cada dato, o
 * tener los datos en negrita detrás de "Etiqueta:". Si no, el editor
 * respondía con un error y el cliente se quedaba sin saber qué hacer. Los
 * documentos reales casi nunca vienen así: vienen con líneas para llenar
 * (____ o .........), con [Nombre del cliente] (lo que escriben las IAs y
 * muchos modelos de abogados), con XXXX, con <<campo>>, o con el dato
 * resaltado en amarillo.
 *
 * Aquí se reconoce todo eso y se reescribe el document.xml para que cada
 * hueco quede como {{clave}} — el mismo formato que ya entiende el resto del
 * sistema (detectFields, renderDocxTemplate, el formulario, el enlace
 * público). Y si aun así no hay nada que reconocer, `marcarTextoComoCampo`
 * deja que el cliente seleccione con el mouse el dato que cambia ("Juan
 * Pérez") y lo convierte en campo en todas las partes donde aparece: la
 * versión para Word del "arrastrar un campo" de Dropbox Sign.
 *
 * El trabajo se hace a nivel de párrafo y no de "run": Word parte el texto
 * en trozos arbitrarios (un "[Nombre" en un run y "del cliente]" en otro),
 * así que se busca sobre el texto completo del párrafo y luego se reparte el
 * reemplazo entre los <w:t> originales, conservando su formato.
 */
import PizZip from 'pizzip';
import type { DetectedField, DetectedFieldType } from './docxTemplateEngine';

// ── Utilidades XML ─────────────────────────────────────────────────────────

const decode = (s: string) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const encode = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const PARAGRAPH_RE = /<w:p[ >][\s\S]*?<\/w:p>/g;
// <w:t> o <w:t xml:space="preserve"> — nunca <w:tab/>, <w:tbl>, <w:tc>…
const TEXT_NODE_RE = /<w:t(\s[^>]*)?>([\s\S]*?)<\/w:t>/g;

interface Reemplazo { start: number; end: number; texto: string }

/** Reescribe un párrafo aplicando reemplazos expresados en posiciones de su
 *  texto plano (ya decodificado). Cada reemplazo se escribe en el <w:t> donde
 *  empieza la coincidencia; los caracteres sobrantes se quitan de los demás. */
function aplicarReemplazos(parrafo: string, reemplazos: Reemplazo[]): string {
  if (reemplazos.length === 0) return parrafo;
  const orden = [...reemplazos].sort((a, b) => a.start - b.start);

  let cursorTexto = 0;
  return parrafo.replace(TEXT_NODE_RE, (_nodo, _attrs: string | undefined, crudo: string) => {
    const texto = decode(crudo);
    const inicio = cursorTexto;
    const fin = inicio + texto.length;
    cursorTexto = fin;

    let nuevo = '';
    for (let i = inicio; i < fin; i++) {
      const r = orden.find((x) => i >= x.start && i < x.end);
      if (!r) { nuevo += texto[i - inicio]; continue; }
      if (i === r.start) nuevo += r.texto;
    }
    return `<w:t xml:space="preserve">${encode(nuevo)}</w:t>`;
  });
}

function textoDelParrafo(parrafo: string): string {
  let out = '';
  for (const m of parrafo.matchAll(TEXT_NODE_RE)) out += decode(m[2]);
  return out;
}

function reescribirDocumento(xml: string, porParrafo: (parrafo: string, texto: string) => string): string {
  return xml.replace(PARAGRAPH_RE, (p) => porParrafo(p, textoDelParrafo(p)));
}

function leerDocumento(buf: ArrayBuffer): { zip: PizZip; xml: string } {
  const zip = new PizZip(buf);
  const archivo = zip.file('word/document.xml');
  if (!archivo) throw new Error('Archivo .docx inválido: no se encontró word/document.xml');
  return { zip, xml: archivo.asText() };
}

function escribirDocumento(zip: PizZip, xml: string): ArrayBuffer {
  zip.file('word/document.xml', xml);
  return zip.generate({ type: 'arraybuffer' }) as ArrayBuffer;
}

// ── Claves y etiquetas ─────────────────────────────────────────────────────

export function claveDeEtiqueta(etiqueta: string): string {
  return etiqueta
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'campo';
}

function etiquetaLegible(t: string): string {
  const limpio = t.replace(/[_\s]+/g, ' ').trim();
  if (!limpio) return limpio;
  // «NOMBRE DEL CLIENTE» → «Nombre del cliente»
  const base = limpio === limpio.toUpperCase() ? limpio.toLowerCase() : limpio;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function tipoPorEtiqueta(etiqueta: string): DetectedFieldType {
  return /\b(fecha|date|d[ií]a de)\b/i.test(etiqueta) ? 'date' : 'text';
}

const PALABRAS_VACIAS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'con', 'en', 'por', 'para', 'a', 'al', 'y', 'e', 'o', 'u', 'un', 'una',
  'su', 'sus', 'que', 'se', 'es', 'no', 'n', 'nº', 'no.', 'of', 'the', 'and', 'to', 'in', 'by', 'for', 'with', 'at', 'on',
]);

/** Para un hueco sin nombre (____), adivina qué dato va ahí mirando lo que
 *  hay justo antes: «Nombre: ____» → «Nombre»; «identificado con cédula
 *  ____ de» → «Cédula». Si no hay nada útil, null. */
function etiquetaPorContexto(antes: string): string | null {
  // Lo que pega al hueco y no es parte del nombre: espacios, $, signos.
  const t = antes.replace(/[\s.…_$€£#Nº°]+$/u, '');
  const conDosPuntos = /([^:：.;\n]{2,60})[:：]$/.exec(t);
  if (conDosPuntos) return etiquetaLegible(conDosPuntos[1].replace(/^.*[,;]\s*/, ''));
  // «identificado con cédula ____» → las palabras después de la última
  // palabra vacía: «cédula».
  const palabras = t.split(/\s+/).filter(Boolean).slice(-4);
  while (palabras.length && PALABRAS_VACIAS.has(palabras[palabras.length - 1].toLowerCase())) palabras.pop();
  let corte = palabras.length;
  while (corte > 0 && !PALABRAS_VACIAS.has(palabras[corte - 1].toLowerCase())) corte--;
  const cola = palabras.slice(Math.max(corte, palabras.length - 2));
  const utiles = cola.join(' ').replace(/[^\p{L}\p{N} ]/gu, '').trim();
  return utiles.length >= 3 ? etiquetaLegible(utiles) : null;
}

class RegistroCampos {
  campos: DetectedField[] = [];
  private porClave = new Map<string, DetectedField>();
  private usos = new Map<string, number>();

  private ocupadas = new Set<string>();

  constructor(clavesExistentes: string[] = []) {
    for (const k of clavesExistentes) { this.usos.set(k, 1); this.ocupadas.add(k); }
  }

  /** Un mismo [Nombre del cliente] repetido es UN campo (se llena una vez). */
  compartido(etiqueta: string): string {
    const clave = claveDeEtiqueta(etiqueta);
    if (!this.porClave.has(clave)) {
      const campo: DetectedField = { key: clave, label: etiquetaLegible(etiqueta), type: tipoPorEtiqueta(etiqueta), required: true };
      this.porClave.set(clave, campo);
      this.campos.push(campo);
      this.usos.set(clave, (this.usos.get(clave) ?? 0) + 1);
    }
    return clave;
  }

  /** Un hueco ____ siempre es un campo nuevo: dos líneas en blanco detrás de
   *  «Cédula» pueden ser de dos personas distintas. */
  nuevo(etiqueta: string | null): string {
    const base = etiqueta ?? `Dato ${this.campos.length + 1}`;
    const claveBase = claveDeEtiqueta(base);
    // Se salta cualquier número ya usado: con «nombre» y «nombre_2» ya en la
    // plantilla, el siguiente tiene que ser «nombre_3», no otro «nombre_2».
    let n = (this.usos.get(claveBase) ?? 0) + 1;
    while (this.ocupadas.has(n > 1 ? `${claveBase}_${n}` : claveBase)) n += 1;
    this.usos.set(claveBase, n);
    const clave = n > 1 ? `${claveBase}_${n}` : claveBase;
    this.ocupadas.add(clave);
    const campo: DetectedField = {
      key: clave,
      label: n > 1 ? `${etiquetaLegible(base)} (${n})` : etiquetaLegible(base),
      type: tipoPorEtiqueta(base),
      required: true,
    };
    this.porClave.set(clave, campo);
    this.campos.push(campo);
    return clave;
  }
}

// ── Detección automática ───────────────────────────────────────────────────

/** Huecos con nombre: [Nombre del cliente], <<Nombre>>, {Nombre} — con al
 *  menos una letra (para no tocar referencias como [1]). */
const CON_NOMBRE_RE = /\[([^[\]\n{}]{2,60})\]|<<\s*([^<>\n]{2,60}?)\s*>>|(?<!\{)\{([^{}\n]{2,60})\}(?!\})/g;
/** Huecos sin nombre: ______, ........, ……, XXXX */
const SIN_NOMBRE_RE = /_{4,}|\.{6,}|…{3,}|\bX{4,}\b|\bx{4,}\b/g;

function reemplazosAutomaticos(texto: string, registro: RegistroCampos): Reemplazo[] {
  const ocupados: Array<[number, number]> = [...texto.matchAll(/\{\{[^}]*\}\}/g)]
    .map((m) => [m.index!, m.index! + m[0].length]);
  const libre = (s: number, e: number) => !ocupados.some(([a, b]) => s < b && e > a);
  const out: Reemplazo[] = [];

  for (const m of texto.matchAll(CON_NOMBRE_RE)) {
    const etiqueta = (m[1] ?? m[2] ?? m[3] ?? '').trim();
    const s = m.index!, e = s + m[0].length;
    if (!/\p{L}/u.test(etiqueta) || !libre(s, e)) continue;
    out.push({ start: s, end: e, texto: `{{${registro.compartido(etiqueta)}}}` });
    ocupados.push([s, e]);
  }
  for (const m of texto.matchAll(SIN_NOMBRE_RE)) {
    const s = m.index!, e = s + m[0].length;
    if (!libre(s, e)) continue;
    // Una línea de puntos SIN nada antes en el párrafo suele ser un índice o
    // un separador, no un dato.
    const antes = texto.slice(0, s);
    if (m[0][0] === '.' && !antes.trim()) continue;
    // «Firma: ______» es donde va la firma, no un dato que se escribe: si se
    // volvía campo, el formulario le pedía al cliente «escribir» su firma.
    const etiqueta = etiquetaPorContexto(antes);
    if (etiqueta && /^(firma|signature|sign here|firme aqu[ií])\b/i.test(etiqueta.trim())) continue;
    out.push({ start: s, end: e, texto: `{{${registro.nuevo(etiqueta)}}}` });
    ocupados.push([s, e]);
  }
  return out;
}

/** Texto resaltado en amarillo (o con sombreado amarillo): la forma más común
 *  de marcar "esto cambia" en las oficinas. Los runs resaltados seguidos se
 *  vuelven un solo campo, y se les quita el resaltado. */
function reescribirResaltados(parrafo: string, registro: RegistroCampos): string {
  const RUN_RE = /<w:r(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g;
  const esResaltado = (run: string) => {
    const rPr = /<w:rPr>[\s\S]*?<\/w:rPr>/.exec(run)?.[0] ?? '';
    return /<w:highlight\s+w:val="(?!none)[^"]+"/.test(rPr) || /<w:shd\b[^>]*w:fill="(FFFF00|FFF2CC|FFFF99)"/i.test(rPr);
  };
  const textoRun = (run: string) => [...run.matchAll(TEXT_NODE_RE)].map((m) => decode(m[2])).join('');

  let out = '';
  let antes = '';
  let grupo: string[] = [];
  let ultimo = 0;
  const cerrarGrupo = () => {
    if (grupo.length === 0) return;
    const valor = grupo.map(textoRun).join('').trim();
    if (!valor || valor.includes('{{')) {
      out += grupo.join('');
      antes += grupo.map(textoRun).join('');
    } else {
      const etiqueta = etiquetaPorContexto(antes);
      const clave = etiqueta ? registro.nuevo(etiqueta) : registro.compartido(valor.slice(0, 40));
      const rPr = (/<w:rPr>[\s\S]*?<\/w:rPr>/.exec(grupo[0])?.[0] ?? '')
        .replace(/<w:highlight\b[^>]*\/>/g, '').replace(/<w:shd\b[^>]*\/>/g, '');
      out += `<w:r>${rPr}<w:t xml:space="preserve">{{${clave}}}</w:t></w:r>`;
      antes = '';
    }
    grupo = [];
  };

  for (const m of parrafo.matchAll(RUN_RE)) {
    const run = m[0];
    const hueco = parrafo.slice(ultimo, m.index);
    ultimo = m.index! + run.length;
    if (esResaltado(run) && textoRun(run)) {
      if (grupo.length && hueco) grupo.push(hueco); else if (hueco) out += hueco;
      grupo.push(run);
    } else {
      cerrarGrupo();
      out += hueco + run;
      antes += textoRun(run);
    }
  }
  cerrarGrupo();
  return out + parrafo.slice(ultimo);
}

export interface ResultadoDeteccion {
  docx: ArrayBuffer;
  campos: DetectedField[];
}

/** Reconoce los huecos de un Word sin {{variables}} y los convierte en
 *  campos. Devuelve el documento reescrito y los campos encontrados (vacío
 *  si no había nada reconocible). */
export function detectarHuecosEnWord(buf: ArrayBuffer, clavesExistentes: string[] = []): ResultadoDeteccion {
  const { zip, xml } = leerDocumento(buf);
  const registro = new RegistroCampos(clavesExistentes);
  let nuevo = reescribirDocumento(xml, (p) => reescribirResaltados(p, registro));
  nuevo = reescribirDocumento(nuevo, (p, texto) => aplicarReemplazos(p, reemplazosAutomaticos(texto, registro)));
  if (registro.campos.length === 0) return { docx: buf, campos: [] };
  return { docx: escribirDocumento(zip, nuevo), campos: registro.campos };
}

// ── Marcado manual ─────────────────────────────────────────────────────────

/** El cliente selecciona «Juan Pérez» en la vista del documento y le pone un
 *  nombre («Nombre del cliente»): se reemplaza en TODO el documento, porque
 *  si el nombre aparece en el encabezado y en la firma, es el mismo dato.
 *  Devuelve null si el texto no aparece tal cual (p. ej. la selección cruzó
 *  dos párrafos). */
export function marcarTextoComoCampo(
  buf: ArrayBuffer,
  textoSeleccionado: string,
  etiqueta: string,
  clavesExistentes: string[],
): (ResultadoDeteccion & { veces: number }) | null {
  const buscado = textoSeleccionado.trim();
  if (!buscado || buscado.includes('\n') || buscado.includes('{{')) return null;
  const { zip, xml } = leerDocumento(buf);
  const registro = new RegistroCampos(clavesExistentes);
  const clave = registro.nuevo(etiqueta.trim() || buscado.slice(0, 40));
  let veces = 0;

  const nuevo = reescribirDocumento(xml, (p, texto) => {
    const reemplazos: Reemplazo[] = [];
    let desde = 0;
    let i: number;
    while ((i = texto.indexOf(buscado, desde)) !== -1) {
      reemplazos.push({ start: i, end: i + buscado.length, texto: `{{${clave}}}` });
      desde = i + buscado.length;
    }
    veces += reemplazos.length;
    return aplicarReemplazos(p, reemplazos);
  });
  if (veces === 0) return null;
  return { docx: escribirDocumento(zip, nuevo), campos: registro.campos, veces };
}

/** Párrafos del documento como texto, con los {{campos}} separados, para la
 *  vista donde el cliente selecciona los datos. */
export function parrafosParaMarcar(buf: ArrayBuffer): string[] {
  const { xml } = leerDocumento(buf);
  return (xml.match(PARAGRAPH_RE) ?? []).map(textoDelParrafo);
}

// ── Colocar campos arrastrando ─────────────────────────────────────────────
//
// La otra forma de armar la plantilla, al estilo de Dropbox Sign: el cliente
// ve el documento y arrastra un campo al punto exacto donde va, o mueve uno
// que quedó mal puesto. Las posiciones son (párrafo, carácter) sobre el mismo
// texto que devuelve parrafosParaMarcar, así que la vista y el Word coinciden.

/** Lo que queda en el texto cuando se quita o se mueve un campo: la línea
 *  para llenar a mano, no un hueco invisible. */
export const LINEA_EN_BLANCO = '__________';

export interface PosicionEnDocumento { parrafo: number; offset: number }
export interface RangoEnDocumento { parrafo: number; start: number; end: number }

/** Como aplicarReemplazos, pero también admite inserciones (start === end):
 *  se escriben justo antes del carácter `start`, o al final del párrafo. */
function aplicarEdiciones(parrafo: string, ediciones: Reemplazo[]): string {
  if (ediciones.length === 0) return parrafo;
  const total = textoDelParrafo(parrafo).length;
  const orden = [...ediciones].sort((a, b) => a.start - b.start || a.end - b.end);
  const inserciones = orden.filter((e) => e.start === e.end);
  const reemplazos = orden.filter((e) => e.start !== e.end);

  let cursorTexto = 0;
  return parrafo.replace(TEXT_NODE_RE, (_nodo, _attrs: string | undefined, crudo: string) => {
    const texto = decode(crudo);
    const inicio = cursorTexto;
    const fin = inicio + texto.length;
    cursorTexto = fin;

    let nuevo = '';
    for (let i = inicio; i < fin; i++) {
      for (const ins of inserciones) if (ins.start === i) nuevo += ins.texto;
      const r = reemplazos.find((x) => i >= x.start && i < x.end);
      if (!r) { nuevo += texto[i - inicio]; continue; }
      if (i === r.start) nuevo += r.texto;
    }
    if (fin === total) for (const ins of inserciones) if (ins.start === total) nuevo += ins.texto;
    return `<w:t xml:space="preserve">${encode(nuevo)}</w:t>`;
  });
}

function editarParrafos(buf: ArrayBuffer, ediciones: Map<number, Reemplazo[]>): ArrayBuffer {
  const { zip, xml } = leerDocumento(buf);
  let indice = -1;
  const nuevo = xml.replace(PARAGRAPH_RE, (p) => {
    indice += 1;
    const propias = ediciones.get(indice);
    return propias ? aplicarEdiciones(p, propias) : p;
  });
  return escribirDocumento(zip, nuevo);
}

/** Un párrafo sin ningún <w:t> (una línea vacía del Word) no puede recibir
 *  texto sin inventar un run nuevo con un formato que no es el del documento. */
export function parrafoAdmiteCampo(buf: ArrayBuffer, parrafo: number): boolean {
  const { xml } = leerDocumento(buf);
  const p = (xml.match(PARAGRAPH_RE) ?? [])[parrafo];
  return Boolean(p && /<w:t(\s[^>]*)?>/.test(p));
}

/** El {{campo}} con un espacio a cada lado si quedaría pegado a una palabra:
 *  soltarlo al final de «Estimate» no debe dar «Estimate{{nombre}}». */
function conEspacios(texto: string, offset: number, tag: string): string {
  const antes = texto[offset - 1] ?? '';
  const despues = texto[offset] ?? '';
  const pegaAntes = antes !== '' && !/[\s(«"'“¿¡/]/.test(antes);
  const pegaDespues = despues !== '' && !/[\s.,;:)»"'”?!/]/.test(despues);
  return `${pegaAntes ? ' ' : ''}${tag}${pegaDespues ? ' ' : ''}`;
}

/** Pone un campo en una posición. Con `claveExistente` reutiliza un dato que
 *  ya existe («el nombre del cliente aparece también aquí»); si no, crea un
 *  campo nuevo con esa etiqueta. */
export function insertarCampo(
  buf: ArrayBuffer,
  en: PosicionEnDocumento,
  opciones: { claveExistente?: string; etiqueta?: string; tipo?: DetectedFieldType },
  clavesExistentes: string[],
): ResultadoDeteccion {
  const registro = new RegistroCampos(clavesExistentes);
  let clave = opciones.claveExistente;
  if (!clave) {
    clave = registro.nuevo(opciones.etiqueta?.trim() || null);
    const campo = registro.campos[registro.campos.length - 1];
    if (opciones.tipo) campo.type = opciones.tipo;
  }
  const texto = parrafosParaMarcar(buf)[en.parrafo] ?? '';
  const docx = editarParrafos(buf, new Map([[en.parrafo, [{ start: en.offset, end: en.offset, texto: conEspacios(texto, en.offset, `{{${clave}}}`) }]]]));
  return { docx, campos: registro.campos };
}

/** Mueve un {{campo}} a otra posición; donde estaba queda la línea en blanco. */
export function moverCampo(buf: ArrayBuffer, desde: RangoEnDocumento, hasta: PosicionEnDocumento): ArrayBuffer {
  // Soltarlo dentro de sí mismo, o justo al lado, no cambia nada.
  if (desde.parrafo === hasta.parrafo && hasta.offset >= desde.start && hasta.offset <= desde.end) return buf;
  const parrafos = parrafosParaMarcar(buf);
  const etiquetaCampo = parrafos[desde.parrafo]?.slice(desde.start, desde.end) ?? '';
  if (!/^\{\{[^}]+\}\}$/.test(etiquetaCampo)) return buf;
  const ediciones = new Map<number, Reemplazo[]>();
  const agregar = (p: number, e: Reemplazo) => ediciones.set(p, [...(ediciones.get(p) ?? []), e]);
  agregar(desde.parrafo, { start: desde.start, end: desde.end, texto: LINEA_EN_BLANCO });
  agregar(hasta.parrafo, { start: hasta.offset, end: hasta.offset, texto: conEspacios(parrafos[hasta.parrafo] ?? '', hasta.offset, etiquetaCampo) });
  return editarParrafos(buf, ediciones);
}

/** Quita un {{campo}} del texto y deja la línea en blanco en su lugar. */
export function quitarCampo(buf: ArrayBuffer, rango: RangoEnDocumento): ArrayBuffer {
  return editarParrafos(buf, new Map([[rango.parrafo, [{ start: rango.start, end: rango.end, texto: LINEA_EN_BLANCO }]]]));
}

/** Claves de los {{campos}} que siguen en el documento, en orden de aparición. */
export function clavesEnDocumento(buf: ArrayBuffer): string[] {
  const vistas = new Set<string>();
  for (const texto of parrafosParaMarcar(buf)) {
    for (const m of texto.matchAll(/\{\{\s*([^}:]+?)\s*(?::[^}]*)?\}\}/g)) vistas.add(m[1]);
  }
  return [...vistas];
}
