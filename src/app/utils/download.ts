async function createTemporaryDownloadLink(href: string, fileName: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (!href) return;

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
  await createTemporaryDownloadLink(url, fileName);
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
  await createTemporaryDownloadLink(url, fileName);
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
    console.error('download.ts: Failed to download from URL, falling back to anchor', { url, fileName, error });
    await createTemporaryDownloadLink(url, fileName);
  }
}
