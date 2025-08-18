// Geospatial import utilities: KML, KMZ, and Shapefile -> GeoJSON
import Papa from 'papaparse';
// Heavy libraries are lazy-loaded with dynamic imports to keep initial bundle small.

// Common attribute mapping presets by provider/source (customize as needed)
export const MAPPING_PRESETS = [
  {
    label: 'Generic (id,height,class,length,attach)',
    value: 'generic',
    mapping: {
  pole: { id: 'id', height: 'height', class: 'class', powerHeight: 'power_ht', hasTransformer: 'xfmr', latitude: '', longitude: '' },
      span: { id: 'id', fromId: 'from_id', toId: 'to_id', length: 'length', proposedAttach: 'attach' },
      line: { type: 'type', height: 'height', company: 'company', makeReady: 'mr', makeReadyHeight: 'mr_height' },
    }
  },
  {
    label: 'FirstEnergy sample',
    value: 'firstEnergy',
    mapping: {
  pole: { id: 'POLE_ID', height: 'HGT_FT', class: 'CLASS', powerHeight: 'PWR_HT', hasTransformer: 'XFMR', latitude: '', longitude: '' },
      span: { id: 'SPAN_ID', fromId: 'FROM_ID', toId: 'TO_ID', length: 'SPAN_FT', proposedAttach: 'ATTACH_FT' },
      line: { type: 'TYPE', height: 'HGT_FT', company: 'COMPANY', makeReady: 'MR', makeReadyHeight: 'MR_HGT' },
    }
  },
  // Example presets for common external tools. Field names vary by org/project;
  // use Configure Mapping to tweak if your export uses different headers.
  {
    label: 'ArcGIS Hosted Feature Layer (example)',
    value: 'arcgis',
    mapping: {
      // Points layer attributes (commonly exported alongside geometry)
  pole: { id: 'POLE_ID', height: 'HEIGHT_FT', class: 'CLASS', powerHeight: 'PWR_HT', hasTransformer: 'XFMR', latitude: 'LATITUDE', longitude: 'LONGITUDE' },
      // Lines layer attributes (if a spans layer is present); length may be estimated from geometry if absent
      span: { id: 'SPAN_ID', fromId: 'FROM_ID', toId: 'TO_ID', length: 'SPAN_FT', proposedAttach: 'ATTACH_FT' },
      // Existing line attachments captured as attributes on either layer
      line: { type: 'LINE_TYPE', height: 'LINE_HT', company: 'OWNER', makeReady: 'MAKE_READY', makeReadyHeight: 'NEW_HT' },
    }
  },
  {
    label: 'ikeGPS (example)',
    value: 'ikegps',
    mapping: {
      // These reflect commonly used headers; adjust to your export as needed
  pole: { id: 'POLE_ID', height: 'POLE_HEIGHT_FT', class: 'POLE_CLASS', powerHeight: 'PRIMARY_HT_FT', hasTransformer: 'TRANSFORMER', latitude: 'LAT', longitude: 'LON' },
      span: { id: 'SPAN_ID', fromId: 'FROM_ID', toId: 'TO_ID', length: 'SPAN_FT', proposedAttach: 'ATTACH_FT' },
      line: { type: 'LINE_TYPE', height: 'LINE_HT', company: 'COMPANY', makeReady: 'MAKE_READY', makeReadyHeight: 'NEW_HT' },
    }
  },
  {
    label: 'Katapult Pro Maps (example)',
    value: 'katapultPro',
    mapping: {
      // CSV/KMZ exports typically include a name/id and optional metadata columns
  pole: { id: 'ID', height: 'HEIGHT_FT', class: 'CLASS', powerHeight: 'PRIMARY_HT', hasTransformer: 'XFMR', latitude: 'LAT', longitude: 'LON' },
      span: { id: 'SPAN_ID', fromId: 'FROM_ID', toId: 'TO_ID', length: 'SPAN_FT', proposedAttach: 'ATTACH_FT' },
      line: { type: 'TYPE', height: 'HGT_FT', company: 'OWNER', makeReady: 'MAKE_READY', makeReadyHeight: 'NEW_HT' },
    }
  },
  {
    label: 'PSE sample',
    value: 'pse',
    mapping: {
  pole: { id: 'POLE', height: 'HEIGHT', class: 'CLASS', powerHeight: 'PRIMARY_HT', hasTransformer: 'TRANSFORMER', latitude: '', longitude: '' },
      span: { id: 'SPAN', fromId: 'FROM_POLE', toId: 'TO_POLE', length: 'LENGTH_FT', proposedAttach: 'PROPOSED_FT' },
      line: { type: 'LINE_TYPE', height: 'LINE_HT', company: 'OWNER', makeReady: 'MAKE_READY', makeReadyHeight: 'NEW_HT' },
    }
  },
];

export async function importGeospatialFile(file) {
  const name = (file?.name || '').toLowerCase();
  if (name.endsWith('.kml')) return parseKML(await file.text());
  if (name.endsWith('.kmz')) return parseKMZ(file);
  if (name.endsWith('.zip') || name.endsWith('.shp') || name.endsWith('.dbf')) return parseShapefile(file);
  throw new Error('Unsupported file format. Please provide KML, KMZ, or Shapefile (.zip).');
}

export async function parseKML(text) {
  const { kml: kmlToGeoJSON } = await import('@tmcw/togeojson');
  const dom = new DOMParser().parseFromString(text, 'text/xml');
  const fc = kmlToGeoJSON(dom);
  return normalizeGeoJSON(fc);
}

export async function parseKMZ(file) {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(file);
  // Find first .kml in the zip
  const kmlEntry = Object.values(zip.files).find(f => f.name.toLowerCase().endsWith('.kml'));
  if (!kmlEntry) throw new Error('KMZ missing KML file');
  const kmlText = await kmlEntry.async('text');
  return parseKML(kmlText);
}

export async function parseShapefile(file) {
  // shpjs can handle a zip, ArrayBuffer, or URL; use file arrayBuffer
  const ab = await file.arrayBuffer();
  const shp = (await import('shpjs')).default;
  const geojson = await shp(ab);
  return normalizeGeoJSON(geojson);
}

function normalizeGeoJSON(geo) {
  if (!geo) return { type: 'FeatureCollection', features: [] };
  if (geo.type === 'FeatureCollection') return geo;
  if (geo.type === 'Feature') return { type: 'FeatureCollection', features: [geo] };
  if (Array.isArray(geo)) {
    // shpjs may return array of FCs -> merge
    const features = geo.flatMap(g => (g?.features || []));
    return { type: 'FeatureCollection', features };
  }
  return { type: 'FeatureCollection', features: [] };
}

export function splitFeaturesByGeometry(fc) {
  const poles = [];
  const lines = [];
  const others = [];
  for (const f of fc.features || []) {
    const g = f.geometry?.type;
    if (g === 'Point') poles.push(f);
    else if (g === 'LineString' || g === 'MultiLineString') lines.push(f);
    else others.push(f);
  }
  return { poles, lines, others };
}

export function getAttributeKeys(feature) {
  return feature && feature.properties ? Object.keys(feature.properties) : [];
}

// Map GeoJSON features to app data using a mapping config
// config example:
// {
//   pole: { id: 'POLE_ID', height: 'HGT_FT', class: 'CLASS', powerHeight: 'PWR_HT', hasTransformer: 'XFORMER' },
//   span: { id: 'SPAN_ID', fromId: 'FROM_POLE', toId: 'TO_POLE', length: 'LENGTH_FT', proposedAttach: 'ATTACH_FT' },
//   line: { type: 'TYPE', height: 'HGT_FT', company: 'COMP', makeReady: 'MR', makeReadyHeight: 'MR_HGT' }
// }
export function mapGeoJSONToAppData(fc, config) {
  const { poles, lines } = splitFeaturesByGeometry(fc);
  const result = { poleTable: [], spanTable: [], existingLines: [] };

  // Poles (points)
  for (const f of poles) {
    const p = f.properties || {};
    const c = config?.pole || {};
    result.poleTable.push({
      id: getProp(p, c.id),
      latitude: f.geometry?.coordinates?.[1] ?? null,
      longitude: f.geometry?.coordinates?.[0] ?? null,
      height: getNumber(p, c.height),
      class: getProp(p, c.class),
      powerHeight: getNumber(p, c.powerHeight),
      hasTransformer: truthy(p, c.hasTransformer),
    });
  }

  // Lines (aerial spans)
  for (const f of lines) {
    const p = f.properties || {};
    const c = config?.span || {};
    result.spanTable.push({
      id: getProp(p, c.id),
      fromId: getProp(p, c.fromId),
      toId: getProp(p, c.toId),
      length: getNumber(p, c.length) ?? estimateLengthFromGeometry(f),
      proposedAttach: getNumber(p, c.proposedAttach),
    });
  }

  // Existing comm/power lines as side table (optional), using point or line attrs
  for (const f of [...poles, ...lines]) {
    const p = f.properties || {};
    const c = config?.line || {};
    const type = getProp(p, c.type);
    const height = getNumber(p, c.height);
    if (!type && height == null) continue;
    result.existingLines.push({
      type: type || 'communication',
      height: height != null ? `${height}` : '',
      companyName: getProp(p, c.company) || '',
      makeReady: truthy(p, c.makeReady),
      makeReadyHeight: numberOrEmpty(p, c.makeReadyHeight),
    });
  }

  return result;
}

function getProp(obj, key) { if (!key) return undefined; return obj?.[key]; }
function getNumber(obj, key) {
  if (!key) return undefined;
  const v = obj?.[key];
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function numberOrEmpty(obj, key) {
  const n = getNumber(obj, key);
  return Number.isFinite(n) ? `${n}` : '';
}
function truthy(obj, key) {
  if (!key) return false;
  const v = obj?.[key];
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return /^(y|yes|true|1)$/i.test(v.trim());
  return false;
}
function estimateLengthFromGeometry(f) {
  // Haversine sum over segments; coordinates are [lon, lat]
  try {
    const geom = f.geometry;
    if (!geom) return undefined;
    const segments = [];
    if (geom.type === 'LineString') {
      segments.push(geom.coordinates);
    } else if (geom.type === 'MultiLineString') {
      for (const arr of geom.coordinates || []) segments.push(arr);
    } else {
      return undefined;
    }
    const toRad = (d) => (d * Math.PI) / 180;
    const Rm = 6371000; // Earth radius meters
    const havSeg = (lon1, lat1, lon2, lat2) => {
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Rm * c; // meters
    };
    let meters = 0;
    for (const coords of segments) {
      for (let i = 1; i < coords.length; i++) {
        const [lon1, lat1] = coords[i - 1];
        const [lon2, lat2] = coords[i];
        meters += havSeg(lon1, lat1, lon2, lat2);
      }
    }
    return meters * 3.28084; // ft
  } catch {
    return undefined;
  }
}

// Simple CSV parser for existing lines: expects headers including fields matching mapping.line
export function parseExistingLinesCSV(csvText, lineMapping) {
  const parsed = Papa.parse(csvText || '', { header: true, skipEmptyLines: 'greedy', dynamicTyping: false });
  const rows = Array.isArray(parsed.data) ? parsed.data : [];
  return rows.map((row) => {
    const get = (key, fallback) => {
      const k = key || fallback;
      const v = k ? row[k] : '';
      return typeof v === 'string' ? v.trim() : v;
    };
    const heightRaw = get(lineMapping?.height, 'height');
    const heightNum = Number(heightRaw);
    return {
      type: get(lineMapping?.type, 'type') || 'communication',
      height: Number.isFinite(heightNum) ? String(heightNum) : String(heightRaw || ''),
      companyName: get(lineMapping?.company, 'company') || '',
      makeReady: /^(y|yes|true|1)$/i.test(String(get(lineMapping?.makeReady, 'makeReady') || '')),
      makeReadyHeight: String(get(lineMapping?.makeReadyHeight, 'makeReadyHeight') || ''),
    };
  });
}

// CSV parser for Poles table
export function parsePolesCSV(csvText, poleMapping) {
  const parsed = Papa.parse(csvText || '', { header: true, skipEmptyLines: 'greedy', dynamicTyping: false });
  const rows = Array.isArray(parsed.data) ? parsed.data : [];
  return rows.map((row) => {
    const get = (key, fallback) => {
      const k = key || fallback;
      const v = k ? row[k] : '';
      return typeof v === 'string' ? v.trim() : v;
    };
    const num = (key, fallback) => {
      const raw = get(key, fallback);
      if (raw === '' || raw == null) return undefined;
      const n = Number(raw);
      return Number.isFinite(n) ? n : undefined;
    };
    return {
      id: String(get(poleMapping?.id, 'id') || ''),
      latitude: num(poleMapping?.latitude, 'latitude') ?? null,
      longitude: num(poleMapping?.longitude, 'longitude') ?? null,
      height: num(poleMapping?.height, 'height'),
      class: get(poleMapping?.class, 'class') || undefined,
      powerHeight: num(poleMapping?.powerHeight, 'power_ht'),
      hasTransformer: /^(y|yes|true|1)$/i.test(String(get(poleMapping?.hasTransformer, 'xfmr') || '')),
    };
  });
}

// CSV parser for Spans table
export function parseSpansCSV(csvText, spanMapping) {
  const parsed = Papa.parse(csvText || '', { header: true, skipEmptyLines: 'greedy', dynamicTyping: false });
  const rows = Array.isArray(parsed.data) ? parsed.data : [];
  return rows.map((row) => {
    const get = (key, fallback) => {
      const k = key || fallback;
      const v = k ? row[k] : '';
      return typeof v === 'string' ? v.trim() : v;
    };
    const num = (key, fallback) => {
      const raw = get(key, fallback);
      if (raw === '' || raw == null) return undefined;
      const n = Number(raw);
      return Number.isFinite(n) ? n : undefined;
    };
    return {
      id: String(get(spanMapping?.id, 'id') || ''),
      fromId: String(get(spanMapping?.fromId, 'from_id') || ''),
      toId: String(get(spanMapping?.toId, 'to_id') || ''),
      length: num(spanMapping?.length, 'length'),
      proposedAttach: num(spanMapping?.proposedAttach, 'attach'),
    };
  });
}

// (No helper needed; ESM import above)
