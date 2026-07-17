
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  // A deploy can land WHILE a visitor already has the site open. Their tab
  // still has the old index.html, which references JS chunk files by a
  // content hash — once the new build goes live, those exact old-hash
  // files no longer exist on the server. The next dynamic import() (route
  // code-splitting, or a lazy `await import('pdf-lib')` deep in the
  // signing flow) 404s, Vercel's SPA rewrite serves index.html for that
  // 404 instead of a real 404 page, and the browser chokes trying to
  // parse HTML as a JS module — surfacing as a raw, meaningless error
  // like "'text/html' is not a valid JavaScript MIME type" instead of
  // anything a user could act on. A single automatic reload fetches the
  // CURRENT index.html + matching chunk hashes and fixes it silently.
  // Guarded with sessionStorage so a real, persistent failure (offline,
  // broken deploy) reloads once and then shows the actual error instead
  // of loop-reloading forever.
  const RELOAD_GUARD_KEY = 'codec_stale_chunk_reload';
  function reloadOnceForStaleChunk() {
    if (sessionStorage.getItem(RELOAD_GUARD_KEY)) return false;
    sessionStorage.setItem(RELOAD_GUARD_KEY, '1');
    window.location.reload();
    return true;
  }
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    reloadOnceForStaleChunk();
  });
  window.addEventListener('unhandledrejection', (event) => {
    const message = String(event.reason?.message ?? event.reason ?? '');
    if (/dynamically imported module|not a valid JavaScript MIME type|Failed to fetch dynamically imported module/i.test(message)) {
      if (reloadOnceForStaleChunk()) event.preventDefault();
    }
  });
  // A successful load means the current bundle is good — clear the guard
  // so a genuinely new stale-chunk event later (the next deploy) can
  // still trigger one reload instead of being silently skipped forever.
  window.addEventListener('load', () => sessionStorage.removeItem(RELOAD_GUARD_KEY));

  createRoot(document.getElementById("root")!).render(<App />);
