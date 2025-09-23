// Geodata builders and exporters for poles and spans
// Exports: buildGeoJSON, exportGeoJSON, exportKML, exportKMZ, exportShapefile (optional)

import JSZip from 'jszip';

/**
 * @typedef {{ type: 'FeatureCollection', features: any[] }} FeatureCollection
 */

/**
 * @param {any} v
 * @returns {number|undefined}
 */
function asNumber(v) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * @param {{ poles?: any[], spans?: any[], job?: any }} [input]
 * @returns {FeatureCollection}
 */
export function buildGeoJSON(input = {}) {
  const { poles = [], spans = [], job = {} } = /** @type {{ poles?: any[], spans?: any[], job?: any }} */ (input);
  /** @type {any[]} */
  const features = [];
  // Poles as points
  for (const p of poles) {
    const lat = asNumber(p.latitude);
    const lon = asNumber(p.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    /** @type {Record<string, any>} */
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
      // New geometry/autofill fields
      incomingBearingDeg: p.incomingBearingDeg ?? '',
      outgoingBearingDeg: p.outgoingBearingDeg ?? '',
      PULL_ft: p.PULL_ft ?? '',
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

  // Spans as LineStrings (only if both endpoints are known)
  const coordIndex = new Map();
  for (const p of poles) {
    const lat = asNumber(p.latitude);
    const lon = asNumber(p.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lon) && p.id) {
      coordIndex.set(String(p.id), [lon, lat]);
    }
  }
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
      // Optional derived fields if present at span-level
      incomingBearingDeg: s.incomingBearingDeg ?? '',
      outgoingBearingDeg: s.outgoingBearingDeg ?? '',
      PULL_ft: s.PULL_ft ?? '',
    };
    features.push({ type: 'Feature', properties: props, geometry: { type: 'LineString', coordinates: [a, b] } });
  }

  return { type: 'FeatureCollection', features };
}

/**
 * @param {string} filename
 * @param {string} text
 * @param {string} [type]
 */
export function downloadText(filename, text, type = 'application/octet-stream') {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('downloadText can only run in a browser environment.');
  }
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

/**
 * @param {FeatureCollection} fc
 * @param {string} [filename]
 */
export function exportGeoJSON(fc, filename = 'geodata.geojson') {
  downloadText(filename, JSON.stringify(fc, null, 2), 'application/geo+json');
}

/**
 * @param {FeatureCollection} fc
 * @param {string} [filename]
 */
export async function exportKML(fc, filename = 'geodata.kml') {
  try {
    const mod = await import('tokml');
    const tokml = mod.default ?? mod;
    const kml = tokml(fc, { documentName: 'Pole Plan Wizard', name: 'id', description: 'jobId' });
    downloadText(filename, kml, 'application/vnd.google-earth.kml+xml');
  } catch (e) {
    console.error('Error exporting KML, falling back to GeoJSON', e);
    exportGeoJSON(fc, filename.replace(/\.kml$/, '.geojson'));
  }
}

/**
 * @param {FeatureCollection} fc
 * @param {string} [filename]
 */
export async function exportKMZ(fc, filename = 'geodata.kmz') {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn('KMZ export is browser-only; falling back to GeoJSON.');
    return exportGeoJSON(fc, filename.replace(/\.kmz$/, '.geojson'));
  }
  try {
    const mod = await import('tokml');
    const tokml = mod.default ?? mod;
    const kml = tokml(fc, { documentName: 'Pole Plan Wizard', name: 'id', description: 'jobId' });
    const zip = new JSZip();
    zip.file('doc.kml', kml);
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Error exporting KMZ, falling back to GeoJSON', e);
    exportGeoJSON(fc, filename.replace(/\.kmz$/, '.geojson'));
  }
}

// Shapefile export as an optional capability
/**
 * @param {FeatureCollection} fc
 * @param {string} [filename]
 * @param {boolean} [autoDownload]
 */
export async function exportShapefile(fc, filename = 'geodata-shapefile.zip', autoDownload = true) {
  const featureCollection = {
    type: 'FeatureCollection',
    features: fc.features || []
  };

  const options = {
    folder: 'poleplanwizard',
    types: { point: 'poles', line: 'spans', polygon: 'areas' }
  };

  try {
    const shpwrite = await loadShpWriteFromCDN();
    if (!shpwrite) throw new Error('shpwrite not available');

    if (autoDownload) {
      shpwrite.download(featureCollection, options);
      return new Blob([JSON.stringify(featureCollection)], { type: 'application/json' });
    }

    const base64 = shpwrite.zip(featureCollection, options);
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: 'application/zip' });
  } catch (e) {
    console.warn('Shapefile export unavailable; falling back to GeoJSON.', e);
    if (autoDownload) exportGeoJSON(fc, filename.replace(/\.zip$/, '.geojson'));
    return new Blob([JSON.stringify(fc)], { type: 'application/json' });
  }
}

async function loadShpWriteFromCDN() {
  if (typeof window === 'undefined') return undefined;
  // @ts-ignore
  if (window.shpwrite) return window.shpwrite;
  const url = 'https://unpkg.com/@mapbox/shp-write@0.4.3/dist/shpwrite.js';
  /** @type {Promise<void>} */
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = url;
    s.async = true;
  s.onload = () => resolve(undefined);
    s.onerror = () => reject(new Error('Failed to load shpwrite from CDN'));
    document.head.appendChild(s);
  });
  // @ts-ignore
  return window.shpwrite;
}
