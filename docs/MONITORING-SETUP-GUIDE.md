# Production Monitoring Setup Guide

## Overview
PolePlan Pro now has comprehensive monitoring configured with Sentry error tracking, performance monitoring, and uptime monitoring. This guide explains how to set up alerts and complete the monitoring configuration.

## 1. Sentry Error Alerts

### Frontend Error Alerts
1. Go to [Sentry Dashboard](https://sentry.io)
2. Select your PolePlan Pro project
3. Navigate to **Alerts** → **Create Alert Rule**
4. Configure the following alerts:

#### Critical Error Alert
- **Name**: "Critical Frontend Errors"
- **Conditions**:
  - `level` equals `error`
  - `environment` equals `production`
- **Actions**:
  - Send email to: [your-email]
  - Send Slack notification to: #alerts

#### Performance Alert
- **Name**: "Slow Page Loads"
- **Conditions**:
  - `transaction.duration` > 5000ms
  - `environment` equals `production`
- **Actions**:
  - Send email to: [your-email]

### Server-Side Error Alerts
1. In Sentry, create alerts for the server project:
- **Name**: "Server Errors"
- **Conditions**:
  - `level` equals `error`
  - `environment` equals `production`
- **Actions**:
  - Send email and Slack notifications

## 2. Netlify Analytics & Performance

### Enable Netlify Analytics
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your PolePlan Pro site
3. Go to **Site settings** → **Analytics & tracking**
4. Enable **Netlify Analytics**
5. Configure data collection for:
   - Page views
   - Performance metrics
   - Custom events

### Netlify Function Monitoring
Netlify provides built-in function monitoring:
1. Go to **Functions** tab in your site dashboard
2. Monitor function invocations and response times
3. Set up alerts for function failures

## 3. Uptime Monitoring (UptimeRobot)

### Setup Steps
1. Go to [UptimeRobot](https://uptimerobot.com)
2. Create a free account
3. Add a new monitor:
   - **Monitor Type**: HTTP(s)
   - **URL**: `https://poleplanpro.com`
   - **Friendly Name**: "PolePlan Pro Production"
   - **Monitoring Interval**: 5 minutes

### Alert Configuration
1. Go to **My Settings** → **Alert Contacts**
2. Add your email and phone number
3. Configure alert preferences:
   - Send alerts when site goes down
   - Send alerts when site comes back up
   - Alert threshold: 1 check (immediate alerts)

## 4. Core Web Vitals Monitoring

The application now tracks Core Web Vitals automatically:
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

Monitor these metrics in:
- Sentry Performance dashboard
- Netlify Analytics
- Chrome DevTools (Lighthouse)

## 5. Function Performance Monitoring

### Health Check Monitoring
The `/health` endpoint now provides:
- Response time tracking
- Memory usage statistics
- Server uptime

### Setting Up Health Check Alerts
1. In UptimeRobot, add a keyword monitor:
   - **URL**: `https://poleplanpro.com/.netlify/functions/health`
   - **Keyword**: `"ok": true`
   - **Alert when keyword disappears**

## 6. Alert Escalation Strategy

### Alert Priority Levels
1. **Critical** (immediate response):
   - Site completely down
   - Critical application errors
   - Database connection failures

2. **High** (within 1 hour):
   - Function timeouts
   - High error rates (>5%)
   - Performance degradation

3. **Medium** (within 4 hours):
   - Slow page loads
   - Minor errors

4. **Low** (daily review):
   - Performance warnings
   - Monitoring system issues

## 7. Monitoring Dashboard

### Recommended Dashboard Setup
1. **Sentry Dashboard**: Error tracking and performance
2. **Netlify Analytics**: Site performance and usage
3. **UptimeRobot**: Uptime status
4. **Custom Dashboard**: Combine metrics from all services

## 8. Environment Variables Required

Add these to your Netlify environment variables:

```bash
# Sentry Configuration
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Monitoring
VITE_APP_VERSION=1.0.0
```

## 9. Testing Monitoring Setup

### Test Error Tracking
1. Temporarily introduce an error in development
2. Verify it appears in Sentry
3. Test alert notifications

### Test Performance Monitoring
1. Load the application
2. Check Core Web Vitals in browser dev tools
3. Verify metrics appear in Sentry

### Test Uptime Monitoring
1. Temporarily change the monitored URL
2. Verify downtime alert is received
3. Restore the correct URL

## 10. Maintenance

### Weekly Reviews
- Check error trends in Sentry
- Review performance metrics
- Verify uptime statistics

### Monthly Reviews
- Update alert thresholds based on usage patterns
- Review and optimize monitoring rules
- Update contact information

---

**Next Steps:**
1. Set up your Sentry account and configure the DSN
2. Enable Netlify Analytics in the dashboard
3. Configure UptimeRobot monitoring
4. Test all monitoring systems
5. Set up alert notifications

For any issues with the monitoring setup, check the application logs and ensure all environment variables are properly configured.