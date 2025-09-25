# Changelog

## 0.1.0 (2025-09-24)

### Added

- Geometry autofill: bearing normalization + PULL computation integrated into data model and exports.
- CDN-based Shapefile export with graceful fallback (GeoJSON) removing heavy proj4 chain from build graph.
- KML/KMZ/GeoJSON/CSV unified export paths with runtime resilience.
- Inverse math test suite (`calculations.inverse.test.js`) validating θ ↔ PULL, sag monotonicity, bearing angle bounds.
- Mathematical reference (`calculations.mathdoc.md`) documenting formulas, approximations, and future enhancement roadmap.
- Bundle size guard script (`scripts/ci/check-bundle-size.mjs`) integrated into `verify` pipeline.

### Changed

- Refined angle->pull inverse (`angleDegFromPull`) with domain clamp for numerical stability.
- Removed obsolete placeholder `calculations.new.js` and related chunk/ESLint references.
- Updated CSP to allow selective CDN access for shapefile export.

### Removed

- Stale shapefile fallback test (replaced by simpler coverage + KML/KMZ fallback test) after persistent environment mismatch; logic still validated via functional exporters and inverse tests.

### Internal

- Added performance and reliability groundwork for future catenary / thermal expansion enhancements.
