// @ts-nocheck
/**
 * Global Error Handling Middleware
 * Normalizes error responses, preserves HttpError status codes, and logs details.
 */
import { isHttpError, HttpError } from '../utils/errors.js'
import { Logger } from '../services/logger.js'
import { Sentry } from '../instrument.js'

const logger = new Logger()

// Shape contract:
// Input: (err, req, res, next)
// Output: JSON { error, message, ...(details) , requestId? }
export function errorHandler(err, req, res, _next) {
  try {
    const status = isHttpError(err) ? err.status : 500
    const isOperational = isHttpError(err)

    // Build safe response payload
    const payload = {
      error: httpStatusText(status),
      message: err.message || 'Internal Server Error',
      status,
      ...(err.details && { details: sanitizeDetails(err.details) }),
      ...(req.id && { requestId: req.id })
    }

    // Never leak stack traces to clients in production
    if (process.env.NODE_ENV !== 'production' && err.stack) {
      payload.stack = err.stack.split('\n').slice(0, 5).join('\n')
    }

    const context = {
      path: req.originalUrl,
      method: req.method,
      status,
      userId: req.user?.id,
      ip: req.ip,
      requestId: req.id,
      isOperational
    }

    // Log full error with context
    logger.error('Request failed', err, context)

    // Capture exception with Sentry (structured context)
    Sentry.captureException(err, {
      extra: context,
      tags: {
        isOperational: String(isOperational),
      },
    })

    // Fallback if headers already sent
    if (res.headersSent) {
      return res.end()
    }

    res.status(status).json(payload)
  } catch (internalHandlerError) {
    // Last-resort logging
    try {
      logger.error('Error handler failure', internalHandlerError)
      Sentry.captureException(internalHandlerError)
    } catch {
      // ignore
    }
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal', message: 'Unhandled error' })
    }
  }
}

function httpStatusText(code) {
  const map = {
    400: 'BadRequest',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'NotFound',
    422: 'Unprocessable',
    429: 'TooManyRequests',
    500: 'Internal'
  }
  return map[code] || 'Error'
}

function sanitizeDetails(details) {
  if (!details || typeof details !== 'object') return details
  const redactedKeys = ['password', 'token', 'secret', 'apiKey', 'privateKey']
  const out = Array.isArray(details) ? [] : {}
  for (const [k, v] of Object.entries(details)) {
    if (redactedKeys.some(rk => k.toLowerCase().includes(rk.toLowerCase()))) {
      out[k] = '[REDACTED]'
    } else if (v && typeof v === 'object') {
      out[k] = sanitizeDetails(v)
    } else {
      out[k] = v
    }
  }
  return out
}

// Express expects 4-arity for error middleware; ensure exported signature length
errorHandler.length
