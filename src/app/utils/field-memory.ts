/**
 * "Remember what I typed last time" for form fields — keyed by the
 * field's LABEL (not a per-template id), so filling "Email" or "Celular"
 * once autofills it the next time that same label shows up in ANY
 * document form (built-in templates AND custom Word templates), not just
 * the exact same template. Persists in localStorage until the browser
 * data is cleared — there's no separate expiry/"forget" action, matching
 * "que quede guardado hasta que se borre".
 */
const MEMORY_KEY_PREFIX = 'codec_field_memory:';

function memoryKey(label: string): string {
  return MEMORY_KEY_PREFIX + label.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function rememberFieldValue(label: string, value: string): void {
  if (!value.trim()) return;
  try { localStorage.setItem(memoryKey(label), value); } catch { /* storage full/blocked — non-fatal */ }
}

export function recallFieldValue(label: string): string {
  try { return localStorage.getItem(memoryKey(label)) ?? ''; } catch { return ''; }
}
