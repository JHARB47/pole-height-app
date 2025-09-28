# Testing, Coverage, and CI/CD Strategy for Enterprise Rollout

## 1. Testing Roadmap

### 1.1 Unit Tests (Vitest + Testing Library)
- **Auth UI**: cover `AuthProvider`, login/logout buttons, protected routes redirect logic.
- **RBAC Controls**: ensure Engineer vs Manager vs Admin UI elements render/hide appropriately.
- **Offline Queue**: validate mutation queue behaviour, retry logic, background sync triggers.
- **API Key Console**: form validation, copy states, revocation confirmation.

### 1.2 Integration & API Tests (Vitest + Supertest)
- Add `server/test` directory with Vitest `node` environment.
- Spin up Express app via in-memory server, seed PostgreSQL test DB (using `pg` + migrations).
- Cover key flows:
  1. **SSO Callback** – exchange auth code → create user → issue JWT.
  2. **RBAC Enforcement** – Engineer denied admin endpoints, Manager allowed project updates.
  3. **Project CRUD** – create/list/update projects within tenant, confirm cross-tenant access blocked.
  4. **Comment Feed** – post comment, retrieve list, audit event recorded.
  5. **API Key Lifecycle** – create key, verify hashed storage, revoke key denies further access.
- Mock external providers (Azure AD, monitoring webhooks) with lightweight stubs.

### 1.3 End-to-End Smoke (Optional Phase 2)
- Use Playwright or Cypress to validate critical flows (login, load project, post comment).
- Gate optional due to infra cost; document manual smoke checklist.

## 2. Coverage Targets
- Maintain current thresholds (Lines/Statements 60%, Functions 55%, Branches 50%).
- Add server files into coverage scope with separate threshold block to ensure backend parity.
- Generate combined report via Vitest `--coverage.enabled` for both `client` and `server` suites, merge using `istanbul-merge` script.

### Metrics Breakdown
- **Client**: focus on auth UI, dashboards, offline sync.
- **Server**: auth controllers, RBAC middleware, service-layer utilities, data mappers.

## 3. Tooling & Commands
- New npm scripts:
  - `"dev:backend": "node --watch server/index.js"`
  - `"db:migrate": "node scripts/db/run-migrations.mjs"`
  - `"test:api": "cross-env NODE_ENV=test node scripts/test/run-vitest.mjs run --dir=server"`
  - `"test:full": "npm run test && npm run test:api"`
  - `"test:coverage:full": "npm run test:coverage && npm run test:api -- --coverage"`
- `.env.example` entries for DB connection, Azure AD, JWT secrets, monitoring URLs.

## 4. CI/CD Enhancements

### 4.1 GitHub Actions (`ci.yml`)
- Add **postgres service** to `test` matrix:
  ```yaml
  services:
    postgres:
      image: postgres:16-alpine
      env:
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: postgres
        POSTGRES_DB: poleplan_test
      ports: ["5432:5432"]
      options: >-
        --health-cmd="pg_isready -U postgres" --health-interval=10s --health-timeout=5s --health-retries=5
  ```
- Introduce new job `test-api` depending on `lint`:
  ```yaml
  - run: npm run db:migrate -- --env=ci
  - run: npm run test:api -- --run --coverage
  - uses: actions/upload-artifact@v4
    with:
      name: coverage-server-${{ github.sha }}
      path: coverage/server
  ```
- Upload merged coverage summary as job artifact and surface in PR comment (optional `dorny/coverage-check`).
- Re-enable optional dependency verification by running build without installing `tokml`, `shpjs`, `@mapbox/shp-write` (use `npm explore` or `npm pkg set optionalDependencies`).

### 4.2 Netlify Deployment
- Document new build command `npm run build && npm run build:server` (if serverless bundle needed).
- Provide environment variable checklist (Azure, DB, JWT, monitoring webhook).
- Ensure Node version pinned via `.nvmrc` and `netlify.toml`.
- Run post-build script to verify service worker bundling + manifest (existing PWA assets remain unchanged).

## 5. Monitoring & Verification
- Extend `scripts/ci/check-bundle-size.mjs` to allow separate budgets for client vs server bundle.
- Add `server/scripts/check-health.mjs` used in CI to hit `/health` after build/start to confirm uptime integration.
- Document manual verification steps in README: `npm run db:seed`, `npm run dev` (client) + `npm run dev:backend` (server), run coverage, view `coverage/index.html`.

## 6. Documentation Checklist
- README updates covering:
  - Prerequisites (Node 22.12.0, Postgres 16, pnpm optional?)
  - Setup steps: `cp .env.example .env`, `npm ci`, `npm run db:migrate`, `npm run dev:backend`, `npm run dev`
  - Test suite commands + coverage instructions (include `npm run test:coverage:full`).
  - Troubleshooting (common SSO errors, clearing vite cache, verifying optional deps).
- `docs/api.md` with endpoint specs + example requests/responses.
- `docs/db-schema.md` showing tables/indexes, RLS policies annotated.
- `docs/monitoring.md` or extend `operational-readiness` doc with instructions for hooking to Datadog, Pingdom, etc.

## 7. Graceful Degradation Tests
- Write dedicated tests toggling feature flags to simulate missing optional deps (mock dynamic import throwing).
- Add integration test ensuring API rejects unknown API keys but still serves read-only data when offline mode engaged.

---
This plan ensures new enterprise capabilities remain verifiable, maintainable, and production-ready with clear developer workflows.
