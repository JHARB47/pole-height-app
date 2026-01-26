#!/usr/bin/env node
/**
 * Run Application Health Checks
 */

import { runHealthChecks } from '../../src/utils/healthMonitor.js';

runHealthChecks()
  .then(summary => {
    if (summary.overallStatus === 'healthy') {
      process.exit(0);
    } else if (summary.overallStatus === 'degraded') {
      process.exit(0); // Still allow to proceed with warnings
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Health check failed:', error);
    process.exit(1);
  });
