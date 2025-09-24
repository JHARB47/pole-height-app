// Export utilities for interoperability with external tools
// Provides CSV, GeoJSON, and KML exports for poles, spans, and existing lines.

export const EXPORT_PRESETS = [
  { label: 'Generic (CSV/GeoJSON/KML)', value: 'generic' },
  { label: 'ArcGIS (example)', value: 'arcgis' },
  { label: 'ikeGPS (example)', value: 'ikegps' },
  { label: 'Katapult Pro (example)', value: 'katapultPro' },
  { label: 'FirstEnergy Joint-Use (example)', value: 'firstEnergy' },
];

function csvEscape(v) {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replaceAll('"', '""') + '"';
  return s;
}

export function buildPolesCSV(poles = [], preset = 'generic') {
  // Common columns; adjust headers by preset
  const base = {
    generic: ['POLE_ID', 'HEIGHT_FT', 'CLASS', 'PWR_HT', 'XFMR', 'Longitude', 'Latitude'],
    arcgis: ['POLE_ID', 'HEIGHT_FT', 'CLASS', 'PWR_HT', 'XFMR', 'Longitude', 'Latitude'],
    ikegps: ['POLE_ID', 'POLE_HEIGHT_FT', 'POLE_CLASS', 'PRIMARY_HT_FT', 'TRANSFORMER', 'Longitude', 'Latitude'],
    katapultPro: ['ID', 'HEIGHT_FT', 'CLASS', 'PRIMARY_HT', 'XFMR', 'Longitude', 'Latitude'],
    firstEnergy: ['POLE_ID', 'HGT_FT', 'CLASS', 'PWR_HT', 'XFMR', 'Longitude', 'Latitude'],
  };
  const headers = base[preset] || base.generic;
  const rows = [headers.join(',')];
  for (const p of poles) {
    const h = p.height != null ? Math.round(p.height) : '';
    const cls = p.class ?? '';
    const pwr = p.powerHeight != null ? Math.round(p.powerHeight) : '';
    const xfmr = p.hasTransformer ? 'Y' : '';
    const id = p.id ?? '';
    const lon = p.longitude ?? '';
    const lat = p.latitude ?? '';
    const map = {
      POLE_ID: id, HGT_FT: h, HEIGHT_FT: h, POLE_HEIGHT_FT: h,
      CLASS: cls, POLE_CLASS: cls,
      PWR_HT: pwr, PRIMARY_HT: pwr, PRIMARY_HT_FT: pwr,
      XFMR: xfmr, TRANSFORMER: xfmr,
      Longitude: lon, Latitude: lat, ID: id,
    };
    rows.push(headers.map(k => csvEscape(map[k] ?? '')).join(','));
  }
  return rows.join('\n');
}

export function buildSpansCSV(spans = [], preset = 'generic') {
  const base = {
    generic: ['SPAN_ID', 'FROM_ID', 'TO_ID', 'SPAN_FT', 'ATTACH_FT'],
    arcgis: ['SPAN_ID', 'FROM_ID', 'TO_ID', 'SPAN_FT', 'ATTACH_FT'],
    ikegps: ['SPAN_ID', 'FROM_ID', 'TO_ID', 'SPAN_FT', 'ATTACH_FT'],
    katapultPro: ['SPAN_ID', 'FROM_ID', 'TO_ID', 'SPAN_FT', 'ATTACH_FT'],
    firstEnergy: ['SPAN_ID', 'FROM_ID', 'TO_ID', 'SPAN_FT', 'ATTACH_FT'],
  };
  const headers = base[preset] || base.generic;
  const rows = [headers.join(',')];
  for (const s of spans) {
    const map = {
      SPAN_ID: s.id ?? '',
      FROM_ID: s.fromId ?? '',
      TO_ID: s.toId ?? '',
      SPAN_FT: s.length != null ? Math.round(s.length) : '',
      ATTACH_FT: s.proposedAttach != null ? Math.round(s.proposedAttach) : '',
    };
    rows.push(headers.map(k => csvEscape(map[k] ?? '')).join(','));
  }
  return rows.join('\n');
}

export function buildExistingLinesCSV(lines = [], preset = 'generic') {
  const base = {
    generic: ['TYPE', 'LINE_HT', 'OWNER', 'MAKE_READY', 'NEW_HT'],
    arcgis: ['LINE_TYPE', 'LINE_HT', 'OWNER', 'MAKE_READY', 'NEW_HT'],
    ikegps: ['LINE_TYPE', 'LINE_HT', 'COMPANY', 'MAKE_READY', 'NEW_HT'],
    katapultPro: ['TYPE', 'HGT_FT', 'OWNER', 'MAKE_READY', 'NEW_HT'],
    firstEnergy: ['TYPE', 'HGT_FT', 'COMPANY', 'MR', 'MR_HGT'],
  };
  const headers = base[preset] || base.generic;
  const rows = [headers.join(',')];
  for (const l of lines) {
    const h = l.height ?? '';
    const map = {
      TYPE: l.type || 'communication', LINE_TYPE: l.type || 'communication',
      LINE_HT: h, HGT_FT: h,
      OWNER: l.companyName || '', COMPANY: l.companyName || '',
      MAKE_READY: l.makeReady ? 'Y' : 'N', MR: l.makeReady ? 'Y' : 'N',
      NEW_HT: l.makeReadyHeight || '', MR_HGT: l.makeReadyHeight || '',
    };
    rows.push(headers.map(k => csvEscape(map[k] ?? '')).join(','));
  }
  return rows.join('\n');
}

export function buildGeoJSON({ poles = [], spans = [] }) {
  const makePoleFeature = (p) => {
    if (p.latitude == null || p.longitude == null) return null;
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [Number(p.longitude), Number(p.latitude)] },
      properties: {
        POLE_ID: p.id || '',
        HEIGHT_FT: p.height != null ? Math.round(p.height) : '',
        CLASS: p.class || '',
        PWR_HT: p.powerHeight != null ? Math.round(p.powerHeight) : '',
        XFMR: p.hasTransformer ? 'Y' : 'N',
      },
    };
  };

  const makeSpanFeature = (s) => {
    if (!s.coordinates || !Array.isArray(s.coordinates)) return null;
    return {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: s.coordinates },
      properties: {
        SPAN_ID: s.id || '',
        FROM_ID: s.fromId || '',
        TO_ID: s.toId || '',
        SPAN_FT: s.length != null ? Math.round(s.length) : '',
        ATTACH_FT: s.proposedAttach != null ? Math.round(s.proposedAttach) : '',
      },
    };
  };

  const poleFeatures = poles.map(makePoleFeature).filter(Boolean);
  const spanFeatures = spans.map(makeSpanFeature).filter(Boolean);
  const features = [...poleFeatures, ...spanFeatures];

  return { type: 'FeatureCollection', features };
}

export function buildKML({ poles = [], spans = [] }) {
  const esc = (s) => String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push('<kml xmlns="http://www.opengis.net/kml/2.2"><Document>');
  parts.push('<name>Pole Plan Wizard Export</name>');
  // Simple styles for better readability in mapping tools
  parts.push([
    '<Style id="poleStyle">',
    '  <IconStyle><color>ff3366ff</color><scale>1.2</scale>',
    '    <Icon><href>http://maps.google.com/mapfiles/kml/paddle/blu-circle.png</href></Icon>',
    '  </IconStyle>',
    '</Style>',
    '<Style id="spanStyle">',
    '  <LineStyle><color>ff0033ff</color><width>2.5</width></LineStyle>',
    '</Style>'
  ].join(''));

  const buildExtendedData = (kv) =>
    Object.entries(kv).map(([k, v]) => `<Data name="${esc(k)}"><value>${esc(v)}</value></Data>`).join('');

  const addPolePlacemark = (p) => {
    if (p.latitude == null || p.longitude == null) return null;
    const kv = {
      HEIGHT_FT: p.height != null ? Math.round(p.height) : '',
      CLASS: p.class || '',
      PWR_HT: p.powerHeight != null ? Math.round(p.powerHeight) : '',
      XFMR: p.hasTransformer ? 'Y' : 'N',
    };
    return [
      '<Placemark>',
      '<styleUrl>#poleStyle</styleUrl>',
      `<name>${esc(p.id || 'Pole')}</name>`,
      '<ExtendedData>',
      buildExtendedData(kv),
      '</ExtendedData>',
      `<Point><coordinates>${p.longitude},${p.latitude},0</coordinates></Point>`,
      '</Placemark>',
    ].join('');
  };

  const addSpanPlacemark = (s) => {
    if (!s.coordinates || !Array.isArray(s.coordinates)) return null;
    const kv = {
      FROM_ID: s.fromId || '',
      TO_ID: s.toId || '',
      SPAN_FT: s.length != null ? Math.round(s.length) : '',
      ATTACH_FT: s.proposedAttach != null ? Math.round(s.proposedAttach) : '',
    };
    const coordString = s.coordinates.map(([lon, lat]) => `${lon},${lat},0`).join(' ');
    return [
      '<Placemark>',
      '<styleUrl>#spanStyle</styleUrl>',
      `<name>${esc(s.id || 'Span')}</name>`,
      '<ExtendedData>',
      buildExtendedData(kv),
      '</ExtendedData>',
      `<LineString><coordinates>${coordString}</coordinates></LineString>`,
      '</Placemark>',
    ].join('');
  };

  // Organize into folders
  parts.push('<Folder><name>Poles</name>');
  for (const p of poles) {
    const pm = addPolePlacemark(p);
    if (pm) parts.push(pm);
  }
  parts.push('</Folder>');
  parts.push('<Folder><name>Spans</name>');
  for (const s of spans) {
    const pm = addSpanPlacemark(s);
    if (pm) parts.push(pm);
  }
  parts.push('</Folder>');

  parts.push('</Document></kml>');
  return parts.join('');
}

// Optional FE example export
export function buildFirstEnergyJointUseCSV({ cachedMidspans = [], job = { name: '' } }) {
  // Example headers; adjust as needed for actual submission portals
  const headers = ['JOB_NAME', 'SPAN_ID', 'FROM_ID', 'TO_ID', 'ENV', 'SPAN_FT', 'ATTACH_FT', 'TARGET_FT', 'MIDSPAN_FT', 'PASS', 'DEFICIT_FT'];
  const rows = [headers.join(',')];
  for (const m of (cachedMidspans || [])) {
    let passStatus = '';
    if (m.pass === true) passStatus = 'PASS';
    else if (m.pass === false) passStatus = 'FAIL';
    const line = [
      job?.name || '', m.spanId || '', m.fromId || '', m.toId || '',
      m.environment || '', m.spanFt ?? '', m.attachFt ?? '', m.targetFt ?? '', m.midspanFt ?? '',
      passStatus, m.deficitFt ?? ''
    ];
    rows.push(line.map(csvEscape).join(','));
  }
  return rows.join('\n');
}

// ---------------- KMZ and CSV convenience helpers ----------------
export function sanitizeFilename(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
}

export async function buildKMZ({ poles = [], spans = [] } = {}) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const kml = buildKML({ poles, spans });
  zip.file('doc.kml', kml);
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  // Consumers should save with .kmz extension and mime application/vnd.google-earth.kmz
  return blob;
}

export function addBOM(csv) {
  const UTF8_BOM = '\ufeff';
  return csv.startsWith(UTF8_BOM) ? csv : UTF8_BOM + csv;
}

export function csvToBlob(csv, { bom = false } = {}) {
  const data = bom ? addBOM(csv) : csv;
  return new Blob([data], { type: 'text/csv;charset=utf-8' });
}

// -------- Convenience bundle/connector helpers --------
// Build a ZIP file containing CSV, GeoJSON, and KML for easy sharing with external systems.
// Returns a Blob (application/zip) ready for download.
// Build an object map of export filenames to data (strings or Blobs)
export function buildExportBundle({
  poles = [],
  spans = [],
  existingLines = [],
  preset = 'generic',
  job = { name: 'Export', jobNumber: '' },
  includeBOM = false,
} = {}) {
  const files = {};
  const timestamp = new Date().toISOString().replaceAll(':', '-');
  const jobPart = [job?.jobNumber, job?.name].filter(Boolean).map(sanitizeFilename).join('-');
  const base = `pole-plan-${jobPart || 'export'}-${timestamp}`;

  // CSVs (optionally with BOM for Excel)
  const polesCsv = buildPolesCSV(poles, preset);
  const spansCsv = buildSpansCSV(spans, preset);
  const linesCsv = buildExistingLinesCSV(existingLines, preset);
  files[`${base}/poles.csv`] = includeBOM ? addBOM(polesCsv) : polesCsv;
  files[`${base}/spans.csv`] = includeBOM ? addBOM(spansCsv) : spansCsv;
  files[`${base}/existing_lines.csv`] = includeBOM ? addBOM(linesCsv) : linesCsv;

  // GeoJSON & KML/KMZ
  const geo = buildGeoJSON({ poles, spans });
  files[`${base}/export.geojson`] = JSON.stringify(geo);
  const kml = buildKML({ poles, spans });
  files[`${base}/export.kml`] = kml;
  // KMZ added separately in buildExportZip (needs async)

  // FE example if present
  if (Array.isArray(spans) && spans.some(s => 'midspanFt' in (s || {}))) {
    const feCsv = buildFirstEnergyJointUseCSV({ cachedMidspans: spans, job });
    files[`${base}/firstenergy_jointuse.csv`] = includeBOM ? addBOM(feCsv) : feCsv;
  }

  return { base, files };
}

export async function buildExportZip({
  poles = [],
  spans = [],
  existingLines = [],
  preset = 'generic',
  job = { name: 'Export', jobNumber: '' },
  includeBOM = false,
  onProgress,
} = {}) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const { base, files } = buildExportBundle({ poles, spans, existingLines, preset, job, includeBOM });

  // Add prepared files
  for (const [name, data] of Object.entries(files)) {
    zip.file(name, data);
  }
  // KMZ packaged KML
  // KMZ packaged KML
  const kmzBlob = await buildKMZ({ poles, spans, name: job?.name || 'export' });
  zip.file(`${base}/export.kmz`, kmzBlob);
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }, (meta) => {
      if (typeof onProgress === 'function') {
        try { onProgress(meta.percent || 0); } catch { /* intentionally empty: ignore progress errors */ }
      }
    });
  return blob;
}

// Trigger a client-side download of a Blob or string
export function downloadFile(data, filename, mime = 'application/octet-stream') {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 0);
}

// Build and immediately download a full export ZIP
export async function downloadExportZip(opts = {}) {
  const blob = await buildExportZip(opts);
  const name = sanitizeFilename([opts?.job?.jobNumber, opts?.job?.name || 'export'].filter(Boolean).join('-'));
  downloadFile(blob, `${name}-bundle.zip`, 'application/zip');
}
