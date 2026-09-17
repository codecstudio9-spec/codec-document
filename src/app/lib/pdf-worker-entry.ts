// pdfjs-dist 5.x calls Promise.withResolvers() throughout the worker bundle
// (pdf.worker.min.mjs). That API only landed in Safari 17.4 (March 2024) —
// on any iPhone on an older iOS this throws immediately inside the worker,
// which is exactly the "document viewer goes blank on iPhone, works fine on
// Android" failure: the worker never gets far enough to render a page or
// report an error the main thread can catch. See index.html for the same
// polyfill on the main thread (pdf.mjs uses it too).
//
// Cast once rather than a `@ts-expect-error` per access — withResolvers is a
// stage-4 TC39 proposal not yet in the lib.dom types this project targets.
const PromiseCtor = Promise as unknown as {
  withResolvers?: <T>() => { promise: Promise<T>; resolve: (value: T | PromiseLike<T>) => void; reject: (reason?: unknown) => void };
};

if (typeof PromiseCtor.withResolvers !== 'function') {
  PromiseCtor.withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
  };
}

// A dynamic import, not a static one — static imports are hoisted above all
// other top-level code in the module, which would run pdf.worker's own code
// (and hit the same missing API) before the polyfill above ever executes.
// @ts-expect-error -- pdfjs-dist doesn't ship a .d.ts for this prebuilt file.
import('pdfjs-dist/build/pdf.worker.min.mjs');
