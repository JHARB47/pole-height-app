<!-- markdownlint-disable MD026 MD032 -->

# Netlify Analytics & Performance Setup

## 1. Enable Netlify Analytics

1. Go to Netlify Dashboard → Your site
2. Site settings → Analytics & tracking
3. Enable 'Netlify Analytics'
4. Configure data collection:
   - Page views: ✓
   - Performance metrics: ✓
   - Custom events: ✓

## 2. Configure Performance Monitoring

1. In Analytics section:
   - Enable Core Web Vitals tracking
   - Enable bandwidth monitoring
   - Enable function performance tracking

## 3. Set Up Bandwidth Alerts

1. Site settings → Analytics & tracking
2. Configure bandwidth alerts:
   - Alert when usage > 80% of plan limit
   - Email notifications: ✓

## 4. Function Monitoring

1. Site settings → Functions
2. Enable function logs
3. Set up function performance alerts

## 5. Custom Analytics Events (Optional)

# Add to your application code:

import { trackEvent } from 'netlify/analytics';

trackEvent('user_action', {
action: 'calculate_pole_height',
user_type: 'engineer'
});

## 6. View Analytics Dashboard

- Real-time visitor metrics
- Performance scores (Lighthouse)
- Function execution times
- Bandwidth usage charts

## Notes:

- Analytics data appears within 24 hours
- Performance metrics update in real-time
- Core Web Vitals scores help optimize user experience
