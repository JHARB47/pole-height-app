<!-- markdownlint-disable MD026 MD032 MD031 -->
# Secrets Setup Template

> **⚠️ IMPORTANT**: This is a TEMPLATE file. Never commit actual secret values to the repository!

## Netlify Environment Variables

Configure these in Netlify Dashboard at:
https://app.netlify.com/sites/poleplanpro/settings/deploys#environment

| Variable Name | Description | Example Value |
|--------------|-------------|---------------|
| `NETLIFY_DATABASE_URL` | Neon pooled database connection | Already configured ✓ |
| `NETLIFY_DATABASE_URL_UNPOOLED` | Neon direct database connection | Already configured ✓ |
| `JWT_SECRET` | JWT signing secret (64-char hex) | **Generate with**: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `REFRESH_TOKEN_SECRET` | Refresh token signing secret (64-char hex) | **Generate with**: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_EXPIRES_IN` | JWT token expiration time | `15m` |
| `REFRESH_TOKEN_TTL` | Refresh token time-to-live | `7d` |

### How to Add Variables in Netlify

1. Go to: **Site Settings** → **Environment variables**
2. Click: **Add a variable**
3. For each variable:
   - Select scope: **All scopes** (production, deploy-previews, branch-deploys)
   - Enter key name (e.g., `JWT_SECRET`)
   - Enter value
   - Click **Create variable**

---

## GitHub Actions Secrets

Configure these in GitHub at:
https://github.com/JHARB47/pole-height-app/settings/secrets/actions

| Secret Name | Description | Source |
|------------|-------------|--------|
| `DATABASE_URL` | Neon pooled database URL for CI/CD | Use the same value as `NETLIFY_DATABASE_URL` |
| `JWT_SECRET` | JWT signing secret | **Must match** the value in Netlify |
| `REFRESH_TOKEN_SECRET` | Refresh token secret | **Must match** the value in Netlify |
| `NETLIFY_BUILD_HOOK_URL` | Netlify build trigger webhook | Create in Netlify: **Site Settings** → **Build & deploy** → **Build hooks** |

### How to Add Secrets in GitHub

1. Go to: **Settings** → **Secrets and variables** → **Actions**
2. Click: **New repository secret**
3. For each secret:
   - Enter name (e.g., `JWT_SECRET`)
   - Enter value
   - Click **Add secret**

---

## Security Best Practices

### ✅ DO:
- Generate strong secrets using crypto.randomBytes()
- Store secrets in Netlify environment variables
- Store secrets in GitHub Actions secrets
- Keep secrets in password managers
- Rotate secrets periodically

### ❌ DON'T:
- Commit secrets to git repository
- Share secrets in plain text (Slack, email, etc.)
- Use weak or predictable secrets
- Reuse secrets across environments
- Store secrets in code comments

---

## Generating Secrets

### JWT Secrets (Node.js)
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate REFRESH_TOKEN_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### JWT Secrets (OpenSSL)
```bash
# Generate JWT_SECRET
openssl rand -hex 32

# Generate REFRESH_TOKEN_SECRET
openssl rand -hex 32
```

### JWT Secrets (Python)
```python
import secrets
print(secrets.token_hex(32))
```

---

## Verification Checklist

### Netlify
- [ ] All 6 environment variables configured
- [ ] Variables scoped to all contexts (production, deploy-previews, branch-deploys)
- [ ] JWT secrets are 64-character hexadecimal strings
- [ ] No secrets visible in build logs

### GitHub Actions
- [ ] All 4 secrets configured
- [ ] JWT secrets match Netlify values exactly
- [ ] Build hook URL created and added
- [ ] Secrets not visible in workflow logs

### Local Development
- [ ] Create `.env` file (not committed to git)
- [ ] Copy environment variables for local testing
- [ ] Test database connections work
- [ ] Test JWT authentication works

---

## Troubleshooting

### Netlify Build Fails with "Secrets detected"
- Remove any files with hardcoded secrets from repository
- Use `SECRETS_SCAN_OMIT_PATHS` to exclude documentation files
- Ensure all secrets use environment variable references: `${SECRET_NAME}`

### GitHub Actions Fails with Authentication Error
- Verify JWT secrets match exactly between GitHub and Netlify
- Check that secrets are available in workflow (use `${{ secrets.SECRET_NAME }}`)
- Test database connection with correct DATABASE_URL

### Local Development JWT Errors
- Ensure `.env` file has correct JWT_SECRET and REFRESH_TOKEN_SECRET
- Verify secrets match production values if testing with production data
- Check JWT_EXPIRES_IN and REFRESH_TOKEN_TTL are valid time formats

---

## Support

For more information:
- **Netlify Environment Variables**: https://docs.netlify.com/environment-variables/overview/
- **Netlify Secrets Scanning**: https://docs.netlify.com/security/secrets-scanning/
- **GitHub Actions Secrets**: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **JWT Best Practices**: https://tools.ietf.org/html/rfc7519

---

**Last Updated**: October 2, 2025
