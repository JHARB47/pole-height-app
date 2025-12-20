#!/usr/bin/env node
// Connectivity self-test: safe, no secrets printed.
// Exits non-zero only if CONNECTIVITY_REQUIRED=true.

import dns from 'node:dns/promises';
import net from 'node:net';
import fs from 'node:fs/promises';

/**
 * @param {string} name
 * @returns {boolean}
 */
function boolEnv(name) {
  const v = process.env[name];
  return v === '1' || v === 'true' || v === 'yes';
}

/**
 * @param {boolean} ok
 * @param {string} msg
 */
function log(ok, msg) {
  const mark = ok ? '\u2705' : '\u26a0\ufe0f';
  console.log(`${mark} ${msg}`);
}

/**
 * @param {string} msg
 */
function logSkip(msg) {
  console.log(`\u23ed\ufe0f ${msg}`);
}

/**
 * GitHub Actions annotation helpers (no-op outside CI).
 */
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

/**
 * @param {string} s
 * @returns {string}
 */
function ghaEscape(s) {
  return s.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
}

/**
 * @param {'notice' | 'warning' | 'error'} level
 * @param {string} title
 * @param {string} message
 */
function ghaAnnotate(level, title, message) {
  if (!isGitHubActions) return;
  console.log(`::${level} title=${ghaEscape(title)}::${ghaEscape(message)}`);
}

/**
 * @param {string} raw
 * @returns {string}
 */
function redactUrl(raw) {
  try {
    const u = new URL(raw);
    // Never print credentials/query.
    const portPart = u.port ? `:${u.port}` : '';
    return `${u.protocol}//${u.hostname}${portPart}${u.pathname}`;
  } catch {
    return '<invalid-url>';
  }
}

/**
 * @param {string} hostname
 * @returns {Promise<{ ok: true } | { ok: false; error: string }>}
 */
async function checkDns(hostname) {
  try {
    await dns.lookup(hostname);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * @param {string} host
 * @param {number} port
 * @param {number} [timeoutMs]
 * @returns {Promise<{ ok: true } | { ok: false; error: string }>}
 */
async function checkTcp(host, port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const t = setTimeout(() => {
      socket.destroy(new Error('timeout'));
    }, timeoutMs);

    socket.once('connect', () => {
      clearTimeout(t);
      socket.end();
      resolve({ ok: true });
    });

    socket.once('error', (err) => {
      clearTimeout(t);
      resolve({ ok: false, error: err?.message || String(err) });
    });
  });
}

/**
 * @param {string} url
 * @param {number} [timeoutMs]
 * @returns {Promise<{ ok: boolean; status?: number; error?: string }>}
 */
async function checkHttp(url, timeoutMs = 2000) {
  if (typeof fetch !== 'function') return { ok: false, error: 'fetch not available' };
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort('timeout'), timeoutMs);
    const res = await fetch(url, { method: 'HEAD', signal: ac.signal });
    clearTimeout(t);
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * GitHub API requires a User-Agent; some endpoints also don't behave well with HEAD.
 * We treat any <500 HTTP response as "reachable".
 * @param {number} [timeoutMs]
 */
async function checkGitHubApi(timeoutMs = 2000) {
  if (typeof fetch !== 'function') return { ok: false, error: 'fetch not available' };
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort('timeout'), timeoutMs);
    const res = await fetch('https://api.github.com/rate_limit', {
      method: 'GET',
      signal: ac.signal,
      headers: {
        accept: 'application/vnd.github+json',
        'user-agent': 'poleplanpro-connectivity',
      },
    });
    clearTimeout(t);
    return { ok: res.status >= 200 && res.status < 500, status: res.status };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** @typedef {{ key: string; value: string }} EnvUrl */

/**
 * @param {{ key: string; value: unknown }} x
 * @returns {x is EnvUrl}
 */
function hasNonEmptyStringValue(x) {
  return typeof x.value === 'string' && x.value.trim().length > 0;
}

function collectDbUrls() {
  const keys = [
    'DATABASE_URL',
    'NETLIFY_DATABASE_URL',
    'NETLIFY_DATABASE_URL_UNPOOLED',
  ];
  /** @type {Array<{ key: string; value: unknown }>} */
  const raw = keys.map((k) => ({ key: k, value: process.env[k] }));
  return raw.filter(hasNonEmptyStringValue);
}

async function main() {
  const required = boolEnv('CONNECTIVITY_REQUIRED');
  let okCount = 0;
  let warnCount = 0;
  let skippedCount = 0;

  /** @type {string[]} */
  const okMessages = [];
  /** @type {string[]} */
  const warnMessages = [];
  /** @type {string[]} */
  const skippedMessages = [];

  /**
   * @param {boolean} ok
   * @param {string} msg
   */
  function record(ok, msg) {
    if (ok) okCount++;
    else warnCount++;
    log(ok, msg);
    if (ok) okMessages.push(msg);
    else warnMessages.push(msg);
    if (!ok) ghaAnnotate('warning', 'Connectivity', msg);
  }

  /**
   * @param {string} msg
   */
  function recordSkip(msg) {
    skippedCount++;
    logSkip(msg);
    skippedMessages.push(msg);
    ghaAnnotate('notice', 'Connectivity (skipped)', msg);
  }

  console.log('Connectivity self-test (safe)\n');
  console.log(`Mode: ${required ? 'required (will fail on warnings)' : 'warn-only (never fails on warnings)'}\n`);

  // 1) Database reachability (DNS + TCP)
  const dbUrls = collectDbUrls();
  if (dbUrls.length === 0) {
    recordSkip('No DB URL env vars set (skipping DB DNS/TCP checks)');
  }

  for (const { key, value } of dbUrls) {
    const safe = redactUrl(value);
    let u;
    try {
      u = new URL(value);
    } catch {
      record(false, `${key}: invalid URL (${safe})`);
      continue;
    }

    const host = u.hostname;
    const port = Number(u.port || '5432');

    const dnsRes = await checkDns(host);
    const dnsDetail = dnsRes.ok ? '' : ` (${dnsRes.error})`;
    record(dnsRes.ok, `${key}: DNS ${host}${dnsDetail}`);

    const tcpRes = await checkTcp(host, port);
    const tcpDetail = tcpRes.ok ? '' : ` (${tcpRes.error})`;
    record(tcpRes.ok, `${key}: TCP ${host}:${port}${tcpDetail}`);

    console.log(`   ${key}: ${safe}`);
  }

  // 2) GitHub API reachability (no auth)
  const gh = await checkGitHubApi();
  const ghDetail = gh.ok ? ` (HTTP ${gh.status})` : ` (${gh.error || 'failed'})`;
  record(gh.ok, `GitHub API reachable${ghDetail}`);

  // 3) Optional URLs (comma-separated)
  const rawUrls = process.env.CHECK_URLS;
  if (typeof rawUrls === 'string' && rawUrls.trim()) {
    for (const url of rawUrls.split(',').map((s) => s.trim()).filter(Boolean)) {
      const res = await checkHttp(url);
      const safe = redactUrl(url);
      const urlDetail = res.ok ? ` (HTTP ${res.status})` : ` (${res.error || 'failed'})`;
      record(res.ok, `URL reachable: ${safe}${urlDetail}`);
    }
  } else {
    recordSkip('CHECK_URLS not set (skipping optional endpoint checks)');
  }

  console.log(`\nSummary: ok=${okCount} warn=${warnCount} skipped=${skippedCount}`);
  ghaAnnotate('notice', 'Connectivity summary', `ok=${okCount} warn=${warnCount} skipped=${skippedCount}`);

  // GitHub Actions step summary (best-effort, never fails the script)
  if (isGitHubActions && typeof process.env.GITHUB_STEP_SUMMARY === 'string' && process.env.GITHUB_STEP_SUMMARY) {
    const mode = required ? 'required' : 'warn-only';
    let md = '';
    md += '## Connectivity self-test\n\n';
    md += `- Mode: **${mode}**\n`;
    md += `- Summary: ok=${okCount} warn=${warnCount} skipped=${skippedCount}\n\n`;

    if (warnMessages.length) {
      md += '### Warnings\n';
      for (const m of warnMessages.slice(0, 25)) md += `- ${m}\n`;
      if (warnMessages.length > 25) md += `- …and ${warnMessages.length - 25} more\n`;
      md += '\n';
    }

    if (skippedMessages.length) {
      md += '### Skipped\n';
      for (const m of skippedMessages.slice(0, 25)) md += `- ${m}\n`;
      if (skippedMessages.length > 25) md += `- …and ${skippedMessages.length - 25} more\n`;
      md += '\n';
    }

    try {
      await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `${md}\n`, 'utf8');
    } catch (e) {
      ghaAnnotate(
        'notice',
        'Connectivity summary',
        `Unable to write step summary: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  if (warnCount > 0 && required) {
    console.error(`\nConnectivity failures: ${warnCount}`);
    process.exit(1);
  }

  if (warnCount > 0) {
    console.log(`\nConnectivity warnings: ${warnCount} (set CONNECTIVITY_REQUIRED=true to hard-fail)`);
  } else {
    console.log('\nAll connectivity checks passed.');
  }
}

try {
  await main();
} catch (e) {
  console.error(e);
  process.exit(1);
}
