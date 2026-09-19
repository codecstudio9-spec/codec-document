import JSZip from 'jszip';
import { getSignedUrlFallback } from '../../lib/signatureService';
import { triggerDownload } from './download';

export interface FolderZipEntry {
  name: string;
  url: string;
}

// Same private-bucket problem as everywhere else a stored PDF URL gets
// fetched directly (see open-document-url.ts / signatureService.ts's
// resolveImageBytes) — a plain fetch 401s for anything uploaded after the
// 2026-09-15 migration, so every entry gets the signed-URL retry before
// being counted as failed.
async function fetchPdfBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (res.ok) return new Uint8Array(await res.arrayBuffer());
  } catch {
    // fall through to signed-URL retry
  }
  try {
    const signed = await getSignedUrlFallback(url);
    if (signed) {
      const res = await fetch(signed);
      if (res.ok) return new Uint8Array(await res.arrayBuffer());
    }
  } catch {
    // give up on this one file — the rest of the zip still proceeds
  }
  return null;
}

function sanitizeFileName(raw: string): string {
  const base = raw.trim().replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80) || 'documento';
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
}

// Two documents in the same folder can share a name ("Contrato" +
// "Contrato") — without de-duping, the second file would silently
// overwrite the first inside the zip.
function uniqueFileName(raw: string, used: Set<string>): string {
  const wanted = sanitizeFileName(raw);
  if (!used.has(wanted)) { used.add(wanted); return wanted; }
  const stem = wanted.replace(/\.pdf$/i, '');
  let n = 2;
  let candidate = `${stem} (${n}).pdf`;
  while (used.has(candidate)) { n++; candidate = `${stem} (${n}).pdf`; }
  used.add(candidate);
  return candidate;
}

/**
 * Builds a .zip of every entry's PDF and triggers a browser download of it.
 * Must be called from a user-gesture handler (a click) — same rule as
 * openDocumentUrl, though a blob: URL isn't subject to the cross-origin
 * download restriction that forced that function's popup dance, since
 * blob: is always same-origin.
 */
export async function downloadFolderAsZip(
  folderName: string,
  entries: FolderZipEntry[],
): Promise<{ ok: number; failed: number }> {
  const zip = new JSZip();
  const used = new Set<string>();
  let ok = 0;
  let failed = 0;

  await Promise.all(entries.map(async (entry) => {
    const bytes = await fetchPdfBytes(entry.url);
    if (!bytes) { failed++; return; }
    zip.file(uniqueFileName(entry.name, used), bytes);
    ok++;
  }));

  if (ok === 0) return { ok, failed };

  const blob = await zip.generateAsync({ type: 'blob' });
  const zipFileName = `${sanitizeFileName(folderName).replace(/\.pdf$/i, '')}.zip`;
  // triggerDownload (not a hand-rolled <a download> click) — iOS Safari
  // doesn't reliably honor `download` on a blob: URL, especially right
  // after this async zip-generation step; this utility routes through the
  // native share sheet on iOS instead. See utils/download.ts. Note: iOS's
  // share sheet can't share .zip files via files[] in all versions, so this
  // falls back to opening the blob URL directly if sharing is unavailable.
  await triggerDownload(blob, zipFileName);

  return { ok, failed };
}
