// Thin async boundary for loading pdf-lib heavy code paths via CDN.
// Centralizing here helps create a single dynamic import point for pdf-lib
// so that unrelated routes and early interactions avoid downloading the PDF code.

import { CircuitBreaker, errorMonitor } from "./errorMonitoring.js";

let pdfLibCache = null;
const pdfLibCircuitBreaker = new CircuitBreaker("pdfLib", {
  failureThreshold: 3,
  resetTimeout: 60000, // 1 minute
});

async function loadPdfLibFromCDN() {
  if (pdfLibCache) return pdfLibCache;

  return pdfLibCircuitBreaker.execute(async () => {
    try {
      // Check if PDFLib is already available globally (from CDN)
      if (window.PDFLib) {
        pdfLibCache = window.PDFLib;
        return window.PDFLib;
      }

      // Load pdf-lib from CDN to reduce bundle size
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js";
      script.async = true;

      const loadPromise = new Promise((resolve, reject) => {
        script.onload = () => {
          if (window.PDFLib) {
            pdfLibCache = window.PDFLib;
            resolve(window.PDFLib);
          } else {
            reject(new Error("PDF-lib failed to load from CDN"));
          }
        };
        script.onerror = () =>
          reject(new Error("PDF-lib CDN script failed to load"));
      });

      document.head.appendChild(script);
      return await loadPromise;
    } catch (error) {
      errorMonitor.logError(error, {
        operation: "pdf_cdn_load",
        fallback: "dynamic_import",
      });
      console.warn("CDN load failed, falling back to dynamic import:", error);
      // Fallback to ESM bundle via dynamic import to keep bundler externals clean
      try {
        const mod = await import(
          /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js"
        );
        pdfLibCache = mod;
        return mod;
      } catch (importError) {
        errorMonitor.logError(importError, {
          operation: "pdf_dynamic_import",
          failed: "both_cdn_and_import",
        });
        console.error("Both CDN and dynamic import failed:", importError);
        throw new Error("Unable to load PDF library");
      }
    }
  });
}

export async function withPdfLib(fn) {
  const mod = await loadPdfLibFromCDN();
  return fn(mod);
}

export async function createPdfDocument() {
  const mod = await loadPdfLibFromCDN();
  return mod.PDFDocument.create();
}

export async function loadPdfLib() {
  return loadPdfLibFromCDN();
}
