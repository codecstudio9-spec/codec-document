function isIosBrowser() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

async function createTemporaryDownloadLink(href: string, fileName: string, blob?: Blob) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (!href) return;

  // iOS Safari does not reliably honor `download` for blob URLs, especially
  // after an async PDF generation step. The share sheet is the native save
  // path; opening the PDF is the fallback when sharing is unavailable.
  if (isIosBrowser()) {
    try {
      if (blob && typeof navigator.share === 'function' && typeof File !== 'undefined') {
        const file = new File([blob], fileName, { type: blob.type || 'application/pdf' });
        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: fileName });
          return;
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.warn('download.ts: iOS share fallback failed', error);
    }

    window.open(href, '_blank', 'noopener,noreferrer');
    // Keep the URL alive long enough for Safari's PDF tab to load it.
    window.setTimeout(() => window.URL.revokeObjectURL(href), 60_000);
    return;
  }

  const link = document.createElement('a');
  link.href = href;
  link.download = fileName;
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  document.body.appendChild(link);

  const cleanup = () => {
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
    if (href.startsWith('blob:')) {
      window.URL.revokeObjectURL(href);
    }
  };

  const scheduleCleanup = () => {
    window.setTimeout(cleanup, 1500);
  };

  const dispatchDownload = () => {
    try {
      link.click();
      return true;
    } catch {
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
      });
      return link.dispatchEvent(clickEvent);
    }
  };

  const dispatched = dispatchDownload();
  if (!dispatched) {
    try {
      window.open(href, '_blank', 'noopener');
    } catch (error) {
      console.error('download.ts: fallback window.open failed', error);
    }
  }

  scheduleCleanup();
}

export async function triggerDownload(blob: Blob, fileName: string): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  if (!fileName || typeof fileName !== 'string') {
    throw new Error('download.ts: Invalid fileName passed to triggerDownload');
  }

  if (!(blob instanceof Blob)) {
    throw new Error('download.ts: Invalid Blob passed to triggerDownload');
  }

  const url = window.URL.createObjectURL(blob);
  await createTemporaryDownloadLink(url, fileName, blob);
}

export async function triggerDownloadFromBytes(bytes: Uint8Array, fileName: string): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  if (!fileName || typeof fileName !== 'string') {
    throw new Error('download.ts: Invalid fileName passed to triggerDownloadFromBytes');
  }

  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) {
    throw new Error('download.ts: PDF byte array is empty or invalid.');
  }

  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  await createTemporaryDownloadLink(url, fileName, blob);
}

export async function triggerDownloadFromUrl(url: string, fileName: string): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  if (!url || typeof url !== 'string' || url.trim() === '') {
    console.error('download.ts: Invalid download URL passed to triggerDownloadFromUrl', { url, fileName });
    const emptyBlob = new Blob([], { type: 'application/pdf' });
    const fallbackUrl = window.URL.createObjectURL(emptyBlob);
    createTemporaryDownloadLink(fallbackUrl, fileName || 'documento_firmado.pdf');
    return;
  }

  try {
    const response = await fetch(url, { credentials: 'omit' });
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    await createTemporaryDownloadLink(objectUrl, fileName);
  } catch (error) {
    // The direct fetch 400s/401s for anything stored in the private
    // `documents-private` bucket (see signatureService.ts) — the stored URL
    // is only ever a bucket/path reference, not something meant to be
    // fetched with zero auth. Lazily import to avoid a circular dependency
    // (signatureService.ts doesn't import this module, but keeping the
    // import local here documents that this is a fallback path, not the
    // common case).
    console.error('download.ts: direct fetch failed, trying signed-URL fallback', { url, fileName, error });
    try {
      const { getSignedUrlFallback } = await import('../../lib/signatureService');
      const signedUrl = await getSignedUrlFallback(url);
      if (signedUrl) {
        const response = await fetch(signedUrl, { credentials: 'omit' });
        if (response.ok) {
          const blob = await response.blob();
          const objectUrl = window.URL.createObjectURL(blob);
          await createTemporaryDownloadLink(objectUrl, fileName);
          return;
        }
      }
    } catch (fallbackError) {
      console.error('download.ts: signed-URL fallback also failed', { url, fileName, fallbackError });
    }
    await createTemporaryDownloadLink(url, fileName);
  }
}
