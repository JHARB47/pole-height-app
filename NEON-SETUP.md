# 🚀 Quick Setup - Neon Database Connection

## TL;DR
**Netlify handles everything automatically! Just update one file for local dev.**

---

## ✅ 3-Step Setup

### Step 1: Get Your Neon URL (2 minutes)
1. Go to https://app.netlify.com
2. Select your site → **Environment variables**
3. Find `NETLIFY_DATABASE_URL` and copy its value
4. Should look like: `postgresql://user:pass@ep-xxxxx.region.neon.tech/neondb?sslmode=require`

### Step 2: Update Local Environment (1 minute)
Edit `server/.env` and replace the DATABASE_URL:

```bash
DATABASE_URL=postgresql://[paste-your-url-here]
```

### Step 3: Test Connection (30 seconds)
```bash
cd server
node -e "import('./db/pool.js').then(m => m.getPool().query('SELECT NOW()')).then(r => console.log('✅ Connected:', r.rows[0]))"
```

**See "✅ Connected"?** You're done! 🎉

---

## 📋 What I Fixed

1. ✅ **netlify.toml** - Added `DATABASE_URL = "${NETLIFY_DATABASE_URL}"` mapping
2. ✅ **server/.env** - Created template (you need to add your URL)
3. ✅ **Git conflicts** - Cleaned up merge conflicts in netlify.toml

---

## 🎯 How It Works

```
Neon → NETLIFY_DATABASE_URL (set by Netlify)
       ↓
       netlify.toml maps it to DATABASE_URL
       ↓
       Your app reads DATABASE_URL
       ↓
       ✅ Connected!
```

**Production**: Automatic - no action needed
**Local Dev**: Update server/.env once

---

## 🧪 Quick Tests

### Test 1: Database Connection
```bash
cd server && node -e "import('./db/pool.js').then(m => m.getPool().query('SELECT NOW()')).then(console.log)"
```

### Test 2: Run Migrations (if needed)
```bash
cd server && npm run db:migrate
```

### Test 3: Start Development Server
```bash
npm run dev:netlify
```

### Test 4: Health Check (after deploy)
```bash
curl https://your-site.netlify.app/.netlify/functions/health
```

---

## 🐛 Common Issues

### "DATABASE_URL is required"
→ Update `server/.env` with your Neon URL

### "connection timeout"
→ Add `?sslmode=require` to your URL

### "relation does not exist"
→ Run migrations: `cd server && npm run db:migrate`

---

## 📝 Files Modified

- ✅ `netlify.toml` - Database URL mapping
- ✅ `server/.env` - Local dev config (you need to update)
- ✅ `docs/DATABASE-CONNECTION-GUIDE.md` - Full documentation

---

## 🔗 Next Steps

1. Update `server/.env` with your Neon URL ← **Do this now**
2. Test connection with command above
3. Run migrations if needed
4. Start developing!

Full docs: `docs/DATABASE-CONNECTION-GUIDE.md`

---

*Setup Time: ~5 minutes • Last Updated: October 1, 2025*
