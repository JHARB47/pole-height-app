<!-- markdownlint-disable MD032 -->
# GitHub Repository Setup Checklist

## 1. Repository Settings
- [ ] Go to Settings → General
- [ ] Set repository visibility (Public/Private as needed)
- [ ] Enable GitHub Pages if needed (Settings → Pages)

## 2. Branch Protection (main branch)
- [ ] Go to Settings → Branches → Add rule
- [ ] Branch name pattern: main
- [ ] Require pull request reviews: ✓
- [ ] Require status checks: ✓
  - Status checks: ci-cd (from .github/workflows/ci-cd.yml)
- [ ] Include administrators: ✓ (optional)

## 3. Repository Secrets (Settings → Secrets and variables → Actions)
Required for automated deployment (if enabling):
- [ ] NETLIFY_AUTH_TOKEN: Your Netlify personal access token
- [ ] NETLIFY_SITE_ID: Your Netlify site ID (from Site settings → General)

## 4. Deploy Keys (if using private submodules)
- [ ] Settings → Deploy keys → Add deploy key

## 5. Webhooks (optional - for deployment notifications)
- [ ] Settings → Webhooks → Add webhook
- [ ] Payload URL: Your deployment notification endpoint
- [ ] Content type: application/json
- [ ] Events: Push to main branch
