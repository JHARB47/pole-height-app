import { describe, it, expect } from 'vitest';
import { loadPdfLib } from './pdfAsync';

// Light smoke test; we only assert that loadPdfLib resolves an object containing expected keys.
describe('pdfAsync loader', () => {
  it('dynamically loads pdf-lib', async () => {
    const lib = await loadPdfLib();
    expect(typeof lib.PDFDocument).toBe('function');
  });
});
