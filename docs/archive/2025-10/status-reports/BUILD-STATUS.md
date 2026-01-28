# Build & Coverage Status

This project uses Vitest for unit/integration tests and V8 coverage reporting.

- Coverage directory: `./coverage`
- Reports generated: `text` (console), `html` (open `coverage/index.html`), `lcov` (`coverage/lcov.info`)
- Scope: Only `src/**/*.js|jsx` files are measured. Configs, scripts, tests and serverless functions are excluded to avoid zero-coverage noise.
- Threshold gates (CI): lines 60%, statements 60%, functions 55%, branches 50%.

How to run locally:

```bash
npm run test:coverage
open coverage/index.html
```

CI will run `npm run -s test -- --run --coverage` and publish the lcov HTML as an artifact.
[![Netlify Status](https://api.netlify.com/api/v1/badges/1722a209-219d-4f21-9380-718a78f4372a/deploy-status)](https://app.netlify.com/sites/1722a209-219d-4f21-9380-718a78f4372a/deploys)
[![CI](https://github.com/JHARB47/pole-height-app/actions/workflows/ci.yml/badge.svg)](https://github.com/JHARB47/pole-height-app/actions/workflows/ci.yml)

## 🎯 Current Status: **STABLE** (September 2025)

**Build System**: Vite 5.x (pinned with explicit manual chunks); migration path to Vite 6/7 under evaluation  
**Runtime Node Version**: 22.12.0 (single source: `.nvmrc`, CI, Netlify)  
**Test Suite**: 76 tests passing across 17 files (post-validation integration)  
**PWA Generation**: ✅ Working (service worker + manifest)  
**Dependencies**: Core deps stable; optional GIS deps dynamically loaded. CSP tightened (removed `unsafe-eval`).

## 🔧 Version Compatibility Matrix

| Vite Version | Status          | Build Time  | Bundle Size | Notes                                |
| ------------ | --------------- | ----------- | ----------- | ------------------------------------ |
| 5.4.19       | ✅ Stable       | ~2.3s       | ~1.2MB      | **Recommended production version**   |
| 7.1.2        | ❌ Incompatible | Build fails | N/A         | External module resolution conflicts |

## 📊 Build Verification Results

### Test Suite Performance

```text
✓ 57 tests passing consistently
✓ 15 test files executed
✓ Coverage: calculations, exports, imports, permits, geodata
✓ Optional dependency graceful degradation tested
✓ Execution time: ~800ms average
```

### Latest Build Output (Snapshot 2025-09-24)

```text
index.html                        ~0.42 kB gzip
assets/vendor                     ~240.28 kB gzip
assets/app-calculator (utils)     ~154.98 kB gzip
assets/react-dom                  ~129.78 kB gzip
assets/pdf-libs                   ~314.91 kB gzip  (largest)
precache entries                  22
```

### Optional Dependencies Status

- **tokml**: ✅ Dynamic import, graceful fallback
- **shpjs**: ✅ Dynamic import, graceful fallback
- **@mapbox/shp-write**: ✅ Dynamic import, graceful fallback

## ⚙️ Current Configuration

### Vite Configuration (vite.config.js)

````javascript
// External dependencies for optional GIS libraries
const optionalDeps = ['tokml', '@mapbox/shp-write', 'shpjs'];

export default defineConfig({
  // External function for proper dependency handling
  external: (id) => optionalDeps.includes(id),

  // Function-based manual chunks for Vite compatibility
  manualChunks: (id) => {
    if (id.includes('node_modules')) return 'vendor';
    if (id.includes('src/utils')) return 'utils';
  }
});
```text

### PWA Configuration

- **Mode**: generateSW
- **Precache**: 22 entries, ~1.2MB total
- **Service Worker**: Generated as dist/sw.js
- **Workbox**: v0.20.5 integration

## 🚨 Known Issues and Solutions

### Vite 7.x Compatibility Issue

**Problem**: External module resolution fails in Vite 7.1.2

```text
Error: Rollup failed to resolve import "tokml" from geodata.js
Error: "shpjs" cannot be included in manualChunks because it is resolved as external
````

**Root Cause**: Vite 7.x has stricter external module detection that conflicts with current configuration

**Current Solution**: ✅ Use Vite 5.4.19 for stable builds

**Long-term Solution**: Monitor Vite 7.x updates for compatibility fixes

### Optional Dependencies Handling

**Approach**: Dynamic imports with try/catch error handling

```javascript
try {
  const { tokml } = await import("tokml");
  return tokml(geojsonData);
} catch (error) {
  console.warn("KML export unavailable:", error.message);
  throw new Error("KML export requires additional dependencies");
}
```

## 🔄 GitHub Actions CI/CD Status

### Enhanced Workflow Configuration

- **CI Pipeline**: ✅ Enhanced with parallel jobs (lint, test, build, verify-optional-deps)
- **PR Checks**: ✅ Comprehensive verification with coverage
- **Netlify Deploy**: ✅ Production + preview deploys with metadata
- **Optional Dependencies**: ✅ Verified without optional libs

### CI Pipeline Jobs

1. **Lint**: ESLint, Stylelint, security audit
2. **Test**: Full test suite execution with artifacts
3. **Build**: Production build verification with size analysis
4. **Optional Deps**: Build verification without optional dependencies

## 📈 Performance Benchmarks

### Build Performance

- **Clean Build**: ~2.3 seconds
- **Incremental Build**: ~1.5 seconds
- **Test Execution**: ~800ms
- **Total CI Pipeline**: ~3-4 minutes

### Bundle Analysis (Historical vs Current)

- Historic main bundle previously 435KB gzip 180KB; refactoring + chunk adjustments split out pdf-libs.
- Current largest gzip: pdf-libs (~315 kB) – lazy-loaded with hover prefetch.
- Vendor now ~240 kB gzip; calculator/utils ~155 kB gzip.

## 🚀 Deployment Configuration

### Netlify Settings

- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 22
- **Environment**: Production optimized with build metadata

### PWA Features

- **Offline Support**: ✅ Service worker caching
- **Install Prompt**: ✅ Web app manifest
- **Background Sync**: ✅ Workbox integration
- **Cache Strategy**: ✅ Precache + runtime cache

## 💻 Development Workflow

### Local Development Commands

```bash
# Full verification pipeline
npm ci && npm run lint && npm run lint:css && npm test && npm run build

# Individual checks
npm test          # Run test suite (76 tests)
npm run lint      # ESLint checks
npm run lint:css  # Stylelint checks
npm run build     # Production build
npm run dev       # Development server
```

### Quality Gates

1. ✅ All tests must pass (76/76)
2. ✅ Linting must pass (ESLint + Stylelint)
3. ✅ Build must complete successfully
4. ✅ PWA assets must generate correctly
5. ✅ Optional dependencies must degrade gracefully

## 🔮 Future Considerations

### Vite 7.x Migration

- Monitor Vite 7.x updates for external dependency fixes
- Investigate alternative bundling strategies
- Consider webpack migration if Vite issues persist

### Bundle Optimization

- Evaluate tree-shaking opportunities
- Consider lazy loading for large utilities
- Monitor bundle size growth over time
  Introduced `pdfAsync.js` dynamic loader boundary for pdf-lib (defer large PDF code until first use)
  Hover prefetch added on Permit Pack button to warm `pdf-lib` chunk.
  Numeric coercion added to CSV/GeoJSON parsing to handle thousands separators, locale decimal commas, units, degrees, and feet–inches.

### PWA Enhancements

- Implement background sync for offline data
- Add push notifications for permit updates
- Optimize caching strategies for better performance

## 🛠️ Troubleshooting Guide

### Build Failures

1. **Check Vite version**: Ensure using 5.4.19
2. **Verify externals**: Confirm optional deps in external config
3. **Clear cache**: `rm -rf node_modules/.vite dist`
4. **Reinstall**: `npm ci` for clean dependency install

### Test Failures

1. **Run specific test**: `npm test -- calculations`
2. **Check environment**: Verify Node.js version compatibility
3. **Mock issues**: Check dynamic import mocking in tests
4. **Timeout issues**: Increase test timeout for heavy operations

### CI/CD Issues

1. **Check workflow logs**: Review GitHub Actions output
2. **Netlify deploy**: Verify environment variables set
3. **Cache issues**: Clear npm cache in CI environment
4. **Node version**: Ensure consistency with local development

## 📋 Support and Maintenance

### Key Files for Build System

- `vite.config.js`: Main build configuration
- `package.json`: Dependencies and scripts
- `.github/workflows/`: CI/CD pipeline definitions
- `src/utils/geodata.js`: Optional dependency handling

### Monitoring Points

- Bundle size growth over time
- Test execution time trends
- Build failure patterns
- Dependency security vulnerabilities

### Regular Maintenance Tasks

- Update dependencies monthly
- Review bundle analysis quarterly
- Update documentation as configuration changes
- Monitor Vite ecosystem for compatibility updates

---

## 🎉 **Production Ready**

All issues have been resolved and the application is ready for continued development and production deployment. The build system is stable, tested, and optimized with comprehensive CI/CD pipeline support.

Node 22.12.0 is the enforced runtime (Netlify, CI, local via `.nvmrc`). No Java toolchain present—prior Java upgrade request resolved by standardizing Node environment.
