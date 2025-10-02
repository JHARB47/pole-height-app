# API Documentation - Projects Endpoint

## Overview
The `/api/projects` endpoint provides full CRUD operations for project management with user data isolation, pagination, and search capabilities.

**Base URL**: `/api/projects`  
**Authentication**: Required (JWT Bearer token)  
**Content-Type**: `application/json`

---

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### User Context
All operations are automatically scoped to the authenticated user. Projects are filtered by:
- `user_id` (automatic, from JWT token)
- `organization_id` (optional filter)
- `client_id` (optional filter)

---

## Endpoints

### 1. List Projects

Get a paginated list of projects for the authenticated user.

**Endpoint**: `GET /api/projects`

#### Query Parameters

| Parameter | Type | Required | Default | Max | Description |
|-----------|------|----------|---------|-----|-------------|
| `page` | integer | No | 1 | - | Page number (1-indexed) |
| `limit` | integer | No | 50 | 100 | Items per page |
| `search` | string | No | - | - | Search in project names (case-insensitive) |
| `sort` | string | No | `updated_at` | - | Sort field: `name`, `created_at`, `updated_at` |
| `order` | string | No | `desc` | - | Sort order: `asc`, `desc` |
| `organization_id` | string | No | - | - | Filter by organization |
| `client_id` | string | No | - | - | Filter by client |

#### Request Example

```bash
# Basic request (first page, 50 items)
curl -X GET "http://localhost:3000/api/projects" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With pagination
curl -X GET "http://localhost:3000/api/projects?page=2&limit=25" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With search
curl -X GET "http://localhost:3000/api/projects?search=mainstreet" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Complex query
curl -X GET "http://localhost:3000/api/projects?search=2024&client_id=client123&sort=name&order=asc&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Response (200 OK)

```json
{
  "success": true,
  "projects": [
    {
      "id": 1,
      "name": "Main Street Line Extension",
      "user_id": "user_123",
      "organization_id": "org_456",
      "client_id": "client_789",
      "project_data": {
        "poles": [
          {
            "id": "P1",
            "latitude": 37.7749,
            "longitude": -122.4194,
            "height": 40,
            "groundLineClearance": 15.5
          }
        ]
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-10-01T14:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 237,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### Response Fields

**projects** (array): Array of project objects
- `id` (integer): Project ID
- `name` (string): Project name
- `user_id` (string): Owner user ID
- `organization_id` (string): Organization ID
- `client_id` (string): Client ID
- `project_data` (object): Project data including poles
- `created_at` (string): ISO 8601 timestamp
- `updated_at` (string): ISO 8601 timestamp

**pagination** (object): Pagination metadata
- `page` (integer): Current page number
- `limit` (integer): Items per page
- `total` (integer): Total number of projects
- `totalPages` (integer): Total number of pages
- `hasNextPage` (boolean): Whether there's a next page
- `hasPrevPage` (boolean): Whether there's a previous page

#### Error Responses

**401 Unauthorized**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Failed to fetch projects"
}
```

---

### 2. Get Single Project

Retrieve a specific project by ID. Only returns projects owned by the authenticated user.

**Endpoint**: `GET /api/projects/:id`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Project ID |

#### Request Example

```bash
curl -X GET "http://localhost:3000/api/projects/123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Response (200 OK)

```json
{
  "success": true,
  "project": {
    "id": 123,
    "name": "Oak Street Upgrade",
    "user_id": "user_123",
    "organization_id": "org_456",
    "client_id": "client_789",
    "project_data": {
      "poles": [
        {
          "id": "P1",
          "latitude": 37.7749,
          "longitude": -122.4194,
          "height": 40
        }
      ]
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-10-01T14:20:00Z"
  }
}
```

#### Error Responses

**404 Not Found**
```json
{
  "success": false,
  "error": "Project not found"
}
```

---

### 3. Create Project

Create a new project with automatic GIS validation for pole coordinates.

**Endpoint**: `POST /api/projects`

#### Request Body

```json
{
  "name": "New Line Project",
  "organization_id": "org_456",
  "client_id": "client_789",
  "project_data": {
    "poles": [
      {
        "id": "P1",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "height": 40
      },
      {
        "id": "P2",
        "latitude": 34.0522,
        "longitude": -118.2437,
        "height": 45
      }
    ]
  }
}
```

#### Request Example

```bash
curl -X POST "http://localhost:3000/api/projects" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Line Project",
    "organization_id": "org_456",
    "client_id": "client_789",
    "project_data": {
      "poles": [
        {
          "id": "P1",
          "latitude": 37.7749,
          "longitude": -122.4194,
          "height": 40
        }
      ]
    }
  }'
```

#### Response (201 Created)

```json
{
  "success": true,
  "project": {
    "id": 124,
    "name": "New Line Project",
    "user_id": "user_123",
    "organization_id": "org_456",
    "client_id": "client_789",
    "project_data": {
      "poles": [...]
    },
    "created_at": "2024-10-01T15:30:00Z",
    "updated_at": "2024-10-01T15:30:00Z"
  }
}
```

#### Error Responses

**400 Bad Request - Validation Error**
```json
{
  "success": false,
  "error": "Invalid pole coordinates",
  "validationErrors": [
    {
      "poleId": "P1",
      "errors": ["Latitude must be between -90 and 90 degrees"],
      "warnings": []
    }
  ]
}
```

**400 Bad Request - Missing Name**
```json
{
  "success": false,
  "error": "Project name is required"
}
```

---

### 4. Update Project

Update an existing project. Includes ownership check and GIS validation.

**Endpoint**: `PUT /api/projects/:id`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Project ID |

#### Request Body

Supports partial updates. Only include fields you want to update.

```json
{
  "name": "Updated Project Name",
  "project_data": {
    "poles": [
      {
        "id": "P1",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "height": 45
      }
    ]
  }
}
```

#### Request Example

```bash
curl -X PUT "http://localhost:3000/api/projects/123" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Project Name",
    "project_data": {
      "poles": [...]
    }
  }'
```

#### Response (200 OK)

```json
{
  "success": true,
  "project": {
    "id": 123,
    "name": "Updated Project Name",
    "user_id": "user_123",
    "organization_id": "org_456",
    "client_id": "client_789",
    "project_data": {
      "poles": [...]
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-10-01T15:45:00Z"
  }
}
```

#### Error Responses

**403 Forbidden**
```json
{
  "success": false,
  "error": "Not authorized to update this project"
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": "Project not found"
}
```

---

### 5. Delete Project

Delete a project. Ownership check required.

**Endpoint**: `DELETE /api/projects/:id`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Project ID |

#### Request Example

```bash
curl -X DELETE "http://localhost:3000/api/projects/123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

#### Error Responses

**403 Forbidden**
```json
{
  "success": false,
  "error": "Not authorized to delete this project"
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": "Project not found"
}
```

---

### 6. Validate Coordinates

Batch validate all pole coordinates in a project.

**Endpoint**: `POST /api/projects/:id/validate-coordinates`

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Project ID |

#### Request Example

```bash
curl -X POST "http://localhost:3000/api/projects/123/validate-coordinates" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Response (200 OK)

```json
{
  "success": true,
  "validation": {
    "total": 3,
    "valid": 2,
    "invalid": 1,
    "details": [
      {
        "poleId": "P1",
        "valid": true,
        "errors": [],
        "warnings": []
      },
      {
        "poleId": "P2",
        "valid": true,
        "errors": [],
        "warnings": []
      },
      {
        "poleId": "P3",
        "valid": false,
        "errors": ["Latitude must be between -90 and 90 degrees"],
        "warnings": []
      }
    ]
  }
}
```

---

## Data Models

### Project Object

```typescript
interface Project {
  id: number;
  name: string;
  user_id: string;
  organization_id?: string;
  client_id?: string;
  project_data: {
    poles: Pole[];
    [key: string]: any;
  };
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}
```

### Pole Object

```typescript
interface Pole {
  id: string;
  latitude: number;
  longitude: number;
  height: number;
  groundLineClearance?: number;
  midspanClearance?: number;
  verticalClearance?: number;
  horizontalClearance?: number;
  [key: string]: any;
}
```

---

## Rate Limits

- **Per User**: 100 requests per minute
- **Burst**: 20 requests per second

Exceeded rate limits return:

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

---

## Best Practices

### Pagination
1. **Start with reasonable limits**: Use `limit=50` for initial loads
2. **Use cursor-based for large datasets**: Request next page using `page` parameter
3. **Cache pagination metadata**: Store `totalPages` to show progress

### Search
1. **Debounce search input**: Wait 300ms after user stops typing
2. **Use partial matching**: Search works with partial project names
3. **Combine with filters**: Search + organization_id for scoped results

### Performance
1. **Request only needed fields**: Consider adding field selection in future
2. **Use appropriate page sizes**: Smaller pages (10-25) for mobile, larger (50-100) for desktop
3. **Sort strategically**: Default `updated_at desc` shows recent projects first

### Error Handling
1. **Always check `success` field**: Don't assume success from HTTP status alone
2. **Handle validation errors gracefully**: Show specific validation messages to users
3. **Implement retry logic**: For 500 errors, retry with exponential backoff

---

## Migration Guide

### From Old API (No Pagination)

**Before:**
```javascript
const response = await fetch('/api/projects');
const { projects } = await response.json();
```

**After:**
```javascript
const response = await fetch('/api/projects?page=1&limit=50');
const { projects, pagination } = await response.json();

// Handle pagination
if (pagination.hasNextPage) {
  // Load more...
}
```

---

## Testing

### Example Test Suite

```javascript
describe('Projects API', () => {
  it('should paginate results', async () => {
    const response = await fetch('/api/projects?page=1&limit=10');
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.projects.length).toBeLessThanOrEqual(10);
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(10);
  });
  
  it('should search projects', async () => {
    const response = await fetch('/api/projects?search=main');
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(data.projects.every(p => 
      p.name.toLowerCase().includes('main')
    )).toBe(true);
  });
});
```

---

## Changelog

### Version 2.0 (October 2024)
- ✅ Added pagination support (page, limit)
- ✅ Added full-text search (search parameter)
- ✅ Added sorting (sort, order parameters)
- ✅ Enhanced filtering (organization_id, client_id)
- ✅ Added pagination metadata in responses
- ✅ Improved performance for large datasets

### Version 1.0 (Previous)
- Basic CRUD operations
- User data isolation
- GIS coordinate validation
- Organization/client filtering

---

## Support

For issues or questions:
- **Documentation**: See PHASE-2-ENHANCEMENTS.md
- **Testing**: Run `node scripts/test/manual-testing-guide.mjs`
- **Examples**: Check `docs/API-EXAMPLES.md`

---

*Last Updated: October 2024*
