/**
 * Site-wide key/value settings (public_settings table). Currently just the
 * Meta/Facebook Pixel ID for ad conversion tracking, but kept generic
 * (key/value) so a future setting doesn't need its own table + migration.
 * Reads are open to anyone (including anonymous visitors, needed so the
 * pixel loads on public marketing pages before login); writes are
 * admin-only, enforced by the app_settings RLS policies.
 */

import { supabase } from '../../lib/supabase';

export const META_PIXEL_ID_KEY = 'meta_pixel_id';

export async function getAppSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (error) throw error;
  return data?.value ?? null;
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw error;
}
