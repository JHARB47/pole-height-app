// Lightweight PDF form filler using pdf-lib for text-only fields.
// Note: Official forms often have complex AcroForms or require ePermitting; we
// provide a generic text overlay approach to assist transcribing fields.

export async function fillPdfWithFields(basePdfBytes, fields, layout) {
  // layout: [{ key, x, y, size?, pageIndex? }]
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const doc = await PDFDocument.load(basePdfBytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pages = doc.getPages();
  for (const spec of layout || []) {
    const page = pages[spec.pageIndex || 0];
    if (!page) continue;
    const value = fields[spec.key];
    if (value == null || value === '') continue;
    page.drawText(String(value), {
      x: spec.x,
      y: spec.y,
      size: spec.size || 10,
      color: rgb(0, 0, 0),
      font: spec.bold ? fontBold : font,
    });
  }
  return await doc.save();
}

export default { fillPdfWithFields };
