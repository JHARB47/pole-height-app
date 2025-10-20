import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';

describe('Preview auth gating', () => {
  const prevEnv = process.env.DISABLE_PREVIEW_AUTH;

  beforeAll(() => {
    process.env.DISABLE_PREVIEW_AUTH = 'true';
  });

  afterAll(() => {
    process.env.DISABLE_PREVIEW_AUTH = prevEnv;
  });

  it('returns 403 on GitHub auth start for Netlify branch host when disabled', async () => {
    const res = await request(app)
      .get('/auth/github')
      .set('x-forwarded-host', 'feature-x--poleplanpro.netlify.app')
      .expect(403);
    expect(res.body && res.body.code).toBe('PREVIEW_AUTH_DISABLED');
  });
});
