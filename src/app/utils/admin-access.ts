export const ADMIN_EMAILS = ['douglastabordasanchez@gmail.com'];

export function isAdminEmail(email?: string | null): boolean {
  const normalized = (email ?? '').toLowerCase().trim();
  return normalized.length > 0 && ADMIN_EMAILS.includes(normalized);
}
