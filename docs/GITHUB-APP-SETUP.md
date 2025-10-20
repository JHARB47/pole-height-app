# GitHub App Setup Guide

This guide walks you through setting up GitHub App authentication for PolePlan Pro. GitHub Apps are the modern, recommended approach over OAuth Apps.

## Why GitHub App vs OAuth App?

**GitHub Apps offer:**

- ✅ Fine-grained permissions (only request what you need)
- ✅ Higher rate limits
- ✅ Better security model (installation-based)
- ✅ Can act as a bot or user
- ✅ Official GitHub recommendation for new integrations

## Prerequisites

- GitHub account with admin access
- Access to the PolePlan Pro server environment variables
- Database access to run migrations

## Step 1: Create GitHub App

### 1. Navigate to GitHub App Settings

Go to [GitHub Apps](https://github.com/settings/apps) and click **"New GitHub App"**

Or go directly to: <https://github.com/settings/apps/new>

### 2. Fill in Basic Information

**GitHub App name:** `PolePlan Pro` (must be globally unique)

**Homepage URL:** `https://poleplanpro.com`

**Description:** (Optional)

```
NESC-compliant pole attachment calculations with geospatial capabilities. 
Sign in with your GitHub account for seamless authentication.
```

**Callback URL:**

```
https://api.poleplanpro.com/auth/github/callback
```

For development, you can add:

```
http://localhost:3001/auth/github/callback
```

> **Note:** GitHub Apps support multiple callback URLs!

### 3. Configure Webhooks

**Webhook:** ❌ Uncheck "Active" (we don't need webhooks for authentication only)

### 4. Set Permissions

Under **"Permissions"**, configure:

**Account permissions:**

- **Email addresses:** Read-only (required)

> **That's it!** We only need email access for authentication.

### 5. Configure User Authentication

Scroll to **"Identifying and authorizing users"** section:

**Request user authorization (OAuth) during installation:** ✅ Check this

**Callback URL:** (Should be pre-filled from step 2)

- Production: `https://api.poleplanpro.com/auth/github/callback`
- Development: `http://localhost:3001/auth/github/callback`

**Enable Device Flow:** ❌ Leave unchecked

**Webhook URL:** Leave empty (we don't need webhooks)

**Webhook secret:** Leave empty

### 6. Post Installation

**Redirect on update:** ❌ Leave unchecked

**Setup URL:** Leave empty

### 7. Create the App

- Check **"Any account"** (allow any GitHub user to authenticate)
- Click **"Create GitHub App"**

### 8. Get Your Credentials

After creation, you'll see:

1. **App ID** - Copy this (example: `123456`)
2. **Client ID** - Copy this (starts with `Iv1.`)
3. **Client secrets** - Click "Generate a new client secret" and copy immediately

> ⚠️ **Important:** Save the client secret now - you can't see it again!

### 9. App Icon (Optional)

Upload a logo/icon for your app (recommended for user trust):

- Go to your app settings
- Scroll to "Display information"
- Upload an image (200x200px PNG/JPG)

## Step 2: Update Backend Configuration

### Update passport.js Strategy

The good news: **No code changes needed!** 

The `passport-github2` strategy we installed works with both OAuth Apps AND GitHub Apps. The authentication flow is identical.

### Configure Environment Variables

Add to `server/.env`:

```bash
# GitHub App Authentication
GITHUB_APP_ID=2081234
GITHUB_CLIENT_ID=Iv23liItM1R8qgZPwcAh
GITHUB_CLIENT_SECRET=your-client-secret-here
```

> **Note:** The `GITHUB_CLIENT_ID` is what Passport.js uses for authentication.

## Step 3: Run Database Migration

```bash
npm run migrate
```

This adds the `github_id` column to the users table (if not already done).

## Step 4: Restart Server

```bash
# Development
npm run dev

# Production
pm2 restart poleplan-server
```

## Step 5: Test Authentication

### Test the Flow

1. Open browser to: `http://localhost:3001/auth/github`
2. You should see the GitHub authorization screen
3. It will say **"PolePlan Pro by [your-username] wants to access your GitHub account"**
4. Click **"Authorize PolePlan Pro"**
5. You'll be redirected back with authentication tokens

### Verify in GitHub

Go to [Authorized GitHub Apps](https://github.com/settings/apps/authorizations) to see PolePlan Pro listed.

## Differences: GitHub App vs OAuth App

### What Users See

**GitHub App:**

```
PolePlan Pro by YourOrg wants to access:
✓ Read your email addresses
```

**OAuth App:**

```
Authorize PolePlan Pro
This application wants to:
• Access your email address
```

### Revocation

**GitHub App:**

- Users can revoke at: <https://github.com/settings/apps/authorizations>
- More granular control

**OAuth App:**

- Users revoke at: <https://github.com/settings/applications>

### API Rate Limits

**GitHub App:** 5,000 requests/hour per installation  
**OAuth App:** 5,000 requests/hour (total)

## Advanced: Acting on Behalf of Users

If you later want to make GitHub API calls on behalf of users (e.g., read repos, create issues):

### 1. Request Additional Permissions

In your GitHub App settings, add permissions:

- **Repository permissions > Contents:** Read-only
- **Repository permissions > Issues:** Read and write
- etc.

### 2. Get Installation Access Token

```javascript
// server/services/github.js
import { App } from '@octokit/app';

const app = new App({
  appId: process.env.GITHUB_APP_ID,
  privateKey: process.env.GITHUB_PRIVATE_KEY,
});

async function getInstallationToken(installationId) {
  const { token } = await app.octokit.rest.apps.createInstallationAccessToken({
    installation_id: installationId,
  });
  return token;
}
```

### 3. Store Installation ID

When users authenticate, store their `installation_id`:

```javascript
// In passport strategy callback
const installations = await github.apps.getUserInstallations({
  headers: { authorization: `Bearer ${accessToken}` }
});
```

> **Note:** This is optional and only needed for advanced use cases!

## Security Best Practices

### 1. Use GitHub App Private Key (Production)

For enhanced security, GitHub Apps can use private keys instead of client secrets.

**Generate Private Key:**

1. Go to your GitHub App settings
2. Scroll to "Private keys"
3. Click "Generate a private key"
4. Download the `.pem` file

**Store Securely:**

```bash
# Don't commit this!
GITHUB_PRIVATE_KEY="$(cat path/to/your-app.pem)"
```

**Use in Production:**

```javascript
// For making API calls as the app
import { App } from '@octokit/app';

const app = new App({
  appId: process.env.GITHUB_APP_ID,
  privateKey: process.env.GITHUB_PRIVATE_KEY,
});
```

### 2. Validate Installation

Verify the user has installed your app:

```javascript
// server/middleware/github-app.js
export async function requireGitHubApp(req, res, next) {
  const user = req.user;
  
  if (!user.github_installation_id) {
    return res.status(403).json({
      error: 'GitHub App not installed',
      install_url: `https://github.com/apps/poleplan-pro/installations/new`
    });
  }
  
  next();
}
```

### 3. Rotate Secrets Regularly

- Rotate client secrets every 90 days
- Use GitHub's secret scanning to detect leaks
- Never commit secrets to git

### 4. Monitor Usage

Check your app's usage:

- Go to GitHub App settings
- View "Advanced" tab
- Monitor API calls, auth requests, etc.

## User Experience

### First-Time Users

1. Click "Sign in with GitHub"
2. See: "PolePlan Pro wants to access your GitHub account"
3. Click "Authorize PolePlan Pro"
4. Redirected back to PolePlan Pro, logged in

### Returning Users

1. Click "Sign in with GitHub"
2. Immediately redirected (no authorization screen)
3. Logged in

### Revoking Access

Users can revoke at any time:

1. Go to <https://github.com/settings/apps/authorizations>
2. Click "Revoke" next to PolePlan Pro
3. Next login will ask for authorization again

## Troubleshooting

### Issue: "App name already taken"

**Cause:** GitHub App names must be globally unique

**Solution:** 

- Try: "PolePlan Pro Auth", "PolePlan Pro by [YourOrg]", etc.
- Or use your organization name: "Acme PolePlan Pro"

### Issue: "Callback URL mismatch"

**Cause:** The URL you're redirecting to isn't in the app's callback URLs

**Solution:**

1. Go to your GitHub App settings
2. Add the callback URL under "Callback URL"
3. You can have multiple (localhost + production)

### Issue: "Email permission required"

**Cause:** App doesn't have email permission

**Solution:**

1. Go to GitHub App settings > Permissions
2. Under "Account permissions" > "Email addresses" > Set to "Read-only"
3. Click "Save changes"
4. GitHub will prompt users to accept new permissions

### Issue: "Failed to obtain access token"

**Cause:** Client secret is incorrect or expired

**Solution:**

1. Go to GitHub App settings
2. Generate a new client secret
3. Update `GITHUB_CLIENT_SECRET` in `.env`
4. Restart server

### Issue: Database error on login

**Cause:** Migration not run

**Solution:**

```bash
npm run migrate
# Verify: psql $DATABASE_URL -c "\d users"
```

## Migrating from OAuth App

If you already have an OAuth App and want to migrate:

### Option 1: Run Both (Recommended)

Keep your OAuth App and add the GitHub App:

- No disruption to existing users
- Both authentication methods work
- Migrate users gradually

### Option 2: Full Migration

1. Create GitHub App (follow this guide)
2. Update environment variables
3. Keep the same code (no changes needed)
4. Users will be prompted to authorize the new app
5. Delete old OAuth App after confirming it works

> **Note:** User accounts remain the same (linked by email/github_id)

## Testing Checklist

- [ ] GitHub App created with email permission
- [ ] Client ID and secret copied to `.env`
- [ ] Database migration run successfully
- [ ] Server restarts without errors
- [ ] Can access `/auth/github` (redirects to GitHub)
- [ ] GitHub shows correct app name and permissions
- [ ] After authorizing, redirects back with tokens
- [ ] Can access protected API routes with JWT
- [ ] User record created/updated in database
- [ ] Audit log shows GitHub login
- [ ] Can revoke and re-authorize

## Frontend Integration

**No changes needed!** The frontend code is identical to OAuth Apps:

```jsx
const handleGitHubLogin = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  window.location.href = `${apiUrl}/auth/github`;
};
```

The user won't notice any difference - it's just a better backend architecture.

## Monitoring & Analytics

### View App Activity

1. Go to [Your GitHub Apps](https://github.com/settings/apps)
2. Click on "PolePlan Pro"
3. Go to "Advanced" tab
4. See:
   - Total installations
   - Recent deliveries (if webhooks enabled)
   - API usage

### Analytics to Track

In your application, monitor:

- GitHub logins per day/week/month
- New user signups via GitHub
- Failed authentication attempts
- Token refresh rates

Example query:

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as github_logins
FROM audit_log
WHERE action = 'sso_login' 
  AND details->>'provider' = 'github'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Additional Resources

- [GitHub Apps Documentation](https://docs.github.com/en/apps)
- [GitHub App vs OAuth App Comparison](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps)
- [Authenticating with GitHub Apps](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/about-authentication-with-a-github-app)
- [GitHub App Permissions](https://docs.github.com/en/rest/overview/permissions-required-for-github-apps)

## Support

- **GitHub App Issues:** [GitHub Support](https://support.github.com/)
- **PolePlan Pro Issues:** Check `docs/` or your internal support

---

**Next Steps:** 

1. Create your GitHub App following Step 1
2. Copy credentials to `.env`
3. Test authentication
4. Add "Sign in with GitHub" button to frontend
5. Monitor successful logins

**Questions?** The code is already compatible - just need to create the app and configure credentials!
