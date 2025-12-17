import dotenv from 'dotenv'
import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'

dotenv.config()

const environment = process.env.NODE_ENV || 'development'
const release = process.env.npm_package_version || '1.0.0'
const dsn = process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN || ''
const isTestLike = environment === 'test' || process.env.VITEST || process.env.TEST || process.env.DISABLE_SENTRY === 'true'

const noop = () => {}
const noopSpan = { setAttribute: noop, setStatus: noop, end: noop }

let SentryClient

if (isTestLike) {
  // AI: rationale — avoid OpenTelemetry overhead/crashes in tests or when disabled
  const safeSpan = (callback) => {
    if (typeof callback === 'function') return callback({ ...noopSpan })
    return { ...noopSpan }
  }

  SentryClient = {
    Handlers: {
      requestHandler: () => (_req, _res, next) => next(),
      errorHandler: () => (err, _req, _res, next) => next(err)
    },
    startSpan: (_ctxOrCallback, maybeCallback) => {
      // Support startSpan(callback) or startSpan(ctx, callback)
      const callback = typeof _ctxOrCallback === 'function' ? _ctxOrCallback : maybeCallback
      return safeSpan(callback)
    },
    startSpanManual: () => ({ ...noopSpan }),
    captureException: noop,
    logger: { info: noop, error: noop, warn: noop },
  }
} else {
  if (!dsn) {
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

  SentryClient = Sentry
}

export { SentryClient as Sentry }
