// Export utilities for interoperability with external tools
// Provides CSV, GeoJSON, and KML exports for poles, spans, and existing lines.

export const EXPORT_PRESETS = [
  { label: 'Generic (CSV/GeoJSON/KML)', value: 'generic' },
  { label: 'ArcGIS (example)', value: 'arcgis' },
  { label: 'ikeGPS (example)', value: 'ikegps' },
  { label: 'Katapult Pro (example)', value: 'katapultPro' },
  { label: 'FirstEnergy Joint-Use (example)', value: 'firstEnergy' },
  { label: 'PoleForeman (beta)', value: 'poleForeman' },
  { label: 'O-Calc (beta)', value: 'oCalc' },
  { label: 'SpidaCalc (beta)', value: 'spidaCalc' },
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
    // PLA-focused schemas (beta): keep minimal, non-proprietary headers
    poleForeman: ['POLE_ID', 'POLE_HT_FT', 'CLASS', 'PRIMARY_HT_FT', 'Longitude', 'Latitude'],
    oCalc: ['POLE_ID', 'HEIGHT_FT', 'CLASS', 'PRIMARY_HT_FT', 'Longitude', 'Latitude'],
    spidaCalc: ['POLE_ID', 'HEIGHT_FT', 'CLASS', 'PRIMARY_HT_FT', 'Longitude', 'Latitude'],
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
      POLE_ID: id, HGT_FT: h, HEIGHT_FT: h, POLE_HEIGHT_FT: h, POLE_HT_FT: h,
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
  poleForeman: ['TYPE', 'HGT_FT', 'OWNER', 'MAKE_READY', 'NEW_HT'],
  oCalc: ['TYPE', 'HGT_FT', 'OWNER', 'MAKE_READY', 'NEW_HT'],
  spidaCalc: ['TYPE', 'HGT_FT', 'OWNER', 'MAKE_READY', 'NEW_HT'],
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
  const features = [];
  for (const p of poles) {
    if (p.latitude == null || p.longitude == null) continue;
    const lat = Number(p.latitude);
    const lon = Number(p.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: {
        POLE_ID: p.id || '',
        HEIGHT_FT: p.height != null ? Math.round(p.height) : '',
        CLASS: p.class || '',
        PWR_HT: p.powerHeight != null ? Math.round(p.powerHeight) : '',
        XFMR: p.hasTransformer ? 'Y' : 'N',
      },
    });
  }
  for (const s of spans) {
    if (s.coordinates && Array.isArray(s.coordinates)) {
      const coords = s.coordinates.filter((xy) => {
        const [x, y] = xy || [];
        return Number.isFinite(x) && Number.isFinite(y) && y >= -90 && y <= 90 && x >= -180 && x <= 180;
      });
      if (!coords.length) continue;
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
        properties: {
          SPAN_ID: s.id || '', FROM_ID: s.fromId || '', TO_ID: s.toId || '',
          SPAN_FT: s.length != null ? Math.round(s.length) : '',
          ATTACH_FT: s.proposedAttach != null ? Math.round(s.proposedAttach) : '',
        },
      });
    }
  }
  return { type: 'FeatureCollection', features };
}

export function buildKML({ poles = [], spans = [] }) {
  const esc = (s) => String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push('<kml xmlns="http://www.opengis.net/kml/2.2"><Document>');
  parts.push('<name>Pole Plan Wizard Export</name>');
  for (const p of poles) {
    if (p.latitude == null || p.longitude == null) continue;
    const lat = Number(p.latitude);
    const lon = Number(p.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;
    parts.push('<Placemark>');
    parts.push(`<name>${esc(p.id || 'Pole')}</name>`);
    parts.push('<ExtendedData>');
    const kv = {
      HEIGHT_FT: p.height != null ? Math.round(p.height) : '',
      CLASS: p.class || '',
      PWR_HT: p.powerHeight != null ? Math.round(p.powerHeight) : '',
      XFMR: p.hasTransformer ? 'Y' : 'N',
    };
    for (const [k, v] of Object.entries(kv)) parts.push(`<Data name="${esc(k)}"><value>${esc(v)}</value></Data>`);
    parts.push('</ExtendedData>');
    parts.push(`<Point><coordinates>${lon},${lat},0</coordinates></Point>`);
    parts.push('</Placemark>');
  }
  for (const s of spans) {
    if (!s.coordinates || !Array.isArray(s.coordinates)) continue;
    const coords = s.coordinates.filter((xy) => {
      const [x, y] = xy || [];
      return Number.isFinite(x) && Number.isFinite(y) && y >= -90 && y <= 90 && x >= -180 && x <= 180;
    });
    if (!coords.length) continue;
    parts.push('<Placemark>');
    parts.push(`<name>${esc(s.id || 'Span')}</name>`);
    parts.push('<ExtendedData>');
    const kv = {
      FROM_ID: s.fromId || '',
      TO_ID: s.toId || '',
      SPAN_FT: s.length != null ? Math.round(s.length) : '',
      ATTACH_FT: s.proposedAttach != null ? Math.round(s.proposedAttach) : '',
    };
    for (const [k, v] of Object.entries(kv)) parts.push(`<Data name="${esc(k)}"><value>${esc(v)}</value></Data>`);
    const coordString = coords.map(([x, y]) => `${x},${y},0`).join(' ');
    parts.push('</ExtendedData>');
    parts.push(`<LineString><coordinates>${coordString}</coordinates></LineString>`);
    parts.push('</Placemark>');
  }
  parts.push('</Document></kml>');
  return parts.join('');
}

// Optional FE example export
/**
 * @param {{ cachedMidspans?: Array<any>, job?: { name?: string } }} params
 */
export function buildFirstEnergyJointUseCSV({ cachedMidspans = [], job = {} }) {
  // Example headers; adjust as needed for actual submission portals
  const headers = ['JOB_NAME', 'SPAN_ID', 'FROM_ID', 'TO_ID', 'ENV', 'SPAN_FT', 'ATTACH_FT', 'TARGET_FT', 'MIDSPAN_FT', 'PASS', 'DEFICIT_FT'];
  const rows = [headers.join(',')];
  for (const m of (cachedMidspans || [])) {
    const jobName = job?.name || '';
    let passStr = '';
    if (m.pass === true) passStr = 'PASS';
    else if (m.pass === false) passStr = 'FAIL';
    const line = [
      jobName, m.spanId || '', m.fromId || '', m.toId || '',
      m.environment || '', m.spanFt ?? '', m.attachFt ?? '', m.targetFt ?? '', m.midspanFt ?? '',
      passStr, m.deficitFt ?? ''
    ];
    rows.push(line.map(csvEscape).join(','));
  }
  return rows.join('\n');
}
