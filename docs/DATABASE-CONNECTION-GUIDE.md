# Database Connection Guide - Neon + Netlify

## 🎯 Quick Answer

**No, you don't need to manually connect PostgreSQL!** Neon handles everything through Netlify automatically. Your environment variables are already configured - you just need to map them correctly.

---

## ✅ What's Already Done

### Netlify Side (Production)
- ✅ Neon database provisioned
- ✅ `NETLIFY_DATABASE_URL` configured (pooled connection)
- ✅ `NETLIFY_DATABASE_URL_UNPOOLED` configured (direct connection)
- ✅ Environment variables set for all contexts (Production, Deploy Previews, Branch deploys)

### Code Side
- ✅ Database pool configuration in `server/db/pool.js`
- ✅ Connection handling in `server/db/client.js`
- ✅ Environment loader in `server/config/env.js`
- ✅ Migration configuration in `server/db/migrate.config.cjs`

---

## 🔧 What You Need to Do

### 1. Update Local Environment File

I've created `server/.env` with a template. **You need to update it with your actual Neon database URL**:

```bash
# Get your database URL from Netlify dashboard
# Navigate to: Site → Environment Variables → NETLIFY_DATABASE_URL
# Copy the value and paste it below
DATABASE_URL=postgresql://username:password@ep-xxxxx.region.neon.tech/neondb?sslmode=require
```

**How to get your Neon URL:**
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site (pole-height-app)
3. Go to **Site settings** → **Environment variables**
4. Find `NETLIFY_DATABASE_URL`
5. Click to reveal the value
6. Copy the full connection string
7. Paste it into `server/.env` replacing the placeholder

### 2. Netlify Configuration Updated

I've updated `netlify.toml` to map Neon's environment variable:

```toml
[build.environment]
  DATABASE_URL = "${NETLIFY_DATABASE_URL}"
```

This maps Neon's `NETLIFY_DATABASE_URL` → your app's `DATABASE_URL`.

### 3. Choose the Right Database URL

Neon provides **two connection strings**:

#### Option A: Pooled Connection (Recommended for Serverless)
```
NETLIFY_DATABASE_URL
```
- ✅ Use this for Netlify Functions
- ✅ Handles connection pooling automatically
- ✅ Better for serverless environments
- ✅ Lower latency

#### Option B: Unpooled Connection
```
NETLIFY_DATABASE_URL_UNPOOLED
```
- Use for migrations
- Use for long-running connections
- Use for transaction-heavy operations

**Default**: Use `NETLIFY_DATABASE_URL` (pooled) for the API.

---

## 🚀 Testing Database Connection

### Local Development

1. **Update `.env` file** with your Neon URL (see step 1 above)

2. **Test connection**:
```bash
cd server
node -e "import('./db/pool.js').then(m => m.getPool().query('SELECT NOW()')).then(r => console.log('✅ Connected:', r.rows[0]))"
```

3. **Run migrations** (if database is empty):
```bash
cd server
npm run db:migrate
```

4. **Start server**:
```bash
npm start
# or from root:
npm run dev:netlify
```

### Production (Netlify)

The connection happens automatically! Just deploy:

```bash
git add netlify.toml
git commit -m "Configure Neon database connection"
git push origin main
```

Netlify will:
1. Read `NETLIFY_DATABASE_URL` from environment
2. Map it to `DATABASE_URL` via `netlify.toml`
3. Your app reads `process.env.DATABASE_URL`
4. Connection established ✅

---

## 🔍 How It Works

### Connection Flow

```
┌─────────────────┐
│  Neon Database  │
│   (Postgres)    │
└────────┬────────┘
         │
         │ Provisioned by Neon Integration
         │
         ▼
┌─────────────────────────┐
│  Netlify Environment    │
│  Variables              │
│  ┌───────────────────┐  │
│  │ NETLIFY_DATABASE_ │  │
│  │ URL = postgres:// │  │
│  │ ...neon.tech/...  │  │
│  └───────────────────┘  │
└────────┬────────────────┘
         │
         │ Mapped in netlify.toml
         │
         ▼
┌─────────────────────────┐
│  Your Application       │
│  ┌───────────────────┐  │
│  │ DATABASE_URL =    │  │
│  │ ${NETLIFY_        │  │
│  │  DATABASE_URL}    │  │
│  └───────────────────┘  │
└────────┬────────────────┘
         │
         │ Read by server/config/env.js
         │
         ▼
┌─────────────────────────┐
│  Database Pool          │
│  (server/db/pool.js)    │
│  ┌───────────────────┐  │
│  │ new Pool({        │  │
│  │   connectionString│  │
│  │ })                │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

### Code Walkthrough

1. **Environment Loading** (`server/config/env.js`):
```javascript
databaseUrl: process.env.DATABASE_URL || ...
```

2. **Pool Creation** (`server/db/pool.js`):
```javascript
pool = new Pool({ connectionString: ENV.databaseUrl });
```

3. **Query Execution** (`server/db/client.js`):
```javascript
const pool = getPool();
return pool.query(text, params);
```

---

## 🛠️ Configuration Files Updated

### ✅ `netlify.toml`
- Fixed git merge conflicts
- Added `DATABASE_URL = "${NETLIFY_DATABASE_URL}"` to all contexts
- Production, Deploy Previews, Branch deploys all configured

### ✅ `server/.env` (Created)
- Template for local development
- You need to add your actual Neon URL
- Includes JWT secrets, CORS, logging config

### ✅ Existing Files (No Changes Needed)
- `server/db/pool.js` - Already reads `DATABASE_URL`
- `server/config/env.js` - Already loads from environment
- `server/db/client.js` - Already uses pool

---

## 🔐 Security Best Practices

### ✅ Do's
- ✅ Keep database URL in environment variables
- ✅ Use connection pooling for serverless
- ✅ Enable SSL/TLS (`?sslmode=require` in URL)
- ✅ Use different URLs for dev/staging/prod
- ✅ Rotate credentials periodically

### ❌ Don'ts
- ❌ Don't commit `.env` file to git (it's in `.gitignore`)
- ❌ Don't hardcode database credentials
- ❌ Don't share production URLs in documentation
- ❌ Don't disable SSL in production
- ❌ Don't use unpooled connections for Netlify Functions

---

## 🧪 Testing Checklist

- [ ] **Local Connection Test**
  ```bash
  cd server && node -e "import('./db/pool.js').then(m => m.getPool().query('SELECT NOW()')).then(r => console.log('✅', r.rows[0]))"
  ```

- [ ] **Netlify Function Test** (after deploy)
  ```bash
  curl https://your-site.netlify.app/.netlify/functions/health
  ```
  Should return database connection status.

- [ ] **API Test** (after deploy)
  ```bash
  curl https://your-site.netlify.app/api/projects
  ```
  Should return projects (or 401 if auth required).

- [ ] **Migration Test** (if needed)
  ```bash
  cd server && npm run db:migrate
  ```
  Should create all tables and schemas.

---

## 🐛 Troubleshooting

### Problem: "DATABASE_URL is required"
**Solution**: Update `server/.env` with your Neon URL from Netlify dashboard.

### Problem: Connection timeout
**Solution**: 
1. Check SSL mode: Add `?sslmode=require` to URL
2. Check firewall/network
3. Verify Neon database is running

### Problem: "relation does not exist"
**Solution**: Run migrations:
```bash
cd server && npm run db:migrate
```

### Problem: Too many connections
**Solution**: 
1. Use pooled connection (`NETLIFY_DATABASE_URL`)
2. Check pool configuration in `pool.js`
3. Reduce max connections if needed

### Problem: Unauthorized
**Solution**: 
1. Check username/password in connection string
2. Verify database exists
3. Check Neon dashboard for access issues

---

## 📚 Additional Resources

- **Neon Documentation**: https://neon.tech/docs
- **Netlify Environment Variables**: https://docs.netlify.com/environment-variables/overview/
- **node-postgres (pg)**: https://node-postgres.com/
- **Your Migration Guide**: `server/db/README.md`

---

## ✅ Next Steps

1. **Update `server/.env`** with your actual Neon URL
2. **Test local connection** with the command above
3. **Run migrations** if database is empty
4. **Deploy to Netlify** - connection is automatic
5. **Test production** with health endpoint

---

*Last Updated: October 1, 2025*
*Database: Neon Postgres (Serverless)*
*Deployment: Netlify*
