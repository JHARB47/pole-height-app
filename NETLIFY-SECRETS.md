# Setting Up GitHub Secrets for Netlify Deployment

To enable the GitHub Actions workflow to deploy to Netlify, you need to set up two repository secrets in your GitHub repository:

1. `NETLIFY_AUTH_TOKEN`
2. `NETLIFY_SITE_ID`

## Steps to Set Up Secrets

### 1. Get Netlify Auth Token

1. Log in to your Netlify account
2. Go to User Settings → Applications
3. Under "Personal Access Tokens", generate a new access token
4. Copy the token (you won't be able to see it again)

### 2. Get Netlify Site ID

1. Go to your Netlify site dashboard
2. Go to Site Settings → General
3. Copy the "Site ID" (API ID) at the top of the page

### 3. Add Secrets to GitHub

1. Go to your GitHub repository
2. Click on "Settings" → "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Add `NETLIFY_AUTH_TOKEN` with your auth token value
5. Add another secret `NETLIFY_SITE_ID` with your site ID value

## Verifying the Setup

After adding these secrets, the GitHub Actions workflow will be able to deploy to Netlify automatically. You can verify this by:

1. Making a small change to your repository
2. Pushing the change to the main branch
3. Checking the "Actions" tab in GitHub to see the workflow running
4. Confirming the deployment is successful in Netlify

## Troubleshooting

If the deployment fails, check:

1. The secrets are correctly named (`NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`)
2. The auth token has the correct permissions
3. The site ID is correct for the site you want to deploy to
4. The publish directory in the workflow matches your build output directory (should be `dist`)
