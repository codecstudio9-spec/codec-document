// Vercel Serverless Function — proxies a Supabase Storage object so the
// browser only ever sees codecdocument.com/api/pdf/... in the address
// bar / iframe src, never yxzchnldmfsgdtbjurey.supabase.co (white-label
// requirement). This is a plain Vercel `/api` function, not a Next.js
// Route Handler — this project is Vite + react-router, not Next.js, and
// Vercel's `/api/*.ts` convention works the same way for any static
// project without needing Next.js at all.
//
// Security note: this only ever fetches from a hardcoded, fixed Supabase
// project URL + an ALLOWLISTED bucket name — never a client-supplied
// full URL — so it can't be turned into an open proxy/SSRF vector. Every
// bucket in this allowlist is already a PUBLIC Supabase Storage bucket
// (see documents-service.ts / template-service.ts / docx-template-service.ts,
// all using `.storage.from(bucket).getPublicUrl(...)` with no auth), so
// this proxy doesn't change WHO can read a file, only what URL they see.
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://yxzchnldmfsgdtbjurey.supabase.co';

const ALLOWED_BUCKETS = new Set(['documents-bucket', 'tx-evidence']);

// Storage paths in this app are always slug/timestamp/uuid based (see
// every upload* function across the services above) — never arbitrary
// user text — so a strict allowlist of path characters is safe and
// doubles as a defense against path-traversal attempts.
const SAFE_PATH = /^[a-zA-Z0-9/_.-]+$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { bucket, path } = req.query;
  const bucketName = Array.isArray(bucket) ? bucket[0] : bucket;
  const relativePath = Array.isArray(path) ? path.join('/') : path;

  if (!bucketName || !ALLOWED_BUCKETS.has(bucketName)) {
    res.status(400).json({ error: 'Unknown bucket' });
    return;
  }
  if (!relativePath || !SAFE_PATH.test(relativePath)) {
    res.status(400).json({ error: 'Invalid path' });
    return;
  }

  const upstreamUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${relativePath}`;

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstreamUrl);
  } catch {
    res.status(502).json({ error: 'Could not reach storage' });
    return;
  }

  if (!upstreamRes.ok) {
    res.status(upstreamRes.status === 404 ? 404 : 502).json({ error: 'File not found' });
    return;
  }

  const contentType = upstreamRes.headers.get('content-type') || 'application/pdf';
  const buffer = Buffer.from(await upstreamRes.arrayBuffer());

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', 'inline');
  // Every path here is unique-per-upload (timestamped, never overwritten
  // — see upsert:false across every uploader), so it's safe to cache
  // indefinitely once fetched.
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.status(200).send(buffer);
}
