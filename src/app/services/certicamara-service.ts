/**
 * Certicámara integration status/config — the actual signing call lives
 * in the `certicamara-sign` Edge Function (not implemented yet, pending
 * their API docs). This service only manages whether an API key is
 * saved, via `admin_secrets` (never `app_settings`, which is publicly
 * readable — see supabase/migrations/20260919030000_certicamara_scaffolding.sql).
 */
import { supabase } from '../../lib/supabase';

export const CERTICAMARA_SECRET_KEY = 'CERTICAMARA_API_KEY';

export interface SecretStatus {
  configured: boolean;
  updated_at: string | null;
}

export async function getSecretStatus(key: string): Promise<SecretStatus> {
  const { data, error } = await supabase.rpc('admin_get_secret_status', { p_key: key });
  if (error) throw new Error(`getSecretStatus: ${error.message}`);
  return (data as SecretStatus) ?? { configured: false, updated_at: null };
}

export async function setSecret(key: string, value: string): Promise<void> {
  const { error } = await supabase.rpc('admin_set_secret', { p_key: key, p_value: value });
  if (error) throw new Error(`setSecret: ${error.message}`);
}

export async function deleteSecret(key: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_secret', { p_key: key });
  if (error) throw new Error(`deleteSecret: ${error.message}`);
}

/** Callable by ANY signed-in user (not admin-gated like getSecretStatus
 * above) — the signing flow needs to know whether to show "Firma digital
 * certificada" as an option for every sender, not just the platform
 * admin. Never returns the key itself, only whether one is saved. */
export async function isCerticamaraConfigured(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_certicamara_configured');
  if (error) return false;
  return Boolean(data);
}
