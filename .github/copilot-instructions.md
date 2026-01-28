# AI Coding Agent Instructions

## Project Overview

This is the **PolePlan Pro** - a React/Vite SPA for NESC-compliant pole attachment calculations with geospatial export capabilities. It's deployed on Netlify and focuses on utility engineering workflows.

## Architecture Patterns

### State Management (Zustand + Persistence)

- **Central store**: `src/utils/store.js` - Zustand store with localStorage persistence
- **Pattern**: All state mutations go through store setters, components use selectors
- **Key state**: `poleHeight`, `importedSpans[]`, `collectedPoles[]`, `existingLines[]`
- **Critical**: Store has corrupt JSON recovery logic - preserve this pattern when modifying

### Code Splitting Strategy

- **Manual chunks in `vite.config.js`**: Organized by functional areas (calculations, permits, geodata)
- **Lazy loading**: `LazyProposedLineCalculator.jsx`, `LazyImportPanel.jsx`, `LazyPermitGenerator.jsx`
- **CDN externals**: Heavy GIS libraries (`@mapbox/shp-write`) loaded via CDN to avoid bundle bloat
- **PDF deferred**: `src/utils/pdfAsync.js` dynamically imports `pdf-lib` only when needed

### Component Architecture

- **Error boundaries**: Every lazy component wrapped in ErrorBoundary with localStorage cleanup
- **Calculation engine**: `src/utils/calculations.js` - pure functions with extensive testing
- **Import/Export**: `src/utils/importers.js` & `src/utils/exporters.js` with format validation

## Development Workflows

### Testing Commands

```bash
npm test                # Run all tests via custom vitest wrapper
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

- **Test pattern**: Co-located `.test.js` files with descriptive names
- **Key tests**: `calculations.reliability.test.js`, `importers.csv-integration.test.js`
- **Test runner**: Custom script at `scripts/test/run-vitest.mjs` with thread control

### Build & Deploy

```bash
npm run verify          # Full CI pipeline locally (lint + test + build + bundle check)
npm run build           # Vite build with chunking
npm run dev:netlify     # Local dev with Netlify Functions
```

- **Node version**: Pinned to 22.20.0 (see `.nvmrc`, `netlify.toml`, CI)
- **Build optimization**: Bundle size monitoring via `scripts/ci/check-bundle-size.mjs`

### Environment Setup

- **Required**: Node 22.20.0 (`nvm use` respects `.nvmrc`)
- **Engines warning**: Upgrade from Node 20 to avoid polyfill differences
- **Local Netlify**: Use `npm run dev:netlify` for Functions testing

## Project-Specific Conventions

### Data Flow Patterns

- **CSV Import**: Header-based mapping with presets for ArcGIS/ikeGPS/Katapult Pro
- **Validation layer**: Optional Zod schemas in "Load + Validate" buttons (non-breaking)
- **Numeric coercion**: Handles messy inputs (thousands separators, units, feet-inches)
- **Geospatial**: Import KML/Shapefile → normalize to internal format → export multiple formats

### File Organization

- **Components**: Lazy-loaded by feature area (`SpansEditor.jsx`, `ExistingLinesEditor.jsx`)
- **Utils**: Functional modules by domain (`calculations.js`, `geodata.js`, `permits.js`)
- **Types**: TypeScript definitions alongside JS files (`.d.ts`)

### Error Handling

- **Graceful degradation**: CDN failures fall back to GeoJSON export
- **Corrupt state recovery**: Store initialization clears invalid localStorage
- **User feedback**: Toast notifications for import/export status

## Integration Points

### Netlify Deployment

- **Config**: `netlify.toml` with Node 22, SPA routing, canonical redirects
- **Functions**: Serverless functions in `netlify/functions/` (esbuild bundling)
- **Skip Next.js**: `NETLIFY_NEXT_PLUGIN_SKIP=true` prevents wrong plugin activation

### External Dependencies

- **GIS runtime**: Shapefile export via `https://unpkg.com/@mapbox/shp-write@latest/shpwrite.js`
- **Service Worker**: Pre-caches CDN scripts for offline capability
- **Icon system**: Lucide React for consistent iconography

### Performance Optimizations

- **Bundle analysis**: Automated size checking in CI
- **Chunk strategy**: Calculation engine, UI components, and vendor libs separated
- **Lazy PDF**: PDF generation deferred until first permit export

## Common Gotchas

- **Store corruption**: Always wrap localStorage access in try/catch
- **Node modules**: Vite config includes polyfills for `buffer`/`stream`/`util`
- **CSV parsing**: Use `papaparse` with header detection, not naive split
- **Coordinate systems**: Geodata utils handle WGS84 ↔ State Plane conversions
- **Format preferences**: User can toggle between "15ft 6in" vs "15' 6"" formatting

## Key Files to Reference

- `src/utils/calculations.js` - Core engineering calculations with NESC compliance
- `src/utils/store.js` - State management patterns and persistence
- `vite.config.js` - Build optimization and chunking strategy
- `src/components/ProposedLineCalculator.jsx` - Main application orchestration
- `netlify.toml` - Deployment configuration and redirects
