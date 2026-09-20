/**
 * Captures an on-screen element (a letter-width HTML page, e.g.
 * AiFormattedDocumentPreview) into a multi-page letter-size PDF blob.
 *
 * Deliberately simpler than preview-page.tsx's downloadHighFidelityPdf:
 * no inline-signature repositioning and no per-page jsPDF header/footer
 * redraw — the source element already contains its own letterhead/footer
 * baked in as HTML (see AiFormattedDocumentPreview), so this only needs
 * to slice one continuous capture across as many letter pages as it
 * takes, the same core technique (clone off-screen → html2canvas →
 * slice), without the parts that are specific to the multi-field
 * template preview.
 */
export async function renderHtmlToPdf(sourceEl: HTMLElement, fileNameForLog = 'documento'): Promise<Blob | null> {
  try {
    // html2canvas-pro, not html2canvas — Tailwind v4's default palette
    // computes colors as oklch(), which the original html2canvas (last
    // released years ago, now unmaintained) cannot parse at all; it
    // throws "unsupported color function oklch" on ANY element in the
    // captured subtree using a standard Tailwind color utility (slate,
    // black, etc. all qualify). html2canvas-pro is an actively maintained
    // fork with the same API that added oklch/lab/lch/color() support.
    const html2canvas = (await import('html2canvas-pro')).default;
    const { jsPDF } = await import('jspdf');

    const sourceW = sourceEl.offsetWidth || 816;
    const clone = sourceEl.cloneNode(true) as HTMLElement;
    clone.style.width = `${sourceW}px`;

    const offscreen = document.createElement('div');
    offscreen.style.cssText = `position:fixed;top:0;left:-${sourceW + 200}px;width:${sourceW}px;overflow:visible;background:#ffffff;z-index:-9999;`;
    offscreen.appendChild(clone);
    document.body.appendChild(offscreen);

    // Let images (e.g. the branding logo) inside the clone finish loading
    // before capture — a logo that hasn't decoded yet would render blank.
    await Promise.all(
      Array.from(clone.querySelectorAll('img')).map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise<void>((resolve) => { img.onload = img.onerror = () => resolve(); });
      }),
    );
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));

    let captured: HTMLCanvasElement;
    try {
      captured = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: sourceW,
        windowHeight: clone.scrollHeight,
        width: clone.scrollWidth,
        height: clone.scrollHeight,
      });
    } finally {
      offscreen.remove();
    }

    if (!captured || captured.width === 0 || captured.height === 0) return null;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const PW = pdf.internal.pageSize.getWidth();
    const PH = pdf.internal.pageSize.getHeight();
    const M = 10;
    const contentW = PW - 2 * M;
    const contentH = PH - 2 * M;

    const pxPerMm = captured.width / contentW;
    const pxPerPage = contentH * pxPerMm;
    const numPages = Math.max(1, Math.ceil(captured.height / pxPerPage));

    for (let page = 0; page < numPages; page++) {
      if (page > 0) pdf.addPage();
      const sliceStartPx = Math.floor(page * pxPerPage);
      const sliceHPx = Math.min(Math.ceil(pxPerPage), captured.height - sliceStartPx);
      if (sliceHPx <= 0) continue;

      const slice = document.createElement('canvas');
      slice.width = captured.width;
      slice.height = sliceHPx;
      const ctx = slice.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(captured, 0, sliceStartPx, captured.width, sliceHPx, 0, 0, captured.width, sliceHPx);
      pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', M, M, contentW, sliceHPx / pxPerMm);
    }

    return pdf.output('blob');
  } catch (err) {
    console.error(`renderHtmlToPdf(${fileNameForLog}):`, err);
    return null;
  }
}
