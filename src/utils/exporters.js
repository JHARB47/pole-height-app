// @ts-nocheck
// Export utilities for interoperability with external tools
// Provides CSV, GeoJSON, and KML exports for poles, spans, and existing lines.

export const EXPORT_PRESETS = [
  { label: "Generic (CSV/GeoJSON/KML)", value: "generic" },
  { label: "ArcGIS (example)", value: "arcgis" },
  { label: "ikeGPS (example)", value: "ikegps" },
  { label: "Katapult Pro (example)", value: "katapultPro" },
  { label: "FirstEnergy Joint-Use (example)", value: "firstEnergy" },
];

export function sanitizeFilename(name) {
  // Convert to lower-kebab-case and strip illegal characters
  const cleaned = String(name || "")
    .toLowerCase()
    .replace(/[\\/:*?"<>|]+/g, " ") // illegal -> space
    .replace(/[^a-z0-9\s-]+/g, "") // drop other punctuation
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return cleaned || "export";
}

function formatNumber(n) {
  return Number.isFinite(n) ? Number(n.toFixed(3)) : "";
}

export function addBOM(str) {
  // Tests expect a string with a leading BOM character
  return "\uFEFF" + String(str ?? "");
}

function buildCSV({ rows, headers }) {
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => r[h] ?? "").join(","));
  }
  return lines.join("\n");
}

function polesToCSV(poles = []) {
  const headers = [
    "id",
    "label",
    "latitude",
    "longitude",
    "height_ft",
    "class",
    "attach_height_ft",
    "bearing_deg",
    "pull_ft",
    "notes",
  ];
  const rows = poles.map((p) => ({
    id: p.id,
    label: p.label,
    latitude: formatNumber(p.latitude ?? p.lat),
    longitude: formatNumber(p.longitude ?? p.lng),
    height_ft: formatNumber(p.heightFt),
    class: p.class || "",
    attach_height_ft: formatNumber(p.attachHeightFt),
    bearing_deg: formatNumber(p.bearingDeg),
    pull_ft: formatNumber(p.pullFt),
    notes: p.notes || "",
  }));
  return buildCSV({ rows, headers });
}

// Named export aliases expected by tests
export function buildPolesCSV(poles = []) {
  return polesToCSV(poles);
}

function spansToCSV(spans = []) {
  const headers = [
    "id",
    "from_pole_id",
    "to_pole_id",
    "length_ft",
    "sag_ft",
    "midspan_height_ft",
  ];
  const rows = spans.map((s) => ({
    id: s.id,
    from_pole_id: s.fromPoleId,
    to_pole_id: s.toPoleId,
    length_ft: formatNumber(s.lengthFt),
    sag_ft: formatNumber(s.sagFt),
    midspan_height_ft: formatNumber(s.midspanHeightFt),
  }));
  return buildCSV({ rows, headers });
}

export function buildSpansCSV(spans = []) {
  return spansToCSV(spans);
}

function existingLinesToCSV(lines = []) {
  const headers = ["id", "type", "latitude", "longitude", "height_ft", "notes"];
  const rows = lines.map((l) => ({
    id: l.id,
    type: l.type || "",
    latitude: formatNumber(l.latitude ?? l.lat),
    longitude: formatNumber(l.longitude ?? l.lng),
    height_ft: formatNumber(l.heightFt),
    notes: l.notes || "",
  }));
  return buildCSV({ rows, headers });
}

export function buildExistingLinesCSV(lines = []) {
  return existingLinesToCSV(lines);
}

function toGeoJSON({ poles = [], spans = [], existingLines = [] }) {
  const features = [];
  for (const p of poles) {
    const lat = p.latitude ?? p.lat;
    const lng = p.longitude ?? p.lng;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: {
        id: p.id,
        label: p.label,
        height_ft: p.heightFt,
        attach_height_ft: p.attachHeightFt,
        bearing_deg: p.bearingDeg,
        pull_ft: p.pullFt,
      },
    });
  }
  for (const s of spans) {
    if (s.coordinates && s.coordinates.length === 2) {
      const normalized = s.coordinates.map((c) => {
        if (Array.isArray(c)) return c;
        if (c && typeof c === "object") {
          return [c.lng ?? c.longitude, c.lat ?? c.latitude];
        }
        return c;
      });
      const isValid = normalized.every(
        (c) =>
          Array.isArray(c) && Number.isFinite(c[0]) && Number.isFinite(c[1]),
      );
      if (!isValid) continue;
      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: normalized,
        },
        properties: {
          id: s.id,
          from: s.fromPoleId,
          to: s.toPoleId,
          length_ft: s.lengthFt,
        },
      });
    }
  }
  for (const l of existingLines) {
    const lat = l.latitude ?? l.lat;
    const lng = l.longitude ?? l.lng;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: { id: l.id, type: l.type },
    });
  }
  return { type: "FeatureCollection", features };
}

export function buildGeoJSON(input = {}) {
  return toGeoJSON(input);
}

export function buildKML({ poles = [], spans = [], name = "Export" }) {
  const esc = (v) =>
    String(v ?? "").replace(
      /[&<>]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c],
    );
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<kml xmlns="http://www.opengis.net/kml/2.2">',
    `<Document><name>${esc(name)}</name>`,
  ];
  for (const p of poles) {
    lines.push(
      "<Placemark>",
      `<name>${esc(p.label || p.id)}</name>`,
      `<Point><coordinates>${p.lng},${p.lat},0</coordinates></Point>`,
      "</Placemark>",
    );
  }
  for (const s of spans) {
    if (s.coordinates && s.coordinates.length === 2) {
      const [a, b] = s.coordinates;
      lines.push(
        "<Placemark>",
        `<name>Span ${esc(s.id)}</name>`,
        `<LineString><coordinates>${a.lng},${a.lat},0 ${b.lng},${b.lat},0</coordinates></LineString>`,
        "</Placemark>",
      );
    }
  }
  lines.push("</Document></kml>");
  return lines.join("");
}
export async function buildKMZ({
  poles = [],
  spans = [],
  name = "Export",
} = {}) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const kml = buildKML({ poles, spans, name });
  zip.file("doc.kml", kml);
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}

export function buildFirstEnergyJointUseCSV({ cachedMidspans = [], job = {} }) {
  const headers = [
    "job_name",
    "span_id",
    "length_ft",
    "sag_ft",
    "midspan_height_ft",
  ];
  const rows = cachedMidspans.map((s) => ({
    job_name: job.name || "",
    span_id: s.id,
    length_ft: formatNumber(s.lengthFt),
    sag_ft: formatNumber(s.sagFt),
    midspan_height_ft: formatNumber(s.midspanHeightFt),
  }));
  return buildCSV({ rows, headers });
}

export function buildExportBundle({
  poles = [],
  spans = [],
  existingLines = [],
  preset = "generic",
  job = { name: "Export", jobNumber: "" },
  includeBOM = false,
} = {}) {
  const ts = new Date().toISOString().replace(/[:T]/g, "-").replace(/\..+/, "");
  const base = sanitizeFilename(
    [job.jobNumber, job.name, ts].filter(Boolean).join("-"),
  );

  const polesCSV = buildPolesCSV(poles);
  const spansCSV = buildSpansCSV(spans);
  const existingCSV = buildExistingLinesCSV(existingLines);

  const files = {
    [`${base}/poles.csv`]: includeBOM ? addBOM(polesCSV) : polesCSV,
    [`${base}/spans.csv`]: includeBOM ? addBOM(spansCSV) : spansCSV,
    [`${base}/existing_lines.csv`]: includeBOM
      ? addBOM(existingCSV)
      : existingCSV,
    [`${base}/data.geojson`]: new Blob(
      [JSON.stringify(buildGeoJSON({ poles, spans, existingLines }), null, 2)],
      { type: "application/geo+json" },
    ),
    [`${base}/data.kml`]: new Blob([], {
      type: "application/vnd.google-earth.kml+xml",
    }), // placeholder; real KML in KMZ
  };

  if (preset === "firstEnergy" && spans.length) {
    const feCsv = buildFirstEnergyJointUseCSV({ cachedMidspans: spans, job });
    files[`${base}/firstenergy_jointuse.csv`] = includeBOM
      ? addBOM(feCsv)
      : feCsv;
  }

  return { base, files };
}

export async function buildExportZip({
  poles = [],
  spans = [],
  existingLines = [],
  preset = "generic",
  job = { name: "Export", jobNumber: "" },
  includeBOM = false,
  onProgress,
} = {}) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const { base, files } = buildExportBundle({
    poles,
    spans,
    existingLines,
    preset,
    job,
    includeBOM,
  });
  for (const [filePath, fileData] of Object.entries(files))
    zip.file(filePath, fileData);
  const kmzBlob = await buildKMZ({ poles, spans, name: job?.name || "export" });
  zip.file(`${base}/export.kmz`, kmzBlob);
  const blob = await zip.generateAsync(
    { type: "blob", compression: "DEFLATE" },
    (meta) => {
      if (typeof onProgress === "function") {
        try {
          onProgress(meta.percent || 0);
        } catch {
          /* intentionally ignore progress errors */
        }
      }
    },
  );
  return blob;
}

export function downloadFile(
  data,
  filename,
  mime = "application/octet-stream",
) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 0);
}

export async function downloadExportZip(opts = {}) {
  const blob = await buildExportZip(opts);
  const name = sanitizeFilename(
    [opts?.job?.jobNumber, opts?.job?.name || "export"]
      .filter(Boolean)
      .join("-"),
  );
  downloadFile(blob, `${name}-bundle.zip`, "application/zip");
}
