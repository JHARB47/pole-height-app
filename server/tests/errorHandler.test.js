import { describe, it, expect, vi } from 'vitest';
import { errorHandler } from '../middleware/errorHandler.js';
import { HttpError, ValidationError } from '../utils/errors.js';

function makeRes() {
  return {
    statusCode: 200,
    headersSent: false,
    _json: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this._json = payload; return this; },
    end() { this.ended = true; }
  };
}

describe('errorHandler', () => {
  it('handles HttpError preserving status & message', () => {
    const err = new ValidationError('Bad input', { field: 'password' });
    const req = { originalUrl: '/api/test', method: 'GET', id: 'req1' };
    const res = makeRes();
    errorHandler(err, req, res, () => {});
    expect(res.statusCode).toBe(400);
    expect(res._json.message).toBe('Bad input');
    expect(res._json.status).toBe(400);
    expect(res._json.details.field).toBe('[REDACTED]');
  });

  it('handles generic Error with 500 fallback', () => {
    const err = new Error('Kaboom');
    const req = { originalUrl: '/x', method: 'POST' };
    const res = makeRes();
    errorHandler(err, req, res, () => {});
    expect(res.statusCode).toBe(500);
    expect(res._json.message).toBe('Kaboom');
  });

  it('does nothing further if headers already sent', () => {
    const err = new HttpError(403, 'Forbidden');
    const req = { originalUrl: '/secure', method: 'GET' };
    const res = makeRes();
    res.headersSent = true;
    errorHandler(err, req, res, () => {});
    // Expect not to overwrite status (stays default 200) but end called
    expect(res.statusCode).toBe(200);
    expect(res.ended).toBe(true);
  });
});
