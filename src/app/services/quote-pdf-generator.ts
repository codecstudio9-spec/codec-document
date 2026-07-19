/**
 * Smart Quotes PDF — deliberately separate from PDFGenerator
 * (pdf-generator.ts), which is purpose-built for jurisdiction-aware legal
 * documents and already carries a lot of that-specific complexity.
 * Quotes have a different shape entirely (cover page, line-items table,
 * financial summary, proposal blocks) — a dedicated generator here keeps
 * both simple and avoids risking the legal-doc generator while building
 * this.
 *
 * Four templates, genuinely different layouts (not just a recolor):
 * - Corporate: color top bar, logo + address block, left-aligned title.
 * - Modern: full-bleed color header panel, white title inside it, bold
 *   sans throughout, angular accent block on the summary page.
 * - Executive: serif (jsPDF "times"), centered title page, grayscale with
 *   the brand color used only as a thin double-rule — a formal
 *   engagement-letter feel.
 * - Minimal: pure black/white, one thin accent line under the title, no
 *   fills at all, generous whitespace, small-caps-style labels.
 */
import { jsPDF } from 'jspdf';
import type { Quote, QuoteLineItem, ProposalBlocks, QuotePublicBranding } from './quotes-service';
import { computeLineItemTotal } from './quotes-service';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;

type TemplateId = 'corporate' | 'modern' | 'executive' | 'minimal';
type Lang = 'es' | 'en';

function fmtMoney(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const BLOCK_LABELS: Record<keyof ProposalBlocks, { es: string; en: string }> = {
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

function rgbOf(hex: string | null | undefined, fallback: [number, number, number]): [number, number, number] {
  if (!hex) return fallback;
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return [Number.isFinite(r) ? r : fallback[0], Number.isFinite(g) ? g : fallback[1], Number.isFinite(b) ? b : fallback[2]];
}

async function logoToDataUrl(url: string): Promise<string | null> {
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

interface Ctx {
  doc: jsPDF;
  quote: Quote;
  items: QuoteLineItem[];
  branding: QuotePublicBranding | null;
  documentTitle: string;
  lang: Lang;
  primary: [number, number, number];
  secondary: [number, number, number];
  font: 'helvetica' | 'times' | 'courier';
  logoDataUrl: string | null;
}

// ── Shared: section header used on the summary/proposal-block body pages,
// styled per template so the whole document feels consistent, not just
// the cover ─────────────────────────────────────────────────────────────
function sectionHeader(ctx: Ctx, template: TemplateId, label: string, y: number): number {
  const { doc, primary, font } = ctx;
  doc.setFont(font, template === 'executive' ? 'bold' : 'bold');
  if (template === 'minimal') {
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    doc.text(label.toUpperCase(), MARGIN, y);
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y + 2, PAGE_W - MARGIN, y + 2);
    return y + 9;
  }
  if (template === 'executive') {
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text(label, PAGE_W / 2, y, { align: 'center' });
    doc.setDrawColor(...primary);
    doc.setLineWidth(0.6);
    doc.line(PAGE_W / 2 - 12, y + 2.5, PAGE_W / 2 + 12, y + 2.5);
    return y + 11;
  }
  if (template === 'modern') {
    doc.setFillColor(...primary);
    doc.rect(MARGIN, y - 5, 3, 7, 'F');
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    doc.text(label, MARGIN + 6, y);
    return y + 9;
  }
  // corporate
  doc.setFontSize(13);
  doc.setTextColor(...primary);
  doc.text(label, MARGIN, y);
  return y + 7;
}

function bodyText(ctx: Ctx, text: string, y: number, width = PAGE_W - MARGIN * 2, align: 'left' | 'center' = 'left'): number {
  const { doc, font } = ctx;
  doc.setFont(font, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(70, 70, 70);
  const x = align === 'center' ? PAGE_W / 2 : MARGIN;
  const wrapped = doc.splitTextToSize(text, width);
  doc.text(wrapped, x, y, align === 'center' ? { align: 'center' } : undefined);
  return y + wrapped.length * 5 + 10;
}

// ── Cover pages — one per template, genuinely different layouts ────────

async function renderCoverCorporate(ctx: Ctx) {
  const { doc, primary, quote, branding, documentTitle, lang, logoDataUrl } = ctx;
  doc.setFillColor(...primary);
  doc.rect(0, 0, PAGE_W, 8, 'F');
  if (logoDataUrl) { try { doc.addImage(logoDataUrl, 'PNG', MARGIN, 20, 32, 32, undefined, 'FAST'); } catch { /* skip */ } }

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.text(branding?.company_legal_name || '', PAGE_W - MARGIN, 25, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  [branding?.company_address_line1, branding?.company_city, branding?.company_phone, branding?.company_email]
    .filter(Boolean).forEach((line, i) => doc.text(line as string, PAGE_W - MARGIN, 31 + i * 5, { align: 'right' }));

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...primary);
  doc.text(documentTitle, MARGIN, 90);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`${lang === 'en' ? 'No.' : 'N.º'} ${quote.quote_number}`, MARGIN, 100);
  doc.text(new Date(quote.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' }), MARGIN, 106);

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(lang === 'en' ? 'PREPARED FOR' : 'PREPARADO PARA', MARGIN, 125);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text(quote.client_name, MARGIN, 133);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  [quote.client_company, quote.client_email, quote.client_phone].filter(Boolean).forEach((line, i) => doc.text(line as string, MARGIN, 140 + i * 5));

  if (quote.project_name) {
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(lang === 'en' ? 'PROJECT' : 'PROYECTO', MARGIN, 165);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    doc.text(quote.project_name, MARGIN, 173);
  }
}

async function renderCoverModern(ctx: Ctx) {
  const { doc, primary, secondary, quote, branding, documentTitle, lang, logoDataUrl } = ctx;
  // Full-bleed color header panel
  doc.setFillColor(...primary);
  doc.rect(0, 0, PAGE_W, 95, 'F');
  doc.setFillColor(...secondary);
  doc.triangle(PAGE_W - 40, 0, PAGE_W, 0, PAGE_W, 40, 'F');

  if (logoDataUrl) { try { doc.addImage(logoDataUrl, 'PNG', MARGIN, 16, 24, 24, undefined, 'FAST'); } catch { /* skip */ } }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(branding?.company_legal_name || '', PAGE_W - MARGIN, 20, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(255, 255, 255);
  doc.text(documentTitle, MARGIN, 60);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`${lang === 'en' ? 'No.' : 'N.º'} ${quote.quote_number}  ·  ${new Date(quote.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`, MARGIN, 72);

  let y = 115;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primary);
  doc.text(lang === 'en' ? 'PREPARED FOR' : 'PREPARADO PARA', MARGIN, y);
  y += 8;
  doc.setFontSize(15);
  doc.setTextColor(20, 20, 20);
  doc.text(quote.client_name, MARGIN, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  [quote.client_company, quote.client_email, quote.client_phone].filter(Boolean).forEach((line) => { doc.text(line as string, MARGIN, y); y += 5; });

  if (quote.project_name) {
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...primary);
    doc.text(lang === 'en' ? 'PROJECT' : 'PROYECTO', MARGIN, y);
    y += 8;
    doc.setFontSize(15);
    doc.setTextColor(20, 20, 20);
    doc.text(quote.project_name, MARGIN, y);
  }
}

async function renderCoverExecutive(ctx: Ctx) {
  const { doc, primary, quote, branding, documentTitle, lang, logoDataUrl } = ctx;
  doc.setFont('times', 'normal');

  if (logoDataUrl) { try { doc.addImage(logoDataUrl, 'PNG', PAGE_W / 2 - 12, 26, 24, 24, undefined, 'FAST'); } catch { /* skip */ } }

  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text((branding?.company_legal_name || '').toUpperCase(), PAGE_W / 2, 60, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(30, 30, 30);
  doc.text(documentTitle, PAGE_W / 2, 105, { align: 'center' });

  doc.setDrawColor(...primary);
  doc.setLineWidth(0.4);
  doc.line(PAGE_W / 2 - 20, 111, PAGE_W / 2 + 20, 111);
  doc.line(PAGE_W / 2 - 20, 113.5, PAGE_W / 2 + 20, 113.5);

  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text(`${lang === 'en' ? 'No.' : 'N.º'} ${quote.quote_number}`, PAGE_W / 2, 125, { align: 'center' });
  doc.text(new Date(quote.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' }), PAGE_W / 2, 132, { align: 'center' });

  let y = 165;
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 140);
  doc.text(lang === 'en' ? 'PREPARED EXCLUSIVELY FOR' : 'PREPARADO EXCLUSIVAMENTE PARA', PAGE_W / 2, y, { align: 'center' });
  y += 9;
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text(quote.client_name, PAGE_W / 2, y, { align: 'center' });
  y += 7;
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const clientLine = [quote.client_company, quote.project_name].filter(Boolean).join(' — ');
  if (clientLine) doc.text(clientLine, PAGE_W / 2, y, { align: 'center' });
}

async function renderCoverMinimal(ctx: Ctx) {
  const { doc, quote, branding, documentTitle, lang, logoDataUrl } = ctx;
  doc.setFont('helvetica', 'normal');

  if (logoDataUrl) { try { doc.addImage(logoDataUrl, 'PNG', MARGIN, 22, 18, 18, undefined, 'FAST'); } catch { /* skip */ } }
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text((branding?.company_legal_name || '').toUpperCase(), PAGE_W - MARGIN, 27, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(26);
  doc.setTextColor(15, 15, 15);
  doc.text(documentTitle, MARGIN, 80);
  doc.setDrawColor(15, 15, 15);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, 85, PAGE_W - MARGIN, 85);

  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text(`${lang === 'en' ? 'No.' : 'N.º'} ${quote.quote_number}`, MARGIN, 93);
  doc.text(new Date(quote.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' }), PAGE_W - MARGIN, 93, { align: 'right' });

  let y = 120;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(lang === 'en' ? 'FOR' : 'PARA', MARGIN, y);
  y += 7;
  doc.setFontSize(13);
  doc.setTextColor(15, 15, 15);
  doc.text(quote.client_name, MARGIN, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  [quote.client_company, quote.client_email, quote.client_phone].filter(Boolean).forEach((line) => { doc.text(line as string, MARGIN, y); y += 5; });

  if (quote.project_name) {
    y += 8;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(lang === 'en' ? 'PROJECT' : 'PROYECTO', MARGIN, y);
    y += 7;
    doc.setFontSize(13);
    doc.setTextColor(15, 15, 15);
    doc.text(quote.project_name, MARGIN, y);
  }
}

// ── Line items table + financial summary — shared structure, styled per
// template via the shared sectionHeader/font/color already set on ctx ──
function renderItemsAndSummary(ctx: Ctx, template: TemplateId) {
  const { doc, items, quote, lang, primary, font } = ctx;
  doc.addPage();
  let y = sectionHeader(ctx, template, lang === 'en' ? 'Products & Services' : 'Productos y Servicios', 22) + 8;

  const colX = { desc: MARGIN, qty: 118, price: 140, disc: 162, total: 182 };
  doc.setFont(font, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(lang === 'en' ? 'DESCRIPTION' : 'DESCRIPCIÓN', colX.desc, y);
  doc.text(lang === 'en' ? 'QTY' : 'CANT.', colX.qty, y);
  doc.text(lang === 'en' ? 'PRICE' : 'PRECIO', colX.price, y);
  doc.text(lang === 'en' ? 'DISC.' : 'DESC.', colX.disc, y);
  doc.text(lang === 'en' ? 'TOTAL' : 'TOTAL', colX.total, y);
  y += 3;
  doc.setDrawColor(template === 'minimal' ? 20 : 220, template === 'minimal' ? 20 : 220, template === 'minimal' ? 20 : 220);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 6;

  doc.setFont(font, 'normal');
  doc.setFontSize(9);
  for (const item of items) {
    if (y > PAGE_H - 30) { doc.addPage(); y = 25; }
    doc.setTextColor(40, 40, 40);
    const descLines = doc.splitTextToSize(item.description, 90);
    doc.text(descLines, colX.desc, y);
    doc.text(`${item.quantity} ${item.unit || ''}`.trim(), colX.qty, y);
    doc.text(fmtMoney(item.unit_price), colX.price, y);
    doc.text(item.discount_pct ? `${item.discount_pct}%` : '—', colX.disc, y);
    doc.text(fmtMoney(computeLineItemTotal(item)), colX.total, y);
    y += Math.max(descLines.length * 5, 7);
  }

  y += 8;
  doc.setDrawColor(template === 'minimal' ? 20 : 220, template === 'minimal' ? 20 : 220, template === 'minimal' ? 20 : 220);
  doc.line(120, y, PAGE_W - MARGIN, y);
  y += 8;
  const summaryRow = (label: string, value: string, bold = false) => {
    doc.setFont(font, bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 12 : 10);
    doc.setTextColor(bold ? primary[0] : 90, bold ? primary[1] : 90, bold ? primary[2] : 90);
    doc.text(label, 140, y);
    doc.text(value, PAGE_W - MARGIN, y, { align: 'right' });
    y += bold ? 8 : 6;
  };
  summaryRow(lang === 'en' ? 'Subtotal' : 'Subtotal', fmtMoney(quote.subtotal));
  if (quote.discount_total > 0) summaryRow(lang === 'en' ? 'Discount' : 'Descuento', `-${fmtMoney(quote.discount_total)}`);
  if (quote.tax_total > 0) summaryRow(lang === 'en' ? 'Taxes' : 'Impuestos', fmtMoney(quote.tax_total));
  summaryRow(lang === 'en' ? 'TOTAL' : 'TOTAL', fmtMoney(quote.total), true);
}

function renderAcceptancePage(ctx: Ctx, template: TemplateId) {
  const { doc, lang, font, quote } = ctx;
  doc.addPage();
  sectionHeader(ctx, template, lang === 'en' ? 'Acceptance' : 'Aceptación', 25);
  doc.setFont(font, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const acceptanceNote = lang === 'en'
    ? 'This document does not necessarily constitute a final legal contract unless the parties so indicate, but it is verifiable evidence of acceptance of this commercial proposal.'
    : 'Este documento no constituye necesariamente un contrato legal definitivo, salvo que las partes así lo indiquen, pero sí constituye evidencia verificable de aceptación de la propuesta comercial.';
  doc.text(doc.splitTextToSize(acceptanceNote, PAGE_W - MARGIN * 2), MARGIN, 35);

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`${quote.quote_number} · Codec Document`, MARGIN, PAGE_H - 15);
}

export async function generateQuotePdf(
  quote: Quote,
  items: QuoteLineItem[],
  branding: QuotePublicBranding | null,
  documentTitle: string,
): Promise<Uint8Array> {
  const template: TemplateId = (quote.template as TemplateId) || 'corporate';
  const lang: Lang = quote.language === 'en' ? 'en' : 'es';
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const primary = rgbOf(branding?.brand_color_primary, [67, 56, 202]);
  const secondary = rgbOf(branding?.brand_color_secondary, [30, 41, 59]);
  const font: Ctx['font'] = template === 'executive' ? 'times' : 'helvetica';
  const logoDataUrl = branding?.company_logo_url ? await logoToDataUrl(branding.company_logo_url) : null;

  const ctx: Ctx = { doc, quote, items, branding, documentTitle, lang, primary, secondary, font, logoDataUrl };

  // ── Cover page ──────────────────────────────────────────────────────
  if (template === 'modern') await renderCoverModern(ctx);
  else if (template === 'executive') await renderCoverExecutive(ctx);
  else if (template === 'minimal') await renderCoverMinimal(ctx);
  else await renderCoverCorporate(ctx);

  // ── Executive summary / scope page ──────────────────────────────────
  if (quote.executive_summary || quote.project_objective || quote.project_scope) {
    doc.addPage();
    let y = 25;
    const addSection = (label: string, text: string | null) => {
      if (!text) return;
      y = sectionHeader(ctx, template, label, y);
      y = bodyText(ctx, text, y, PAGE_W - MARGIN * 2, template === 'executive' ? 'center' : 'left');
    };
    addSection(lang === 'en' ? 'Executive Summary' : 'Resumen Ejecutivo', quote.executive_summary);
    addSection(lang === 'en' ? 'Objective' : 'Objetivo', quote.project_objective);
    addSection(lang === 'en' ? 'Scope' : 'Alcance', quote.project_scope);
  }

  // ── Proposal blocks (activated sections) ────────────────────────────
  const activeBlocks = Object.entries(quote.proposal_blocks || {}).filter(([, v]) => v && String(v).trim());
  if (activeBlocks.length > 0) {
    doc.addPage();
    let y = 25;
    for (const [key, value] of activeBlocks) {
      const label = BLOCK_LABELS[key as keyof ProposalBlocks]?.[lang] ?? key;
      if (y > PAGE_H - 40) { doc.addPage(); y = 25; }
      y = sectionHeader(ctx, template, label, y);
      y = bodyText(ctx, String(value), y, PAGE_W - MARGIN * 2, template === 'executive' ? 'center' : 'left');
    }
  }

  renderItemsAndSummary(ctx, template);
  renderAcceptancePage(ctx, template);

  return new Uint8Array(doc.output('arraybuffer'));
}
