// @ts-nocheck
/**
 * PolePlan Pro Deployment Checklist
 * Provides environment-specific deploy readiness validation.
 */

import { execSync } from 'child_process';

const DEPLOY_ENV = (process.env.DEPLOY_ENV || 'production').toLowerCase();
const SKIP_CHECKS = new Set(
  (process.env.SKIP_DEPLOY_CHECKS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
);

const RUN_OPTIONAL_CHECKS =
  (process.env.RUN_OPTIONAL_CHECKS ?? (DEPLOY_ENV === 'production' ? 'true' : 'false'))
    .toString()
    .toLowerCase() === 'true';

const REQUIRED_NODE_VERSION = process.env.REQUIRED_NODE_VERSION || 'v22.12.0';
const POSTGRES_HOST = process.env.DATABASE_HOST || 'localhost';
const POSTGRES_PORT = process.env.DATABASE_PORT || '5432';
const ENV_FILE = process.env.DEPLOY_ENV_FILE || 'server/.env';
const SSL_CERT_PATH = process.env.DEPLOY_SSL_CERT || 'ssl/cert.pem';
const SSL_KEY_PATH = process.env.DEPLOY_SSL_KEY || 'ssl/key.pem';
const HEALTH_URL = process.env.DEPLOY_HEALTH_URL || 'http://localhost:3001/health';

const DEPLOY_PROFILES = {
  production: {
    required: [
      'node-version',
      'postgres-ready',
      'env-file',
      'ssl-certificates',
      'database-migration',
      'build-assets',
      'run-tests',
      'health-check',
    ],
    optional: [],
  },
  staging: {
    required: ['node-version', 'env-file', 'build-assets'],
    optional: ['postgres-ready', 'ssl-certificates', 'database-migration', 'run-tests', 'health-check'],
  },
};

const PROFILE = DEPLOY_PROFILES[DEPLOY_ENV] || DEPLOY_PROFILES.production;

const CHECKS = [
  {
    id: 'node-version',
    label: 'Node.js Version',
    command:
      process.env.DEPLOY_CHECK_NODE_VERSION || `node --version | grep "${REQUIRED_NODE_VERSION}"`,
  },
  {
    id: 'postgres-ready',
    label: 'PostgreSQL Ready',
    command:
      process.env.DEPLOY_CHECK_POSTGRES || `pg_isready -h ${POSTGRES_HOST} -p ${POSTGRES_PORT}`,
  },
  {
    id: 'env-file',
    label: 'Environment Variables Present',
    command: process.env.DEPLOY_CHECK_ENV_FILE || `test -f ${ENV_FILE}`,
  },
  {
    id: 'ssl-certificates',
    label: 'SSL Certificates',
    command:
      process.env.DEPLOY_CHECK_SSL || `test -f ${SSL_CERT_PATH} && test -f ${SSL_KEY_PATH}`,
  },
  {
    id: 'database-migration',
    label: 'Database Migration',
    command: process.env.DEPLOY_CHECK_MIGRATION || 'npm run db:migrate',
  },
  {
    id: 'build-assets',
    label: 'Build Assets',
    command: process.env.DEPLOY_CHECK_BUILD || 'npm run build',
  },
  {
    id: 'run-tests',
    label: 'Run Integration Tests',
    command: process.env.DEPLOY_CHECK_TESTS || 'npm run test:integration',
  },
  {
    id: 'health-check',
    label: 'API Health Check',
    command: process.env.DEPLOY_CHECK_HEALTH || `curl -f ${HEALTH_URL}`,
  },
];

console.log('🚀 PolePlan Pro Deployment Checklist');
console.log('===================================');
console.log(`Environment: ${DEPLOY_ENV}\n`);

const failures = [];
const warnings = [];

const shouldRunCheck = (checkId, isRequired, isOptional) => {
  if (!isRequired && !isOptional) {
    return false;
  }

  if (SKIP_CHECKS.has(checkId)) {
    console.log(`• Skipping ${checkId} (explicit skip)`);
    return false;
  }

  if (isOptional && !RUN_OPTIONAL_CHECKS) {
    console.log(`• Skipping ${checkId} (optional in ${DEPLOY_ENV}; set RUN_OPTIONAL_CHECKS=true to run)`);
    return false;
  }

  return true;
};

for (const { id, label, command } of CHECKS) {
  const isRequired = PROFILE.required.includes(id);
  const isOptional = PROFILE.optional.includes(id);

  if (!shouldRunCheck(id, isRequired, isOptional)) continue;

  try {
    execSync(command, { stdio: 'ignore' });
    console.log(`✓ ${label}`);
  } catch (error) {
    if (isRequired) {
      console.log(`✗ ${label} FAILED`);
      failures.push({ id, label, command, error });
    } else {
      console.log(`⚠ ${label} skipped (non-blocking failure)`);
      warnings.push({ id, label, command, error });
    }
  }
}

if (failures.length === 0) {
  console.log('\n🎉 All required deployment checks passed!');
  if (warnings.length) {
    console.log('⚠ Non-blocking checks had issues:');
    for (const warning of warnings) {
      console.log(`   • ${warning.label}`);
    }
    console.log('   Review warnings before promoting to production.');
  }
} else {
  console.log('\n❌ Some required deployment checks failed.');
  for (const failure of failures) {
    console.log(`   • ${failure.label}`);
  }
  console.log('\nTips:');
  console.log('  • Set DEPLOY_ENV=staging to relax database/SSL/test requirements.');
  console.log('  • Set RUN_OPTIONAL_CHECKS=true to force optional checks even in staging.');
  console.log('  • Provide SKIP_DEPLOY_CHECKS="check-id,other-id" to bypass specific checks.');
  console.log('  • Override individual commands with DEPLOY_CHECK_* env vars.');
  process.exit(1);
}

export { CHECKS as DEPLOYMENT_CHECKLIST };
