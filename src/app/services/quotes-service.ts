/**
 * Smart Quotes / Cotizaciones Inteligentes — cotizaciones que se pueden
 * enviar, ver, y firmar electrónicamente (no una plantilla PDF suelta).
 * Reutiliza el motor de firmas existente (signatureService.ts:
 * createDocumentRecord/createSigner/createSigningLink) — cuando se pide
 * firma, se crea un documento/firmante/link reales, y un trigger de base
 * de datos (ver supabase_add_smart_quotes_migration.sql) marca la
 * cotización como "accepted" automáticamente cuando ese firmante completa,
 * sin que este archivo tenga que enterarse del detalle.
 */
import { supabase, publicSupabase } from '../../lib/supabase';

export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
export type QuoteType = 'quote' | 'proposal' | 'estimate' | 'sow';

export interface ProposalBlocks {
  /** El cuerpo de la propuesta escrito de una sola vez — lo que el cliente
   *  pega en el recuadro, o lo que la agente redacta cuando se lo pide de
   *  viva voz. Es el camino normal; los diez bloques de abajo son el camino
   *  largo, para quien quiera separar la propuesta en secciones.
   *
   *  Va dentro de `proposal_blocks` (jsonb) en vez de en una columna nueva
   *  precisamente para no necesitar migración. */
  pitch?: string;
  intro?: string;
  problem?: string;
  solution?: string;
  benefits?: string;
  exclusions?: string;
  timeline?: string;
  terms?: string;
  warranty?: string;
  payment_terms?: string;
  notes?: string;
}

export interface QuoteLineItem {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_pct: number;
  tax_pct: number;
  /** Cuando tiene valor, este ítem es UNA alternativa dentro de un grupo de
   * opciones (p. ej. "Plan Esencial" / "Plan Profesional" / "Plan Premium",
   * todos con option_group: "Planes"), no un producto adicional. Los ítems
   * con el mismo option_group se muestran juntos en el PDF y el cliente
   * elige uno — por eso quedan FUERA del subtotal/total (ver
   * computeQuoteTotals), sumarlos daría un total que nadie va a pagar. */
  option_group?: string | null;
}

export interface Quote {
  id: string;
  user_id: string;
  quote_number: string;
  status: QuoteStatus;
  country: string | null;
  language: 'es' | 'en';
  quote_type: QuoteType;
  client_name: string;
  client_company: string | null;
  client_position: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_address: string | null;
  project_name: string | null;
  executive_summary: string | null;
  project_objective: string | null;
  project_scope: string | null;
  proposal_blocks: ProposalBlocks;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  total: number;
  template: 'corporate' | 'modern' | 'executive' | 'minimal';
  /** Rótulo que le pone su dueño («Kevin Hernández», «Agendas diciembre»).
   *  Sólo para encontrarla en el panel — nunca aparece en el PDF. */
  name: string | null;
  folder_id: string | null;
  pdf_url: string | null;
  signed: boolean;
  signature_transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteInput {
  quote_number?: string;
  country?: string | null;
  language?: 'es' | 'en';
  quote_type?: QuoteType;
  client_name: string;
  client_company?: string;
  client_position?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  project_name?: string;
  executive_summary?: string;
  project_objective?: string;
  project_scope?: string;
  proposal_blocks?: ProposalBlocks;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  total: number;
  template?: string;
}

/** Real-time totals for the line-items table — one item's total is
 * (qty * unit_price) - discount% + tax%, applied in that order (discount
 * off the pre-tax line, then tax on the discounted amount), which is the
 * conventional order in every quoting tool this is meant to resemble. */
export function computeLineItemTotal(item: QuoteLineItem): number {
  const base = item.quantity * item.unit_price;
  const afterDiscount = base * (1 - (item.discount_pct || 0) / 100);
  const withTax = afterDiscount * (1 + (item.tax_pct || 0) / 100);
  return Math.round(withTax * 100) / 100;
}

export function computeQuoteTotals(items: QuoteLineItem[]): { subtotal: number; discountTotal: number; taxTotal: number; total: number } {
  let subtotal = 0, discountTotal = 0, taxTotal = 0;
  // Las opciones alternativas (option_group) no se suman al total — el
  // cliente elige una, no las tres. Ver la nota en QuoteLineItem.
  for (const item of items) {
    if ((item.option_group || '').trim()) continue;
    const base = item.quantity * item.unit_price;
    const discount = base * (item.discount_pct || 0) / 100;
    const afterDiscount = base - discount;
    const tax = afterDiscount * (item.tax_pct || 0) / 100;
    subtotal += base;
    discountTotal += discount;
    taxTotal += tax;
  }
  const round = (n: number) => Math.round(n * 100) / 100;
  return { subtotal: round(subtotal), discountTotal: round(discountTotal), taxTotal: round(taxTotal), total: round(subtotal - discountTotal + taxTotal) };
}

export async function createQuote(quote: QuoteInput, items: QuoteLineItem[]): Promise<string> {
  const { data, error } = await supabase.rpc('create_quote', { p_quote: quote, p_items: items });
  if (error) throw new Error(`createQuote: ${error.message}`);
  return data as string;
}

export async function updateQuote(id: string, quote: Partial<QuoteInput>, items?: QuoteLineItem[]): Promise<void> {
  const { error } = await supabase.rpc('update_quote', { p_id: id, p_quote: quote, p_items: items ?? null });
  if (error) throw new Error(`updateQuote: ${error.message}`);
}

export async function setQuotePdfAndStatus(id: string, pdfUrl: string | null, status: QuoteStatus | null): Promise<void> {
  const { error } = await supabase.rpc('set_quote_pdf_and_status', { p_id: id, p_pdf_url: pdfUrl, p_status: status });
  if (error) throw new Error(`setQuotePdfAndStatus: ${error.message}`);
}

/** Called right after createDocumentRecord() when "Solicitar firma" is
 * clicked — links the quote to the real signature document so the DB
 * trigger can flip it to "accepted" once that document is fully signed. */
export async function linkQuoteSignature(id: string, documentId: string): Promise<void> {
  const { error } = await supabase.rpc('link_quote_signature', { p_id: id, p_document_id: documentId });
  if (error) throw new Error(`linkQuoteSignature: ${error.message}`);
}

export async function listMyQuotes(): Promise<Quote[]> {
  const { data, error } = await supabase.rpc('list_my_quotes');
  if (error || !data) return [];
  return data as Quote[];
}

export async function getMyQuoteFull(id: string): Promise<{ quote: Quote; items: QuoteLineItem[] } | null> {
  const { data, error } = await supabase.rpc('get_my_quote_full', { p_id: id });
  if (error || !data) return null;
  return { quote: data.quote as Quote, items: (data.items ?? []) as QuoteLineItem[] };
}

export async function deleteQuote(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_quote', { p_id: id });
  if (error) throw new Error(`deleteQuote: ${error.message}`);
}

// ─── Nombre y carpetas ──────────────────────────────────────────────────
//
// Una cotización se distinguía sólo por su número («Q-20260812-a3f1») y el
// nombre del cliente, así que quien manda varias al mes no encontraba la que
// quería reutilizar. `name` es un rótulo interno: NO sale en el PDF.

export interface QuoteFolder {
  id: string;
  name: string;
  color: string;
  quoteCount: number;
}

export async function listMyQuoteFolders(): Promise<QuoteFolder[]> {
  const { data, error } = await supabase.rpc('list_my_quote_folders');
  if (error || !data) return [];
  return (data as any[]).map((r) => ({
    id: r.id, name: r.name, color: r.color ?? '#4338CA', quoteCount: Number(r.quote_count ?? 0),
  }));
}

export async function createQuoteFolder(name: string, color?: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_quote_folder', { p_name: name, p_color: color ?? '#4338CA' });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function renameQuoteFolder(id: string, name: string, color?: string): Promise<void> {
  const { error } = await supabase.rpc('rename_quote_folder', { p_id: id, p_name: name, p_color: color ?? null });
  if (error) throw new Error(error.message);
}

/** Borrar una carpeta NO borra lo que hay dentro: esas cotizaciones vuelven a
 *  «sin carpeta» (ON DELETE SET NULL en la migración). */
export async function deleteQuoteFolder(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_quote_folder', { p_id: id });
  if (error) throw new Error(error.message);
}

export async function setQuoteFolder(quoteId: string, folderId: string | null): Promise<void> {
  const { error } = await supabase.rpc('set_quote_folder', { p_quote_id: quoteId, p_folder_id: folderId });
  if (error) throw new Error(error.message);
}

export async function setQuoteName(quoteId: string, name: string): Promise<void> {
  const { error } = await supabase.rpc('set_quote_name', { p_quote_id: quoteId, p_name: name });
  if (error) throw new Error(error.message);
}

/** Copia la cotización con todos sus productos. Nace como borrador con número
 *  nuevo — no hereda el estado de envío, ni el PDF, ni la firma del original. */
export async function duplicateQuote(id: string, name?: string): Promise<string> {
  const { data, error } = await supabase.rpc('duplicate_quote', { p_id: id, p_name: name ?? null });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function getQuotesSummary(): Promise<{
  totalCount: number; sentCount: number; viewedCount: number; acceptedCount: number; rejectedCount: number;
  quotedValue: number; acceptedValue: number;
}> {
  const { data, error } = await supabase.rpc('get_quotes_summary');
  const row = !error && Array.isArray(data) ? data[0] : null;
  return {
    totalCount: Number(row?.total_count ?? 0), sentCount: Number(row?.sent_count ?? 0),
    viewedCount: Number(row?.viewed_count ?? 0), acceptedCount: Number(row?.accepted_count ?? 0),
    rejectedCount: Number(row?.rejected_count ?? 0),
    quotedValue: Number(row?.quoted_value ?? 0), acceptedValue: Number(row?.accepted_value ?? 0),
  };
}

// ─── Public (client-facing, no session) ────────────────────────────────

export interface QuotePublicBranding {
  company_logo_url: string | null;
  /** Opcionales porque `get_quote_public` (la vista sin sesión) no los
   *  devuelve: el PDF siempre se genera del lado del dueño, con el perfil
   *  completo que trae getUserBranding. Sin esto, el generador ignoraba lo
   *  que el cliente había configurado — logo aplastado, marca de agua
   *  activada que no aparecía nunca. */
  logo_size?: 'small' | 'medium' | 'large' | null;
  logo_position?: 'left' | 'right' | null;
  enable_logo_in_docs?: boolean | null;
  use_watermark?: boolean | null;
  header_text?: string | null;
  footer_text?: string | null;
  company_legal_name: string | null;
  company_address_line1: string | null;
  company_address_line2: string | null;
  company_city: string | null;
  company_state: string | null;
  company_country: string | null;
  company_phone: string | null;
  company_email: string | null;
  company_website: string | null;
  brand_color_primary: string | null;
  brand_color_secondary: string | null;
  brand_font: string | null;
  bank_name: string | null;
  bank_account: string | null;
  payment_ach: string | null;
  payment_zelle: string | null;
  payment_nequi: string | null;
  payment_daviplata: string | null;
  payment_paypal: string | null;
}

export async function getQuotePublic(id: string): Promise<{ quote: Quote; items: QuoteLineItem[]; branding: QuotePublicBranding } | null> {
  const { data, error } = await publicSupabase.rpc('get_quote_public', { p_id: id });
  if (error || !data) return null;
  return { quote: data.quote as Quote, items: (data.items ?? []) as QuoteLineItem[], branding: data.branding as QuotePublicBranding };
}

export async function recordQuoteView(id: string, country: string | null, city: string | null, device: string): Promise<void> {
  try {
    await publicSupabase.rpc('record_quote_view', { p_id: id, p_country: country, p_city: city, p_device: device });
  } catch { /* tracking must never break the client's view of the quote */ }
}

/** Guest-side lookup — the client signs at /guest-sign/:token (the
 * generic e-signature engine, not a quote-specific page), which only
 * knows a documentId. This resolves "is this document actually a quote,
 * and which one" so guest-sign-page.tsx can call recordQuoteView(). */
/** Guest-side rejection — the client has no session, only a valid signing
 * token (hence a documentId, resolved to a quoteId via
 * getQuoteIdByDocument first). Only flips status while still
 * 'sent'/'viewed' — server-side, can't un-accept an already-signed quote. */
export async function rejectQuotePublic(quoteId: string): Promise<boolean> {
  const { data, error } = await publicSupabase.rpc('reject_quote_public', { p_quote_id: quoteId });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function getQuoteIdByDocument(documentId: string): Promise<string | null> {
  try {
    const { data, error } = await publicSupabase.rpc('get_quote_id_by_document', { p_document_id: documentId });
    if (error || !data) return null;
    return data as string;
  } catch {
    return null;
  }
}

export async function getQuoteViewStats(id: string): Promise<{ viewCount: number; firstViewedAt: string | null; lastViewedAt: string | null; countries: string[] }> {
  const { data, error } = await supabase.rpc('get_quote_view_stats', { p_id: id });
  const row = !error && Array.isArray(data) ? data[0] : null;
  return {
    viewCount: Number(row?.view_count ?? 0),
    firstViewedAt: row?.first_viewed_at ?? null,
    lastViewedAt: row?.last_viewed_at ?? null,
    countries: row?.countries ?? [],
  };
}

// ─── Country-aware terminology ─────────────────────────────────────────
// US concepts (Quote/Proposal/Estimate/SOW) vs. LatAm per-country wording
// — same underlying document, just the label the creator/client sees.

export const QUOTE_TYPE_LABELS_US: Record<QuoteType, string> = {
  quote: 'Quote', proposal: 'Proposal', estimate: 'Estimate', sow: 'Statement of Work',
};

const LATAM_TITLE_BY_COUNTRY: Record<string, string> = {
  CO: 'Cotización Comercial',
  MX: 'Propuesta Comercial',
  CL: 'Cotización',
  PE: 'Propuesta Económica',
  AR: 'Presupuesto',
  EC: 'Cotización',
};

export function getQuoteDocumentTitle(countryCode: string | null, quoteType: QuoteType, language: 'es' | 'en'): string {
  if (language === 'en' || countryCode === 'US') return QUOTE_TYPE_LABELS_US[quoteType];
  return LATAM_TITLE_BY_COUNTRY[(countryCode || '').toUpperCase()] ?? 'Cotización Comercial';
}

/** "hace 2 horas" / "2 hours ago" — the exact framing the client-activity
 * dashboard needs ("El cliente abrió la propuesta hace 2 horas"), without
 * pulling in a date library for one string. */
export function formatRelativeTime(iso: string, language: 'es' | 'en'): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  const units: Array<[number, { en: string; es: string }]> = [
    [60, { en: 'minute', es: 'minuto' }],
    [24, { en: 'hour', es: 'hora' }],
    [30, { en: 'day', es: 'día' }],
    [12, { en: 'month', es: 'mes' }],
  ];
  if (diffMin < 1) return language === 'en' ? 'just now' : 'justo ahora';

  let value = diffMin;
  let unitLabel = units[0][1];
  for (const [divisor, label] of units) {
    if (value < divisor) { unitLabel = label; break; }
    value = Math.round(value / divisor);
    unitLabel = label;
  }
  const plural = value === 1 ? '' : (language === 'en' ? 's' : (unitLabel.es.endsWith('s') ? '' : 's'));
  return language === 'en'
    ? `${value} ${unitLabel.en}${plural} ago`
    : `hace ${value} ${unitLabel.es}${plural}`;
}
