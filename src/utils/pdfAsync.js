// Thin async boundary for loading pdf-lib heavy code paths via CDN.
// Centralizing here helps create a single dynamic import point for pdf-lib
// so that unrelated routes and early interactions avoid downloading the PDF code.

let pdfLibCache = null;

async function loadPdfLibFromCDN() {
  if (pdfLibCache) return pdfLibCache;
  
  try {
    // Check if PDFLib is already available globally (from CDN)
    if (window.PDFLib) {
      pdfLibCache = window.PDFLib;
      return window.PDFLib;
    }
    
    // Load pdf-lib from CDN to reduce bundle size
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
    script.async = true;
    
    const loadPromise = new Promise((resolve, reject) => {
      script.onload = () => {
        if (window.PDFLib) {
          pdfLibCache = window.PDFLib;
          resolve(window.PDFLib);
        } else {
          reject(new Error('PDF-lib failed to load from CDN'));
        }
      };
      script.onerror = () => reject(new Error('PDF-lib CDN script failed to load'));
    });
    
    document.head.appendChild(script);
    return await loadPromise;
  } catch (error) {
    console.warn('CDN load failed, falling back to dynamic import:', error);
    // Fallback to dynamic import if CDN fails
    try {
      const mod = await import('pdf-lib');
      pdfLibCache = mod;
      return mod;
    } catch (importError) {
      console.error('Both CDN and dynamic import failed:', importError);
      throw new Error('Unable to load PDF library');
    }
  }
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
