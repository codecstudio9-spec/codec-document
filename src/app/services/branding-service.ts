import { supabase, publicSupabase } from '../../lib/supabase';
import type { DocumentBranding } from '../types/document';

export interface UserBranding {
  companyLogoUrl: string | null;
  logoSize: 'small' | 'medium' | 'large';
  headerText: string | null;
  footerText: string | null;
  useWatermark: boolean;
  useGlobalBranding: boolean;
  // Legal-document PDF export identity block (document-generator-page.tsx's
  // "Personalizar Diseño" drawer reads these as ITS defaults on first
  // load only — editing a single document never writes back here, so a
  // one-off tweak for one document can never silently change this saved
  // profile, and vice versa).
  enableLogoInDocs: boolean;
  logoPosition: 'left' | 'right';
  companyLegalName: string | null;
  companyAddressLine1: string | null;
  companyAddressLine2: string | null;
  companyCity: string | null;
  companyState: string | null;
  companyZip: string | null;
  companyCountry: string | null;
  companyEIN: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  companyWebsite: string | null;
  // Identidad visual + datos bancarios -- usados por el generador de PDF
  // de Smart Quotes (cotizaciones), reutilizando este mismo perfil de
  // marca en vez de un /my-company-branding paralelo.
  brandColorPrimary: string | null;
  brandColorSecondary: string | null;
  brandFont: string | null;
  bankName: string | null;
  bankAccount: string | null;
  paymentAch: string | null;
  paymentZelle: string | null;
  paymentNequi: string | null;
  paymentDaviplata: string | null;
  paymentPaypal: string | null;
}

const EMPTY_BRANDING: UserBranding = {
  companyLogoUrl: null, logoSize: 'medium', headerText: null, footerText: null,
  useWatermark: false, useGlobalBranding: false,
  enableLogoInDocs: false, logoPosition: 'left',
  companyLegalName: null, companyAddressLine1: null, companyAddressLine2: null,
  companyCity: null, companyState: null, companyZip: null, companyCountry: null,
  companyEIN: null, companyPhone: null, companyEmail: null, companyWebsite: null,
  brandColorPrimary: null, brandColorSecondary: null, brandFont: null,
  bankName: null, bankAccount: null, paymentAch: null, paymentZelle: null,
  paymentNequi: null, paymentDaviplata: null, paymentPaypal: null,
};

const BRANDING_COLUMNS = 'company_logo_url, logo_size, header_text, footer_text, use_watermark, use_global_branding, enable_logo_in_docs, logo_position, company_legal_name, company_address_line1, company_address_line2, company_city, company_state, company_zip, company_country, company_ein, company_phone, company_email, company_website, brand_color_primary, brand_color_secondary, brand_font, bank_name, bank_account, payment_ach, payment_zelle, payment_nequi, payment_daviplata, payment_paypal';

export async function getUserBranding(userId: string): Promise<UserBranding> {
  const { data, error } = await supabase
    .from('users')
    .select(BRANDING_COLUMNS)
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return EMPTY_BRANDING;
  return {
    companyLogoUrl: data.company_logo_url ?? null,
    logoSize: (data.logo_size as UserBranding['logoSize']) ?? 'medium',
    headerText: data.header_text ?? null,
    footerText: data.footer_text ?? null,
    useWatermark: Boolean(data.use_watermark),
    useGlobalBranding: Boolean(data.use_global_branding),
    enableLogoInDocs: Boolean(data.enable_logo_in_docs),
    logoPosition: (data.logo_position as UserBranding['logoPosition']) ?? 'left',
    companyLegalName: data.company_legal_name ?? null,
    companyAddressLine1: data.company_address_line1 ?? null,
    companyAddressLine2: data.company_address_line2 ?? null,
    companyCity: data.company_city ?? null,
    companyState: data.company_state ?? null,
    companyZip: data.company_zip ?? null,
    companyCountry: data.company_country ?? null,
    companyEIN: data.company_ein ?? null,
    companyPhone: data.company_phone ?? null,
    companyEmail: data.company_email ?? null,
    companyWebsite: data.company_website ?? null,
    brandColorPrimary: data.brand_color_primary ?? null,
    brandColorSecondary: data.brand_color_secondary ?? null,
    brandFont: data.brand_font ?? null,
    bankName: data.bank_name ?? null,
    bankAccount: data.bank_account ?? null,
    paymentAch: data.payment_ach ?? null,
    paymentZelle: data.payment_zelle ?? null,
    paymentNequi: data.payment_nequi ?? null,
    paymentDaviplata: data.payment_daviplata ?? null,
    paymentPaypal: data.payment_paypal ?? null,
  };
}

/** Used by the guest-facing signing page — the guest has no session, so
 * this goes through get_document_branding (SECURITY DEFINER), not a
 * direct `.from('users')` read, which owner-only RLS would block. */
export async function getDocumentBranding(documentId: string): Promise<UserBranding> {
  const { data, error } = await publicSupabase.rpc('get_document_branding', { p_document_id: documentId }).maybeSingle();
  if (error || !data) return EMPTY_BRANDING;
  const row = data as {
    company_logo_url: string | null; logo_size: string | null; header_text: string | null;
    footer_text: string | null; use_watermark: boolean | null; use_global_branding: boolean | null;
  };
  return {
    ...EMPTY_BRANDING,
    companyLogoUrl: row.company_logo_url ?? null,
    logoSize: (row.logo_size as UserBranding['logoSize']) ?? 'medium',
    headerText: row.header_text ?? null,
    footerText: row.footer_text ?? null,
    useWatermark: Boolean(row.use_watermark),
    useGlobalBranding: Boolean(row.use_global_branding),
  };
}

/** Used by the guest-facing /sign/:transactionId page's "download my own
 * copy" button — the guest has no session, so this goes through
 * get_sign_transaction_branding (SECURITY DEFINER), resolving the
 * transaction CREATOR's branding profile, not the guest's own (a guest
 * never has one). Returns the full branding profile (logo, watermark,
 * header/footer, company identity) — see
 * 20260907140000_add_sign_transaction_branding.sql. */
export async function getSignTransactionBranding(transactionId: string): Promise<UserBranding> {
  const { data, error } = await publicSupabase.rpc('get_sign_transaction_branding', { p_transaction_id: transactionId }).maybeSingle();
  if (error || !data) return EMPTY_BRANDING;
  const row = data as Record<string, unknown>;
  return {
    companyLogoUrl: (row.company_logo_url as string) ?? null,
    logoSize: (row.logo_size as UserBranding['logoSize']) ?? 'medium',
    headerText: (row.header_text as string) ?? null,
    footerText: (row.footer_text as string) ?? null,
    useWatermark: Boolean(row.use_watermark),
    useGlobalBranding: Boolean(row.use_global_branding),
    enableLogoInDocs: Boolean(row.enable_logo_in_docs),
    logoPosition: (row.logo_position as UserBranding['logoPosition']) ?? 'left',
    companyLegalName: (row.company_legal_name as string) ?? null,
    companyAddressLine1: (row.company_address_line1 as string) ?? null,
    companyAddressLine2: (row.company_address_line2 as string) ?? null,
    companyCity: (row.company_city as string) ?? null,
    companyState: (row.company_state as string) ?? null,
    companyZip: (row.company_zip as string) ?? null,
    companyCountry: (row.company_country as string) ?? null,
    companyEIN: (row.company_ein as string) ?? null,
    companyPhone: (row.company_phone as string) ?? null,
    companyEmail: (row.company_email as string) ?? null,
    companyWebsite: (row.company_website as string) ?? null,
    brandColorPrimary: null, brandColorSecondary: null, brandFont: null,
    bankName: null, bankAccount: null, paymentAch: null, paymentZelle: null,
    paymentNequi: null, paymentDaviplata: null, paymentPaypal: null,
  };
}

/** Same mapping as loadDocumentBrandingForUser, but for a guest signer with
 * no session — resolves the transaction CREATOR's branding via
 * getSignTransactionBranding instead of the caller's own profile. */
export async function loadSignTransactionBrandingForGuest(transactionId: string): Promise<DocumentBranding> {
  try {
    const saved = await getSignTransactionBranding(transactionId);
    const logoDataUrl = saved.companyLogoUrl ? await logoUrlToDataUrl(saved.companyLogoUrl) : null;
    return {
      enableLogo: saved.enableLogoInDocs ? Boolean(logoDataUrl) : false,
      enableLogoWatermark: saved.useWatermark ? Boolean(logoDataUrl) : false,
      logoDataUrl: logoDataUrl || undefined,
      logoPosition: saved.logoPosition,
      headerText: saved.headerText || undefined,
      footerText: saved.footerText || undefined,
      companyLegalName: saved.companyLegalName || undefined,
      companyAddressLine1: saved.companyAddressLine1 || undefined,
      companyAddressLine2: saved.companyAddressLine2 || undefined,
      companyCity: saved.companyCity || undefined,
      companyState: saved.companyState || undefined,
      companyZip: saved.companyZip || undefined,
      companyCountry: saved.companyCountry || undefined,
      companyEIN: saved.companyEIN || undefined,
      companyPhone: saved.companyPhone || undefined,
      companyEmail: saved.companyEmail || undefined,
      companyWebsite: saved.companyWebsite || undefined,
    };
  } catch {
    return {};
  }
}

// SECURITY DEFINER RPC, not a raw `.update()` — same reasoning used
// throughout this project (a raw update matching 0 rows reports success
// with no error). `branding` is the FULL desired state, not a partial
// patch, matching the same convention as updateUserDocumentDetails.
export async function updateUserBranding(branding: UserBranding): Promise<void> {
  const { data, error } = await supabase.rpc('update_user_branding', {
    p_company_logo_url: branding.companyLogoUrl,
    p_logo_size: branding.logoSize,
    p_header_text: branding.headerText,
    p_footer_text: branding.footerText,
    p_use_watermark: branding.useWatermark,
    p_use_global_branding: branding.useGlobalBranding,
    p_enable_logo_in_docs: branding.enableLogoInDocs,
    p_logo_position: branding.logoPosition,
    p_company_legal_name: branding.companyLegalName,
    p_company_address_line1: branding.companyAddressLine1,
    p_company_address_line2: branding.companyAddressLine2,
    p_company_city: branding.companyCity,
    p_company_state: branding.companyState,
    p_company_zip: branding.companyZip,
    p_company_country: branding.companyCountry,
    p_company_ein: branding.companyEIN,
    p_company_phone: branding.companyPhone,
    p_company_email: branding.companyEmail,
    p_company_website: branding.companyWebsite,
    p_brand_color_primary: branding.brandColorPrimary,
    p_brand_color_secondary: branding.brandColorSecondary,
    p_brand_font: branding.brandFont,
    p_bank_name: branding.bankName,
    p_bank_account: branding.bankAccount,
    p_payment_ach: branding.paymentAch,
    p_payment_zelle: branding.paymentZelle,
    p_payment_nequi: branding.paymentNequi,
    p_payment_daviplata: branding.paymentDaviplata,
    p_payment_paypal: branding.paymentPaypal,
  });
  if (error) throw new Error(`updateUserBranding: ${error.message}`);
  if (!data) throw new Error('updateUserBranding: not saved (not signed in?)');
}

/** document-generator-page.tsx's PDF header (renderPdfHeader in
 * preview-page.tsx) needs an actual base64 data URL to embed via
 * jsPDF's addImage — a bare hosted URL doesn't work there. Used only to
 * pre-fill the "Personalizar Diseño" drawer's local logoDataUrl from the
 * saved companyLogoUrl on first load; never persisted anywhere itself.
 * Returns null on any failure (CORS, network) so a broken fetch just
 * means "no logo pre-filled", never a crash. */
export async function logoUrlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
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

/**
 * Loads a signed-in user's saved branding profile and maps it into the
 * shape PDFGenerator's `branding` option expects (logo as a base64 data
 * URL, not a bare hosted URL — jsPDF's addImage needs the former).
 *
 * Extracted so every PDF-generation entry point that renders a document
 * for its OWNER (not a guest signer — see get_sign_transaction_branding
 * for that case) applies the exact same mapping as
 * document-generator-page.tsx's "Personalizar Diseño" drawer, instead of
 * each page re-deriving it slightly differently or, worse, forgetting to
 * fetch it at all — which is exactly what happened for custom Word-template
 * documents and any document re-downloaded after
 * stashSignedTransactionForDownload() clears the sessionStorage-cached
 * 'documentBranding' (see sign-transaction-service.ts): the branding
 * configured in Settings (logo, watermark, header/footer, company
 * identity) silently never made it into the final PDF.
 */
export async function loadDocumentBrandingForUser(userId: string): Promise<DocumentBranding> {
  try {
    const saved = await getUserBranding(userId);
    const logoDataUrl = saved.companyLogoUrl ? await logoUrlToDataUrl(saved.companyLogoUrl) : null;
    return {
      enableLogo: saved.enableLogoInDocs ? Boolean(logoDataUrl) : false,
      enableLogoWatermark: saved.useWatermark ? Boolean(logoDataUrl) : false,
      logoDataUrl: logoDataUrl || undefined,
      logoPosition: saved.logoPosition,
      headerText: saved.headerText || undefined,
      footerText: saved.footerText || undefined,
      companyLegalName: saved.companyLegalName || undefined,
      companyAddressLine1: saved.companyAddressLine1 || undefined,
      companyAddressLine2: saved.companyAddressLine2 || undefined,
      companyCity: saved.companyCity || undefined,
      companyState: saved.companyState || undefined,
      companyZip: saved.companyZip || undefined,
      companyCountry: saved.companyCountry || undefined,
      companyEIN: saved.companyEIN || undefined,
      companyPhone: saved.companyPhone || undefined,
      companyEmail: saved.companyEmail || undefined,
      companyWebsite: saved.companyWebsite || undefined,
    };
  } catch {
    // A branding fetch must never block generating/downloading the document.
    return {};
  }
}

/** Timestamped path, never a fixed one — the same anon/authenticated
 * storage RLS this project has hit repeatedly only reliably grants
 * INSERT on documents-bucket, not UPDATE, so re-uploading a logo to the
 * SAME path would 403 on the second try. A fresh path every time sides
 * around that entirely. */
export async function uploadLogo(userId: string, file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  const path = `branding/${userId}/logo-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('documents-bucket').upload(path, file, {
    contentType: file.type || 'image/png',
    upsert: false,
  });
  if (error) throw new Error(`uploadLogo: ${error.message}`);
  const { data } = supabase.storage.from('documents-bucket').getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('uploadLogo: could not retrieve public URL');
  return data.publicUrl;
}
