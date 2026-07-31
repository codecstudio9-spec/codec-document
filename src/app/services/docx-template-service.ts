/**
 * Word (.docx) {{variable}} templates — ZapSign-style. Additive second
 * "kind" on the existing public.templates table (see template-service.ts
 * for the original PDF-by-coordinates engine, which this doesn't touch).
 *
 * Public-facing reads (the /t/:slug fill page) go through the
 * get_template_by_slug_public RPC — see
 * supabase/migrations/20260729120000_add_docx_templates.sql — never a raw
 * table SELECT, since public.templates' only RLS policy is owner-only.
 */
import { supabase } from '../../lib/supabase';
import type { SecurityConfig } from './sign-transaction-service';
import type { DetectedField, ExtraClause } from '../../lib/docxTemplateEngine';

export type SignerRole = 'variable' | 'fixed';

export interface TemplateSigner {
  role: SignerRole;
  label: string;
  /** Only meaningful for role: 'fixed'. */
  name?: string;
  email?: string;
  /** This fixed signer's name/email should instead be collected as a
   * regular fill-in field (see DetectedField) rather than pre-filled —
   * "convertir a variable" in the editor UI. */
  promotedToField?: boolean;
}

export interface DocxTemplate {
  id: string;
  userId: string;
  name: string;
  docxFileUrl: string;
  detectedFields: DetectedField[];
  signers: TemplateSigner[];
  securityConfig: SecurityConfig;
  publicSlug: string;
  instructionsEn: string;
  instructionsEs: string;
  createdAt: string;
  /** Owner-rewritten clause text, keyed by paragraph index — see
   * detectEditableClauseBlocks/applyClauseOverrides in docxTemplateEngine.ts. */
  clauseOverrides: Record<string, string>;
  /** Brand-new clause blocks the owner added, not tied to any paragraph
   * in the source .docx — see applyExtraClauses in docxTemplateEngine.ts. */
  extraClauses: ExtraClause[];
}

/** Public-safe subset — exactly what get_template_by_slug_public returns.
 * Deliberately excludes userId/createdAt (irrelevant to a guest filling it in). */
export type PublicDocxTemplate = Omit<DocxTemplate, 'userId' | 'createdAt'>;

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  standardSignature: true,
  requireSelfie: false,
  requireIdPhoto: false,
  requireSmsOtp: false,
  requireEsignConsent: false,
  advancedAuditTrail: false,
  requireBiometric: false,
};

function slugify(name: string): string {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
    .slice(0, 60) || 'plantilla';
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

/** Slugify(name) + a short random suffix, retried on the rare collision.
 * Matches the "always a fresh, unique path" reasoning already used for
 * storage paths elsewhere in this codebase (see uploadTemplateFile in
 * template-service.ts) — simpler than an upsert/locking scheme. */
export async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `${base}-${randomSuffix()}`;
    const { data } = await supabase.from('templates').select('id').eq('public_slug', candidate).maybeSingle();
    if (!data) return candidate;
  }
  // Astronomically unlikely to hit this, but never loop forever.
  return `${base}-${randomSuffix()}-${Date.now()}`;
}

/** Timestamped path — same "storage RLS only reliably grants INSERT"
 * reasoning as uploadTemplateFile in template-service.ts. */
export async function uploadDocxTemplateFile(userId: string, file: File): Promise<string> {
  const path = `templates/${userId}/docx-template-${Date.now()}.docx`;
  const { error } = await supabase.storage.from('documents-bucket').upload(path, file, {
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    upsert: false,
  });
  if (error) throw new Error(`uploadDocxTemplateFile: ${error.message}`);
  const { data } = supabase.storage.from('documents-bucket').getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('uploadDocxTemplateFile: could not retrieve public URL');
  return data.publicUrl;
}

interface DocxTemplateRow {
  id: string; user_id: string; name: string; docx_file_url: string;
  detected_fields: unknown; signers: unknown; security_config: unknown;
  public_slug: string; instructions_en: string | null; instructions_es: string | null;
  created_at: string; clause_overrides: unknown; extra_clauses: unknown;
}

function rowToTemplate(row: DocxTemplateRow): DocxTemplate {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    docxFileUrl: row.docx_file_url,
    detectedFields: Array.isArray(row.detected_fields) ? (row.detected_fields as DetectedField[]) : [],
    signers: Array.isArray(row.signers) ? (row.signers as TemplateSigner[]) : [],
    securityConfig: { ...DEFAULT_SECURITY_CONFIG, ...(row.security_config as Partial<SecurityConfig> ?? {}) },
    publicSlug: row.public_slug,
    instructionsEn: row.instructions_en ?? '',
    instructionsEs: row.instructions_es ?? '',
    createdAt: row.created_at,
    clauseOverrides: (row.clause_overrides && typeof row.clause_overrides === 'object')
      ? (row.clause_overrides as Record<string, string>)
      : {},
    extraClauses: Array.isArray(row.extra_clauses) ? (row.extra_clauses as ExtraClause[]) : [],
  };
}

const ROW_COLUMNS = 'id, user_id, name, docx_file_url, detected_fields, signers, security_config, public_slug, instructions_en, instructions_es, created_at, clause_overrides, extra_clauses';

export async function createDocxTemplate(params: {
  userId: string; name: string; docxFileUrl: string;
  detectedFields: DetectedField[]; signers: TemplateSigner[];
  securityConfig: SecurityConfig; instructionsEn: string; instructionsEs: string;
  clauseOverrides?: Record<string, string>; extraClauses?: ExtraClause[];
}): Promise<DocxTemplate> {
  const publicSlug = await generateUniqueSlug(params.name);
  const { data, error } = await supabase
    .from('templates')
    .insert({
      user_id: params.userId,
      name: params.name,
      file_url: params.docxFileUrl, // shared NOT NULL column with the pdf_overlay engine
      docx_file_url: params.docxFileUrl,
      kind: 'docx_variables',
      detected_fields: params.detectedFields,
      signers: params.signers,
      security_config: params.securityConfig,
      instructions_en: params.instructionsEn,
      instructions_es: params.instructionsEs,
      clause_overrides: params.clauseOverrides ?? {},
      extra_clauses: params.extraClauses ?? [],
      public_slug: publicSlug,
    })
    .select(ROW_COLUMNS)
    .single();
  if (error) throw new Error(`createDocxTemplate: ${error.message}`);
  return rowToTemplate(data as DocxTemplateRow);
}

export async function updateDocxTemplate(templateId: string, updates: Partial<{
  name: string; detectedFields: DetectedField[]; signers: TemplateSigner[];
  securityConfig: SecurityConfig; instructionsEn: string; instructionsEs: string;
  clauseOverrides: Record<string, string>; extraClauses: ExtraClause[];
}>): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.detectedFields !== undefined) patch.detected_fields = updates.detectedFields;
  if (updates.signers !== undefined) patch.signers = updates.signers;
  if (updates.securityConfig !== undefined) patch.security_config = updates.securityConfig;
  if (updates.instructionsEn !== undefined) patch.instructions_en = updates.instructionsEn;
  if (updates.instructionsEs !== undefined) patch.instructions_es = updates.instructionsEs;
  if (updates.clauseOverrides !== undefined) patch.clause_overrides = updates.clauseOverrides;
  if (updates.extraClauses !== undefined) patch.extra_clauses = updates.extraClauses;
  const { error } = await supabase.from('templates').update(patch).eq('id', templateId);
  if (error) throw new Error(`updateDocxTemplate: ${error.message}`);
}

/**
 * `userId` is unused directly — relies entirely on RLS (`templates_own` +
 * `templates_select_company_shared`) to return the union of the caller's
 * own templates and any their company has shared, so a company template
 * an admin created shows up for every teammate without a second query.
 * Kept as a parameter so call sites don't need to change and this only
 * ever runs for a signed-in user.
 */
export async function listDocxTemplates(userId: string): Promise<DocxTemplate[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('templates')
    .select(ROW_COLUMNS)
    .eq('kind', 'docx_variables')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as DocxTemplateRow[]).map(rowToTemplate);
}

export async function getDocxTemplateForOwner(templateId: string): Promise<DocxTemplate | null> {
  const { data, error } = await supabase
    .from('templates')
    .select(ROW_COLUMNS)
    .eq('id', templateId)
    .eq('kind', 'docx_variables')
    .maybeSingle();
  if (error || !data) return null;
  return rowToTemplate(data as DocxTemplateRow);
}

export async function deleteDocxTemplate(templateId: string): Promise<void> {
  const { error } = await supabase.from('templates').delete().eq('id', templateId);
  if (error) throw new Error(`deleteDocxTemplate: ${error.message}`);
}

/**
 * Email-based template sharing (see supabase/migrations/
 * 20260730005000_add_template_email_shares.sql) — lets the owner share a
 * template with another account by email, no company required. The
 * recipient's own listDocxTemplates() query then returns this same row
 * automatically (RLS: templates_select_email_shared), so it shows up
 * identical — same fields, signers, security config, instructions — with
 * zero extra code on the read side.
 */
export interface TemplateShare {
  id: string;
  sharedWithEmail: string;
  createdAt: string;
}

export async function listTemplateShares(templateId: string): Promise<TemplateShare[]> {
  const { data, error } = await supabase
    .from('template_shares')
    .select('id, shared_with_email, created_at')
    .eq('template_id', templateId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as { id: string; shared_with_email: string; created_at: string }[]).map((r) => ({
    id: r.id, sharedWithEmail: r.shared_with_email, createdAt: r.created_at,
  }));
}

export async function shareDocxTemplateByEmail(templateId: string, email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) throw new Error('Ingresa un correo válido.');
  const { error } = await supabase
    .from('template_shares')
    .insert({ template_id: templateId, shared_with_email: normalized });
  if (error) {
    if (error.code === '23505') throw new Error('Ya compartiste esta plantilla con ese correo.');
    throw new Error(`shareDocxTemplateByEmail: ${error.message}`);
  }
}

export async function unshareDocxTemplate(shareId: string): Promise<void> {
  const { error } = await supabase.from('template_shares').delete().eq('id', shareId);
  if (error) throw new Error(`unshareDocxTemplate: ${error.message}`);
}

/** Public, anonymous-safe lookup for the /t/:slug fill page — goes
 * through the SECURITY DEFINER RPC, never a direct table SELECT. */
export async function getTemplateBySlugPublic(slug: string): Promise<PublicDocxTemplate | null> {
  const { data, error } = await supabase.rpc('get_template_by_slug_public', { p_slug: slug }).maybeSingle();
  if (error || !data) return null;
  const row = data as Omit<DocxTemplateRow, 'user_id' | 'created_at'>;
  return rowToTemplate({ ...row, user_id: '', created_at: '' } as DocxTemplateRow);
}

/** Public, anonymous-safe lookup by id (not slug) — used by the guest
 * "download my copy" button on /sign/:transactionId, which only has
 * document_data.templateId to go on, not the original public_slug. */
export async function getDocxTemplateByIdPublic(templateId: string): Promise<{ id: string; name: string; docxFileUrl: string; clauseOverrides: Record<string, string>; extraClauses: ExtraClause[] } | null> {
  const { data, error } = await supabase.rpc('get_docx_template_by_id_public', { p_id: templateId }).maybeSingle();
  if (error || !data) return null;
  const row = data as { id: string; name: string; docx_file_url: string; clause_overrides: unknown; extra_clauses: unknown };
  return {
    id: row.id,
    name: row.name,
    docxFileUrl: row.docx_file_url,
    clauseOverrides: (row.clause_overrides && typeof row.clause_overrides === 'object') ? (row.clause_overrides as Record<string, string>) : {},
    extraClauses: Array.isArray(row.extra_clauses) ? (row.extra_clauses as ExtraClause[]) : [],
  };
}

/**
 * Creates the sign_transactions row for a filled-in template — goes
 * through create_custom_template_transaction, which resolves the
 * template's real owner (creator_id) server-side so it never has to be
 * exposed to this anonymous client. Returns the new transaction id; the
 * caller navigates to /sign/<id>, which is the exact same signing engine
 * (selfie/ID/biometric/ESIGN consent) every other document type uses.
 *
 * Two callers, two different `options`:
 * - The public /t/:slug fill page (a guest fills a BLANK template and
 *   signs it themselves) calls this with no options — intent defaults to
 *   'blank_send' and security_config defaults to the template's own.
 * - GenerateSendModal (an authenticated user fills the template THEMSELVES
 *   and generates a one-time link for someone else to just sign) passes
 *   intent: 'fill_send' and may pass securityOverride to raise/lower
 *   verification for this one document without touching the template's
 *   stored default.
 */
export async function createCustomTemplateTransaction(
  slug: string,
  values: Record<string, string>,
  options?: { securityOverride?: SecurityConfig; intent?: 'blank_send' | 'fill_send' },
): Promise<string> {
  const { data, error } = await supabase.rpc('create_custom_template_transaction', {
    p_slug: slug,
    p_values: values,
    p_security_override: options?.securityOverride ?? null,
    p_intent: options?.intent ?? 'blank_send',
  });
  if (error) throw new Error(`createCustomTemplateTransaction: ${error.message}`);
  return data as string;
}
