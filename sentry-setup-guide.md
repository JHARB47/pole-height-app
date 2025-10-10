# Sentry Monitoring Setup

## 1. Create Sentry Account & Projects
1. Go to https://sentry.io/signup/
2. Create account and verify email
3. Create TWO projects:
   - Project 1: 'poleplan-pro-frontend' (React platform)
   - Project 2: 'poleplan-pro-backend' (Node.js platform)

## 2. Get DSN Keys
For each project:
1. Go to Settings → Client Keys (DSN)
2. Copy the DSN URL (starts with https://)

## 3. Configure Environment Variables
In Netlify Dashboard → Site settings → Environment variables:

VITE_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id

## 4. Set Up Alerts (Frontend Project)
1. Go to Alerts → Create Alert Rule
2. Name: 'Critical Frontend Errors'
3. Conditions:
   - level equals error
   - environment equals production
4. Actions: Email + Slack notifications

## 5. Set Up Performance Alerts
1. Create new alert rule
2. Name: 'Slow Page Loads'
3. Conditions:
   - transaction.duration > 5000ms
   - environment equals production
4. Actions: Email notifications

## 6. Configure Release Tracking
1. Go to Releases → Configure
2. Enable automatic release tracking
3. Set environment: production

## 7. Test Error Reporting
# Trigger a test error (temporary code):
console.error('Test Sentry error');
throw new Error('Test error for Sentry');

# Check Sentry dashboard - should see the error within minutes
