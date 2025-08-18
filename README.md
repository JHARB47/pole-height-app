# Pole Plan Wizard

[![Netlify Status](https://api.netlify.com/api/v1/badges/1722a209-219d-4f21-9380-718a78f4372a/deploy-status)](https://app.netlify.com/sites/1722a209-219d-4f21-9380-718a78f4372a/deploys)
[![CI](https://github.com/JHARB47/pole-height-app/actions/workflows/ci.yml/badge.svg)](https://github.com/JHARB47/pole-height-app/actions/workflows/ci.yml)

A comprehensive web application for calculating NESC-compliant pole attachment heights for utility engineering workflows.

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
- Shapefile (ZIP): optional dependency

Shapefile export is lazy-loaded and won’t affect bundle size unless used. To enable it locally:

```bash
npm i -D @mapbox/shp-write
```

If @mapbox/shp-write is not installed, the app will fall back to GeoJSON and display a note in the UI.

Notes:

- Vite may log “Module 'assert' has been externalized for browser compatibility” for @mapbox/shp-write; this is expected and safe.
- PLA presets (PoleForeman/O‑Calc/SpidaCalc) are minimal and currently map to the generic CSV schema.

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
```

If you see an engines warning locally, switch to Node 22:

```bash
nvm use 22
```

## 🌍 Deployment to Netlify

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

- Buffer Polyfill: Included for browser compatibility with geospatial libraries
- Code Splitting: Automatic chunking for optimal loading performance
- Build Optimization: Target ES2015 with CommonJS support
- CSV Parser: Uses papaparse via ESM import
- Development Server: Hot reload with network access enabled

 
```bash
npm i -D @mapbox/shp-write
```

If @mapbox/shp-write is not installed, the app will fall back to GeoJSON and display a note in the UI.

Notes:

- Vite may log “Module 'assert' has been externalized for browser compatibility” for @mapbox/shp-write; this is expected and safe.
- PLA presets (PoleForeman/O‑Calc/SpidaCalc) are minimal and currently map to the generic CSV schema.

 

- **KML/KMZ**: Google Earth files with configurable attribute mapping
- **Shapefiles**: Industry-standard GIS format (.shp, .dbf, .shx)
- **CSV**: Poles, Spans, and Existing Lines CSV. Mapping presets for ArcGIS/ikeGPS/Katapult Pro; save custom profiles per job.

## �️ Interop Exports

The Interop Export modal supports:

- CSV (ZIP): poles, spans, existing lines aligned to the selected preset
- GeoJSON (ZIP) and KML (ZIP)
- Shapefile (ZIP): optional dependency

Shapefile export is lazy-loaded and won’t affect bundle size unless used. To enable it locally:

```bash
npm i -D @mapbox/shp-write
```

If the package is not installed, the app will fall back to GeoJSON and display a note in the UI.


## �🔧 Troubleshooting

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
