// Thin async boundary for loading pdf-lib heavy code paths.
// Centralizing here helps create a single dynamic import point for pdf-lib
// so that unrelated routes and early interactions avoid downloading the PDF code.

export async function withPdfLib(fn) {
  const mod = await import('pdf-lib');
  return fn(mod);
}

export async function createPdfDocument() {
  const { PDFDocument } = await import('pdf-lib');
  return PDFDocument.create();
}

export async function loadPdfLib() {
  return import('pdf-lib');
}
