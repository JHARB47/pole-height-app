// Simple permit PDF builders using pdf-lib
// These produce lightweight, draft PDFs with key fields from the permit summary.

// Note: We avoid embedding agency-owned form templates. These drafts help populate data
// and can be transcribed to official forms.

import { loadPdfLib } from "./pdfAsync.js";

export async function buildMM109PDF(summary) {
  const { PDFDocument, StandardFonts, rgb } = await loadPdfLib();
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const draw = (text, x, y, bold = false, size = 12, color = rgb(0, 0, 0)) => {
    page.drawText(String(text ?? ""), {
      x,
      y,
      size,
      font: bold ? fontBold : font,
      color,
    });
  };

  // Header
  draw("WV DOH MM-109 Application (Draft)", 50, 750, true, 18);
  draw(
    `Generated: ${new Date().toLocaleString()}`,
    50,
    730,
    false,
    10,
    rgb(0.2, 0.2, 0.2),
  );

  const job = summary.job || {};
  const pole = summary.pole || {};
  const span = summary.span || {};
  const attach = summary.attach || {};
  const profile = summary.profile || {};

  let y = 700;
  const line = (label, value) => {
    draw(label, 50, y, true);
    draw(String(value ?? ""), 220, y);
    y -= 18;
  };

  line("Applicant/Company:", job.applicant || "");
  line("Communications Co.:", job.commCompany || "");
  line("Job Name:", job.name || "");
  line("Job #:", job.jobNumber || "");
  line("Owner (Utility):", job.owner || "");
  line("Environment:", summary.environment || "");
  line("Submission Profile:", profile?.label || profile?.name || "");
  line("Manifest Type:", profile?.manifestType || "");
  y -= 6;
  draw("Location", 50, y, true);
  y -= 16;
  line("Pole Latitude:", pole.gps?.lat || "");
  line("Pole Longitude:", pole.gps?.lon || "");
  line("Pole Height (ft):", pole.heightFt ?? "");
  line("Pole Class:", pole.class || "");
  line("Power (voltage):", summary.power?.voltage || "");
  line("Power Height:", summary.power?.heightFt || "");
  y -= 6;
  draw("Span", 50, y, true);
  y -= 16;
  line("Span Length (ft):", span.lengthFt ?? "");
  line("Target Ground Clearance (ft):", span.targetFt ?? "");
  line("Computed Ground Clearance (ft):", span.computedGroundClearanceFt ?? "");
  line("Midspan (ft):", span.midspanFt ?? "");
  line("Target Source:", span.targetSource || "");
  y -= 6;
  draw("Attachment", 50, y, true);
  y -= 16;
  line("Proposed Attach (ft):", attach.proposedFt ?? "");
  line("Basis:", attach.basis || "");
  line("Detail:", attach.detail || "");

  // Notes
  y -= 10;
  draw("Notes:", 50, y, true);
  y -= 16;
  const notes = [
    "This draft contains calculated values and job metadata to assist with MM-109 preparation.",
    "For Interstate crossings (new), ensure minimum 21 ft clearance is satisfied (profile configurable).",
    "Validate location and attach heights against field conditions and owner requirements before submission.",
  ];
  for (const n of notes) {
    draw(`• ${n}`, 60, y);
    y -= 14;
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

export async function buildCSXPDF(summary) {
  const { PDFDocument, StandardFonts, rgb } = await loadPdfLib();
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const draw = (text, x, y, bold = false, size = 12, color = rgb(0, 0, 0)) => {
    page.drawText(String(text ?? ""), {
      x,
      y,
      size,
      font: bold ? fontBold : font,
      color,
    });
  };

  // Header
  draw("Railroad Crossing Application (Draft: CSX)", 50, 750, true, 18);
  draw(
    `Generated: ${new Date().toLocaleString()}`,
    50,
    730,
    false,
    10,
    rgb(0.2, 0.2, 0.2),
  );

  const job = summary.job || {};
  const pole = summary.pole || {};
  const span = summary.span || {};
  const attach = summary.attach || {};
  const profile = summary.profile || {};

  let y = 700;
  const line = (label, value) => {
    draw(label, 50, y, true);
    draw(String(value ?? ""), 260, y);
    y -= 18;
  };

  line("Applicant/Company:", job.applicant || "");
  line("Communications Co.:", job.commCompany || "");
  line("Job Name:", job.name || "");
  line("Job #:", job.jobNumber || "");
  line("Owner (Utility):", job.owner || "");
  line("Environment:", summary.environment || "");
  line("Submission Profile:", profile?.label || profile?.name || "");
  line("Manifest Type:", profile?.manifestType || "");
  y -= 6;
  draw("Location", 50, y, true);
  y -= 16;
  line("Pole Latitude:", pole.gps?.lat || "");
  line("Pole Longitude:", pole.gps?.lon || "");
  line("Pole Height (ft):", pole.heightFt ?? "");
  line("Pole Class:", pole.class || "");
  line("Power (voltage):", summary.power?.voltage || "");
  line("Power Height:", summary.power?.heightFt || "");
  y -= 6;
  draw("Span", 50, y, true);
  y -= 16;
  line("Span Length (ft):", span.lengthFt ?? "");
  line("Target Ground Clearance (ft):", span.targetFt ?? "");
  line("Computed Ground Clearance (ft):", span.computedGroundClearanceFt ?? "");
  line("Midspan (ft):", span.midspanFt ?? "");
  line("Target Source:", span.targetSource || "");
  y -= 6;
  draw("Attachment", 50, y, true);
  y -= 16;
  line("Proposed Attach (ft):", attach.proposedFt ?? "");
  line("Basis:", attach.basis || "");
  line("Detail:", attach.detail || "");

  // Notes
  y -= 10;
  draw("Notes:", 50, y, true);
  y -= 16;
  const notes = [
    "Target ground clearance for railroad crossings is typically 27 ft (profile configurable).",
    "Ensure vertical and horizontal clearances meet railroad standards and owner requirements.",
    "Provide plan/profile drawing, location map, and contact information with the official submittal.",
  ];
  for (const n of notes) {
    draw(`• ${n}`, 60, y);
    y -= 14;
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
