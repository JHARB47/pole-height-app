# PolePlan Pro

[![Live Site](https://img.shields.io/website?url=https%3A%2F%2Fpoleplanpro.com&label=live%20site&up_message=online&down_message=offline)](https://poleplanpro.com)
[![CI/CD](https://github.com/JHARB47/pole-height-app/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/JHARB47/pole-height-app/actions/workflows/ci-cd.yml)
[![CI Robust](https://github.com/JHARB47/pole-height-app/actions/workflows/ci-robust.yml/badge.svg)](https://github.com/JHARB47/pole-height-app/actions/workflows/ci-robust.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/1722a209-219d-4f21-9380-718a78f4372a/deploy-status)](https://app.netlify.com/projects/poleplanpro/deploys)
[![Security](https://img.shields.io/badge/security-0%20vulnerabilities-brightgreen)](https://github.com/JHARB47/pole-height-app/security)
[![Build Size](https://img.shields.io/badge/bundle-1388.4%20KB%20%2F%201450%20KB-success)](https://github.com/JHARB47/pole-height-app/actions)

**Live URL**: <https://poleplanpro.com>  
**Status**: Production | Node 22.20.0 | React 18 | Vite 7.1.8

A comprehensive web application for calculating NESC-compliant pole attachment heights and span-level pull (tension surrogate) using bearing-derived geometry, with enterprise-grade authentication, database integration, and resilient geospatial export capabilities.

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

### Frontend

- **Framework**: React 18.2 with Vite 7.1.8
- **Styling**: TailwindCSS 3.4 with responsive design and print optimization
- **State Management**: Zustand with localStorage persistence and corruption recovery
- **Icons**: Lucide React icon library

### Backend & Database

- **Runtime**: Node.js 22.20.0 (LTS)
- **Server**: Express 4.21 with Helmet security middleware
- **Database**: PostgreSQL 17.5 (Neon serverless)
  - Pooled connections for app runtime
  - Unpooled connections for migrations
  - Full schema with users, organizations, projects, API keys
- **Authentication**: JWT + Refresh tokens with Passport.js
  - Local strategy (email/password)
  - GitHub OAuth 2.0 ✨ NEW
  - Azure AD OAuth2
  - Google OAuth
  - SAML support

### DevOps & Quality

- **CI/CD**: GitHub Actions with multi-stage pipeline
  - Security scanning (CodeQL, Snyk, Trivy)
  - Automated testing (193/203 passing)
  - Bundle size monitoring (1388.4 KB / 1450 KB)
  - Docker builds with multi-platform support
- **Testing**: Vitest + Playwright for E2E
- **Deployment**: Netlify with environment-specific configs
- **Monitoring**: Pino structured logging

### Geospatial

- **Import**: shpjs, @tmcw/togeojson for KML/Shapefile
- **Export**: CDN-loaded @mapbox/shp-write (runtime only)
- **Formats**: CSV, GeoJSON, KML, KMZ, Shapefile

## 🏗 Build Configuration

### For Netlify Deployment

The application is optimized for Netlify deployment with the following configuration:

#### Build Settings

- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 22.20.0 (enforced via `.nvmrc`)
  - All CI workflows use `node-version-file: '.nvmrc'`
  - Local development: `nvm use` or `asdf install`
- **Bundle Size**: 1388.4 KB / 1450 KB limit (95.8% utilized)
- **Build Time**: ~2.2 seconds (optimized)
- **Dependencies**: 1624 packages, 0 production vulnerabilities
- **Node Version**: 22.20.0 (pinned via `.nvmrc`, `netlify.toml`, and CI). Use `nvm use` or asdf to ensure consistency locally.
  - If you previously used Node 20, upgrade before contributing to avoid subtle polyfill differences.
  - CI now reads the version from `.nvmrc` to enforce a single source of truth.

#### Key Files

- `netlify.toml` - Netlify deployment configuration
- `vite.config.js` - Optimized Vite build with code splitting
- `package.json` - Dependencies and build scripts

### Code Splitting & Runtime GIS Strategy

The build avoids bundling heavy shapefile generation libraries. `@mapbox/shp-write` is fetched via CDN only when a Shapefile export is explicitly requested. This removed prior `proj4` transitive dependency issues and shrinks the main bundle. Manual chunk logic in `vite.config.js` groups calculation engine, geodata utilities, and vendor code for optimal caching.

## 📦 Installation & Development

### Prerequisites

- **Node.js**: 22.20.0 (enforced - see `.nvmrc`)
- **npm**: 10.x or later
- **PostgreSQL**: 17.5+ (for backend development)

### Quick Start

```bash
# Use correct Node version
nvm use  # Reads from .nvmrc (22.20.0)

# Install dependencies (deterministic)
npm ci

# Start frontend development server
npm run dev

# Start backend + frontend together
npm run dev:full

# Start with Netlify Functions
npm run dev:netlify
```

### Development Commands

```bash
# Testing
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Generate coverage report
npm run test:api            # Backend API tests only
npm run test:calc           # Focused calculation + permit logic suite
npm run test:e2e            # Playwright E2E tests

# Building
npm run build               # Production build
npm run build:no-sw         # Build without service worker
npm run preview             # Preview production build

# Quality Checks
npm run lint                # ESLint + all linters
npm run lint:css            # Stylelint for CSS
npm run format:check        # Prettier check
npm run verify              # Full CI pipeline locally

# Database (Backend)
npm run db:migrate          # Run pending migrations
cd server && node test-connection.mjs  # Test DB connection

# Docker
npm run docker:dev          # Start dev environment
npm run docker:prod         # Start production environment
```

### Environment Setup
If you see an engines warning locally, switch to Node 22.20.0:

```bash
# Frontend (.env)
cp .env.example .env

# Backend (server/.env) - contains secrets, DO NOT COMMIT
# See SECRETS-CHECKLIST.md for required variables
nvm install 22.20.0 # if not already installed
nvm use 22.20.0
```

## 🌍 Deployment to Netlify

### Automatic Deployment (Recommended)

1. Connect your GitHub repository to Netlify
2. Netlify will automatically detect the build settings from `netlify.toml`
3. Deploy will run `npm run build` and publish the `dist` folder

### GitHub Actions

**Active Workflows:**
CI focuses on build, lint, and tests, and now includes a staging-profile checklist run (`DEPLOY_ENV=staging`) so the deployment notes stay in sync with reality. Netlify performs deploys directly from `main`; disabled reference workflow files remain for historical context. If re-enabling automated Netlify deployments via Actions, restore secrets (`NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`) and activate the workflow.

- `ci-cd.yml` - Full CI/CD pipeline with security scanning, testing, building, and deployment
- `ci-robust.yml` - Robust verification workflow with weekly hygiene checks
- `release.yml` - Automated release management

**Pipeline Stages:**

1. **Security** - CodeQL, npm audit, Snyk scanning
2. **Lint** - ESLint, Stylelint, Prettier
3. **Test** - Unit tests on Node 22.x & 24.x with PostgreSQL
4. **E2E** - Playwright browser tests
5. **Build** - Bundle analysis and artifact generation
6. **Docker** - Multi-platform builds with Trivy scanning
7. **Deploy** - Automated Netlify deployments
8. **Staging Profile Check** - Exercises `scripts/deploy/production-check.mjs` with `DEPLOY_ENV=staging` to ensure staging guidance stays accurate

**Required Secrets:**

- `DATABASE_URL` - PostgreSQL connection (for CI tests)
- `JWT_SECRET` - Authentication secret
- `REFRESH_TOKEN_SECRET` - Refresh token secret
- `NETLIFY_BUILD_HOOK_URL` - Deployment webhook
- `CODECOV_TOKEN` - Code coverage reporting (optional)
- `SNYK_TOKEN` - Security scanning (optional)

See `SECRETS-CHECKLIST.md` for complete setup guide.

### Manual Deployment

```bash
# Build the application
npm run build

# Deploy the dist folder to Netlify
# (Use Netlify CLI or drag-and-drop deployment)
```

### Deployment Checklists

```bash
npm run verify:staging      # relaxed gate for staging
npm run verify:production   # full production gate
```

> Optional checks (database, SSL, API health, integration tests) are skipped automatically in staging. Set `RUN_OPTIONAL_CHECKS=true` if you want to exercise them anyway.

### Environment Variables

#### Frontend (`.env`)

```bash
VITE_APP_NAME=PolePlan Pro
VITE_APP_VERSION=0.1.0
VITE_DEBUG_MODE=false
VITE_ENABLE_SW=true  # Service worker
```

> Need to sync environment variables to Netlify? Run `npm run deploy:netlify:env-template` to print ready-to-paste `netlify env:set` commands.

#### Backend (`server/.env`) - **DO NOT COMMIT**

```bash
# Database (from Neon Console)
DATABASE_URL=postgresql://...                    # Pooled
DATABASE_URL_UNPOOLED=postgresql://...           # Unpooled (migrations)

# Authentication (generate secure 32+ byte secrets)
JWT_SECRET=<generate-random-hex-64-chars>
REFRESH_TOKEN_SECRET=<generate-different-hex-64-chars>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_TTL=7d

# Server Config
NODE_ENV=development
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
LOG_LEVEL=debug

# Optional: SSO Configuration
AZURE_AD_TENANT_ID=
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

**Generate Production Secrets:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

See `SECRETS-CHECKLIST.md` for complete configuration guide.

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

**Test Coverage**: 193/203 tests passing (95%)

### Test Suites

- **Unit Tests**: Calculation engine, utilities, components
- **Integration Tests**: Database operations, API endpoints
- **E2E Tests**: Playwright browser automation
- **Reliability Tests**: Edge cases, error handling

### Test Execution

```bash
# All tests (Vitest)
npm test                       # Run once
npm run test:watch             # Watch mode
npm run test:coverage          # Generate coverage

# Backend API tests
npm run test:api               # Server tests with PostgreSQL

# E2E tests (Playwright)
npm run test:e2e               # Browser automation

# Full test suite
npm run test:full              # Frontend + Backend
npm run test:coverage:full     # Combined coverage
```

### Test Environment

- **Database**: PostgreSQL 16 (Docker service in CI)
- **Node Versions**: 22.x and 24.x (matrix testing)
- **Coverage**: Uploaded to Codecov on main branch

## 📚 Usage

### Application Quick Start

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

### Build Issues

**Node Version Mismatch**

```bash
# Solution: Use Node 22.20.0
nvm install 22.20.0
nvm use 22.20.0
```

**Bundle Size Exceeded**

- Current: 1388.4 KB / 1450 KB limit
- Shapefile libraries loaded via CDN (not bundled)
- Check `npm run bundle:check` for details

**Database Connection Errors**

```bash
# Test connection
cd server && node test-connection.mjs

# Run migrations
npm run db:migrate

# Check schema
node scripts/db/check-schema.mjs
```

### Deployment Troubleshooting

**Netlify Build Failures**

1. Verify Node version in Netlify: Settings → Build & deploy → Environment → Node.js version
2. Check environment variables: All secrets configured?
3. Review build logs for specific errors

**GitHub Actions Failures**

1. Check workflow status: https://github.com/JHARB47/pole-height-app/actions
2. Verify repository secrets are set correctly
3. Ensure no trailing whitespace in secret values

**Database Migration Issues**

- ✅ Use `scripts/db/run-migrations.mjs` (working)
- ❌ Avoid `scripts/db/migrate.mjs` (removed - was corrupted)
- See `MIGRATE-FILE-NOTE.md` for details

### Common Development Issues

**Port Already in Use**

```bash
# Frontend (5173)
lsof -ti:5173 | xargs kill -9

# Backend (3001)
lsof -ti:3001 | xargs kill -9
```

**Service Worker Caching Issues**

- Hard refresh: Cmd/Ctrl + Shift + R
- Disable in DevTools: Application → Service Workers → Unregister
- Production: New deployments update SW automatically

**Test Failures**

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm test
```

### Getting Help

**Documentation**

- `SYNC-STATUS-REPORT.md` - Repository sync verification
- `SECRETS-CHECKLIST.md` - Environment setup guide
- `DATABASE-CONNECTION-SUCCESS.md` - Database setup details
- `docs/DATABASE-CONNECTION-GUIDE.md` - Complete database guide
- `docs/TECHNICAL_GUIDE.md` - Architecture documentation

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
nvm use 22.20.0
npm ci
npm run dev:netlify
# Functions health check (no DB required)
curl -s http://localhost:8888/.netlify/functions/health | jq
```

Routes:

- `/` and `/:slug` render content files from `content/pages/{slug}.json` (used by Netlify Studio).
- `/app` launches the PolePlan Pro application.

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
# Deployment trigger
