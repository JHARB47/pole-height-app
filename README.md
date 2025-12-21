# PolePlan Pro

[![Live Site](https://img.shields.io/website?url=https%3A%2F%2Fpoleplanpro.com&label=live%20site&up_message=online&down_message=offline)](https://poleplanpro.com)
[![CI/CD](https://github.com/JHARB47/pole-height-app/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/JHARB47/pole-height-app/actions/workflows/ci-cd.yml)
[![CI Robust](https://github.com/JHARB47/pole-height-app/actions/workflows/ci-robust.yml/badge.svg)](https://github.com/JHARB47/pole-height-app/actions/workflows/ci-robust.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/1722a209-219d-4f21-9380-718a78f4372a/deploy-status)](https://app.netlify.com/projects/poleplanpro/deploys)
[![Security](https://img.shields.io/badge/security-0%20vulnerabilities-brightgreen)](https://github.com/JHARB47/pole-height-app/security)
[![Build Size](https://img.shields.io/badge/bundle-1388.4%20KB%20%2F%201450%20KB-success)](https://github.com/JHARB47/pole-height-app/actions)

**Live URL**: <https://poleplanpro.com>  
**Status**: Production | Node 22.x (see `.nvmrc`) | React 18 | Vite 7.x | Netlify Functions (esbuild)

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

- **Framework**: React 18.2 with Vite 7.x
- **Styling**: TailwindCSS 4.x with responsive design and print optimization
- **State Management**: Zustand with localStorage persistence and corruption recovery
- **Icons**: Lucide React icon library

### Backend & Database

- **Runtime**: Node.js 22.x (see `.nvmrc`)
- **Server**: Express 5.x with Helmet security middleware
- **Database**: PostgreSQL 17.5 (Neon serverless)
  - Pooled connections for runtime operations
  - Unpooled connections for migrations
  - Full schema with users, organizations, projects, API keys
- **Authentication**: JWT + Refresh tokens with Passport.js
  - Local strategy (email/password)
  - GitHub OAuth 2.0
  - Azure AD OAuth2
  - Google OAuth
  - SAML support

### DevOps & Quality

- **CI/CD**: GitHub Actions multi-stage pipeline
  - Security scanning (CodeQL, Snyk, Trivy)
  - Automated testing (see CI badges)
  - Bundle size monitoring (see CI logs)
  - Docker builds with multi-platform support
- **Testing**: Vitest + Playwright for end-to-end validation
- **Deployment**: Netlify (with environment-specific configs + functions)
- **Monitoring**: Pino structured logging

### Geospatial

- **Import**: `shpjs`, `@tmcw/togeojson` for KML/Shapefile ingestion
- **Export**: CDN-loaded `@mapbox/shp-write` (runtime only) plus CSV, GeoJSON, KML, KMZ, Shapefile outputs
- **Runtime Strategy**: Heavy GIS libraries fetched lazily to keep bundle lean

## 🧱 Full Stack Runbook

1. **Local Environment Preparation**
   - `nvm use` (reads `.nvmrc`; Node 22.20.0)
   - `npm ci` (deterministic install)

2. **Database & Backend**
   - Configure PostgreSQL 17.5+ via Neon or local container
   - Environment variables: Pooled/Unpooled `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, OAuth secrets
   - Run migrations: `npm run db:migrate`
   - Start backend API: `npm run dev:backend` (or `npm run dev:full` for concurrent frontend)

3. **Frontend Development**
   - Start Vite dev server: `npm run dev` (hot reload)
   - Components lazy-load heavy features via `Lazy*` wrappers
   - Tailwind rebuilds on file change; service worker precaches runtime assets

4. **Netlify Functions**
   - Launch functions/local proxies: `npm run dev:netlify`
   - Verify health: `curl -s http://localhost:8888/.netlify/functions/health`

5. **Full Stack Verification**
   - Run `npm run verify` to execute linting, tests, bundle, and deploy checks sequentially
   - CI mirrors these steps on the Node version from `.nvmrc`

6. **Deployment Flow**
   - GitHub Action (`ci-cd.yml`) handles lint → test → build → deploy
   - Netlify deploy (triggered via webhook + Netlify UI) runs `npm run build` → publish `dist`
   - Monitoring includes bundle size badge, Netlify latency, and Health endpoint alerts

## 🏗 Build Configuration

### For Netlify Deployment

#### Build Settings

- **Command**: `npm run build`
- **Publish Dir**: `dist`
- **Node Version**: 22.x (enforced by `.nvmrc`, `netlify.toml`, CI)
- **Consistency**: CI and Netlify read `.nvmrc`; developers must `nvm use` before `npm ci`

#### Key Files

- `netlify.toml`
- `vite.config.js`
- `package.json`

### Code Splitting & Runtime GIS Strategy

- `@mapbox/shp-write` loaded at runtime for shapefile export
- Manual chunking in Vite groups calculation engine, geodata utils, vendor code
- Deferred `pdf-lib` via `src/utils/pdfAsync.js`

## 📦 Installation & Development

### Prerequisites

- Node.js 22.x (see `.nvmrc` and `netlify.toml`)
- npm 10.x+
- PostgreSQL 17.5+

### Quick Start

```bash
nvm use
npm ci
npm run dev           # frontend
npm run dev:backend   # backend API
npm run dev:netlify   # functions + app with Netlify Dev
```

### Development Commands

```bash
npm test
npm run test:watch
npm run test:coverage
npm run test:api
npm run test:calc
npm run test:e2e
npm run build
npm run build:no-sw
npm run preview
npm run lint
npm run lint:css
npm run format:check
npm run verify
npm run db:migrate
cd server && node test-connection.mjs
npm run docker:dev
npm run docker:prod
```

### Environment Setup

```bash
cp .env.example .env
nvm install 22
nvm use
```

## 🌍 Deployment to Netlify

(Sections describing automatic/manual deployment, workflows, pipeline stages, required secrets, and environment variables remain in sync with current releases.)

## 📋 Configuration

(Include SPA routing, security headers, caching, file upload, Vite chunking, shapefile CDN strategy, polyfills, CSV parser, dev server.)

## 🧪 Testing

(Expand upon current test coverage, execution commands, environment matrix, and status badge updates.)

## 📚 Usage

(Summarize quick start, advanced features, file import/export flow, validation layer, deferred PDF loading.)

## 🔧 Troubleshooting

(Provide troubleshooting snippets for node mismatch, bundle size, database, deployment, dev server issues, testing resets.)

## 📝 License

(Proprietary utility engineering software.)

## 🤝 Contributing

(Outline contribution guidelines.)

## 📞 Support

(Contact development team.)
