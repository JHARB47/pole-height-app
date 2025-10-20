#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';
if (typeof fetch === 'undefined') {
  const mod = await import('node-fetch');
  globalThis.fetch = mod.default || mod;
}

const argv = process.argv.slice(2);
const file = argv.find(a => !a.startsWith('--')) || 'scripts/dev/fixtures/github.pull_request.opened.json';
const shouldPost = argv.includes('--post');
const urlArg = argv.find(a => a.startsWith('--url='));
const baseUrl = urlArg ? urlArg.split('=')[1] : (process.env.NETLIFY_DEV_URL || 'http://localhost:8888');
const endpoint = `${baseUrl.replace(/\/$/, '')}/.netlify/functions/github_webhook`;
const payload = fs.readFileSync(file, 'utf8');
const secret = process.env.GITHUB_APP_WEBHOOK_SECRET || 'dev-secret';

function sign(body) {
  const h = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return `sha256=${h}`;
}

const headers = {
  'x-github-event': 'pull_request',
  'x-github-delivery': `dev-${Date.now()}`,
  'x-hub-signature-256': sign(payload),
  'content-type': 'application/json'
};

console.log('# Simulated GitHub headers');
console.log(JSON.stringify(headers, null, 2));
console.log('\n# Body');
console.log(payload);

console.log('\n# curl (optional)');
console.log(`curl -s -X POST \
  -H 'x-github-event: pull_request' \
  -H 'x-github-delivery: ${headers['x-github-delivery']}' \
  -H 'x-hub-signature-256: ${headers['x-hub-signature-256']}' \
  -H 'content-type: application/json' \
  --data-binary @${file} \
  ${endpoint}`);

if (shouldPost) {
  const body = payload;
  const postHeaders = {
    'x-github-event': 'pull_request',
    'x-github-delivery': headers['x-github-delivery'],
    'x-hub-signature-256': headers['x-hub-signature-256'],
    'content-type': 'application/json'
  };
  console.log(`\n# POSTing to ${endpoint} ...`);
  const res = await fetch(endpoint, { method: 'POST', headers: postHeaders, body });
  const text = await res.text();
  console.log(`# Response: ${res.status}`);
  console.log(text);
}
