import { describe, expect, it } from 'vitest';
import { Buffer } from 'node:buffer';
import nodeCrypto from 'node:crypto';

import {
  getHeader,
  normalizePrivateKey,
  sanitizeBranchName,
  verifySignature,
} from '../functions/github_webhook.js';

describe('netlify/functions/github_webhook helpers', () => {
  it('getHeader is case-insensitive and returns only string values', () => {
    const event = {
      headers: {
        'X-GitHub-Event': 'pull_request',
        'x-hub-signature-256': 'sha256=abc',
        'x-not-a-string': 123,
      },
    };

    expect(getHeader(event, 'x-github-event')).toBe('pull_request');
    expect(getHeader(event, 'X-Hub-Signature-256')).toBe('sha256=abc');
    expect(getHeader(event, 'x-not-a-string')).toBe(undefined);
    expect(getHeader(event, 'missing')).toBe(undefined);
  });

  it(String.raw`normalizePrivateKey converts \n-escaped PEM to multiline`, () => {
    const raw = String.raw`-----BEGIN PRIVATE KEY-----\nline1\nline2\n-----END PRIVATE KEY-----`;
    const normalized = normalizePrivateKey(raw);
    expect(normalized).toContain('\nline1\n');
    expect(normalized).not.toContain(String.raw`\nline1\n`);
  });

  it('sanitizeBranchName keeps full branch path (slashes collapsed)', () => {
    expect(sanitizeBranchName('refs/heads/feature/x')).toBe('feature-x');
    expect(sanitizeBranchName('bugfix/JIRA-123__hot')).toBe('bugfix-jira-123-hot');
  });

  it('verifySignature accepts sha256 signatures and rejects unknown algos', () => {
    const secret = nodeCrypto.randomBytes(16).toString('hex');
    const payload = Buffer.from('{"hello":"world"}', 'utf8');

    // sha256 signature of payload with secret
    const hex = nodeCrypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    expect(verifySignature(secret, payload, `sha256=${hex}`)).toBe(true);
    expect(verifySignature(secret, payload, `md5=${hex}`)).toBe(false);
    expect(verifySignature(secret, payload, `sha256=not-hex`)).toBe(false);
  });
});
