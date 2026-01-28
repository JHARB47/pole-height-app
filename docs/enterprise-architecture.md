# PolePlan Pro Enterprise Architecture Plan

## 1. Current Baseline

- React 18 SPA served via Vite 5.4.x with manual chunking tuned for GIS + PDF tooling.
- Client-side state managed via Zustand, persistence limited to browser storage (no multi-user sync).
- Netlify deploy targets static `dist/`, PWA service worker handles offline caching.
- No dedicated backend beyond Netlify functions; optional GIS libraries dynamically imported.

## 2. Enterprise Goals

1. **Authentication & Authorization** – Add SSO (OAuth 2.0 / OIDC with Azure AD as primary), fallback email+password for admins, enforced RBAC (Engineer, Manager, Admin).
2. **Data Isolation & Collaboration** – Multi-tenant org/department hierarchy, scoped access to projects, shared dashboards, inline comments, audit history.
3. **API Integrations** – REST API for projects, pole/span datasets, collaboration events, and API key management for external systems.
4. **Operational Readiness** – Health checks, structured logging, metrics/alerting hooks, uptime dashboards, and documentation for incident response.
5. **PWA Continuity** – Preserve offline-first experience while syncing server state and handling detached sessions.

## 3. Delivery Strategy (Front → Persistence → API)

### 3.1 Front-end Iterations

1. **Auth Shell**
   - New top-level route group `/auth` with `LoginPage`, `CallbackPage`, `LogoutPage`.
   - Context provider `AuthProvider` handling tokens, refresh, user/role metadata.
   - UI components: `SSOButton` (Azure AD), `ApiKeyBanner`, `RoleBadge`.

2. **Multi-tenant Navigation**
   - Update `App.jsx` routing to guard authenticated areas via `ProtectedLayout`.
   - Side navigation scoped by organization → department → project.
   - Manager/Admin dashboards to manage teams, invite users, and view activity feed.

3. **Collaboration Layer**
   - `ProjectDashboard` with live project metadata, recent comments, job status.
   - `CommentsPanel` (WebSocket/polling) for pole/span annotations.
   - `TeamActivity` timeline showing audit events (exports, approvals, etc.).

4. **Engineer Workspace Enhancements**
   - Integrate server-backed data via `ProjectProvider` (sync local cache ↔ API).
   - Offline queue for mutations using service worker background sync (fallback to manual retry).
   - RBAC-driven feature switches (e.g., only Managers see approval tools).

5. **Administrative Console**
   - Admin-only area for API key issuance/revocation, SSO tenant configuration, health status.
   - Visualization of usage metrics (surface uptime monitoring results).

### 3.2 Persistence Layer (PostgreSQL)

- New database schema defined via migration files under `server/db/migrations` (use `node-pg-migrate`).
- Core tables:
  - `organizations(id, name, external_id, created_at)`
  - `departments(id, organization_id, name, created_at)`
  - `users(id, organization_id, department_id, email, display_name, role, sso_subject, status, created_at, updated_at)`
  - `projects(id, organization_id, department_id, name, status, metadata, created_at, updated_at)`
  - `project_members(user_id, project_id, role, added_at)`
  - `pole_sets(id, project_id, version, data, checksum, created_at, created_by)` – stores denormalized pole/span payload (JSONB)
  - `comments(id, project_id, author_id, entity_type, entity_id, body, created_at)`
  - `api_keys(id, organization_id, name, hashed_key, scopes, last_used_at, created_at)`
  - `audit_events(id, organization_id, actor_id, action, target_type, target_id, context, created_at)`
  - `sessions(id, user_id, refresh_token_hash, expires_at, created_at)`
- Indices enforce tenant isolation (e.g., `(organization_id, project_id)` uniqueness).
- Row-Level Security (RLS) policies ensure cross-org isolation directly at DB layer.

### 3.3 API / Service Layer (Express)

- New `server/` workspace with Express app using modular routers.
- Middleware stack:
  - `helmet`, `cors`, `compression`
  - Request logging via `pino-http`
  - Authentication: bearer tokens (JWT) issued post-SSO, refresh tokens kept server-side
  - RBAC guard middleware checking `req.user.role` and organization scope
- Endpoints (initial set):
  - `POST /auth/sso/azure` – start OIDC flow (redirect URL from env config)
  - `GET /auth/sso/azure/callback` – handle Azure tokens, create session, issue app JWT
  - `POST /auth/session/refresh` – rotate access tokens
  - `POST /auth/logout` – revoke refresh token
  - `GET /orgs/:orgId/departments` – list departments
  - `GET /orgs/:orgId/projects` / `POST` / `PATCH` – CRUD with RBAC checks
  - `GET /projects/:projectId/pole-sets` / `POST` – versioned dataset management
  - `POST /projects/:projectId/comments` / `GET` – collaboration feed
  - `GET /projects/:projectId/activity` – audit events timeline
  - `POST /orgs/:orgId/api-keys` / `DELETE` – key management (Admin only)
  - `GET /health` – readiness, returns DB + queue status
  - `GET /metrics` – optional Prometheus endpoint (behind admin token)
- WebSocket (or SSE) gateway under `/projects/:id/events` for live collaboration (phase 2).

### 3.4 Integration Points

- **SSO Providers**: Start with Azure AD via `openid-client` (Authorization Code + PKCE). Plan extension hooks for Okta, Ping, generic SAML using separate handler module.
- **Monitoring**: Provide `POST /internal/alerts` stub for integration with PagerDuty/Statuspage; embed `opentelemetry` instrumentation scaffolding for future metrics.
- **API Keys**: Keys generated server-side (prefix+random secret). Store hashed (SHA-256 + salt). Expose one-way secret to admins.

## 4. Data Flow Overview

1. User clicks “Continue with Azure AD” → front-end hits `/auth/sso/azure` to obtain redirect URL → user authenticates → callback goes to Express API.
2. Express validates token, looks up/creates user + membership, verifies license state, issues signed JWT (short-lived) + refresh token cookie (HTTP-only, SameSite=strict).
3. Front-end stores JWT in memory (Zustand auth slice), uses `ProjectService` to fetch scoped data from API. Service worker caches GET responses for offline usage.
4. Mutations (comments, project updates) are queued client-side when offline; service worker background sync flushes to API once online.
5. API writes changes to Postgres, records `audit_events`, broadcasts collaboration updates (via SSE/WebSocket) to connected clients.

## 5. Security & Compliance

- **Tenant Isolation**: Enforce `organization_id` in every query; RLS + scoped JWT claims.
- **Rate Limiting**: Add `express-rate-limit` per route group and per API key.
- **Secrets Management**: `.env.example` documenting required variables (DB URL, Azure client IDs, JWT secret, Netlify context overrides).
- **Logging**: Structured logs (JSON) with correlation IDs; integrate with monitoring provider (Datadog/New Relic) via log drains.
- **Monitoring Hooks**: `/health` for uptime checks, optional `/metrics` instrumented with Prometheus client.

## 6. Incremental Implementation Plan

1. **Foundation**
   - Scaffold Express server (`server/index.js`) + shared config.
   - Add DB connection manager, migration scripts, and `.env` handling.
   - Extend Netlify build/deploy to include serverless/Edge or containerized API (document both options).

2. **Authentication + RBAC**
   - Implement Azure AD OIDC handshake, JWT issuance, refresh rotation, RBAC middleware.
   - Update front-end with `AuthProvider`, login/logout flows, protected routes.

3. **Multi-tenant Data Model**
   - Create migrations/tables, seed admin org and sample data for local dev.
   - Build `/orgs` + `/projects` endpoints; connect front-end dashboards.

4. **Collaboration + Comments**
   - Implement comments endpoints, integrate UI panel with optimistic updates/offline queue.
   - Record audit events for key operations.

5. **API Keys & External Integrations**
   - Build admin UI to create/revoke API keys; update docs with usage guidelines.
   - Add per-key rate limiting and metrics tagging.

6. **Monitoring & PWA Enhancements**
   - Add `/health`, `/metrics`, integration docs for alerting.
   - Update service worker for background sync + offline mutation queue.

7. **Testing & CI/CD**
   - Expand Vitest to cover auth flows (front-end), API integration tests (supertest + Vitest), RBAC enforcement, offline queue, API key lifecycles.
   - Update GitHub Actions to spin up Postgres service during tests and run full coverage.

## 7. Documentation Deliverables

- `docs/api.md` – Endpoint specs, request/response models, auth requirements.
- `docs/db-schema.md` – ERD, migrations summary, RLS policies.
- `docs/operational-readiness.md` – Monitoring, alerting, SSO setup, troubleshooting.
- README updates – quickstart for full-stack dev (`npm run dev:backend`, etc.), coverage commands, Vite pinned version notes and migration guide.

## 8. Risks & Mitigations

- **Scope**: Enterprise feature set is large → execute in increments, maintain passing tests between phases.
- **SSO Complexity**: Provide local dev stub provider (mock OIDC server) to unblock engineers.
- **Database Ops**: Document migrations + seeding; incorporate `npm run db:migrate` in CI.
- **Offline Sync Conflicts**: Start with last-write-wins; log conflicts and surface warnings in UI.

---

This plan preserves the existing high-perf client experience while layering enterprise-grade identity, collaboration, and observability onto a maintainable Express/Postgres backend.
