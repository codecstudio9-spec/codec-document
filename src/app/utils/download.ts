function createTemporaryDownloadLink(href: string, fileName: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const link = document.createElement('a');
  link.href = href;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function triggerDownloadFromBytes(bytes: Uint8Array, fileName: string): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  if (!fileName || typeof fileName !== 'string') {
    console.error('download.ts: Invalid fileName passed to triggerDownloadFromBytes', { fileName });
  }

  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) {
    console.error('download.ts: PDF byte array is empty or invalid. Falling back to forced anchor download.', { bytes });
  }

  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  createTemporaryDownloadLink(url, fileName);
  window.URL.revokeObjectURL(url);
}

export async function triggerDownloadFromUrl(url: string, fileName: string): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  if (!url || typeof url !== 'string' || url.trim() === '') {
    console.error('download.ts: Invalid download URL passed to triggerDownloadFromUrl', { url, fileName });
    const emptyBlob = new Blob([], { type: 'application/pdf' });
    const fallbackUrl = window.URL.createObjectURL(emptyBlob);
    createTemporaryDownloadLink(fallbackUrl, fileName || 'documento_firmado.pdf');
    window.URL.revokeObjectURL(fallbackUrl);
    return;
  }

  try {
    const response = await fetch(url, { credentials: 'omit' });
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    createTemporaryDownloadLink(objectUrl, fileName);
    window.URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error('download.ts: Failed to download from URL, falling back to anchor', { url, fileName, error });
    createTemporaryDownloadLink(url, fileName);
  }
}
