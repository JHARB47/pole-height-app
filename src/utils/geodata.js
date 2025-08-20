// @ts-nocheck
// Geodata builders and exporters for poles and spans
// Exports: buildGeoJSON, exportGeoJSON, exportKML, exportKMZ, exportShapefile (optional)

// Cached probe for optional Shapefile support
let _shpSupport;
export async function hasShapefileSupport() {
  if (_shpSupport != null) return _shpSupport;
  try {
    const mod = '@mapbox/' + 'shp-write';
    const dynamicImport = (m) => (new Function('m', 'return import(/* @vite-ignore */ m)'))(m);
    const m = await dynamicImport(mod).catch(() => null);
    _shpSupport = !!(m && (m.default || m.write));
    return _shpSupport;
  } catch {
    _shpSupport = false;
    return false;
  }
}

function asNumber(v) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function buildPoleFeatures(poles, job = {}) {
  const features = [];
  for (const p of poles) {
    const lat = asNumber(p.latitude);
    const lon = asNumber(p.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;
    
    const props = {
      id: p.id || '',
      jobId: p.jobId || job.id || '',
      status: p.status || 'draft',
      height: p.height ?? '',
      poleClass: p.poleClass ?? '',
      powerHeight: p.powerHeight ?? '',
      voltage: p.voltage ?? '',
      hasTransformer: !!p.hasTransformer,
      spanDistance: p.spanDistance ?? '',
      adjacentPoleHeight: p.adjacentPoleHeight ?? '',
      attachmentType: p.attachmentType || 'communication',
      timestamp: p.timestamp || '',
      commCompany: job.commCompany || '',
    };
    
    if (p.asBuilt?.attachHeight != null) props.asBuiltAttach = p.asBuilt.attachHeight;
    if (p.asBuilt?.powerHeight != null) props.asBuiltPower = p.asBuilt.powerHeight;
    if (p._varianceIn != null) props.varianceIn = p._varianceIn;
    if (p._variancePass != null) props.variancePass = p._variancePass;
    
    features.push({
      type: 'Feature',
      properties: props,
      geometry: { type: 'Point', coordinates: [lon, lat] }
    });
  }
  return features;
}

function buildCoordinateIndex(poles) {
  const coordIndex = new Map();
  for (const p of poles) {
    const lat = asNumber(p.latitude);
    const lon = asNumber(p.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lon) && p.id) {
      coordIndex.set(String(p.id), [lon, lat]);
    }
  }
  return coordIndex;
}

function buildSpanFeatures(spans, coordIndex, job = {}) {
  const features = [];
  for (const s of spans) {
    const a = s.fromId != null ? coordIndex.get(String(s.fromId)) : undefined;
    const b = s.toId != null ? coordIndex.get(String(s.toId)) : undefined;
    if (!a || !b) continue;
    
    const props = {
      id: s.id || '',
      jobId: job.id || '',
      lengthFt: s.length ?? '',
      proposedAttach: s.proposedAttach ?? '',
      environment: s.environment || '',
    };
    
    features.push({ 
      type: 'Feature', 
      properties: props, 
      geometry: { type: 'LineString', coordinates: [a, b] } 
    });
  }
  return features;
}

export function buildGeoJSON({ poles = [], spans = [], job = {} } = {}) {
  const poleFeatures = buildPoleFeatures(poles, job);
  const coordIndex = buildCoordinateIndex(poles);
  const spanFeatures = buildSpanFeatures(spans, coordIndex, job);
  
  return { 
    type: 'FeatureCollection', 
    features: [...poleFeatures, ...spanFeatures] 
  };
}

export function downloadText(filename, text, type = 'application/octet-stream') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

export function exportGeoJSON(fc, filename = 'geodata.geojson') {
  downloadText(filename, JSON.stringify(fc, null, 2), 'application/geo+json');
}

export async function exportKML(fc, filename = 'geodata.kml') {
  if (!fc?.features?.length) return; // nothing to export
  const kml = buildKMLFromGeoJSON(fc, 'Pole Plan Wizard');
  downloadText(filename, kml, 'application/vnd.google-earth.kml+xml');
}

export async function exportKMZ(fc, filename = 'geodata.kmz') {
  if (!fc?.features?.length) return; // nothing to export
  const kml = buildKMLFromGeoJSON(fc, 'Pole Plan Wizard');
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  zip.file('doc.kml', kml);
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

// Optional Shapefile export (ZIP) via dynamic import of '@mapbox/shp-write'.
// If the library is not installed, we show a helpful message and fall back to GeoJSON.
export async function exportShapefile(fc, filename = 'geodata-shapefile.zip') {
  try {
    // Lazy-load to avoid increasing bundle size unless needed
  // Use a dynamic module string and an eval'd importer to prevent static analysis by Rollup/Vite
  const mod = '@mapbox/' + 'shp-write';
  const dynamicImport = (m) => (new Function('m', 'return import(/* @vite-ignore */ m)'))(m);
  const shpwrite = await dynamicImport(mod).catch(() => null);
  // '@mapbox/shp-write' expects a FeatureCollection and returns a Blob via callback
    const options = { folder: 'shapefile', types: { point: 'poles', line: 'spans' } };
  const zipBlob = await new Promise((resolve, reject) => {
      try {
    const fn = (shpwrite && (shpwrite.default || shpwrite.write)) || null;
    if (!fn) throw new Error('shp-write export function not found');
    fn(fc, options, (err, blob) => {
      if (err) reject(err instanceof Error ? err : new Error(String(err)));
      else resolve(blob);
        });
    } catch (e) { reject(e instanceof Error ? e : new Error(String(e))); }
    });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  } catch (e) {
    // Library not present or runtime error — provide guidance and offer a GeoJSON fallback
  const msg = 'Shapefile export requires optional dependency "@mapbox/shp-write". Install it to enable (npm i -D @mapbox/shp-write). Exporting GeoJSON instead.';
  try { console.warn(msg, e); } catch { /* ignore console error */ }
  try { exportGeoJSON(fc, filename.replace(/\.zip$/i, '.geojson')); } catch { /* ignore */ }
  try { alert(msg); } catch { /* ignore in non-DOM env */ }
  }
}

function escXml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');
}

function buildKMLFromGeoJSON(fc, documentName = 'Export') {
  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push('<kml xmlns="http://www.opengis.net/kml/2.2"><Document>');
  parts.push(`<name>${escXml(documentName)}</name>`);
  for (const f of fc.features || []) {
    const g = f.geometry || {};
    parts.push('<Placemark>');
    const name = f.properties?.id ?? f.properties?.name ?? '';
    if (name) parts.push(`<name>${escXml(name)}</name>`);
    parts.push('<ExtendedData>');
    const props = f.properties || {};
    for (const [k, v] of Object.entries(props)) {
      if (v == null) continue;
      parts.push(`<Data name="${escXml(k)}"><value>${escXml(v)}</value></Data>`);
    }
    parts.push('</ExtendedData>');
    if (g.type === 'Point' && Array.isArray(g.coordinates)) {
      const [lon, lat] = g.coordinates;
      parts.push(`<Point><coordinates>${lon},${lat},0</coordinates></Point>`);
    } else if (g.type === 'LineString' && Array.isArray(g.coordinates)) {
      const coordString = g.coordinates.map(([lon, lat]) => `${lon},${lat},0`).join(' ');
      parts.push(`<LineString><coordinates>${coordString}</coordinates></LineString>`);
    }
    parts.push('</Placemark>');
  }
  parts.push('</Document></kml>');
  return parts.join('');
}
