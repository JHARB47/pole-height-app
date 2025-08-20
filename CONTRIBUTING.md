# Contributing

Thanks for helping improve Pole Plan Wizard.

## Setup

- Node: use the version in `.nvmrc` (Node 22). If you use nvm:

```bash
nvm use
```

- Install deps:

```bash
npm ci
```

## Dev commands

- Start dev server: `npm run dev`
- Lint (JS): `npm run lint`
- Lint (CSS): `npm run lint:css`
- Tests: `npm test`
- Build: `npm run build`
- Full verify: `npm run verify`
- Format (auto-fix JS/CSS): `npm run format`

## Git hooks

- Pre-commit: runs lint-staged (or eslint/stylelint fallback) + tests
- Pre-push: runs `npm run verify`

Hooks skip automatically in CI and when `node_modules` is missing.

## Optional geospatial dependencies

- Shapefile export: `npm i -D @mapbox/shp-write`
- Shapefile import: `npm i -D shpjs`

The app dynamically detects these and falls back safely when absent.
