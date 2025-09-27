# Pole Plan Wizard

[![Live Site](https://img.shields.io/website?url=https%3A%2F%2Fmrejointuse.netlify.app&label=live%20site&up_message=online&down_message=offline)](https://mrejointuse.netlify.app)
[![CI](https://github.com/JHARB47/pole-height-app/actions/workflows/ci.yml/badge.svg)](https://github.com/JHARB47/pole-height-app/actions/workflows/ci.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/1722a209-219d-4f21-9380-718a78f4372a/deploy-status)](https://app.netlify.com/projects/poleplanpro/deploys)

Live URL: <https://mrejointuse.netlify.app>

A comprehensive web application for calculating NESC-compliant pole attachment heights and span-level pull (tension surrogate) using bearing-derived geometry, optimized for lightweight builds and resilient geospatial export.

## 🚀 Features

- **NESC Compliance**: Automatic validation against National Electrical Safety Code standards
- **Advanced Calculations**: Sag calculations, clearance validation, and cost estimation
- **Geospatial Import/Export**: Support for KML/KMZ/Shapefile (import), and export of CSV, GeoJSON, KML, KMZ, Shapefile (runtime CDN) with configurable mapping
- **CSV Import (Poles/Spans/Existing Lines)**: Robust, header-based CSV parser with mapping presets (ArcGIS, ikeGPS, Katapult Pro) and per-job export profile
  - Now includes optional inline data validation ("Load + Validate") buttons that surface field-level issues before data is committed.
  - Numeric coercion for messy inputs: handles thousands separators, locale decimal commas, units (ft/m), degree symbols, and feet–inches (e.g., `12'6"`).
- **Format Preferences**: Choose between verbose (15ft 6in) and tick mark (15' 6") formatting
- **Comprehensive Help**: Built-in help system with detailed documentation and examples
- **Professional Reports**: Export calculations to CSV with print-optimized layouts; permit pack PDFs
  - PDF generation now behind a dynamic loader boundary to defer `pdf-lib` download until first use.
  - Hover prefetch: mouses over the Permit Pack button preloads the `pdf-lib` chunk to minimize click latency.
- **Autofill PULL_ft**: Bearing-based automatic pull computation between poles
- **State Persistence**: User preferences and data saved locally between sessions
- **Mobile Friendly**: Responsive inputs/buttons
- **GPS Autofill**: Use device location to populate pole latitude/longitude
- **Permit Pack Export**: WV Highway (MM109) and Railroad (CSX)
- **Spans Editor**: Interactive span and attachment management

## 🛠 Technology Stack

- **Frontend**: React 18 + Vite 5
- **Styling**: TailwindCSS with responsive design and print optimization
- **State Management**: Zustand with localStorage persistence
- **Testing**: Vitest with comprehensive test coverage
- **Geospatial**: shpjs, @tmcw/togeojson for file import; CDN-loaded @mapbox/shp-write only at export time
- **Icons**: Lucide React icon library

## 🏗 Build Configuration

### For Netlify Deployment

The application is optimized for Netlify deployment with the following configuration:

#### Build Settings

- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 22.12.0 (pinned via `.nvmrc`, `netlify.toml`, and CI). Use `nvm use` or asdf to ensure consistency locally.
  - If you previously used Node 20, upgrade before contributing to avoid subtle polyfill differences.
  - CI now reads the version from `.nvmrc` to enforce a single source of truth.

#### Key Files

- `netlify.toml` - Netlify deployment configuration
- `vite.config.js` - Optimized Vite build with code splitting
- `package.json` - Dependencies and build scripts

### Code Splitting & Runtime GIS Strategy

The build avoids bundling heavy shapefile generation libraries. `@mapbox/shp-write` is fetched via CDN only when a Shapefile export is explicitly requested. This removed prior `proj4` transitive dependency issues and shrinks the main bundle. Manual chunk logic in `vite.config.js` groups calculation engine, geodata utilities, and vendor code for optimal caching.

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

If you see an engines warning locally, switch to Node 22.12.0:

```bash
nvm install 22.12.0 # if not already installed
nvm use 22.12.0
```

## 🌍 Deployment to Netlify

### Automatic Deployment (Recommended)

1. Connect your GitHub repository to Netlify
2. Netlify will automatically detect the build settings from `netlify.toml`
3. Deploy will run `npm run build` and publish the `dist` folder

### GitHub Actions

CI focuses on build, lint, and tests. Netlify performs deploys directly from `main`; disabled reference workflow files remain for historical context. If re-enabling automated Netlify deployments via Actions, restore secrets (`NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`) and activate the workflow.

### Manual Deployment

```bash
# Build the application
npm run build

# Deploy the dist folder to Netlify
# (Use Netlify CLI or drag-and-drop deployment)
```

### Environment Variables

Copy `.env.example` to `.env` for local development:

```bash
cp .env.example .env
```

Available environment variables:

- `VITE_APP_NAME` - Application name
- `VITE_APP_VERSION` - Version number
- `VITE_DEBUG_MODE` - Enable debug features
- `VITE_ENABLE_*` - Feature flags

## 📋 Configuration

### Netlify Features Enabled

- **SPA Routing**: All routes redirect to `index.html` for client-side routing
- **Security Headers**: X-Frame-Options, CSP, and other security headers (CSP tightened 2025-09-24 by removing `unsafe-eval`; revert if a dependency requires eval in prod).
- **Static Asset Caching**: Optimized caching for `/assets/*` files
- **File Upload Support**: CSP configured for geospatial file imports

### Vite Configuration Highlights

- **Chunking**: Manual grouping for calculation engine, geodata utilities, vendor
- **No Shapefile Bundle**: Shapefile export uses CDN runtime load (no `proj4` in graph)
- **Polyfills**: Buffer/stream/util as needed for packaging logic
- **CSV Parser**: Uses robust parser for embedded commas/quotes
- **Dev Server**: Hot reload with network access

## 🧪 Testing

Comprehensive test suite covering:

- Calculation engine accuracy
- Format parsing and conversion
- Integration testing
- Reliability testing with edge cases

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📚 Usage

### Quick Start

1. Enter basic pole and span information
2. Configure existing utilities and proposed attachments
3. Review calculated clearances and NESC compliance
4. Export results or generate reports

### Advanced Features

- **Batch Processing**: Import multiple spans from CSV/Shapefile
- **Custom Clearances**: Override default NESC requirements
- **Make-Ready Analysis**: Calculate costs for existing utility modifications
- **Professional Reports**: Export with company branding and detailed calculations

### File Import/Export Support

- **Import**: KML, KMZ, Shapefiles, CSV (poles, spans, existing lines)
- **Export**: CSV, GeoJSON, KML, KMZ, Shapefile (CDN `@mapbox/shp-write`), PDF
- **Fallback**: If CDN shapefile script fails, GeoJSON ZIP still provided

#### Shapefile Export Flow

1. User selects Shapefile export.
2. App injects `<script src="https://unpkg.com/@mapbox/shp-write@latest/shpwrite.js">` (UMD global).
3. On load success, Shapefile component files + GeoJSON packaged via JSZip.
4. On failure, fallback ZIP with GeoJSON only (user notified).

Advantages: Smaller bundle, build stability, graceful offline behavior.

Offline enhancement implemented: Service worker now pre-caches the Shapefile CDN script for improved offline readiness and faster first export.

### Validation Layer

- Lightweight `zod` schemas validate imported Pole / Span rows via new "Load + Validate" buttons.
- Validation is additive and non-breaking: legacy "Load (Raw)" remains for maximum tolerance.
- Errors are summarized (first few with overflow count) and do not block valid rows.
- Future: Promote numeric coercion failures to actionable inline guidance.

### Deferred PDF Loading

- `pdf-lib` code isolated via `src/utils/pdfAsync.js`.
- Reduces initial bundle weight; network fetch for PDF code occurs only on first permit PDF action.
- Future optimization: split `pdf-lib` core/api further if growth continues.

## 🔧 Troubleshooting

### Common Build Issues

**Buffer/Node.js Module Errors**:

- The vite.config.js includes polyfills for browser compatibility
- Geospatial libraries require Node.js modules that are automatically handled

**Large Bundle Warnings**:

- Heavy shapefile libraries excluded from bundle; verify no regressions reintroduce them.

**Netlify Deployment Issues**:

- Ensure Node.js version is 22 (matches `netlify.toml`)
- Confirm canonical redirects working (`poleplanpro.com`)
- Verify service worker updates after deployment (hard refresh if stale)
- If `npm ci` fails locally, run `npm install` then commit updated lockfile only if intentional updates

## Visual Editor (Netlify Create) Readiness

Content pages reside in `content/pages/*.json` and model definitions are in `stackbit.config.ts`.

Enable Steps:

1. Enable Visual Editor in Netlify site settings.
2. Verify content source path: `content/pages`.
3. Open the editor; ensure Page entries (slug/title) are editable.
4. Save changes; confirm commit and subsequent deploy.

Best Practices:

- Keep model schema changes synchronized with the config file.
- For rich text or additional fields, extend the Page model and update render components.

### Local Functions + Studio

Run the site, Functions, and Visual Editor proxy together with Netlify Dev:

```bash
nvm use 22.12.0
npm ci
npm run dev:netlify
# Functions health check (no DB required)
curl -s http://localhost:8888/.netlify/functions/health | jq
```

Routes:

- `/` and `/:slug` render content files from `content/pages/{slug}.json` (used by Netlify Studio).
- `/app` launches the Pole Plan Wizard application.

If you see any Next.js plugin setup in logs, remove `@netlify/plugin-nextjs` in the Netlify Plugins UI. We also set `NETLIFY_NEXT_PLUGIN_SKIP=true` as a guard in `netlify.toml`.

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
