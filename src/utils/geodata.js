// Geodata builders and exporters for poles and spans
// Exports: buildGeoJSON, exportGeoJSON, exportKML, exportKMZ

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
  const kml = buildKMLFromGeoJSON(fc, 'Pole Plan Wizard');
  downloadText(filename, kml, 'application/vnd.google-earth.kml+xml');
}

export async function exportKMZ(fc, filename = 'geodata.kmz') {
  const kml = buildKMLFromGeoJSON(fc, 'Pole Plan Wizard');
  const zip = new JSZip();
  zip.file('doc.kml', kml);
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

// Shapefile export intentionally omitted to keep bundle light and avoid heavy deps.

function escXml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
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
