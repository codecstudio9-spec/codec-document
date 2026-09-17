/**
 * The single pdf.js worker URL every PDF viewer/signature component should
 * use for `pdfjsLib.GlobalWorkerOptions.workerSrc` — instead of each one
 * inlining its own `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)`.
 *
 * Points at ./pdf-worker-entry.ts (a tiny wrapper), not pdfjs-dist's file
 * directly, so the Promise.withResolvers polyfill it installs always runs
 * before the real worker code — see that file for why.
 *
 * Imported with Vite's `?worker&url` suffix, NOT `new URL(..., import.meta.url)`
 * — that plain-URL pattern only asset-copies a file's raw bytes with no JS/TS
 * transform (it mis-detected pdf-worker-entry.ts's own TypeScript source as
 * an MPEG-TS video file and base64-inlined it verbatim, un-executable). The
 * `?worker&url` suffix instead runs the file through Vite's real worker
 * build pipeline (TS compiled, its own dynamic import of pdfjs-dist bundled
 * properly) and hands back the URL of the resulting compiled chunk.
 */
import PDF_WORKER_SRC from './pdf-worker-entry.ts?worker&url';

export { PDF_WORKER_SRC };
