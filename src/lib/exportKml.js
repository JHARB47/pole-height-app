// src/lib/exportKml.js
export async function exportKml(geojson) {
  try {
    const { default: tokml } = await import("tokml"); // or a maintained fork later
    const kml = tokml(geojson, { documentName: "PolePlan Pro Export" });
    return kml;
  } catch {
    // graceful fallback caller already handles -> GeoJSON
    return null;
  }
}
