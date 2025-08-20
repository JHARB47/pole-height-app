# Pole Plan Wizard

[![Netlify Status](https://api.netlify.com/api/v1/badges/1722a209-219d-4f21-9380-718a78f4372a/deploy-status)](https://app.netlify.com/sites/1722a209-219d-4f21-9380-718a78f4372a/deploys)
[![CI](https://github.com/JHARB47/pole-height-app/actions/workflows/ci.yml/badge.svg)](https://github.com/JHARB47/pole-height-app/actions/workflows/ci.yml)

A comprehensive web application for calculating NESC-compliant pole attachment heights for utility engineering workflows.

## Typical user workflow (field ➜ analysis ➜ deliverables)

1. Create a Job and set the submission profile (e.g., FirstEnergy / Mon Power)
2. Add poles and spans manually or import geospatial/CSV (KML/KMZ/Shapefile/CSV)
3. Enter existing power height and proposed attach details; set environment (road/railroad/etc.)
4. Review computed results: proposed attach, midspan, clearances, sag, guying, warnings
5. Resolve any warnings (e.g., clearance deficits or owner rules), adjust inputs if needed
6. Export deliverables:

- Interop: CSV/GeoJSON/KML for GIS/engineering tools
- Permit Pack: WV Highway (MM109) / Railroad (CSX) with summary, fields, and draft PDFs

1. Save state (auto-persisted) or export project data; deploy or share as needed

## 🚀 Features

- NESC Compliance: Automatic validation against National Electrical Safety Code standards
- Advanced Calculations: Sag calculations, clearance validation, and cost estimation
- Geospatial Import: Support for KML/KMZ/Shapefile data import with configurable mapping
- CSV Import (Poles/Spans/Existing Lines): Header-based CSV parser with presets (ArcGIS, ikeGPS, Katapult Pro) and per-job export profile
- Format Preferences: Choose between verbose (15ft 6in) and tick mark (15' 6") formatting
- Comprehensive Help: Built-in help system with detailed documentation and examples
- Professional Reports: Export calculations to CSV with print-optimized layouts
- State Persistence: User preferences and data saved locally between sessions
- Mobile-friendly layout tweaks (responsive inputs/buttons)
- GPS autofill: Use device location to populate pole latitude/longitude
- Permit Pack export: WV Highway (MM109) and Railroad (CSX)

## 🔄 Interop Exports

The Interop Export modal supports:

- CSV (ZIP): poles, spans, existing lines aligned to the selected preset
- GeoJSON (ZIP) and KML (ZIP)
- Shapefile (ZIP): optional dependency; install only if you need export functionality

Shapefile export is lazy-loaded and won’t affect bundle size unless used. To enable it locally:

```bash
npm i -D @mapbox/shp-write
```

If @mapbox/shp-write is not installed, the app will fall back to GeoJSON and display a note in the UI.

Notes:

- Vite may log “Module 'assert' has been externalized for browser compatibility” for @mapbox/shp-write; this is expected and safe.
- PLA presets (PoleForeman/O‑Calc/SpidaCalc) are minimal and currently map to the generic CSV schema.

Shapefile import is also optional. To enable importing .zip/.shp:

```bash
npm i -D shpjs
```

If shpjs is not installed, the import panel will show an availability hint and a copy-to-clipboard install command.

## 📦 Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
# Lint CSS
npm run lint:css

# Full check (lint + tests + build + audit)
npm run check
```

If you see an engines warning locally, switch to Node 22:

```bash
nvm use 22
```

If npm commands appear to hang in VS Code, open a new terminal (so it starts as a login shell) and run:

```bash
# Confirm tools are on PATH
node -v && npm -v

# Install with fewer spinners/audit to reduce stalls
npm ci --no-audit --progress=false

# Run stepwise to spot where it stalls
npm run -s build:stepwise
```

## 🌍 Deployment to Netlify

See `DEPLOYMENT.md` for a detailed, step-by-step checklist.

### Automatic Deployment (Recommended)

1. Connect your GitHub repository to Netlify
2. Netlify will automatically detect the build settings from netlify.toml
3. Deploy will run npm run build and publish the dist folder

### Manual Deployment

```bash
# Build the application
npm run build

# Deploy the dist folder to Netlify
# (Use Netlify CLI or drag-and-drop deployment)
```

### Environment Variables

Copy .env.example to .env for local development:

```bash
cp .env.example .env
```

Available environment variables:

- VITE_APP_NAME - Application name
- VITE_APP_VERSION - Version number
- VITE_DEBUG_MODE - Enable debug features
- VITE_ENABLE_* - Feature flags

## 📋 Configuration

### Netlify Features Enabled

- SPA Routing: All routes redirect to index.html for client-side routing
- Security Headers: X-Frame-Options, CSP, and other security headers
- Static Asset Caching: Optimized caching for /assets/* files
- File Upload Support: CSP configured for geospatial file imports

### Vite Configuration Highlights

- PWA: Service worker and manifest via vite-plugin-pwa (autoUpdate mode)
- Buffer Polyfill: Provided via alias for browser compatibility with geospatial libs
- Code Splitting: Manual chunks for better caching and perf
  - geospatial: ['shpjs', '@tmcw/togeojson', 'jszip']
  - vendor: ['react', 'react-dom', 'zustand']
- Build Optimization: Target ES2015 with CommonJS support
- CSV Parser: Uses papaparse via ESM import
- Development Server: Hot reload with network access enabled

## 🔧 Troubleshooting

### Common Build Issues

**Buffer/Node.js Module Errors**:

- The vite.config.js includes polyfills for browser compatibility
- Geospatial libraries require Node.js modules that are automatically handled

**Large Bundle Warnings**:

- Code splitting is configured to keep chunks under 600KB
- Geospatial features are in a separate chunk for optional loading

**Netlify Deployment Issues**:

- Ensure Node.js version is set to 22 in build settings (matches `netlify.toml` and CI)
- Check that `netlify.toml` is in the repository root
- Verify build command is set to `npm run build`
- If local `npm ci` fails due to lock mismatch, run `npm install` to refresh `package-lock.json`.

### Development Issues

**Dev Server Won't Start**:

- Check if ports 5173-5176 are available
- Use `npm run dev -- --host` to bind to all interfaces

**Tests Failing**:

- Run `npm install` to ensure all dependencies are current
- Check that test files haven't been modified

## 📝 License

This project is proprietary software for utility engineering applications.

## 🤝 Contributing

1. Follow existing code style and patterns
2. Add tests for new features
3. Update documentation for API changes
4. Ensure build passes before submitting

## 📞 Support

For technical support or feature requests, please contact the development team.
