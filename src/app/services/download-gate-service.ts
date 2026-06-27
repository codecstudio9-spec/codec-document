import { supabase } from '../../lib/supabase';

export async function checkDownloadAllowed(userId?: string | null): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_user_usage_limit', {
      p_user_id: userId || null,
    });
    if (error) return true; // fail open — never block on RPC error
    return Boolean(data);
  } catch {
    return true;
  }
}

export async function recordDownloadEvent(
  userId?: string | null,
  actionType: 'doc' | 'sig' = 'doc',
): Promise<void> {
  if (!userId) return;
  try {
    await supabase.from('user_usage_limits').insert({
      user_id:     userId,
      client_ip:   null,
      action_type: actionType,
    });
  } catch { /* non-blocking */ }
}
