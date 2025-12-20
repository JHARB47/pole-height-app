import { describe, expect, it } from 'vitest';
import { Buffer } from 'node:buffer';
import crypto from 'node:crypto';

import {
  getHeader,
  verifyNetlifySecret,
} from '../functions/netlify_deploy_webhook.js';

describe('netlify/functions/netlify_deploy_webhook helpers', () => {
  it('getHeader is case-insensitive and returns only string values', () => {
    const event = {
      headers: {
        'X-Webhook-Signature': 'abc',
        'x-not-a-string': 123,
      },
    };

    expect(getHeader(event, 'x-webhook-signature')).toBe('abc');
    expect(getHeader(event, 'X-WEBHOOK-SIGNATURE')).toBe('abc');
    expect(getHeader(event, 'x-not-a-string')).toBe(undefined);
    expect(getHeader(event, 'missing')).toBe(undefined);
  });

  it('verifyNetlifySecret accepts valid signatures for utf8 and base64 bodies', () => {
    const testSecret = crypto.randomBytes(16).toString('hex');

    const body = JSON.stringify({ hello: 'world' });
    const hex = crypto.createHmac('sha256', testSecret).update(body).digest('hex');

    const utf8Event = {
      headers: { 'X-Webhook-Signature': hex },
      body,
      isBase64Encoded: false,
    };
    expect(verifyNetlifySecret(utf8Event, testSecret)).toBe(true);

    const base64Body = Buffer.from(body, 'utf8').toString('base64');
    const base64Event = {
      headers: { 'x-webhook-signature': `sha256=${hex}` },
      body: base64Body,
      isBase64Encoded: true,
    };
    expect(verifyNetlifySecret(base64Event, testSecret)).toBe(true);
  });

  it('verifyNetlifySecret allows requests when secret is not configured', () => {
    expect(verifyNetlifySecret({ headers: {}, body: '' }, undefined)).toBe(true);
  });
});
