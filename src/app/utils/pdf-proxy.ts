/**
 * Rewrites a raw Supabase Storage public URL to go through
 * /api/pdf/<bucket>/<path> instead (see api/pdf/[bucket]/[...path].ts) —
 * so an iframe src / anchor href shown to a user never displays
 * yxzchnldmfsgdtbjurey.supabase.co. Origin-relative on purpose: works
 * unchanged in local dev (localhost) and production (codecdocument.com).
 *
 * Safe to call on anything — a blob:/data: URL, an already-proxied path,
 * or an unrelated external URL all pass through unchanged; only a real
 * Supabase Storage public URL gets rewritten.
 */
const SUPABASE_STORAGE_PREFIX = 'https://yxzchnldmfsgdtbjurey.supabase.co/storage/v1/object/public/';

export function toProxiedPdfUrl<T extends string | undefined | null>(rawUrl: T): T | string {
  if (!rawUrl) return rawUrl;
  if (!rawUrl.startsWith(SUPABASE_STORAGE_PREFIX)) return rawUrl;
  const bucketAndPath = rawUrl.slice(SUPABASE_STORAGE_PREFIX.length);
  return `/api/pdf/${bucketAndPath}`;
}
