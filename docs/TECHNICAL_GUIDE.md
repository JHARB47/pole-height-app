# PolePlan Pro - Technical Implementation Guide

## Overview

This document provides technical details for developers implementing or extending the PolePlan Pro enhancements, including:

1. User Authentication & Authorization
2. User-Specific Data Handling
3. Client Partitioning (Multi-Tenant)
4. GIS/GPS Validation
5. CSV Export Customization
6. Testing Strategy

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Auth Service │  │  GIS Validator│  │ CSV Exporter │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Zustand Store (State Management)          │  │
│  │  - User Context  - Projects  - UI Preferences    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                    REST API / JWT
                            │
┌─────────────────────────────────────────────────────────┐
│                    Backend (Node/Express)                │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Auth Routes  │  │  Middleware  │  │ Project API  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                  PostgreSQL + PostGIS                    │
├─────────────────────────────────────────────────────────┤
│  organizations │ users │ projects │ geospatial_cache    │
└─────────────────────────────────────────────────────────┘
```

---

## 1. User Authentication Integration

### Database Schema

The authentication system uses the following tables (already implemented):

```sql
-- Users with SSO support
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL for SSO-only users
    organization_id UUID REFERENCES organizations(id),
    role VARCHAR(50) DEFAULT 'user',

    -- SSO fields
    azure_id VARCHAR(255),
    google_id VARCHAR(255),
    saml_id VARCHAR(255),

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions for token management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Frontend Authentication Service

Location: `src/services/auth.js`

```javascript
class AuthService {
  async login(email, password) {
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    this.handleAuthSuccess(data);
    return data;
  }

  handleAuthSuccess(data) {
    // Store tokens
    localStorage.setItem("poleplan_token", data.tokens.access_token);
    localStorage.setItem("poleplan_refresh", data.tokens.refresh_token);
    localStorage.setItem("poleplan_user", JSON.stringify(data.user));

    // Update store
    useAppStore.getState().setCurrentUser(data.user);
    useAppStore.getState().setIsAuthenticated(true);
  }

  getAuthHeaders() {
    const token = localStorage.getItem("poleplan_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }
}
```

### Backend Authentication Middleware

Location: `server/middleware/auth.js`

```javascript
export const authMiddleware = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err || !user) {
      return res.status(401).json({
        error: "Authentication required",
        code: "AUTH_REQUIRED",
      });
    }

    req.user = user; // Attach user to request
    next();
  })(req, res, next);
};
```

---

## 2. User-Specific Data Handling

### Database Implementation

All user data is associated with `user_id`:

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    project_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast user-specific queries
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_org ON projects(organization_id);
```

### API Implementation

#### Creating User-Specific Projects

```javascript
// POST /api/projects
router.post("/projects", authMiddleware, async (req, res) => {
  const { name, description, project_data } = req.body;
  const user_id = req.user.id; // From auth middleware

  const result = await db.query(
    `INSERT INTO projects (name, description, user_id, organization_id, project_data)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, description, user_id, req.user.organization_id, project_data],
  );

  res.json(result.rows[0]);
});
```

#### Fetching User-Specific Projects

```javascript
// GET /api/projects
router.get("/projects", authMiddleware, async (req, res) => {
  const user_id = req.user.id;

  const result = await db.query(
    `SELECT * FROM projects 
     WHERE user_id = $1 AND deleted_at IS NULL
     ORDER BY updated_at DESC`,
    [user_id],
  );

  res.json(result.rows);
});
```

### Frontend Integration

```javascript
// In React components
import useAppStore from "../utils/store";

function MyProjects() {
  const currentUser = useAppStore((state) => state.currentUser);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (currentUser) {
      fetchUserProjects();
    }
  }, [currentUser]);

  async function fetchUserProjects() {
    const response = await fetch("/api/projects", {
      headers: authService.getAuthHeaders(),
    });
    const data = await response.json();
    setProjects(data);
  }
}
```

---

## 3. Client Partitioning (Multi-Tenant)

### Optional Client Context

For organizations serving multiple clients, add client filtering:

```sql
-- Optional: Extend projects table
ALTER TABLE projects ADD COLUMN client_id VARCHAR(255);
CREATE INDEX idx_projects_client ON projects(client_id);
```

### Store Implementation

```javascript
// In store.js
const useAppStore = create(
  persist((set) => ({
    currentClient: null,
    setCurrentClient: (client) => set({ currentClient: client }),

    // Filter projects by client
    getFilteredProjects: (projects) => {
      const client = useAppStore.getState().currentClient;
      if (!client) return projects;
      return projects.filter((p) => p.client_id === client.id);
    },
  })),
);
```

### API Implementation

```javascript
// GET /api/projects with optional client filter
router.get("/projects", authMiddleware, async (req, res) => {
  const { client_id } = req.query;
  const user_id = req.user.id;

  let query = `SELECT * FROM projects WHERE user_id = $1 AND deleted_at IS NULL`;
  let params = [user_id];

  if (client_id) {
    query += ` AND client_id = $2`;
    params.push(client_id);
  }

  const result = await db.query(query, params);
  res.json(result.rows);
});
```

---

## 4. GIS/GPS Validation

### Validation Module

Location: `src/utils/gisValidation.js`

#### Core Validation Functions

```javascript
export function validateCoordinates(lat, lon) {
  const errors = [];

  const latResult = validateLatitude(lat);
  if (!latResult.valid) errors.push(latResult.error);

  const lonResult = validateLongitude(lon);
  if (!lonResult.valid) errors.push(lonResult.error);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    coordinates: [lonResult.value, latResult.value], // GeoJSON format
  };
}
```

#### Frontend Integration

```javascript
import { validatePoleCoordinates } from "../utils/gisValidation";

function PoleForm({ pole, onChange }) {
  const [validation, setValidation] = useState({ valid: true });

  function handleCoordinateChange(field, value) {
    const updated = { ...pole, [field]: value };
    onChange(updated);

    // Validate on change
    const result = validatePoleCoordinates(updated);
    setValidation(result);
  }

  return (
    <div>
      <input
        value={pole.latitude}
        onChange={(e) => handleCoordinateChange("latitude", e.target.value)}
        className={validation.valid ? "" : "border-red-500"}
      />

      {validation.errors && (
        <div className="text-red-600 text-sm">
          {validation.errors.map((err, i) => (
            <div key={i}>{err}</div>
          ))}
        </div>
      )}

      {validation.warnings && (
        <div className="text-yellow-600 text-sm">
          {validation.warnings.map((warn, i) => (
            <div key={i}>⚠️ {warn}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### Backend Validation

```javascript
// In project creation/update routes
import { validatePoleBatch } from "../utils/gisValidation.js";

router.post("/projects", authMiddleware, async (req, res) => {
  const { poles } = req.body.project_data;

  // Validate all poles
  const validation = validatePoleBatch(poles);

  if (!validation.valid) {
    return res.status(400).json({
      error: "Invalid pole coordinates",
      details: validation.results.filter((r) => !r.valid),
    });
  }

  // Proceed with project creation
  // ...
});
```

---

## 5. CSV Export Customization

### Module Architecture

```
src/utils/csvCustomization.js
├── REGULATORY_FRAMEWORKS   // Framework definitions
├── CSV_COLUMNS             // Column definitions
├── EXPORT_PRESETS          // Quick-start templates
└── Functions
    ├── getDefaultColumns()
    ├── validateColumnSelection()
    └── formatDataForExport()
```

### Integration with Existing Exporters

```javascript
// Extend existing CSV export
import Papa from "papaparse";
import { formatDataForExport } from "../utils/csvCustomization";

export function exportCustomCSV(poles, config) {
  const { framework, columns, useTickMarkFormat } = config;

  // Format data according to selection
  const formattedData = formatDataForExport(poles, columns, {
    framework,
    useTickMarkFormat,
  });

  // Generate CSV
  const csv = Papa.unparse(formattedData);

  // Download
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `poles_export_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
}
```

### UI Integration

```javascript
function ExportButton({ poles }) {
  const [showDialog, setShowDialog] = useState(false);

  function handleExport(config) {
    exportCustomCSV(poles, config);
    setShowDialog(false);
  }

  return (
    <>
      <button onClick={() => setShowDialog(true)}>Export CSV</button>

      {showDialog && (
        <CSVExportDialog
          poles={poles}
          onExport={handleExport}
          onClose={() => setShowDialog(false)}
        />
      )}
    </>
  );
}
```

---

## 6. Testing Strategy

### Unit Tests

#### GIS Validation Tests

```javascript
// src/utils/__tests__/gisValidation.test.js
import { validateCoordinates } from "../gisValidation";

describe("validateCoordinates", () => {
  it("accepts valid coordinates", () => {
    const result = validateCoordinates(45.5, -122.6);
    expect(result.valid).toBe(true);
    expect(result.coordinates).toEqual([-122.6, 45.5]);
  });

  it("rejects invalid latitude", () => {
    const result = validateCoordinates(91, -122.6);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Latitude must be between -90 and 90 degrees",
    );
  });
});
```

#### CSV Customization Tests

```javascript
// src/utils/__tests__/csvCustomization.test.js
import { validateColumnSelection } from "../csvCustomization";

describe("validateColumnSelection", () => {
  it("validates NESC framework requirements", () => {
    const columns = ["poleId", "poleHeight", "voltage"];
    const result = validateColumnSelection(columns, "NESC");
    expect(result.valid).toBe(true);
  });

  it("rejects missing required fields", () => {
    const columns = ["poleId"]; // Missing required fields
    const result = validateColumnSelection(columns, "NESC");
    expect(result.valid).toBe(false);
    expect(result.missingRequired).toContain("voltage");
  });
});
```

### Integration Tests

```javascript
// server/tests/auth.integration.test.js
describe("User Authentication", () => {
  it("creates user-specific projects", async () => {
    // Login as user1
    const auth1 = await request(app)
      .post("/auth/login")
      .send({ email: "user1@example.com", password: "password" });

    // Create project as user1
    const project = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${auth1.body.tokens.access_token}`)
      .send({ name: "User 1 Project" });

    // Login as user2
    const auth2 = await request(app)
      .post("/auth/login")
      .send({ email: "user2@example.com", password: "password" });

    // Fetch projects as user2
    const projects = await request(app)
      .get("/api/projects")
      .set("Authorization", `Bearer ${auth2.body.tokens.access_token}`);

    // User 2 should NOT see user 1's project
    expect(projects.body).not.toContainEqual(
      expect.objectContaining({ id: project.body.id }),
    );
  });
});
```

### End-to-End Tests

```javascript
// tests/e2e/csv-export.test.js
import { test, expect } from "@playwright/test";

test("CSV export with custom columns", async ({ page }) => {
  await page.goto("/");
  await page.fill('[name="email"]', "test@example.com");
  await page.fill('[name="password"]', "password");
  await page.click('button[type="submit"]');

  // Open project
  await page.click("text=My Project");

  // Open export dialog
  await page.click("text=Export");
  await page.click("text=CSV");

  // Select framework
  await page.selectOption('select[name="framework"]', "NESC");

  // Select columns
  await page.check('input[value="poleId"]');
  await page.check('input[value="poleHeight"]');

  // Export
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.click('button:has-text("Export CSV")'),
  ]);

  expect(download.suggestedFilename()).toMatch(
    /poles_export_\d{4}-\d{2}-\d{2}\.csv/,
  );
});
```

---

## 7. API Endpoints Reference

### Authentication

| Method | Endpoint         | Auth | Description                 |
| ------ | ---------------- | ---- | --------------------------- |
| POST   | `/auth/login`    | No   | Email/password login        |
| POST   | `/auth/register` | No   | User registration           |
| POST   | `/auth/refresh`  | No   | Refresh access token        |
| POST   | `/auth/logout`   | Yes  | Logout and invalidate token |
| GET    | `/auth/me`       | Yes  | Get current user info       |

### Projects

| Method | Endpoint                  | Auth | Description              |
| ------ | ------------------------- | ---- | ------------------------ |
| GET    | `/api/projects`           | Yes  | List user's projects     |
| POST   | `/api/projects`           | Yes  | Create new project       |
| GET    | `/api/projects/:id`       | Yes  | Get project details      |
| PUT    | `/api/projects/:id`       | Yes  | Update project           |
| DELETE | `/api/projects/:id`       | Yes  | Delete project           |
| POST   | `/api/projects/:id/share` | Yes  | Share project with users |

### Export

| Method | Endpoint                | Auth | Description                    |
| ------ | ----------------------- | ---- | ------------------------------ |
| POST   | `/api/export/csv`       | Yes  | Export CSV with custom columns |
| POST   | `/api/export/geojson`   | Yes  | Export GeoJSON                 |
| POST   | `/api/export/kml`       | Yes  | Export KML                     |
| POST   | `/api/export/shapefile` | Yes  | Export Shapefile               |

---

## 8. Security Considerations

### Authentication Security

1. **Password Hashing**: Use bcrypt with 12+ rounds
2. **JWT Expiration**: Access tokens expire in 24 hours
3. **Refresh Tokens**: Rotate on use, stored hashed
4. **Rate Limiting**: 5 login attempts per 15 minutes
5. **HTTPS Only**: Enforce HTTPS in production

### Data Access Control

1. **User Isolation**: All queries filtered by `user_id`
2. **Organization Scoping**: Enforce `organization_id` boundaries
3. **Role-Based Access**: Check role before privileged operations
4. **Audit Logging**: Log all data access and modifications

### Input Validation

1. **Coordinate Validation**: Server-side validation of all GIS data
2. **SQL Injection**: Use parameterized queries
3. **XSS Prevention**: Sanitize user input in UI
4. **CSRF Protection**: Use CSRF tokens for state-changing operations

---

## 9. Performance Optimization

### Database Indexes

```sql
-- User-specific queries
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_org ON projects(organization_id);

-- Geospatial queries
CREATE INDEX idx_projects_location ON projects USING GIST(location);

-- Audit and compliance
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

### Caching Strategy

```javascript
// Cache user projects in frontend
const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [lastFetch, setLastFetch] = useState(null);

  useEffect(() => {
    // Only fetch if cache is stale (> 5 minutes)
    const now = Date.now();
    if (!lastFetch || now - lastFetch > 300000) {
      fetchProjects();
    }
  }, []);

  async function fetchProjects() {
    const data = await api.getProjects();
    setProjects(data);
    setLastFetch(Date.now());
  }

  return { projects, refetch: fetchProjects };
};
```

---

## 10. Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Authentication tokens configured
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Backup strategy in place
- [ ] Monitoring alerts set up
- [ ] User documentation deployed
- [ ] API documentation updated

---

**Document Version**: 1.0.0  
**Last Updated**: October 1, 2025  
**Maintained By**: PolePlan Pro Development Team
