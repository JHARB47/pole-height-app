# GitHub OAuth Setup Guide

This guide walks you through setting up GitHub OAuth authentication for PolePlan Pro.

> 🆕 **Recommended:** Use [GitHub Apps](./GITHUB-APP-SETUP.md) instead of OAuth Apps for better security, fine-grained permissions, and higher rate limits. This guide covers the legacy OAuth App approach.

## Prerequisites

- GitHub account with admin access to create OAuth Apps
- Access to the PolePlan Pro server environment variables
- Database access to run migrations

## Step 1: Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"** or **"Register a new application"**
3. Fill in the application details:

   **Application name:** `PolePlan Pro` (or your preferred name)

   **Homepage URL:**
   - Production: `https://poleplanpro.com`
   - Development: `http://localhost:3000`

   **Application description:** `NESC-compliant pole attachment calculations with geospatial capabilities`

   **Authorization callback URL:**
   - Production: `https://api.poleplanpro.com/auth/github/callback`
   - Development: `http://localhost:3001/auth/github/callback`

   > **Note:** If your API is on a different domain/port, adjust accordingly

4. Click **"Register application"**
5. On the next page, you'll see your **Client ID**
6. Click **"Generate a new client secret"** and copy the secret immediately (you won't be able to see it again)

## Step 2: Configure Environment Variables

Add the following to your `.env` file (in the `server/` directory):

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your-actual-client-id-here
GITHUB_CLIENT_SECRET=your-actual-client-secret-here
```

**Important:**

- Never commit the `.env` file to version control
- Keep the client secret secure and rotate it periodically
- Use different OAuth Apps for development and production environments

## Step 3: Run Database Migration

The GitHub OAuth integration requires a `github_id` column in the users table.

### Using the migration script

```bash
cd server
npm run migrate
```

### Or manually run the SQL

```bash
psql $DATABASE_URL -f server/migrations/002_add_github_oauth.sql
```

### Or using Drizzle (if configured)

```bash
npm run db:push
```

The migration will:

- Add `github_id VARCHAR(255)` column to users table
- Create an index on `github_id` for fast lookups
- Add a unique constraint to prevent duplicate GitHub accounts

## Step 4: Restart the Server

After configuring environment variables and running the migration, restart your server:

```bash
# Development
npm run dev

# Or with Netlify Dev
npm run dev:netlify

# Production (with PM2 or similar)
pm2 restart poleplan-server
```

## Step 5: Test the Integration

### Backend Testing

1. **Check if GitHub strategy is loaded:**

   ```bash
   curl http://localhost:3001/auth/github
   ```

   This should redirect you to GitHub's authorization page

2. **Complete the OAuth flow:**
   - Click "Authorize" on GitHub
   - You should be redirected back with tokens

### Frontend Testing

1. Add a "Sign in with GitHub" button to your login page (see Frontend Integration section)
2. Click the button and complete the OAuth flow
3. Verify you're logged in and can access protected routes

## Frontend Integration

### Add GitHub Login Button

In your login component (e.g., `src/components/Login.jsx`):

```jsx
const handleGitHubLogin = () => {
  // Redirect to backend GitHub OAuth initiation
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  window.location.href = `${apiUrl}/auth/github`;
};

return (
  <div>
    {/* Existing email/password form */}

    <div className="oauth-buttons">
      <button onClick={handleGitHubLogin}>
        <svg><!-- GitHub icon --></svg>
        Sign in with GitHub
      </button>
    </div>
  </div>
);
```

### Handle OAuth Callback

Create a callback route to handle the redirect from the backend:

```jsx
// src/routes/AuthCallback.jsx
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refresh");

    if (token && refreshToken) {
      // Store tokens
      localStorage.setItem("access_token", token);
      localStorage.setItem("refresh_token", refreshToken);

      // Redirect to dashboard
      navigate("/dashboard");
    } else {
      // Handle error
      navigate("/login?error=oauth_failed");
    }
  }, [searchParams, navigate]);

  return <div>Completing login...</div>;
}
```

Add the route to your router:

```jsx
// src/App.jsx or router config
<Route path="/auth/callback" element={<AuthCallback />} />
```

## How It Works

### OAuth Flow

1. **User clicks "Sign in with GitHub"**
   - Frontend redirects to: `GET /auth/github`

2. **Backend initiates OAuth**
   - Passport.js redirects user to GitHub authorization page
   - Requests scope: `user:email` (to access verified email)

3. **User authorizes on GitHub**
   - GitHub redirects back to: `GET /auth/github/callback?code=...`

4. **Backend processes callback**
   - Exchanges authorization code for access token
   - Fetches user profile from GitHub API
   - Checks if user exists by `github_id` or email
   - Creates new user or updates existing user with `github_id`
   - Generates JWT access token and refresh token
   - Logs SSO login audit event

5. **Backend redirects to frontend**
   - Redirects to: `https://poleplanpro.com/auth/callback?token=...&refresh=...`

6. **Frontend stores tokens**
   - Saves tokens to localStorage
   - Redirects to dashboard

### User Account Linking

**New User:**

- If no user exists with the GitHub ID or email, a new user is created
- Fields populated: `github_id`, `email`, `first_name`, `last_name`
- Password field remains NULL (GitHub-only authentication)

**Existing User (same email):**

- If a user exists with the same email, their `github_id` is added
- This allows the user to log in with either email/password or GitHub

**Existing GitHub User:**

- If `github_id` already exists, user is logged in
- `last_login_at` timestamp is updated

## Security Considerations

1. **Email Verification:**
   - GitHub OAuth strategy requires verified email addresses
   - Users must verify their email on GitHub before signing in

2. **Scope Permissions:**
   - Only requests `user:email` scope (minimal permissions)
   - Does not request access to repositories or other sensitive data

3. **Token Storage:**
   - JWT tokens are short-lived (24 hours by default)
   - Refresh tokens allow getting new access tokens without re-authentication
   - Store tokens securely (consider using secure, httpOnly cookies in production)

4. **Audit Logging:**
   - All GitHub logins are logged to the `audit_log` table
   - Tracks user ID, provider, IP address, and user agent

5. **Account Takeover Prevention:**
   - Email uniqueness is enforced at database level
   - If email is already registered, GitHub ID is linked (not a new account)

## Troubleshooting

### Issue: "Callback URL mismatch"

**Cause:** The callback URL configured in GitHub doesn't match the server URL

**Solution:**

1. Check GitHub OAuth App settings
2. Verify callback URL matches: `https://your-domain.com/auth/github/callback`
3. Ensure protocol (http/https) and port match exactly

### Issue: "User has no verified email"

**Cause:** User's GitHub account doesn't have a verified email address

**Solution:**

1. User should go to [GitHub Email Settings](https://github.com/settings/emails)
2. Add and verify an email address
3. Make the email public or keep it private (both work)

### Issue: "GitHub strategy not found"

**Cause:** Environment variables not set or server not restarted

**Solution:**

1. Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are in `.env`
2. Restart the server
3. Check server logs for "GitHub OAuth strategy registered"

### Issue: "Invalid client ID or secret"

**Cause:** Incorrect credentials or expired client secret

**Solution:**

1. Double-check client ID matches GitHub OAuth App
2. Generate a new client secret if needed
3. Update `.env` with new secret and restart server

### Issue: "Cannot read property 'github_id' of undefined"

**Cause:** Database migration not run

**Solution:**

1. Run: `psql $DATABASE_URL -f server/migrations/002_add_github_oauth.sql`
2. Verify column exists: `\d users` in psql
3. Restart server

## Additional Resources

- [GitHub OAuth Documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- [Passport GitHub2 Strategy](https://github.com/cfsghost/passport-github)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

## Multiple OAuth Apps (Development vs Production)

For better security, create separate OAuth Apps for development and production:

### Development OAuth App

- Homepage: `http://localhost:3000`
- Callback: `http://localhost:3001/auth/github/callback`
- Use in `.env` (local)

### Production OAuth App

- Homepage: `https://poleplanpro.com`
- Callback: `https://api.poleplanpro.com/auth/github/callback`
- Use in Netlify environment variables

This prevents development tokens from working in production and vice versa.

## Next Steps

After setting up GitHub OAuth:

1. **Add to login page:** Update frontend with GitHub login button
2. **Test thoroughly:** Try new user creation, existing user linking, error cases
3. **Monitor logs:** Check audit logs for successful OAuth logins
4. **User documentation:** Let users know they can now sign in with GitHub
5. **Consider additional providers:** Implement GitLab, Bitbucket, etc. using same pattern

---

**Questions?** Check the [PolePlan Pro documentation](./docs/) or contact support.
