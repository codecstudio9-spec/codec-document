/**
 * Company Workspace (Fase 1 del modulo empresarial) — multi-usuario bajo
 * una cuenta corporativa, con roles (owner/admin/manager/user) y
 * deteccion de dominio ("juan@acme.com" → ¿ya existe la empresa Acme?).
 * Todo pasa por funciones SECURITY DEFINER (ver
 * supabase_add_company_workspace_migration.sql) — el cliente nunca
 * decide directamente quien pertenece a que empresa o con qué rol.
 */
import { supabase } from '../../lib/supabase';

export type CompanyRole = 'owner' | 'admin' | 'manager' | 'user';

export interface Company {
  id: string;
  name: string;
  domain: string | null;
  logo_url: string | null;
  owner_user_id: string;
  subscription_plan: string;
  plan_active_until: string | null;
  plan_billing_cycle: 'monthly' | 'annual' | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  user_id: string;
  email: string;
  role: CompanyRole;
  joined_at: string;
}

export interface MyCompany {
  company: Company;
  myRole: CompanyRole;
  members: CompanyMember[];
}

export interface CompanyDomainMatch {
  id: string;
  name: string;
  domain: string;
}

function rpcError(context: string, error: { message: string } | null): never | void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

export async function createCompany(name: string, domain?: string): Promise<Company> {
  const { data, error } = await supabase.rpc('create_company', { p_name: name, p_domain: domain || null });
  rpcError('createCompany', error);
  return data as Company;
}

export async function getMyCompany(): Promise<MyCompany | null> {
  const { data, error } = await supabase.rpc('get_my_company_full');
  if (error || !data) return null;
  return {
    company: data.company as Company,
    myRole: data.my_role as CompanyRole,
    members: (data.members ?? []) as CompanyMember[],
  };
}

/** Returns the matching company if this user's email domain matches an
 * existing one AND they don't already belong to a company — null
 * otherwise. Used to show the "Esta organización ya existe. ¿Deseas
 * unirte?" prompt. */
export async function findCompanyByMyDomain(): Promise<CompanyDomainMatch | null> {
  const { data, error } = await supabase.rpc('find_company_by_my_domain');
  if (error || !Array.isArray(data) || data.length === 0) return null;
  return data[0] as CompanyDomainMatch;
}

export async function joinCompanyByDomain(): Promise<void> {
  const { error } = await supabase.rpc('join_company_by_domain');
  rpcError('joinCompanyByDomain', error);
}

export async function addCompanyMember(email: string, role: CompanyRole): Promise<void> {
  const { error } = await supabase.rpc('add_company_member_by_email', { p_email: email, p_role: role });
  rpcError('addCompanyMember', error);
}

export async function removeCompanyMember(userId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_company_member', { p_user_id: userId });
  rpcError('removeCompanyMember', error);
}

// ─── API Keys (Fase 2) ──────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  revoked_at: string | null;
}

export interface GeneratedApiKey extends ApiKey {
  api_key: string; // full plaintext — only ever present right after generation
}

export async function listApiKeys(): Promise<ApiKey[]> {
  const { data, error } = await supabase.rpc('list_api_keys');
  if (error || !data) return [];
  return data as ApiKey[];
}

export async function generateApiKey(name: string): Promise<GeneratedApiKey> {
  const { data, error } = await supabase.rpc('generate_api_key', { p_name: name });
  rpcError('generateApiKey', error);
  return data as GeneratedApiKey;
}

export async function revokeApiKey(keyId: string): Promise<void> {
  const { error } = await supabase.rpc('revoke_api_key', { p_key_id: keyId });
  rpcError('revokeApiKey', error);
}

// ─── Webhooks (Fase 3 — registro + log de eventos; el despachador HTTP
// en vivo es un incremento aparte, ver el pie de
// supabase_add_webhooks_migration.sql) ──────────────────────────────────────

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
}

export const WEBHOOK_EVENT_TYPES = ['document.created', 'document.completed', 'signature.sent', 'signature.completed'] as const;

export async function listWebhooks(): Promise<Webhook[]> {
  const { data, error } = await supabase.rpc('list_webhooks');
  if (error || !data) return [];
  return data as Webhook[];
}

export async function createWebhook(url: string, events: string[]): Promise<void> {
  const { error } = await supabase.rpc('create_webhook', { p_url: url, p_events: events });
  rpcError('createWebhook', error);
}

export async function deleteWebhook(webhookId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_webhook', { p_webhook_id: webhookId });
  rpcError('deleteWebhook', error);
}

export const COMPANY_ROLE_LABELS: Record<CompanyRole, { en: string; es: string }> = {
  owner: { en: 'Owner', es: 'Propietario' },
  admin: { en: 'Admin', es: 'Administrador' },
  manager: { en: 'Manager', es: 'Gerente' },
  user: { en: 'Member', es: 'Miembro' },
};
