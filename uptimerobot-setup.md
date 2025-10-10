# UptimeRobot Monitoring Setup

## 1. Create UptimeRobot Account
1. Go to https://uptimerobot.com/
2. Sign up for account (free tier available)
3. Verify email

## 2. Add Your Site for Monitoring
1. Dashboard → Add New Monitor
2. Monitor Type: 'HTTP(s)'
3. URL to monitor: https://poleplanpro.com
4. Friendly Name: 'PolePlan Pro Production'
5. Monitoring Interval: 5 minutes

## 3. Configure Alert Settings
1. Alert Contacts → Add Alert Contact
2. Add email alert: your-email@example.com
3. Alert Types: 
   - Monitor goes down: ✓
   - Monitor comes back up: ✓
   - Monitor has a keyword issue: ✓

## 4. Advanced Monitoring Settings
1. Monitor Settings:
   - Keyword Monitoring: Monitor for specific text on page
   - Keyword Type: Should contain
   - Keyword Value: 'Pole Height Calculator' (or your app's title)
   
2. SSL Certificate Monitoring: ✓
3. Response Time Monitoring: ✓

## 5. Set Up Multiple Monitors
Create additional monitors for:
- Main site: https://poleplanpro.com
- API endpoint: https://poleplanpro.netlify.app/.netlify/functions/health
- Admin panel (if applicable)

## 6. Configure Alert Thresholds
1. Alert Settings:
   - Send alerts when down for: 2 checks (10 minutes)
   - Send up alerts: ✓
   - Send alert when monitor pauses: ✓

## 7. Integration Options (Optional)
- Slack notifications
- SMS alerts (paid)
- Webhooks for custom integrations
- Zapier integration

## 8. Monitor Dashboard
- Uptime percentage (target: >99.9%)
- Response time graphs
- SSL certificate expiry alerts
- Incident history

## Free Tier Limits:
- 50 monitors
- 5-minute intervals
- Email alerts only
- 90-day data retention
