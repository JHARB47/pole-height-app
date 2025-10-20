import { config as loadEnvFile } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let cached;

function ensure(value, name, { required = false, fallback } = {}) {
  if ((value == null || value === '') && required) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value ?? fallback;
}

export function loadEnv(overrides = {}) {
  if (!cached) {
    const dotenvEnabled = process.env.NODE_ENV !== 'production' && process.env.DISABLE_DOTENV !== 'true';
    if (dotenvEnabled) {
      loadEnvFile({ path: process.env.ENV_FILE || join(__dirname, '../.env'), override: false });
    }
    const isTest = process.env.NODE_ENV === 'test';
    const base = {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: Number(process.env.API_PORT || process.env.PORT || 4001),
      databaseUrl: process.env.DATABASE_URL || (isTest ? 'pgmem://test-suite' : undefined),
      databaseSchema: process.env.DATABASE_SCHEMA || 'public',
      jwtSecret: ensure(process.env.JWT_SECRET, 'JWT_SECRET', { required: true, fallback: isTest ? 'test-secret' : 'dev-jwt-secret-change-in-production' }),
      refreshTokenSecret: ensure(process.env.REFRESH_TOKEN_SECRET, 'REFRESH_TOKEN_SECRET', { required: true, fallback: isTest ? 'test-refresh-secret' : 'dev-refresh-secret-change-in-production' }),
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
      refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '7d',
      azureTenantId: process.env.AZURE_AD_TENANT_ID || '',
      azureClientId: process.env.AZURE_AD_CLIENT_ID || '',
      azureClientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
      azureRedirectUri: process.env.AZURE_AD_REDIRECT_URI || '',
      allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
      logLevel: process.env.LOG_LEVEL || 'info',
      serviceName: process.env.SERVICE_NAME || 'pole-height-api',
      enableSsoStub: process.env.ENABLE_SSO_STUB === 'true',
    };
    cached = base;
  }
  return { ...cached, ...overrides };
}

export function resetEnvCache() {
  cached = undefined;
}

export const ENV = loadEnv();
