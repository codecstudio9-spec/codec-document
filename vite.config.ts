import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: [
      // Alias @ to the src directory
      { find: '@', replacement: path.resolve(__dirname, './src') },
      // pdfjs-dist 5.x's default (modern) build calls brand-new JS APIs
      // with no fallback — Map#getOrInsertComputed, Math.sumPrecise,
      // Promise.try, Uint8Array#toHex/fromBase64 — that Safari/iOS WebKit
      // (every iPhone browser, Chrome included) doesn't ship yet, so pdf.js
      // threw on load and the signing/placement screen rendered blank on
      // iPhone. The legacy build is the same API with core-js polyfills
      // bundled in. Exact-match regex so type imports and the worker path
      // (see src/app/lib/pdf-worker-entry.ts) aren't rewritten by accident.
      { find: /^pdfjs-dist$/, replacement: 'pdfjs-dist/legacy/build/pdf.mjs' },
    ],
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // 'es' instead of Vite's default 'iife': src/app/lib/pdf-worker-entry.ts
  // (the pdf.js worker wrapper, imported with `?worker&url`) does a dynamic
  // `import('pdfjs-dist/build/pdf.worker.min.mjs')` so its own
  // Promise.withResolvers polyfill runs first — that needs code-splitting
  // for the nested chunk, which Rollup only supports for ES module workers.
  worker: { format: 'es' },
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
