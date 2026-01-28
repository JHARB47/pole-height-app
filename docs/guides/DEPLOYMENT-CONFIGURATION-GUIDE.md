# Deployment Configuration Guide

Complete reference for configuring PolePlan Pro deployment on Netlify.

## netlify.toml Configuration

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "22.12.0"
  NPM_FLAGS = "--legacy-peer-deps"
  NETLIFY_NEXT_PLUGIN_SKIP = "true"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "no-referrer"
```

## Environment Variables

### Required

None - application is fully client-side.

### Optional (Future Features)

- `VITE_API_URL` - Backend API URL if adding server features
- `VITE_MAPBOX_TOKEN` - For advanced mapping features

## Build Settings

### Node Version

**Required**: Node 22.12.0 (specified in `netlify.toml`, `.nvmrc`)

### Build Command

```bash
npm run build
```

This runs:

1. Vite production build
2. Code splitting with manual chunks
3. Bundle size verification

### Publish Directory

`dist/` - Vite output directory

## Vite Configuration

Key settings from `vite.config.js`:

### Manual Chunking

```javascript
manualChunks: {
  'calculations': ['./src/utils/calculations.js'],
  'permits': ['./src/utils/permits.js'],
  'geodata': ['./src/utils/geodata.js']
}
```

### CDN Externals

Heavy libraries loaded via CDN:

- `@mapbox/shp-write` (shapefile export)

### Build Optimization

- Tree shaking enabled
- Minification on
- Source maps for production debugging

## Content Security Policy

Headers configured in `public/_headers`:

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'
```

## Service Worker

Configured in `vite.config.js` via `vite-plugin-pwa`:

```javascript
VitePWA({
  registerType: "autoUpdate",
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/unpkg\.com\/.*/i,
        handler: "CacheFirst",
      },
    ],
  },
});
```

## Troubleshooting

### Build Fails

1. Check Node version: `node --version` (must be 22.12.0)
2. Clear cache: `rm -rf node_modules dist && npm install`
3. Check build logs in Netlify UI

### Deploy Succeeds but Site Broken

1. Check browser console for errors
2. Verify CSP headers not blocking resources
3. Check service worker registration

### Performance Issues

1. Run bundle analysis: `npm run build -- --profile`
2. Check lazy loading working: Network tab in DevTools
3. Verify CDN resources loading

## Deployment Checklist

Before deploying:

- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] No security issues: `npm audit`
- [ ] Bundle size acceptable: Check `dist/` directory
- [ ] `netlify.toml` up to date
- [ ] Node version correct in config

## References

- [Netlify Configuration Docs](https://docs.netlify.com/configure-builds/file-based-configuration/)
- [Vite Build Options](https://vitejs.dev/config/build-options.html)
- [PWA Configuration](https://vite-pwa-org.netlify.app/)

---

_Last Updated: October 5, 2025_
