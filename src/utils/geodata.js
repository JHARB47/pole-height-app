// Geodata builders and exporters for poles and spans
// Exports: buildGeoJSON, exportGeoJSON, exportKML, exportKMZ, exportShapefile (optional)

import JSZip from 'jszip';

function asNumber(v) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function buildGeoJSON({ poles = [], spans = [], job = {} } = {}) {
  const features = [];
  // Poles as points
  for (const p of poles) {
    const lat = asNumber(p.latitude);
    const lon = asNumber(p.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
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
    };
    features.push({ type: 'Feature', properties: props, geometry: { type: 'LineString', coordinates: [a, b] } });
  }

  return { type: 'FeatureCollection', features };
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
  try {
    const { default: tokml } = await import('tokml');
    const kml = tokml(fc, { documentName: 'Pole Plan Wizard', name: 'id', description: 'jobId' });
    downloadText(filename, kml, 'application/vnd.google-earth.kml+xml');
  } catch (e) {
    console.error('Error exporting KML, falling back to GeoJSON', e);
    exportGeoJSON(fc, filename.replace(/\.kml$/, '.geojson'));
  }
}

export async function exportKMZ(fc, filename = 'geodata.kmz') {
  try {
    const { default: tokml } = await import('tokml');
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
export async function exportShapefile(fc, filename = 'geodata-shapefile.zip') {
  try {
    const { default: shapefile } = await import('@mapbox/shp-write');
    
    // Convert to shapefile format
    const options = {
      folder: 'poleplanwizard',
      types: {
        point: 'poles',
        line: 'spans',
        polygon: 'areas'
      }
    };
    
    const zipBlob = await new Promise((resolve, reject) => {
      shapefile.zipSync(fc, options, (err, content) => {
        if (err) return reject(err);
        // Content is a base64 string, convert to Blob
        const binary = atob(content);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        resolve(new Blob([bytes], { type: 'application/zip' }));
      });
    });
    
    // Download the resulting blob
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.warn('Shapefile export requires optional dependency "@mapbox/shp-write". Falling back to GeoJSON.', e);
    exportGeoJSON(fc, filename.replace(/\.zip$/, '.geojson'));
  }
}
