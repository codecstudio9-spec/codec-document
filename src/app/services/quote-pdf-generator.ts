/**
 * Smart Quotes PDF — deliberately separate from PDFGenerator
 * (pdf-generator.ts), which is purpose-built for jurisdiction-aware legal
 * documents and already carries a lot of that-specific complexity.
 * Quotes have a different shape entirely (cover page, line-items table,
 * financial summary, proposal blocks) — a dedicated generator here keeps
 * both simple and avoids risking the legal-doc generator while building
 * this. "Corporate" template only for this first pass; Modern/Executive/
 * Minimal are a follow-up.
 */
import { jsPDF } from 'jspdf';
import type { Quote, QuoteLineItem, ProposalBlocks } from './quotes-service';
import type { QuotePublicBranding } from './quotes-service';
import { computeLineItemTotal } from './quotes-service';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;

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

export async function generateQuotePdf(
  quote: Quote,
  items: QuoteLineItem[],
  branding: QuotePublicBranding | null,
  documentTitle: string,
): Promise<Uint8Array> {
  const lang = quote.language === 'en' ? 'en' : 'es';
  const primary = branding?.brand_color_primary || '#4338CA';
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const rgb = (hex: string): [number, number, number] => {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16) || 67, parseInt(h.slice(2, 4), 16) || 56, parseInt(h.slice(4, 6), 16) || 202];
  };
  const [r, g, b] = rgb(primary);

  // ── Cover page ──────────────────────────────────────────────────────
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, PAGE_W, 8, 'F');

  if (branding?.company_logo_url) {
    try {
      const res = await fetch(branding.company_logo_url);
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      doc.addImage(dataUrl, 'PNG', MARGIN, 20, 32, 32, undefined, 'FAST');
    } catch { /* no logo, skip */ }
  }

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.text(branding?.company_legal_name || '', PAGE_W - MARGIN, 25, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const companyLines = [
    branding?.company_address_line1, branding?.company_city, branding?.company_phone, branding?.company_email,
  ].filter(Boolean) as string[];
  companyLines.forEach((line, i) => doc.text(line, PAGE_W - MARGIN, 31 + i * 5, { align: 'right' }));

  doc.setFontSize(28);
  doc.setTextColor(r, g, b);
  doc.text(documentTitle, MARGIN, 90);

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`${lang === 'en' ? 'No.' : 'N.º'} ${quote.quote_number}`, MARGIN, 100);
  doc.text(new Date(quote.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' }), MARGIN, 106);

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(lang === 'en' ? 'PREPARED FOR' : 'PREPARADO PARA', MARGIN, 125);
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text(quote.client_name, MARGIN, 133);
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  const clientLines = [quote.client_company, quote.client_email, quote.client_phone].filter(Boolean) as string[];
  clientLines.forEach((line, i) => doc.text(line, MARGIN, 140 + i * 5));

  if (quote.project_name) {
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(lang === 'en' ? 'PROJECT' : 'PROYECTO', MARGIN, 165);
    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    doc.text(quote.project_name, MARGIN, 173);
  }

  // ── Executive summary / scope page ──────────────────────────────────
  if (quote.executive_summary || quote.project_objective || quote.project_scope) {
    doc.addPage();
    let y = 25;
    const addSection = (label: string, text: string | null) => {
      if (!text) return;
      doc.setFontSize(13);
      doc.setTextColor(r, g, b);
      doc.text(label, MARGIN, y);
      y += 7;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const wrapped = doc.splitTextToSize(text, PAGE_W - MARGIN * 2);
      doc.text(wrapped, MARGIN, y);
      y += wrapped.length * 5 + 10;
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
      doc.setFontSize(13);
      doc.setTextColor(r, g, b);
      doc.text(label, MARGIN, y);
      y += 7;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const wrapped = doc.splitTextToSize(String(value), PAGE_W - MARGIN * 2);
      doc.text(wrapped, MARGIN, y);
      y += wrapped.length * 5 + 10;
    }
  }

  // ── Line items table + financial summary ────────────────────────────
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(r, g, b);
  doc.text(lang === 'en' ? 'Products & Services' : 'Productos y Servicios', MARGIN, 22);

  let y = 34;
  const colX = { desc: MARGIN, qty: 118, price: 140, disc: 162, total: 182 };
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(lang === 'en' ? 'DESCRIPTION' : 'DESCRIPCIÓN', colX.desc, y);
  doc.text(lang === 'en' ? 'QTY' : 'CANT.', colX.qty, y);
  doc.text(lang === 'en' ? 'PRICE' : 'PRECIO', colX.price, y);
  doc.text(lang === 'en' ? 'DISC.' : 'DESC.', colX.disc, y);
  doc.text(lang === 'en' ? 'TOTAL' : 'TOTAL', colX.total, y);
  y += 3;
  doc.setDrawColor(220, 220, 220);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 6;

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
  doc.setDrawColor(220, 220, 220);
  doc.line(120, y, PAGE_W - MARGIN, y);
  y += 8;
  const summaryRow = (label: string, value: string, bold = false) => {
    doc.setFontSize(bold ? 12 : 10);
    doc.setTextColor(bold ? r : 90, bold ? g : 90, bold ? b : 90);
    doc.text(label, 140, y);
    doc.text(value, PAGE_W - MARGIN, y, { align: 'right' });
    y += bold ? 8 : 6;
  };
  summaryRow(lang === 'en' ? 'Subtotal' : 'Subtotal', fmtMoney(quote.subtotal));
  if (quote.discount_total > 0) summaryRow(lang === 'en' ? 'Discount' : 'Descuento', `-${fmtMoney(quote.discount_total)}`);
  if (quote.tax_total > 0) summaryRow(lang === 'en' ? 'Taxes' : 'Impuestos', fmtMoney(quote.tax_total));
  summaryRow(lang === 'en' ? 'TOTAL' : 'TOTAL', fmtMoney(quote.total), true);

  // ── Final page: signature + validation ──────────────────────────────
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(r, g, b);
  doc.text(lang === 'en' ? 'Acceptance' : 'Aceptación', MARGIN, 25);
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const acceptanceNote = lang === 'en'
    ? 'This document does not necessarily constitute a final legal contract unless the parties so indicate, but it is verifiable evidence of acceptance of this commercial proposal.'
    : 'Este documento no constituye necesariamente un contrato legal definitivo, salvo que las partes así lo indiquen, pero sí constituye evidencia verificable de aceptación de la propuesta comercial.';
  doc.text(doc.splitTextToSize(acceptanceNote, PAGE_W - MARGIN * 2), MARGIN, 35);

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`${quote.quote_number} · Codec Document`, MARGIN, PAGE_H - 15);

  return new Uint8Array(doc.output('arraybuffer'));
}
