function isMobileBrowser() {
  if (typeof navigator === 'undefined') return false;
  return /Mobi|Android|iP(ad|hone|od)/i.test(navigator.userAgent);
}

function isIOSBrowser() {
  if (typeof navigator === 'undefined') return false;
  return /iP(ad|hone|od)/i.test(navigator.userAgent) && /WebKit/i.test(navigator.userAgent) && !/CriOS|FxiOS|OPiOS/i.test(navigator.userAgent);
}

function canNativeShareFile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return typeof navigator.canShare === 'function' && typeof navigator.share === 'function';
}

async function sharePdfFile(blob: Blob, fileName: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !canNativeShareFile()) return false;

  try {
    const file = new File([blob], fileName, { type: 'application/pdf' });
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: fileName, text: 'Open or save your PDF document' });
      return true;
    }
  } catch (error) {
    console.warn('download.ts: native share failed', error);
  }
  return false;
}

async function createTemporaryDownloadLink(href: string, fileName: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (!href) return;

  const link = document.createElement('a');
  link.href = href;
  link.download = fileName;
  link.rel = 'noopener noreferrer';
  link.target = '_blank';
  link.style.display = 'none';
  document.body.appendChild(link);

  // On mobile browsers, the download attribute is often ignored or treated as a preview.
  // Opening in a new tab or using native share is usually more reliable for PDF access.
  if (isMobileBrowser() || isIOSBrowser()) {
    if (href.startsWith('blob:') && canNativeShareFile()) {
      try {
        const response = await fetch(href);
        const pdfBlob = await response.blob();
        const shared = await sharePdfFile(pdfBlob, fileName);
        if (shared) {
          if (link.parentNode) link.parentNode.removeChild(link);
          return;
        }
      } catch {
        // ignore and fallback to open:
      }
    }

    try {
      window.open(href, '_blank', 'noopener');
    } catch {
      link.click();
    }
    if (link.parentNode) link.parentNode.removeChild(link);
    return;
  }

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

  setTimeout(() => {
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
    if (href.startsWith('blob:')) {
      window.URL.revokeObjectURL(href);
    }
  }, 1500);
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
