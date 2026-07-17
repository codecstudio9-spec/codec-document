import { supabase, publicSupabase } from '../../lib/supabase';

export interface UserBranding {
  companyLogoUrl: string | null;
  logoSize: 'small' | 'medium' | 'large';
  headerText: string | null;
  footerText: string | null;
  useWatermark: boolean;
  useGlobalBranding: boolean;
}

const EMPTY_BRANDING: UserBranding = {
  companyLogoUrl: null, logoSize: 'medium', headerText: null, footerText: null,
  useWatermark: false, useGlobalBranding: false,
};

export async function getUserBranding(userId: string): Promise<UserBranding> {
  const { data, error } = await supabase
    .from('users')
    .select('company_logo_url, logo_size, header_text, footer_text, use_watermark, use_global_branding')
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
    companyLogoUrl: row.company_logo_url ?? null,
    logoSize: (row.logo_size as UserBranding['logoSize']) ?? 'medium',
    headerText: row.header_text ?? null,
    footerText: row.footer_text ?? null,
    useWatermark: Boolean(row.use_watermark),
    useGlobalBranding: Boolean(row.use_global_branding),
  };
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
  });
  if (error) throw new Error(`updateUserBranding: ${error.message}`);
  if (!data) throw new Error('updateUserBranding: not saved (not signed in?)');
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
