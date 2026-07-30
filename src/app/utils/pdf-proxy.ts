/**
 * Disabled: this used to rewrite a raw Supabase Storage public URL to go
 * through /api/pdf/<bucket>/<path> (see api/pdf/[...path].ts) so the
 * address bar / iframe src never showed yxzchnldmfsgdtbjurey.supabase.co.
 *
 * That proxy route stopped being reachable in production for any path
 * with more than one segment after the bucket (i.e. every real signed
 * document — documents-bucket/documents/<uuid>/<file>.pdf is 3 segments)
 * — Vercel returned its own platform-level 404 before ever invoking the
 * function, even after fixing the known nested-dynamic-route cause of it.
 * Rather than leave document viewing broken while that's investigated
 * further, this now passes the Supabase public URL straight through
 * unchanged — every bucket here is already a public Storage bucket (see
 * documents-service.ts / template-service.ts / docx-template-service.ts),
 * so this only changes what URL is visible, never who can read the file.
 */
export function toProxiedPdfUrl<T extends string | undefined | null>(rawUrl: T): T | string {
  return rawUrl;
}
