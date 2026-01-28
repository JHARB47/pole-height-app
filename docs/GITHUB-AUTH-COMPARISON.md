# GitHub Authentication: App vs OAuth

Quick comparison to help you choose between GitHub App and OAuth App for PolePlan Pro.

## TL;DR Recommendation

**Use GitHub App** ✅ (Modern, secure, recommended by GitHub)

## Side-by-Side Comparison

| Feature                   | GitHub App 🆕          | OAuth App (Legacy)     |
| ------------------------- | ---------------------- | ---------------------- |
| **Setup Complexity**      | Easy                   | Easy                   |
| **Code Changes**          | ✅ None needed         | ✅ Already implemented |
| **Security**              | ⭐⭐⭐⭐⭐ Best        | ⭐⭐⭐ Good            |
| **Permissions**           | Fine-grained           | Broad scopes           |
| **Rate Limits**           | 5,000/hour per install | 5,000/hour total       |
| **GitHub Recommendation** | ✅ Recommended         | ⚠️ Legacy              |
| **User Experience**       | Identical              | Identical              |
| **Future-Proof**          | ✅ Yes                 | ⚠️ May deprecate       |

## Detailed Comparison

### Setup Process

**GitHub App:**

- Create at: <https://github.com/settings/apps/new>
- Set permissions: Email (read-only)
- Get: App ID, Client ID, Client Secret
- Same code, just different credentials

**OAuth App:**

- Create at: <https://github.com/settings/developers>
- Set scope: `user:email`
- Get: Client ID, Client Secret
- Already implemented

### Permissions

**GitHub App:**

```
Account permissions:
✓ Email addresses: Read-only
```

Users see exactly what you can access.

**OAuth App:**

```
Scope: user:email
```

Less transparent to users.

### Rate Limits

**GitHub App:**

- 5,000 requests/hour **per installation**
- Scales with user base
- Example: 1,000 users = 5M requests/hour

**OAuth App:**

- 5,000 requests/hour **total**
- Shared across all users
- Can hit limits with growth

### Security Model

**GitHub App:**

- Installation-based (user installs app)
- Can use private key authentication
- Granular permission control
- Easier to audit

**OAuth App:**

- User authorization only
- Client secret only
- Broad scope access
- Less granular

### User Experience

**Both are identical:**

1. Click "Sign in with GitHub"
2. Authorize on GitHub
3. Redirect back with tokens
4. Logged in

Users won't notice the difference.

### Code Requirements

**Good news:** The code is **exactly the same** for both!

```javascript
// Works for BOTH GitHub App and OAuth App
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/auth/github/callback",
      scope: ["user:email"],
    },
    callback,
  ),
);
```

The only difference is where you create the app on GitHub.

## When to Use Each

### Use GitHub App if

- ✅ Starting fresh (recommended)
- ✅ Want best practices
- ✅ Need higher rate limits
- ✅ Want fine-grained permissions
- ✅ Plan to grow user base
- ✅ Want future-proof solution

### Use OAuth App if

- ✅ Already have one set up
- ✅ Need to ship immediately
- ✅ Don't need API calls (just auth)
- ⚠️ Don't mind legacy approach

## Migration Path

Already have an OAuth App? No problem!

### Option 1: Keep OAuth App

- Works fine for authentication only
- No migration needed
- Consider upgrading later

### Option 2: Add GitHub App (Recommended)

- Both can coexist
- Same code works for both
- Update `.env` when ready
- Users won't notice

### Option 3: Full Switch

- Create GitHub App
- Update environment variables
- Delete OAuth App after testing
- Zero downtime

## Setup Time

**GitHub App:** ~5 minutes  
**OAuth App:** ~5 minutes

Both are equally fast to set up.

## What PolePlan Pro Needs

For **authentication only** (current use case):

- ✅ Read user email
- ✅ Get user profile (name, avatar)
- ❌ Don't need repo access
- ❌ Don't need to make API calls

**Both work perfectly for this!**

But GitHub App is better for:

- Future features (if you add GitHub integration)
- Higher rate limits (as you grow)
- Security best practices
- GitHub's recommendation

## My Recommendation for PolePlan Pro

### Immediate: OAuth App ✅

**Why:**

- ✅ Already implemented
- ✅ Works right now
- ✅ Zero changes needed
- ✅ Ship faster

**Action:**

1. Follow [GITHUB-OAUTH-SETUP.md](./GITHUB-OAUTH-SETUP.md)
2. Create OAuth App (5 minutes)
3. Add credentials to `.env`
4. Done!

### Long-term: GitHub App ✅

**Why:**

- ✅ Better architecture
- ✅ Future-proof
- ✅ GitHub's recommendation
- ✅ No migration needed (just update creds)

**Action:**

1. When you have time, follow [GITHUB-APP-SETUP.md](./GITHUB-APP-SETUP.md)
2. Create GitHub App (5 minutes)
3. Update `.env` with new credentials
4. Test and switch over
5. Delete old OAuth App

## Quick Decision Matrix

```
Need it NOW?
└─ Yes → OAuth App (already implemented)
   └─ Follow: GITHUB-OAUTH-SETUP.md

Want best practices?
└─ Yes → GitHub App (recommended)
   └─ Follow: GITHUB-APP-SETUP.md

Not sure?
└─ Start with OAuth App
   └─ Upgrade to GitHub App later (easy!)
```

## Environment Variables

**Both use the same variable names:**

```bash
# OAuth App
GITHUB_CLIENT_ID=abc123...
GITHUB_CLIENT_SECRET=secret123...

# GitHub App (just different values)
GITHUB_APP_ID=123456
GITHUB_CLIENT_ID=Iv1.abc123...
GITHUB_CLIENT_SECRET=secret456...
```

The code reads the same variables!

## Code Compatibility

**This code works for both:**

```javascript
// server/config/passport.js
import { Strategy as GitHubStrategy } from "passport-github2";

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID, // ✅ Works for both
      clientSecret: process.env.GITHUB_CLIENT_SECRET, // ✅ Works for both
      callbackURL: "/auth/github/callback",
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      // ... authentication logic
    },
  ),
);
```

## Testing Both

You can test both at the same time!

**Development: OAuth App**

```bash
GITHUB_CLIENT_ID=oauth_client_id
GITHUB_CLIENT_SECRET=oauth_secret
```

**Production: GitHub App**

```bash
GITHUB_CLIENT_ID=Iv1.github_app_client_id
GITHUB_CLIENT_SECRET=github_app_secret
```

## Summary

**For PolePlan Pro right now:**

1. ✅ **OAuth App works great** - already implemented, ship today
2. ✅ **GitHub App is better** - upgrade later when you have time
3. ✅ **Both use same code** - switching is easy
4. ✅ **No wrong choice** - both work perfectly for authentication

## Action Items

### Immediate (Today)

```bash
# Option A: OAuth App (fastest)
1. Go to https://github.com/settings/developers
2. Create OAuth App
3. Add credentials to .env
4. Test: http://localhost:3001/auth/github
5. ✅ Done!
```

### Later (When You Have Time)

```bash
# Option B: GitHub App (recommended)
1. Go to https://github.com/settings/apps/new
2. Create GitHub App
3. Update credentials in .env
4. Test: http://localhost:3001/auth/github
5. Delete old OAuth App
6. ✅ Done!
```

## Questions?

- **"Which should I use?"** → Start with OAuth App, upgrade to GitHub App later
- **"Is migration hard?"** → No! Just update environment variables
- **"Will users notice?"** → No, experience is identical
- **"Does code change?"** → No, same code works for both
- **"Can I use both?"** → Yes, but you'd pick one in `.env`

## Resources

- [GitHub App Setup Guide](./GITHUB-APP-SETUP.md) - Recommended approach
- [OAuth App Setup Guide](./GITHUB-OAUTH-SETUP.md) - Quick setup
- [GitHub's Official Comparison](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps)

---

**Bottom Line:** OAuth App to ship fast today, GitHub App for best practices long-term. Either way, you're good! 🚀
