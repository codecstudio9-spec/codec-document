/**
 * Smart Quotes PDF — deliberadamente separado de PDFGenerator
 * (pdf-generator.ts), que está hecho para documentos legales con lógica de
 * jurisdicción y ya carga bastante complejidad propia.
 *
 * ── Por qué se reescribió la maquetación ─────────────────────────────────
 *
 * La versión anterior forzaba `addPage()` en cada sección: portada, resumen,
 * bloques de propuesta, tabla de ítems y aceptación. Una cotización de tres
 * productos salía en cinco páginas, casi todas vacías —la portada dejaba
 * 120 mm en blanco bajo el nombre del cliente, y la página de aceptación
 * tenía un párrafo y nada más—. Eso no es un problema estético: una
 * cotización de agendas que llega en cinco hojas se lee como relleno y resta
 * credibilidad al precio que va dentro.
 *
 * Ahora el documento FLUYE. Hay un solo motor de maquetación con un cursor
 * vertical (`ctx.y`) y una única regla —`asegurarEspacio()`— que salta de
 * página sólo cuando lo que viene no cabe. Una cotización corta sale en una
 * hoja; una propuesta larga crece hasta donde haga falta, sin huecos.
 *
 * Las cuatro plantillas siguen siendo distintas de verdad (no un recoloreado),
 * pero la diferencia está en la CABECERA y en los detalles de estilo, no en
 * gastar una hoja entera de portada:
 * - Corporate: banda de color superior, logo y datos enfrentados.
 * - Modern:    panel de color con el título en blanco dentro.
 * - Executive: serif centrado con doble filete fino, tono de carta formal.
 * - Minimal:   blanco y negro, un filete y mucho aire, sin rellenos.
 *
 * ── Marca y configuración del cliente ────────────────────────────────────
 *
 * El generador anterior leía sólo el logo y los colores, e ignoraba el resto
 * del perfil de marca que el cliente sí había configurado: tamaño del logo,
 * posición, si quiere logo en los documentos, marca de agua, y los datos de
 * pago. Aquí se respetan todos: lo que el cliente ve en Configuración es lo
 * que sale en el PDF.
 */
import { jsPDF } from 'jspdf';
import type { Quote, QuoteLineItem, ProposalBlocks, QuotePublicBranding } from './quotes-service';
import { computeLineItemTotal } from './quotes-service';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;
/**
 * Límite inferior del contenido. Debajo queda reservada la franja del pie:
 * la nota de aceptación y la línea de numeración.
 *
 * La reserva es deliberada. Cuando la nota se maquetaba como una sección más
 * del flujo, un documento que terminaba cerca del borde se llevaba esas dos
 * líneas a una hoja nueva —y salía una página entera en blanco con un párrafo
 * de letra pequeña arriba—. Reservar 30 mm en todas las páginas cuesta menos
 * que una hoja fantasma en cualquiera.
 */
const FONDO = PAGE_H - 30;

export type TemplateId = 'corporate' | 'modern' | 'executive' | 'minimal';
type Lang = 'es' | 'en';

function fmtMoney(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Caracteres Unicode invisibles (espacio de ancho cero, joiners, BOM, soft
// hyphen, marcas direccionales) que a veces cuela un modelo de IA al
// redactar texto — sobre todo alrededor de símbolos como "$" o "/". El
// texto extraído (copiar/pegar) los ignora y se ve normal, pero la fuente
// estándar de jsPDF (WinAnsi, 8 bits) no tiene glifo para ellos y les da un
// ancho de avance por defecto en vez de cero — el resultado visual es cada
// letra separada por un hueco, como si alguien hubiera espaciado el texto
// a mano. Confirmado reproduciendo el efecto exacto inyectando U+200B entre
// letras en un PDF de prueba. Se limpia UNA vez, al entrar el texto al
// generador, para cubrir tanto lo que escribe la IA como lo que alguien
// pega de Word o de una página web (ahí también aparecen seguido).
//
// Construidos desde sus códigos DECIMALES con String.fromCharCode, nunca
// como caracteres invisibles pegados literalmente en este archivo — eso
// sería imposible de revisar a simple vista en un editor de código.
// 173=soft hyphen, 8203-8207=zero-width space/joiners/LTR-RTL marks,
// 8234-8238=marcas de formato direccional, 8288=word joiner,
// 65279=BOM/zero-width no-break space, 1564=Arabic letter mark.
const INVISIBLE_CODES = [173, 8203, 8204, 8205, 8206, 8207, 8234, 8235, 8236, 8237, 8238, 8288, 65279, 1564];
const INVISIBLES_RE = new RegExp(`[${INVISIBLE_CODES.map((c) => String.fromCharCode(c)).join('')}]`, 'g');
function limpiarInvisibles(s: string | null | undefined): string {
  return s ? s.replace(INVISIBLES_RE, '') : '';
}

function limpiarQuoteYItems(quote: Quote, items: QuoteLineItem[]): { quote: Quote; items: QuoteLineItem[] } {
  const q: Quote = {
    ...quote,
    client_name: limpiarInvisibles(quote.client_name),
    client_company: quote.client_company ? limpiarInvisibles(quote.client_company) : quote.client_company,
    client_position: quote.client_position ? limpiarInvisibles(quote.client_position) : quote.client_position,
    project_name: quote.project_name ? limpiarInvisibles(quote.project_name) : quote.project_name,
    executive_summary: quote.executive_summary ? limpiarInvisibles(quote.executive_summary) : quote.executive_summary,
    project_objective: quote.project_objective ? limpiarInvisibles(quote.project_objective) : quote.project_objective,
    project_scope: quote.project_scope ? limpiarInvisibles(quote.project_scope) : quote.project_scope,
    proposal_blocks: Object.fromEntries(
      Object.entries(quote.proposal_blocks ?? {}).map(([k, v]) => [k, typeof v === 'string' ? limpiarInvisibles(v) : v]),
    ) as ProposalBlocks,
  };
  const its = items.map((it) => ({ ...it, description: limpiarInvisibles(it.description) }));
  return { quote: q, items: its };
}

const BLOCK_LABELS: Record<keyof ProposalBlocks, { es: string; en: string }> = {
  pitch: { es: 'Propuesta', en: 'Proposal' },
  intro: { es: 'Introducción', en: 'Introduction' },
  problem: { es: 'Problema del Cliente', en: 'Client Problem' },
  solution: { es: 'Solución Propuesta', en: 'Proposed Solution' },
  benefits: { es: 'Beneficios', en: 'Benefits' },
  exclusions: { es: 'Exclusiones', en: 'Exclusions' },
  timeline: { es: 'Cronograma', en: 'Timeline' },
  terms: { es: 'Condiciones', en: 'Terms' },
  warranty: { es: 'Garantías', en: 'Warranty' },
  payment_terms: { es: 'Forma de Pago', en: 'Payment Terms' },
  notes: { es: 'Observaciones', en: 'Notes' },
};

/** Orden de aparición. `pitch` —el texto que el cliente pega de una vez— va
 *  primero porque es el cuerpo de la propuesta; el resto son secciones
 *  opcionales que casi nadie rellena y que sólo salen si tienen contenido. */
const ORDEN_BLOQUES: Array<keyof ProposalBlocks> = [
  'pitch', 'intro', 'problem', 'solution', 'benefits',
  'exclusions', 'timeline', 'terms', 'warranty', 'payment_terms', 'notes',
];

function rgbOf(hex: string | null | undefined, fallback: [number, number, number]): [number, number, number] {
  if (!hex) return fallback;
  const h = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return fallback;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Blanco o negro según el fondo, para que el texto sobre la banda de color
 *  se lea tanto si la marca es amarilla como si es azul marino. Fórmula de
 *  luminancia relativa; el umbral 0.6 es el que deja legible el amarillo. */
function textoSobre(fondo: [number, number, number]): [number, number, number] {
  const [r, g, b] = fondo.map((c) => c / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.6 ? [20, 20, 20] : [255, 255, 255];
}

async function logoToDataUrl(url: string): Promise<string | null> {
  // Si ya viene incrustado no hay nada que descargar. Además de ahorrar una
  // petición, es lo que permite probar el generador fuera del navegador.
  if (url.startsWith('data:')) return url;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** El formato se deduce del propio data URL. Antes iba fijo a 'PNG', así que
 *  un logo JPEG —lo que sale de la cámara o de casi cualquier descarga— o no
 *  se dibujaba o se dibujaba corrupto. */
function formatoDeDataUrl(dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' {
  const cabecera = dataUrl.slice(0, 30).toLowerCase();
  if (cabecera.includes('jpeg') || cabecera.includes('jpg')) return 'JPEG';
  if (cabecera.includes('webp')) return 'WEBP';
  return 'PNG';
}

interface Ctx {
  doc: jsPDF;
  quote: Quote;
  items: QuoteLineItem[];
  branding: QuotePublicBranding | null;
  documentTitle: string;
  lang: Lang;
  template: TemplateId;
  primary: [number, number, number];
  secondary: [number, number, number];
  font: 'helvetica' | 'times';
  logoDataUrl: string | null;
  logoFormato: 'PNG' | 'JPEG' | 'WEBP';
  /** Proporción ancho/alto real de la imagen, para no deformarla. */
  logoRatio: number;
  usarMarcaDeAgua: boolean;
  /** Cursor vertical. Lo mueve cada bloque que escribe. */
  y: number;
}

// ── Marca de agua ────────────────────────────────────────────────────────
//
// No existía. El cliente la activaba en Configuración y no aparecía en
// ninguna cotización. Va en diagonal, grande y por DEBAJO del contenido
// (se dibuja al abrir cada página, antes que nada), con opacidad baja para
// que no compita con el texto pero se note.

function marcaDeAgua(ctx: Ctx) {
  if (!ctx.usarMarcaDeAgua) return;
  const { doc } = ctx;
  const GS = (doc as unknown as { GState: new (o: { opacity: number }) => unknown }).GState;

  doc.saveGraphicsState();
  try {
    doc.setGState(new GS({ opacity: 0.07 }));

    if (ctx.logoDataUrl) {
      // El logo del cliente, centrado y grande, ajustado a una caja de
      // 150 × 170 mm sobre una hoja de 210 × 297.
      //
      // Se limita por ANCHO Y POR ALTO. Fijando sólo el ancho, un logotipo
      // vertical (por ejemplo 1:4) salía de 130 mm de ancho por 520 de alto y
      // se derramaba fuera de la página por arriba y por abajo.
      const CAJA_W = 150;
      const CAJA_H = 170;
      const ratio = ctx.logoRatio || 1;
      const ancho = Math.min(CAJA_W, CAJA_H * ratio);
      const alto = ancho / ratio;
      try {
        doc.addImage(ctx.logoDataUrl, ctx.logoFormato, (PAGE_W - ancho) / 2, (PAGE_H - alto) / 2, ancho, alto, undefined, 'FAST');
      } catch { /* un logo ilegible no puede tumbar la cotización entera */ }
    } else {
      // Sin logo, el nombre de la empresa en diagonal. jsPDF mide el texto,
      // así que el cuerpo se calcula para que ocupe el ancho de la diagonal
      // en vez de fijar un tamaño que se desborde con nombres largos.
      const texto = (ctx.branding?.company_legal_name || ctx.documentTitle).toUpperCase();
      doc.setFont(ctx.font, 'bold');
      doc.setTextColor(120, 120, 120);

      // El largo admisible no es la diagonal de la hoja: un texto girado θ
      // ocupa ancho·cos(θ) en horizontal, y ahí es donde se salía. Con 38° y
      // 186 mm de ancho útil, el máximo real es 186/cos(38°) ≈ 236 mm. Antes
      // se fijaba en 250 y la marca aparecía recortada por los dos lados.
      const ANGULO = 38;
      const rad = (ANGULO * Math.PI) / 180;
      const objetivo = Math.min((PAGE_W - 26) / Math.cos(rad), (PAGE_H - 26) / Math.sin(rad));

      let cuerpo = 90;
      doc.setFontSize(cuerpo);
      const anchoA90 = doc.getTextWidth(texto);
      if (anchoA90 > 0) cuerpo = Math.max(24, Math.min(90, (cuerpo * objetivo) / anchoA90));
      doc.setFontSize(cuerpo);

      // El punto de partida se calcula a mano en vez de usar align:'center'.
      // jsPDF aplica el centrado ANTES de rotar, así que con un ángulo el
      // texto queda descolocado y se sale por un lado de la hoja. Aquí se
      // retrocede media palabra a lo largo del propio eje del texto girado
      // —que avanza en (cos θ, −sen θ)— y así el centro real cae en el centro
      // de la página.
      const largo = doc.getTextWidth(texto);
      const x0 = PAGE_W / 2 - (largo / 2) * Math.cos(rad);
      const y0 = PAGE_H / 2 + (largo / 2) * Math.sin(rad);
      doc.text(texto, x0, y0, { angle: ANGULO, baseline: 'middle' });
    }
  } catch { /* si el motor no soporta opacidad, mejor sin marca que con un bloque opaco */ }
  doc.restoreGraphicsState();
}

// ── Motor de flujo ───────────────────────────────────────────────────────

function nuevaPagina(ctx: Ctx) {
  ctx.doc.addPage();
  marcaDeAgua(ctx);
  ctx.y = MARGIN + 6;
}

/** La única regla de salto de página del documento: si lo que viene no cabe
 *  en lo que queda de hoja, se abre otra. Nada más fuerza un salto. */
function asegurarEspacio(ctx: Ctx, alto: number) {
  if (ctx.y + alto > FONDO) nuevaPagina(ctx);
}

function pieDePagina(ctx: Ctx) {
  const { doc, quote, branding, lang } = ctx;
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);

    // La nota de aceptación va sólo en la última página, anclada a la franja
    // reservada por FONDO. Así nunca puede generar una hoja para ella sola.
    if (p === total) {
      const nota = lang === 'en'
        ? 'This document does not necessarily constitute a final legal contract unless the parties so indicate, but it is verifiable evidence of acceptance of this commercial proposal.'
        : 'Este documento no constituye necesariamente un contrato legal definitivo, salvo que las partes así lo indiquen, pero sí constituye evidencia verificable de aceptación de la propuesta comercial.';
      doc.setFont(ctx.font, 'normal');
      doc.setFontSize(7.5);
      const lineas = doc.splitTextToSize(nota, CONTENT_W) as string[];
      // Se ancla por abajo: la última línea queda siempre a la misma altura,
      // llegue el texto en una o en tres líneas.
      let yNota = PAGE_H - 18 - (lineas.length - 1) * 3.4;
      doc.setDrawColor(228, 228, 228);
      doc.setLineWidth(0.25);
      doc.line(MARGIN, yNota - 5, PAGE_W - MARGIN, yNota - 5);
      doc.setTextColor(145, 145, 145);
      for (const linea of lineas) {
        doc.text(linea, MARGIN, yNota);
        yNota += 3.4;
      }
    }

    doc.setFont(ctx.font, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    const izquierda = [quote.quote_number, branding?.company_legal_name].filter(Boolean).join(' · ');
    doc.text(izquierda, MARGIN, PAGE_H - 12);
    if (total > 1) {
      doc.text(`${p} / ${total}`, PAGE_W - MARGIN, PAGE_H - 12, { align: 'right' });
    }
    if (branding?.footer_text) {
      doc.text(String(branding.footer_text).slice(0, 120), PAGE_W / 2, PAGE_H - 7, { align: 'center' });
    }
  }
}

function tituloDeSeccion(ctx: Ctx, label: string) {
  const { doc, primary, template } = ctx;
  asegurarEspacio(ctx, 16);
  doc.setFont(ctx.font, 'bold');

  if (template === 'minimal') {
    doc.setFontSize(9);
    doc.setTextColor(20, 20, 20);
    doc.text(label.toUpperCase(), MARGIN, ctx.y);
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, ctx.y + 1.8, PAGE_W - MARGIN, ctx.y + 1.8);
    ctx.y += 7;
    return;
  }
  if (template === 'executive') {
    doc.setFontSize(11.5);
    doc.setTextColor(50, 50, 50);
    doc.text(label, PAGE_W / 2, ctx.y, { align: 'center' });
    doc.setDrawColor(...primary);
    doc.setLineWidth(0.5);
    doc.line(PAGE_W / 2 - 11, ctx.y + 2, PAGE_W / 2 + 11, ctx.y + 2);
    ctx.y += 8.5;
    return;
  }
  if (template === 'modern') {
    doc.setFillColor(...primary);
    doc.rect(MARGIN, ctx.y - 3.6, 2.6, 5.2, 'F');
    doc.setFontSize(11.5);
    doc.setTextColor(20, 20, 20);
    doc.text(label, MARGIN + 5.5, ctx.y);
    ctx.y += 7.5;
    return;
  }
  doc.setFontSize(11.5);
  doc.setTextColor(...primary);
  doc.text(label, MARGIN, ctx.y);
  ctx.y += 7;
}

/**
 * Escribe un párrafo largo respetando saltos de línea y viñetas, y partiendo
 * por página cuando hace falta. Es lo que recibe el texto que el cliente pega
 * de una sola vez, así que tiene que aguantar cualquier cosa: líneas sueltas,
 * listas con guiones, párrafos separados por líneas en blanco.
 */
function parrafo(ctx: Ctx, texto: string, centrado = false) {
  const { doc } = ctx;
  doc.setFont(ctx.font, 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(70, 70, 70);

  const bloques = String(texto).replace(/\r\n/g, '\n').split('\n');
  for (const bruto of bloques) {
    const linea = bruto.trim();
    if (!linea) { ctx.y += 2.6; continue; }

    // Las viñetas se sangran y conservan su marca, en vez de fundirse con el
    // párrafo anterior como pasaba antes al pasarlo todo por splitTextToSize.
    const esVinieta = /^[-*•·]\s+/.test(linea);
    const cuerpo = esVinieta ? linea.replace(/^[-*•·]\s+/, '') : linea;
    const sangria = esVinieta ? 5 : 0;
    const ancho = CONTENT_W - sangria;
    const partes = doc.splitTextToSize(cuerpo, ancho);

    for (let i = 0; i < partes.length; i++) {
      asegurarEspacio(ctx, 6);
      const x = centrado ? PAGE_W / 2 : MARGIN + sangria;
      if (esVinieta && i === 0) {
        doc.text('•', MARGIN + 1, ctx.y);
      }
      doc.text(partes[i], x, ctx.y, centrado ? { align: 'center' } : undefined);
      ctx.y += 4.9;
    }
  }
  ctx.y += 3.5;
}

// ── Cabecera (sustituye a la portada de página completa) ─────────────────

function dibujarLogo(ctx: Ctx, x: number, y: number, altoMax: number): number {
  if (!ctx.logoDataUrl) return 0;
  const alto = altoMax;
  const ancho = alto * (ctx.logoRatio || 1);
  try {
    ctx.doc.addImage(ctx.logoDataUrl, ctx.logoFormato, x, y, ancho, alto, undefined, 'FAST');
    return ancho;
  } catch {
    return 0;
  }
}

/** Alto del logo en mm según lo que el cliente eligió en Configuración. */
function altoDelLogo(ctx: Ctx): number {
  const tam = ctx.branding?.logo_size ?? 'medium';
  return tam === 'small' ? 12 : tam === 'large' ? 26 : 18;
}

function bloqueEmpresa(ctx: Ctx, x: number, y: number, alinear: 'left' | 'right'): number {
  const { doc, branding } = ctx;
  let yy = y;
  doc.setFont(ctx.font, 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 30, 30);
  if (branding?.company_legal_name) {
    doc.text(branding.company_legal_name, x, yy, { align: alinear });
    yy += 4.6;
  }
  doc.setFont(ctx.font, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(115, 115, 115);
  const lineas = [
    branding?.company_address_line1,
    [branding?.company_city, branding?.company_state].filter(Boolean).join(', ') || null,
    branding?.company_phone,
    branding?.company_email,
    branding?.company_website,
  ].filter(Boolean) as string[];
  for (const l of lineas) {
    doc.text(l, x, yy, { align: alinear });
    yy += 3.9;
  }
  return yy;
}

function cabecera(ctx: Ctx) {
  const { doc, quote, template, primary, secondary, documentTitle, lang } = ctx;
  const mostrarLogo = ctx.branding?.enable_logo_in_docs !== false && Boolean(ctx.logoDataUrl);
  const aDerecha = ctx.branding?.logo_position === 'right';
  const altoLogo = altoDelLogo(ctx);
  const fecha = new Date(quote.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const numero = `${lang === 'en' ? 'No.' : 'N.º'} ${quote.quote_number}`;

  if (template === 'modern') {
    const altoPanel = 46;
    doc.setFillColor(...primary);
    doc.rect(0, 0, PAGE_W, altoPanel, 'F');
    doc.setFillColor(...secondary);
    doc.triangle(PAGE_W - 32, 0, PAGE_W, 0, PAGE_W, 32, 'F');
    const tinta = textoSobre(primary);

    if (mostrarLogo) dibujarLogo(ctx, aDerecha ? PAGE_W - MARGIN - altoLogo * ctx.logoRatio : MARGIN, 9, altoLogo);
    doc.setFont(ctx.font, 'bold');
    doc.setFontSize(21);
    doc.setTextColor(...tinta);
    doc.text(documentTitle, MARGIN, altoPanel - 15);
    doc.setFont(ctx.font, 'normal');
    doc.setFontSize(9.5);
    doc.text(`${numero}  ·  ${fecha}`, MARGIN, altoPanel - 7.5);

    // Hay que avanzar el cursor HASTA EL FINAL del bloque de la empresa. Con
    // un `+= 2` fijo, la columna derecha del bloque de cliente («Proyecto»)
    // se dibujaba encima de la dirección y el teléfono.
    ctx.y = bloqueEmpresa(ctx, PAGE_W - MARGIN, altoPanel + 12, 'right') + 7;
    return;
  }

  if (template === 'executive') {
    if (mostrarLogo) {
      const ancho = altoLogo * ctx.logoRatio;
      dibujarLogo(ctx, (PAGE_W - ancho) / 2, MARGIN, altoLogo);
    }
    let y = MARGIN + (mostrarLogo ? altoLogo + 7 : 0);
    doc.setFont(ctx.font, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    if (ctx.branding?.company_legal_name) {
      doc.text(ctx.branding.company_legal_name.toUpperCase(), PAGE_W / 2, y, { align: 'center' });
      y += 9;
    }
    doc.setFont(ctx.font, 'bold');
    doc.setFontSize(22);
    doc.setTextColor(30, 30, 30);
    doc.text(documentTitle, PAGE_W / 2, y + 4, { align: 'center' });
    doc.setDrawColor(...primary);
    doc.setLineWidth(0.4);
    doc.line(PAGE_W / 2 - 18, y + 8, PAGE_W / 2 + 18, y + 8);
    doc.line(PAGE_W / 2 - 18, y + 9.6, PAGE_W / 2 + 18, y + 9.6);
    doc.setFont(ctx.font, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(`${numero}   ·   ${fecha}`, PAGE_W / 2, y + 16, { align: 'center' });
    ctx.y = y + 26;
    return;
  }

  if (template === 'minimal') {
    if (mostrarLogo) dibujarLogo(ctx, aDerecha ? PAGE_W - MARGIN - altoLogo * ctx.logoRatio : MARGIN, MARGIN, altoLogo);
    // Sin logo no se reserva su altura: quien no sube marca no tiene por qué
    // recibir un documento con un hueco donde el logo habría ido.
    const y = MARGIN + (mostrarLogo ? altoLogo + 8 : 4);
    doc.setFont(ctx.font, 'normal');
    doc.setFontSize(19);
    doc.setTextColor(15, 15, 15);
    doc.text(documentTitle, MARGIN, y);
    doc.setDrawColor(15, 15, 15);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y + 3.5, PAGE_W - MARGIN, y + 3.5);
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(`${numero}`, MARGIN, y + 9);
    doc.text(fecha, PAGE_W - MARGIN, y + 9, { align: 'right' });
    ctx.y = bloqueEmpresa(ctx, PAGE_W - MARGIN, y + 16, 'right') + 7;
    return;
  }

  // corporate
  doc.setFillColor(...primary);
  doc.rect(0, 0, PAGE_W, 6, 'F');
  const yTop = 18;
  if (mostrarLogo) dibujarLogo(ctx, aDerecha ? PAGE_W - MARGIN - altoLogo * ctx.logoRatio : MARGIN, yTop, altoLogo);
  const xDatos = aDerecha ? MARGIN : PAGE_W - MARGIN;
  const finDatos = bloqueEmpresa(ctx, xDatos, yTop + 4, aDerecha ? 'left' : 'right');

  const y = Math.max(mostrarLogo ? yTop + altoLogo : 0, finDatos) + 10;
  doc.setFont(ctx.font, 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...primary);
  doc.text(documentTitle, MARGIN, y);
  doc.setFont(ctx.font, 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(110, 110, 110);
  doc.text(`${numero}   ·   ${fecha}`, MARGIN, y + 6.5);
  ctx.y = y + 15;
}

// ── Cliente + proyecto, en dos columnas ──────────────────────────────────
//
// Antes ocupaban 60 mm de una portada vacía. Aquí van enfrentados en una
// franja de ~26 mm, que es lo que ocupa esta información en cualquier
// cotización real.

function bloqueCliente(ctx: Ctx) {
  const { doc, quote, lang } = ctx;
  asegurarEspacio(ctx, 34);

  const yIni = ctx.y;
  const colDer = MARGIN + CONTENT_W / 2 + 4;

  const etiqueta = (txt: string, x: number, y: number) => {
    doc.setFont(ctx.font, 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text(txt.toUpperCase(), x, y);
  };

  etiqueta(lang === 'en' ? 'Prepared for' : 'Preparado para', MARGIN, yIni);
  let yIzq = yIni + 5.5;
  doc.setFont(ctx.font, 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(25, 25, 25);
  doc.text(quote.client_name || '—', MARGIN, yIzq);
  yIzq += 5;
  doc.setFont(ctx.font, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(105, 105, 105);
  const datosCliente = [
    [quote.client_position, quote.client_company].filter(Boolean).join(' · ') || null,
    quote.client_email,
    quote.client_phone,
    quote.client_address,
  ].filter(Boolean) as string[];
  for (const l of datosCliente) {
    for (const parte of doc.splitTextToSize(l, CONTENT_W / 2 - 6)) {
      doc.text(parte, MARGIN, yIzq);
      yIzq += 4;
    }
  }

  let yDer = yIni;
  if (quote.project_name) {
    etiqueta(lang === 'en' ? 'Project' : 'Proyecto', colDer, yDer);
    yDer += 5.5;
    doc.setFont(ctx.font, 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(25, 25, 25);
    for (const parte of doc.splitTextToSize(quote.project_name, CONTENT_W / 2 - 4)) {
      doc.text(parte, colDer, yDer);
      yDer += 5;
    }
  }

  ctx.y = Math.max(yIzq, yDer) + 7;

  // Filete de cierre: separa la identidad de las partes del contenido
  // comercial. En minimal no va — esa plantilla vive de no tener adornos.
  if (ctx.template !== 'minimal') {
    doc.setDrawColor(225, 225, 225);
    doc.setLineWidth(0.25);
    doc.line(MARGIN, ctx.y - 3.5, PAGE_W - MARGIN, ctx.y - 3.5);
  }
}

// ── Tabla de productos y servicios ───────────────────────────────────────

// Anclas de columna en mm. Las numéricas se alinean a la derecha, que es como
// se leen las cifras de una cotización (las unidades bajo las unidades).
//
// El reparto está calculado para el peor caso realista: importes en pesos
// colombianos con separador de miles, del orden de $10,000,000.00, que a 8,5 pt
// ocupan unos 23 mm. La versión anterior dejaba 14 mm entre IVA y TOTAL y los
// dos valores se solapaban —salía «19%$1,017,450.00» pegado—; aquí el total
// tiene 30 mm propios.
const COL = {
  desc: MARGIN,           // izquierda
  cant: 94,               // derecha
  unidad: 97,             // izquierda
  precio: 136,            // derecha
  desc_pct: 149,          // derecha
  iva_pct: 160,           // derecha
  total: PAGE_W - MARGIN, // derecha (192)
};
const ANCHO_DESC = 64;

function encabezadoTabla(ctx: Ctx) {
  const { doc, lang, template, primary } = ctx;
  doc.setFont(ctx.font, 'bold');
  doc.setFontSize(7.5);

  if (template === 'modern' || template === 'corporate') {
    doc.setFillColor(...primary);
    doc.rect(MARGIN, ctx.y - 4.2, CONTENT_W, 6.4, 'F');
    doc.setTextColor(...textoSobre(primary));
  } else {
    doc.setTextColor(130, 130, 130);
  }

  const t = (txt: string, x: number, alinear?: 'right') => doc.text(txt, x, ctx.y, alinear ? { align: 'right' } : undefined);
  t(lang === 'en' ? 'DESCRIPTION' : 'DESCRIPCIÓN', COL.desc + (template === 'modern' || template === 'corporate' ? 2 : 0));
  t(lang === 'en' ? 'QTY' : 'CANT.', COL.cant, 'right');
  t(lang === 'en' ? 'UNIT' : 'UNIDAD', COL.unidad);
  t(lang === 'en' ? 'PRICE' : 'PRECIO', COL.precio, 'right');
  t(lang === 'en' ? 'DISC.' : 'DESC.', COL.desc_pct, 'right');
  t(lang === 'en' ? 'TAX' : 'IVA', COL.iva_pct, 'right');
  t('TOTAL', COL.total - (template === 'modern' || template === 'corporate' ? 2 : 0), 'right');

  ctx.y += 3;
  if (template !== 'modern' && template !== 'corporate') {
    doc.setDrawColor(template === 'minimal' ? 20 : 210, template === 'minimal' ? 20 : 210, template === 'minimal' ? 20 : 210);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, ctx.y, PAGE_W - MARGIN, ctx.y);
  }
  ctx.y += 5.5;
}

/** Dibuja una sola fila de la tabla (descripción + cantidades + total de esa
 *  fila). Compartida entre la tabla normal, que se suma, y cada bloque de
 *  opciones alternativas, que NO se suma — ver tablaDeItems. */
function filaDeItem(ctx: Ctx, item: QuoteLineItem, alterna: boolean): void {
  const { doc, template } = ctx;
  doc.setFont(ctx.font, 'normal');
  doc.setFontSize(8.5);
  const lineasDesc = doc.splitTextToSize((item.description || '').trim() || '—', ANCHO_DESC);
  const altoFila = Math.max(lineasDesc.length * 4.2, 6) + 2.6;

  // Si la fila no cabe entera, se lleva completa a la página siguiente y se
  // repite el encabezado. Partir una fila por la mitad es lo que hacía que
  // la descripción quedara huérfana del precio.
  if (ctx.y + altoFila > FONDO) {
    nuevaPagina(ctx);
    encabezadoTabla(ctx);
  }

  if (alterna && template !== 'minimal') {
    doc.setFillColor(248, 249, 251);
    doc.rect(MARGIN, ctx.y - 3.8, CONTENT_W, altoFila, 'F');
  }

  doc.setTextColor(45, 45, 45);
  doc.text(lineasDesc, COL.desc + 2, ctx.y);
  doc.setTextColor(80, 80, 80);
  doc.text(String(item.quantity ?? 0), COL.cant, ctx.y, { align: 'right' });
  if (item.unit) doc.text(String(item.unit).slice(0, 12), COL.unidad, ctx.y);
  doc.text(fmtMoney(item.unit_price || 0), COL.precio, ctx.y, { align: 'right' });
  doc.text(item.discount_pct ? `${item.discount_pct}%` : '—', COL.desc_pct, ctx.y, { align: 'right' });
  doc.text(item.tax_pct ? `${item.tax_pct}%` : '—', COL.iva_pct, ctx.y, { align: 'right' });
  doc.setFont(ctx.font, 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(fmtMoney(computeLineItemTotal(item)), COL.total - 2, ctx.y, { align: 'right' });

  ctx.y += altoFila;
}

/** Agrupa por option_group preservando el orden de primera aparición — un
 *  Map normal ya hace esto en JS, se deja explícito porque es lo que hace
 *  que "Plan Esencial, Profesional, Premium" salgan en el orden en que se
 *  escribieron y no reordenados. */
function agruparOpciones(items: QuoteLineItem[]): Map<string, QuoteLineItem[]> {
  const grupos = new Map<string, QuoteLineItem[]>();
  for (const item of items) {
    const clave = (item.option_group || '').trim();
    if (!clave) continue;
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave)!.push(item);
  }
  return grupos;
}

/** Un bloque de opciones alternativas (p. ej. "Plan Esencial / Profesional /
 *  Premium"): mismo formato de fila que la tabla normal, pero cada opción
 *  es una alternativa completa, no un ítem que se suma a las demás. Por eso
 *  vive fuera de resumenFinanciero — sumar tres planes distintos como si el
 *  cliente fuera a comprar los tres a la vez es exactamente el error que
 *  este bloque existe para evitar. */
function bloqueDeOpciones(ctx: Ctx, etiqueta: string, opciones: QuoteLineItem[]): void {
  const { lang } = ctx;
  // tituloDeSeccion sólo reserva espacio para SÍ MISMA (16mm) — sin este
  // chequeo previo, un título que sí cabe pero deja menos de 24mm después
  // se dibuja solo, huérfano al final de la página, con la tabla entera
  // empezando en la siguiente. El bug real que se vio en producción: la
  // palabra "Planes" sola al pie de una hoja. Reservando título + cabecera
  // + una fila de sobra ANTES de dibujar nada, los tres saltan juntos.
  asegurarEspacio(ctx, 16 + 24 + 10);
  tituloDeSeccion(ctx, etiqueta);
  asegurarEspacio(ctx, 24);
  encabezadoTabla(ctx);

  let alterna = false;
  for (const item of opciones) {
    filaDeItem(ctx, item, alterna);
    alterna = !alterna;
  }

  ctx.doc.setFont(ctx.font, 'italic');
  ctx.doc.setFontSize(7.5);
  ctx.doc.setTextColor(140, 140, 140);
  ctx.doc.text(
    lang === 'en'
      ? 'The client chooses one of the options above — these are not added together.'
      : 'El cliente elige una de las opciones anteriores — estos precios no se suman entre sí.',
    COL.desc, ctx.y,
  );
  ctx.y += 8;
}

function tablaDeItems(ctx: Ctx) {
  const { doc, items, lang, template } = ctx;
  const conItems = items.filter((it) => (it.description || '').trim() || it.unit_price > 0);
  if (conItems.length === 0) return;

  // Las que pertenecen a un option_group son alternativas entre sí (planes,
  // paquetes) y van en su propio bloque, antes de la tabla que sí se suma —
  // el cliente decide primero qué opción quiere, y lo que sigue abajo son
  // los cargos fijos que aplican sin importar cuál elija.
  const grupos = agruparOpciones(conItems);
  for (const [clave, opciones] of grupos) {
    bloqueDeOpciones(ctx, clave, opciones);
  }

  const regulares = conItems.filter((it) => !(it.option_group || '').trim());
  if (regulares.length === 0) return;

  // Mismo chequeo que en bloqueDeOpciones — ver el comentario ahí.
  asegurarEspacio(ctx, 16 + 24 + 10);
  tituloDeSeccion(ctx, lang === 'en' ? 'Products & Services' : 'Productos y Servicios');
  asegurarEspacio(ctx, 24);
  encabezadoTabla(ctx);

  let alterna = false;
  for (const item of regulares) {
    filaDeItem(ctx, item, alterna);
    alterna = !alterna;
  }

  resumenFinanciero(ctx);
}

function resumenFinanciero(ctx: Ctx) {
  const { doc, quote, lang, primary, template } = ctx;
  asegurarEspacio(ctx, 34);
  ctx.y += 2;

  const xEtiqueta = 128;
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.3);
  doc.line(xEtiqueta, ctx.y, PAGE_W - MARGIN, ctx.y);
  ctx.y += 6;

  const fila = (label: string, valor: string) => {
    doc.setFont(ctx.font, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(105, 105, 105);
    doc.text(label, xEtiqueta, ctx.y);
    doc.setTextColor(45, 45, 45);
    doc.text(valor, PAGE_W - MARGIN, ctx.y, { align: 'right' });
    ctx.y += 5.4;
  };

  fila(lang === 'en' ? 'Subtotal' : 'Subtotal', fmtMoney(quote.subtotal));
  if (quote.discount_total > 0) fila(lang === 'en' ? 'Discount' : 'Descuento', `-${fmtMoney(quote.discount_total)}`);
  if (quote.tax_total > 0) fila(lang === 'en' ? 'Taxes' : 'Impuestos', fmtMoney(quote.tax_total));

  // El total va en una caja de color: es el dato por el que se abre una
  // cotización, y antes se perdía como una línea más de la lista.
  ctx.y += 1.5;
  const altoCaja = 11;
  if (template === 'minimal') {
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.5);
    doc.line(xEtiqueta, ctx.y - 4, PAGE_W - MARGIN, ctx.y - 4);
    doc.setTextColor(15, 15, 15);
  } else {
    doc.setFillColor(...primary);
    doc.rect(xEtiqueta, ctx.y - 6.5, PAGE_W - MARGIN - xEtiqueta, altoCaja, 'F');
    doc.setTextColor(...textoSobre(primary));
  }
  doc.setFont(ctx.font, 'bold');
  doc.setFontSize(11.5);
  doc.text('TOTAL', xEtiqueta + (template === 'minimal' ? 0 : 3), ctx.y);
  doc.text(fmtMoney(quote.total), PAGE_W - MARGIN - (template === 'minimal' ? 0 : 3), ctx.y, { align: 'right' });
  ctx.y += altoCaja + 5;
}

// ── Datos de pago ────────────────────────────────────────────────────────
//
// El cliente ya los tenía configurados (banco, Nequi, Daviplata, Zelle,
// PayPal, ACH) y no salían en ninguna cotización, que es justo donde hacen
// falta: quien acepta necesita saber a dónde transferir.

function datosDePago(ctx: Ctx) {
  const { branding, lang } = ctx;
  if (!branding) return;
  const filas: Array<[string, string]> = [];
  if (branding.bank_name || branding.bank_account) {
    filas.push([lang === 'en' ? 'Bank' : 'Banco', [branding.bank_name, branding.bank_account].filter(Boolean).join(' · ')]);
  }
  if (branding.payment_nequi) filas.push(['Nequi', branding.payment_nequi]);
  if (branding.payment_daviplata) filas.push(['Daviplata', branding.payment_daviplata]);
  if (branding.payment_zelle) filas.push(['Zelle', branding.payment_zelle]);
  if (branding.payment_ach) filas.push(['ACH', branding.payment_ach]);
  if (branding.payment_paypal) filas.push(['PayPal', branding.payment_paypal]);
  if (filas.length === 0) return;

  const { doc } = ctx;
  asegurarEspacio(ctx, 14 + filas.length * 4.6);
  tituloDeSeccion(ctx, lang === 'en' ? 'Payment Details' : 'Datos de Pago');
  for (const [etiqueta, valor] of filas) {
    doc.setFont(ctx.font, 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(90, 90, 90);
    doc.text(`${etiqueta}:`, MARGIN, ctx.y);
    doc.setFont(ctx.font, 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(String(valor), MARGIN + 26, ctx.y);
    ctx.y += 4.6;
  }
  ctx.y += 3;
}

// ── Entrada pública ──────────────────────────────────────────────────────

export async function generateQuotePdf(
  quoteCruda: Quote,
  itemsCrudos: QuoteLineItem[],
  branding: QuotePublicBranding | null,
  documentTitle: string,
): Promise<Uint8Array> {
  const { quote, items } = limpiarQuoteYItems(quoteCruda, itemsCrudos);
  const { layout, color } = parseTemplate(quote.template);
  const lang: Lang = quote.language === 'en' ? 'en' : 'es';
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // El color elegido en el cajón de diseño de esta cotización manda sobre el
  // color de marca del perfil; sin elección, se usa el de marca.
  const primary = color ? rgbOf(color, [67, 56, 202]) : rgbOf(branding?.brand_color_primary, [67, 56, 202]);
  const secondary = rgbOf(branding?.brand_color_secondary, [30, 41, 59]);
  const font: Ctx['font'] = layout === 'executive' ? 'times' : 'helvetica';

  const logoDataUrl = branding?.company_logo_url ? await logoToDataUrl(branding.company_logo_url) : null;
  let logoRatio = 1;
  let logoFormato: Ctx['logoFormato'] = 'PNG';
  if (logoDataUrl) {
    logoFormato = formatoDeDataUrl(logoDataUrl);
    try {
      // Sin esto el logo se metía a la fuerza en un cuadrado de 32×32 mm y
      // salía aplastado; un logotipo apaisado es lo normal, no la excepción.
      const props = doc.getImageProperties(logoDataUrl);
      if (props?.width && props?.height) logoRatio = props.width / props.height;
    } catch { /* proporción 1:1 como último recurso */ }
  }

  const ctx: Ctx = {
    doc, quote, items, branding, documentTitle, lang, template: layout,
    primary, secondary, font, logoDataUrl, logoFormato, logoRatio,
    usarMarcaDeAgua: Boolean(branding?.use_watermark),
    y: MARGIN,
  };

  marcaDeAgua(ctx);
  cabecera(ctx);
  bloqueCliente(ctx);

  // Resumen / objetivo / alcance — sólo los que tengan contenido.
  const centrado = layout === 'executive';
  for (const [label, texto] of [
    [lang === 'en' ? 'Executive Summary' : 'Resumen Ejecutivo', quote.executive_summary],
    [lang === 'en' ? 'Objective' : 'Objetivo', quote.project_objective],
    [lang === 'en' ? 'Scope' : 'Alcance', quote.project_scope],
  ] as Array<[string, string | null]>) {
    if (!texto || !texto.trim()) continue;
    tituloDeSeccion(ctx, label);
    parrafo(ctx, texto, centrado);
  }

  // Bloques de propuesta, en orden fijo. `pitch` es el texto que el cliente
  // pega de una vez y va sin título propio: ES el cuerpo de la propuesta, y
  // encabezarlo con la palabra «Propuesta» dentro de un documento que ya se
  // titula «Cotización» sólo añade ruido.
  const bloques = quote.proposal_blocks || {};
  for (const clave of ORDEN_BLOQUES) {
    const valor = bloques[clave];
    if (!valor || !String(valor).trim()) continue;
    if (clave !== 'pitch') tituloDeSeccion(ctx, BLOCK_LABELS[clave][lang]);
    parrafo(ctx, String(valor), centrado && clave !== 'pitch');
  }

  tablaDeItems(ctx);
  datosDePago(ctx);
  pieDePagina(ctx);

  return new Uint8Array(doc.output('arraybuffer'));
}

/**
 * `template` guarda la maqueta y, opcionalmente, el color elegido para esta
 * cotización concreta: `"corporate"` o `"corporate|#0EA5E9"`.
 *
 * Se codifica en la misma columna a propósito. `quotes.template` es `text`
 * sin restricción CHECK, así que admite el sufijo sin tocar la base de datos,
 * y los valores antiguos —sin barra— siguen leyéndose igual. La alternativa
 * era una migración con una columna nueva para un dato puramente estético.
 */
export function parseTemplate(valor: string | null | undefined): { layout: TemplateId; color: string | null } {
  const bruto = String(valor || 'corporate');
  const [maqueta, color] = bruto.split('|');
  const layout = (['corporate', 'modern', 'executive', 'minimal'] as const).includes(maqueta as TemplateId)
    ? (maqueta as TemplateId)
    : 'corporate';
  return { layout, color: color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : null };
}

export function buildTemplateValue(layout: TemplateId, color: string | null): string {
  return color ? `${layout}|${color}` : layout;
}
