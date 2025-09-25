// Lightweight PDF form filler using pdf-lib for text-only fields.
// Note: Official forms often have complex AcroForms or require ePermitting; we
// provide a generic text overlay approach to assist transcribing fields.

// Overlay text values at absolute coordinates.
export async function fillPdfWithFields(basePdfBytes, fields, layout) {
  // layout: [{ key, x, y, size?, pageIndex?, bold? }]
  const { loadPdfLib } = await import('./pdfAsync');
  const { PDFDocument, StandardFonts, rgb } = await loadPdfLib();
  const doc = await PDFDocument.load(basePdfBytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();
  for (const spec of (layout || [])) {
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

// Fill AcroForm fields by name using normalized fields and a field name mapper.
// This works when the official PDF is a fillable form.
export async function fillAcroFormByName(basePdfBytes, env, fields) {
  const { loadPdfLib } = await import('./pdfAsync');
  const { PDFDocument } = await loadPdfLib();
  const { mapFieldNameToKey } = await import('./pdfFieldMapper');
  const doc = await PDFDocument.load(basePdfBytes);
  const form = doc.getForm();
  const acroFields = form.getFields();
  for (const f of acroFields) {
    try {
      const name = f.getName();
      const key = mapFieldNameToKey(name, env);
      if (!key) continue;
      const val = fields[key];
      if (val == null || val === '') continue;
      const s = String(val);
      if (f.setText) f.setText(s);
    } catch {
      // ignore single-field errors to keep bulk fill robust
    }
  }
  return await doc.save();
}

// Lightweight PDF meta reader for layout selection
export async function getPdfMeta(basePdfBytes) {
  const { loadPdfLib } = await import('./pdfAsync');
  const { PDFDocument } = await loadPdfLib();
  const doc = await PDFDocument.load(basePdfBytes);
  const pages = doc.getPages();
  const first = pages[0];
  const size = first ? first.getSize() : { width: 0, height: 0 };
  return { pages: pages.length, firstPage: { width: size.width, height: size.height } };
}

// Convenience: auto-pick a layout for an environment if none provided
export async function fillPdfAuto(basePdfBytes, env, fields, explicitLayout) {
  let layout = explicitLayout;
  if (!layout || !layout.length) {
    const { getLayoutFor } = await import('./pdfLayouts');
    const meta = await getPdfMeta(basePdfBytes);
    layout = getLayoutFor(env, meta);
  }
  return fillPdfWithFields(basePdfBytes, fields, layout);
}

export default { fillPdfWithFields, fillAcroFormByName, getPdfMeta, fillPdfAuto };
