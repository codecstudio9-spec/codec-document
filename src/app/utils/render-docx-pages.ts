/**
 * Rasterizes an already-merged .docx (the output of docxTemplateEngine's
 * renderDocxTemplate) into a sequence of full Letter-page PNG images —
 * preserving whatever the original Word file actually looked like (bold
 * values, an embedded company logo, tables, fonts) instead of the
 * plain-text-only extraction extractTextFromDocx() does. That plain-text
 * path is what fed PDFGenerator's generic text renderer and is why a
 * client's polished, letterhead-branded Word contract came out as
 * uniform, unbranded text once filled and downloaded.
 *
 * Feeds PDFGenerator's `richContentPages` option (see pdf-generator.ts) —
 * that class still builds the signature block / identity verification /
 * audit-certificate pages exactly as before, untouched; only the document
 * BODY becomes pre-rendered images instead of PDFGenerator's own text
 * layout engine.
 *
 * Same html2canvas capture + "slice a tall canvas into page-height
 * chunks" approach preview-page.tsx's own high-fidelity PDF export
 * already uses for built-in document types (see downloadHighFidelityPdf)
 * — reused here rather than re-invented, just driven by mammoth's HTML
 * instead of a live DOM preview element.
 */
import mammoth from 'mammoth';

export interface RichContentPage {
  dataUrl: string;
  format: 'PNG';
  heightMm: number;
}

// Mirrors PDFGenerator's own Letter-page geometry (pdf-generator.ts:
// margin = 25.4mm, Letter = 215.9 x 279.4mm) so these pre-sliced images
// land exactly where PDFGenerator expects them. Its first page starts
// ~6.6mm lower than later pages once addPremiumFirstPageHeader's divider
// line runs (even with no branding set) — using that tighter first-page
// budget for EVERY page trades a little unused bottom margin on later
// pages for zero risk of a page's content overflowing/clipping.
const PAGE_WIDTH_MM = 215.9;
const PAGE_HEIGHT_MM = 279.4;
const MARGIN_MM = 25.4;
const FIRST_PAGE_TOP_MM = 38;
export const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - 2 * MARGIN_MM;
export const CONTENT_HEIGHT_MM = PAGE_HEIGHT_MM - MARGIN_MM - FIRST_PAGE_TOP_MM;

const RENDER_WIDTH_PX = 800;
const RENDER_SCALE = 2.5;

async function docxToHtmlWithInlineImages(docxArrayBuffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.convertToHtml(
    { arrayBuffer: docxArrayBuffer },
    {
      convertImage: mammoth.images.imgElement((image) =>
        image.read('base64').then((b64) => ({ src: `data:${image.contentType};base64,${b64}` })),
      ),
    },
  );
  return result.value;
}

/**
 * Renders an already-merged .docx (renderDocxTemplate's output) to a
 * sequence of page images matching PDFGenerator's Letter-page geometry.
 */
export async function renderDocxToPageImages(mergedDocxBytes: ArrayBuffer): Promise<RichContentPage[]> {
  const html = await docxToHtmlWithInlineImages(mergedDocxBytes);
  const html2canvas = (await import('html2canvas')).default;

  const style = document.createElement('style');
  style.textContent = `
    .cd-docx-render p { margin: 0 0 10px; }
    .cd-docx-render table { border-collapse: collapse; width: 100%; margin: 8px 0; }
    .cd-docx-render td, .cd-docx-render th { border: 1px solid #999; padding: 4px 6px; font-size: 13px; }
    .cd-docx-render img { max-width: 100%; }
    .cd-docx-render strong, .cd-docx-render b { font-weight: 700; }
  `;

  const container = document.createElement('div');
  container.className = 'cd-docx-render';
  container.innerHTML = html;
  container.style.cssText = [
    `width:${RENDER_WIDTH_PX}px`,
    'font-family:"Times New Roman",Georgia,serif',
    'font-size:14px',
    'line-height:1.5',
    'color:#111',
    'background:#ffffff',
  ].join(';');

  const offscreen = document.createElement('div');
  offscreen.style.cssText =
    `position:fixed;top:0;left:-${RENDER_WIDTH_PX + 200}px;width:${RENDER_WIDTH_PX}px;` +
    'overflow:visible;background:#ffffff;z-index:-9999;';
  offscreen.appendChild(style);
  offscreen.appendChild(container);
  document.body.appendChild(offscreen);

  try {
    await Promise.all(
      Array.from(container.querySelectorAll('img')).map((img) =>
        img.complete ? Promise.resolve() : new Promise<void>((r) => { img.onload = img.onerror = () => r(); }),
      ),
    );
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));

    const captured = await html2canvas(container, {
      scale: RENDER_SCALE,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: RENDER_WIDTH_PX,
    });

    if (!captured || captured.width === 0 || captured.height === 0) return [];

    const pxPerMm = captured.width / CONTENT_WIDTH_MM;
    const pxPerPage = CONTENT_HEIGHT_MM * pxPerMm;
    const numPages = Math.max(1, Math.ceil(captured.height / pxPerPage));

    const pages: RichContentPage[] = [];
    for (let i = 0; i < numPages; i++) {
      const sliceStartPx = Math.floor(i * pxPerPage);
      const sliceHPx = Math.min(Math.ceil(pxPerPage), captured.height - sliceStartPx);
      if (sliceHPx <= 0) continue;
      const slice = document.createElement('canvas');
      slice.width = captured.width;
      slice.height = sliceHPx;
      const ctx = slice.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(captured, 0, sliceStartPx, captured.width, sliceHPx, 0, 0, captured.width, sliceHPx);
      pages.push({ dataUrl: slice.toDataURL('image/png'), format: 'PNG', heightMm: sliceHPx / pxPerMm });
    }
    return pages;
  } finally {
    document.body.removeChild(offscreen);
  }
}
