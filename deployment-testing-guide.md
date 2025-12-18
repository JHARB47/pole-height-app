<!-- markdownlint-disable MD001 MD026 MD032 -->
# Deployment Testing & Verification

## 1. Pre-Deployment Checklist
- [ ] All environment variables configured in Netlify
- [ ] Database connection tested
- [ ] JWT secrets generated and set
- [ ] Sentry DSN configured
- [ ] Branch protection rules set in GitHub
- [ ] CI/CD pipeline passing

## 2. Test Local Build
npm run verify  # Runs full test suite + build
npm run build   # Test production build
npm run preview # Test production preview

## 3. Test Netlify Functions Locally
npm run dev:netlify
# Test health endpoint: curl http://localhost:8888/.netlify/functions/health

## 4. Deploy to Staging (Optional)
# If you have a staging environment:
npm run deploy:netlify -- --alias=staging

## 5. Production Deployment
npm run deploy:netlify

## 6. Post-Deployment Verification

### A. Site Accessibility
curl -I https://poleplanpro.com
# Should return 200 OK

### B. Health Endpoint
curl https://poleplanpro.netlify.app/.netlify/functions/health
# Should return JSON with status: 'healthy'

### C. Core Functionality
# Test main application features:
- Load calculator page
- Perform pole height calculation
- Test import/export functions
- Verify user authentication (if enabled)

### D. Monitoring Verification

#### Sentry
1. Go to Sentry dashboard
2. Check if new release is detected
3. Trigger test error to verify error reporting

#### Netlify Analytics
1. Go to Netlify dashboard → Analytics
2. Verify page views are being tracked
3. Check Core Web Vitals scores

#### UptimeRobot
1. Go to UptimeRobot dashboard
2. Verify monitor shows 'Up'
3. Check response time graphs

### E. Performance Testing
# Run Lighthouse audit:
npx lighthouse https://poleplanpro.com --output=json --output-path=./lighthouse-report.json

# Check Core Web Vitals scores:
- LCP: <2.5s
- FID: <100ms  
- CLS: <0.1

## 7. Rollback Plan
# If issues detected:
1. Check Netlify deploy logs
2. Review error logs in Sentry
3. Rollback to previous deployment in Netlify dashboard
4. Update environment variables if needed

## 8. Monitoring Alerts Setup
- [ ] Sentry error alerts configured
- [ ] Netlify bandwidth alerts set
- [ ] UptimeRobot downtime alerts active
- [ ] Email/Slack notifications working

## 9. Documentation Updates
- [ ] Update deployment docs with new environment variables
- [ ] Document any custom configurations
- [ ] Update monitoring runbooks

## Success Criteria
- [ ] Site loads without errors
- [ ] All core functionality works
- [ ] Monitoring systems receiving data
- [ ] Performance scores within acceptable ranges
- [ ] No critical security vulnerabilities
