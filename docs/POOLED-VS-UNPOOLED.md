# 🔗 Pooled vs Unpooled Connections - Complete Guide

## ✅ Configuration Complete

Both connection types are now configured in your application!

**Status**: ✅ Connected and verified  
**Date**: October 2, 2025

---

## 📊 Connection Comparison

| Feature                | Pooled (Default)               | Unpooled (Direct)             |
| ---------------------- | ------------------------------ | ----------------------------- |
| **Variable**           | `DATABASE_URL`                 | `DATABASE_URL_UNPOOLED`       |
| **Endpoint**           | `ep-noisy-sea-aervqc49-pooler` | `ep-noisy-sea-aervqc49`       |
| **Connection Pooling** | ✅ Yes (managed by Neon)       | ❌ No (direct connection)     |
| **Best For**           | API requests, Serverless       | Migrations, Long transactions |
| **Latency**            | Lower (pooled)                 | Slightly higher               |
| **Connection Limit**   | Higher (pooling)               | Lower (direct)                |
| **Use Case**           | Production API                 | Database operations           |

---

## 🔄 Pooled Connection (Default)

### When to Use (Pooled)

- ✅ **Netlify Functions** - Serverless environment
- ✅ **API Endpoints** - Quick request/response
- ✅ **High concurrency** - Many simultaneous requests
- ✅ **Production workload** - General application traffic

### Configuration (Pooled)

```bash
# In server/.env (local-only; do not commit)
DATABASE_URL=postgresql://<user>:<password>@<pooler-host>/<database>?sslmode=require&channel_binding=require
```

### Example Usage (Pooled)

```javascript
// server/db/pool.js automatically uses DATABASE_URL
import { getPool } from "./db/pool.js";

const pool = getPool();
const result = await pool.query("SELECT * FROM projects");
```

---

## 🔗 Unpooled Connection (Direct)

### When to Use (Unpooled)

- ✅ **Database migrations** - Schema changes
- ✅ **Long transactions** - Complex operations
- ✅ **Batch operations** - Large data imports
- ✅ **Connection-specific features** - Advisory locks, etc.

### Configuration (Unpooled)

```bash
# In server/.env (local-only; do not commit)
DATABASE_URL_UNPOOLED=postgresql://<user>:<password>@<direct-host>/<database>?sslmode=require&channel_binding=require
```

### Example Usage (Unpooled)

```javascript
// For migrations
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_UNPOOLED,
});

// Run migration
await pool.query("ALTER TABLE projects ADD COLUMN ...");
```

---

## 🧪 Testing Both Connections

### Test Pooled Connection

```bash
cd server && node test-connection.mjs
```

**Expected Output:**

```
✅ DATABASE CONNECTION SUCCESSFUL!

📊 Connection Details:
   Database: neondb
   User: neondb_owner
   PostgreSQL: PostgreSQL 17.5
```

### Test Unpooled Connection

```bash
node scripts/db/check-status.mjs
```

**Expected Output:**

```
🔍 Database Connection Status

Connection: 🔗 Direct (Unpooled)
Database: neondb
User: neondb_owner
PostgreSQL: PostgreSQL 17.5

✅ Database ready for migrations!
```

---

## 🔧 Configuration Files Updated

### netlify.toml

```toml
[build.environment]
  DATABASE_URL = "${NETLIFY_DATABASE_URL}"
  DATABASE_URL_UNPOOLED = "${NETLIFY_DATABASE_URL_UNPOOLED}"

[context.production.environment]
  DATABASE_URL = "${NETLIFY_DATABASE_URL}"
  DATABASE_URL_UNPOOLED = "${NETLIFY_DATABASE_URL_UNPOOLED}"

# Same for deploy-preview and branch-deploy contexts
```

### server/.env

```bash
# Pooled connection (default for API)
DATABASE_URL=postgresql://...pooler.../neondb?...

# Unpooled connection (for migrations)
DATABASE_URL_UNPOOLED=postgresql://.../neondb?...
```

---

## 📋 Migration Workflow

### Using Unpooled Connection

The migration scripts automatically use the unpooled connection:

```bash
# Check migration status
npm run db:status

# Run pending migrations
npm run db:migrate

# Check database structure
npm run db:schema
```

---

## 🎯 Best Practices

### ✅ Do's

1. **Use Pooled for API**

   ```javascript
   // In API routes
   import { getPool } from "./db/pool.js";
   const pool = getPool(); // Uses DATABASE_URL (pooled)
   ```

2. **Use Unpooled for Migrations**

   ```javascript
   // In migration scripts
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL_UNPOOLED,
   });
   ```

3. **Close Connections**

   ```javascript
   // Always close when done
   await pool.end();
   ```

4. **Handle Errors**

   ```javascript
   try {
     await pool.query("...");
   } catch (error) {
     console.error("Query failed:", error);
   }
   ```

### ❌ Don'ts

1. ❌ Don't use unpooled for API requests (slower)
2. ❌ Don't keep connections open indefinitely
3. ❌ Don't commit credentials to git
4. ❌ Don't disable SSL in production

---

## 🔒 Security Notes

### Both Connections Use

- ✅ SSL/TLS encryption (`sslmode=require`)
- ✅ Channel binding (`channel_binding=require`)
- ✅ Secure credentials (in environment variables)
- ✅ Same authentication (neondb_owner)

### Differences

- **Pooled**: Connection managed by Neon's pooler
- **Unpooled**: Direct connection to database server

---

## 📊 Performance Characteristics

### Pooled Connection

```
Client → Neon Pooler → Database
         ↑
    Connection reuse
    Lower latency
    Higher concurrency
```

**Metrics:**

- Connection time: ~50ms (reused)
- Query latency: +5-10ms (pooler overhead)
- Max connections: High (pooling)

### Unpooled Connection

```
Client → Database
    ↑
Direct connection
Slightly higher latency
Lower concurrency
```

**Metrics:**

- Connection time: ~100ms (new)
- Query latency: Lower (direct)
- Max connections: Limited

---

## 🧪 Testing Commands

### Connection Tests

```bash
# Test pooled (default)
cd server && node test-connection.mjs

# Test unpooled
node scripts/db/check-status.mjs

# Test both
npm run db:test-all
```

### Migration Tests

```bash
# Check migration status (uses unpooled)
npm run db:status

# Run migrations (uses unpooled)
npm run db:migrate

# Reset database (uses unpooled)
npm run db:reset
```

### API Tests

```bash
# Start server (uses pooled)
npm run dev:netlify

# Test API endpoint
curl http://localhost:8888/api/projects
```

---

## 🚀 Production Deployment

### Netlify Automatically Provides

1. `NETLIFY_DATABASE_URL` (pooled)
2. `NETLIFY_DATABASE_URL_UNPOOLED` (direct)

### netlify.toml Maps Them

```toml
DATABASE_URL = "${NETLIFY_DATABASE_URL}"
DATABASE_URL_UNPOOLED = "${NETLIFY_DATABASE_URL_UNPOOLED}"
```

### Your App Reads

```javascript
process.env.DATABASE_URL; // Pooled (API)
process.env.DATABASE_URL_UNPOOLED; // Unpooled (migrations)
```

**Result**: ✅ Both connections available automatically!

---

## 📚 Documentation

- **Quick Setup**: `NEON-SETUP.md`
- **Connection Guide**: `docs/DATABASE-CONNECTION-GUIDE.md`
- **Success Summary**: `DATABASE-CONNECTION-SUCCESS.md`
- **This Document**: Understanding connection types

---

## 🔍 Troubleshooting

### Pooled Connection Issues

**Problem**: Timeout errors

```
Solution: Connection pool might be full
→ Use unpooled for long operations
→ Check pool configuration
```

**Problem**: "Too many connections"

```
Solution: Neon pooler reached limit
→ Increase pool size in Neon dashboard
→ Use connection pooling client-side
```

### Unpooled Connection Issues

**Problem**: Slower responses

```
Solution: This is expected (no pooling)
→ Use pooled for API requests
→ Reserve unpooled for migrations
```

**Problem**: Connection limit reached

```
Solution: Direct connections limited
→ Close connections promptly
→ Use pooled for concurrent requests
```

---

## ✅ Configuration Checklist

- [x] `DATABASE_URL` configured (pooled)
- [x] `DATABASE_URL_UNPOOLED` configured (direct)
- [x] `netlify.toml` updated with both mappings
- [x] `server/.env` contains both URLs
- [x] Both connections tested successfully
- [x] Migration scripts use unpooled
- [x] API uses pooled by default
- [x] Documentation complete

---

## 🎊 Summary

You now have **two connection types** configured:

1. **Pooled (DATABASE_URL)** - For your API and serverless functions
   - ✅ Fast, efficient, scalable
   - ✅ Default for all application code

2. **Unpooled (DATABASE_URL_UNPOOLED)** - For migrations and admin tasks
   - ✅ Direct connection, better for long operations
   - ✅ Used by migration scripts automatically

**Both are ready to use!** 🚀

---

_Last Updated: October 2, 2025_  
_Connections Verified: Pooled ✅ | Unpooled ✅_  
_Ready for: Development ✅ | Migrations ✅ | Production ✅_
