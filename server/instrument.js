import dotenv from 'dotenv'
import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'

dotenv.config()

const environment = process.env.NODE_ENV || 'development'
const release = process.env.npm_package_version || '1.0.0'
const dsn = process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN || ''
const isTestLike = environment === 'test' || process.env.VITEST || process.env.TEST || process.env.DISABLE_SENTRY === 'true'
// AI: rationale — disable Sentry in dev to avoid OpenTelemetry startup crashes
const isDevDisabled = environment === 'development' && !dsn

const noop = () => {}
const noopSpan = { setAttribute: noop, setStatus: noop, end: noop }

const SentryClient = (() => {
  if (isTestLike || isDevDisabled) {
    // AI: rationale — avoid OpenTelemetry overhead/crashes in tests or when disabled
    const safeSpan = (/** @type {(arg0: { setAttribute: () => void; setStatus: () => void; end: () => void; }) => any} */ callback) => {
      if (typeof callback === 'function') return callback({ ...noopSpan })
      return { ...noopSpan }
    }

    return {
      Handlers: {
        requestHandler: () => (/** @type {any} */ _req, /** @type {any} */ _res, /** @type {() => any} */ next) => next(),
        errorHandler: () => (/** @type {any} */ err, /** @type {any} */ _req, /** @type {any} */ _res, /** @type {(arg0: any) => any} */ next) => next(err)
      },
      startSpan: (/** @type {any} */ _ctxOrCallback, /** @type {any} */ maybeCallback) => {
        // Support startSpan(callback) or startSpan(ctx, callback)
        const callback = typeof _ctxOrCallback === 'function' ? _ctxOrCallback : maybeCallback
        return safeSpan(callback)
      },
      startSpanManual: (/** @type {any} */ _ctx) => ({ ...noopSpan }),
      captureException: noop,
      logger: { info: noop, error: noop, warn: noop },
    }
  }

  if (!dsn) {
    console.warn('[Sentry] SENTRY_DSN missing; using no-op Sentry client')
    // AI: rationale — without DSN, skip full Sentry.init to avoid profiling/OTEL errors
    return {
      Handlers: {
        requestHandler: () => (/** @type {any} */ _req, /** @type {any} */ _res, /** @type {() => any} */ next) => next(),
        errorHandler: () => (/** @type {any} */ err, /** @type {any} */ _req, /** @type {any} */ _res, /** @type {(arg0: any) => any} */ next) => next(err)
      },
      startSpan: (/** @type {any} */ _ctx) => ({ ...noopSpan }),
      startSpanManual: (/** @type {any} */ _ctx) => ({ ...noopSpan }),
      captureException: noop,
      logger: { info: noop, error: noop, warn: noop },
    }
  }

  // Initialize integrations defensively; profiling integration can be incompatible in some dev environments
  const integrations = []
  try {
    if (typeof nodeProfilingIntegration === 'function') {
      integrations.push(nodeProfilingIntegration())
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[Sentry] profiling integration failed to initialize (non-fatal):', err && err.message)
  }

  try {
    Sentry.init({
      dsn: dsn || undefined,
      environment,
      release,
      integrations,
      tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
      profilesSampleRate: environment === 'production' ? 0.2 : 1.0,
      profileSessionSampleRate: environment === 'production' ? 0.1 : 1.0,
      profileLifecycle: 'trace',
      enableLogs: true,
      sendDefaultPii: process.env.SENTRY_SEND_DEFAULT_PII === 'true',
    })

    // Warm up profiling with a startup span so the first requests capture traces
    try {
      const span = Sentry.startSpan({
        op: 'app.startup',
        name: 'server bootstrap',
      })
      if (span && typeof span.end === 'function') {
        span.end()
      }
    } catch (err) {
      // If Sentry/OpenTelemetry startSpan signature differs, avoid crashing the server
      // AI: rationale — log the issue and continue; we don't want instrumentation to block app startup
      // eslint-disable-next-line no-console
      console.warn('[Sentry] startSpan failed during startup (non-fatal):', err && err.message)
    }

    return Sentry
  } catch (initError) {
    // If Sentry.init() itself fails (e.g., OpenTelemetry errors), fall back to no-op client
    // eslint-disable-next-line no-console
    console.error('[Sentry] Initialization failed, using no-op client:', initError && initError.message)
    return {
      Handlers: {
        requestHandler: () => (/** @type {any} */ _req, /** @type {any} */ _res, /** @type {() => any} */ next) => next(),
        errorHandler: () => (/** @type {any} */ err, /** @type {any} */ _req, /** @type {any} */ _res, /** @type {(arg0: any) => any} */ next) => next(err)
      },
      startSpan: (/** @type {any} */ _ctx) => ({ ...noopSpan }),
      startSpanManual: (/** @type {any} */ _ctx) => ({ ...noopSpan }),
      captureException: noop,
      logger: { info: noop, error: noop, warn: noop },
    }
  }
})()

export { SentryClient as Sentry }
