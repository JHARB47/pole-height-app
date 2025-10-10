import dotenv from 'dotenv'
import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'

dotenv.config()

const environment = process.env.NODE_ENV || 'development'
const release = process.env.npm_package_version || '1.0.0'
const dsn = process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN || ''

if (!dsn && environment !== 'test') {
  console.warn('[Sentry] SENTRY_DSN missing; Sentry will not capture events')
}

Sentry.init({
  dsn: dsn || undefined,
  environment,
  release,
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
  profilesSampleRate: environment === 'production' ? 0.2 : 1.0,
  profileSessionSampleRate: environment === 'production' ? 0.1 : 1.0,
  profileLifecycle: 'trace',
  enableLogs: true,
  sendDefaultPii: process.env.SENTRY_SEND_DEFAULT_PII === 'true',
})

// Warm up profiling with a startup span so the first requests capture traces
Sentry.startSpan({
  op: 'app.startup',
  name: 'server bootstrap',
}, () => {
  // noop — this span ensures profiling attaches during boot
})

export { Sentry }
