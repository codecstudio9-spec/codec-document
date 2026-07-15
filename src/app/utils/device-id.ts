/**
 * Stable per-browser identifier for anonymous (not-logged-in) usage quotas.
 * Persisted in localStorage so a device/browser that never authenticates
 * still gets a real "2 free actions per 72h" allowance instead of being
 * treated as a single shared global anonymous user — see
 * supabase_guest_dashboard_anon_migration.sql (anon_usage_events).
 */
const STORAGE_KEY = 'codec_device_id';

export function getDeviceId(): string {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // localStorage unavailable (private browsing lockdown, etc.) — fall
    // back to a per-tab id; worst case this device just won't persist its
    // quota across reloads, but it's never merged into someone else's.
    return `volatile-${crypto.randomUUID()}`;
  }
}
