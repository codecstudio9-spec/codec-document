export async function triggerDownload(blob: Blob, fileName: string): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function triggerDownloadFromUrl(url: string, fileName: string): Promise<void> {
  const response = await fetch(url, { credentials: 'omit' });
  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }

  const blob = await response.blob();
  await triggerDownload(blob, fileName);
}
