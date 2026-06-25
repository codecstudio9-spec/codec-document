import { supabase } from '../../lib/supabase';

export async function checkDownloadAllowed(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_user_limits', {
      user_ip: null,
      u_id: userId,
    });
    if (error) return true; // fail open — never block on RPC error
    return data as boolean;
  } catch {
    return true;
  }
}

export async function recordDownloadEvent(
  userId: string,
  actionType: 'doc' | 'sig' = 'doc',
): Promise<void> {
  try {
    await supabase.from('user_usage_limits').insert({
      user_id:     userId,
      client_ip:   null,
      action_type: actionType,
    });
  } catch { /* non-blocking */ }
}
