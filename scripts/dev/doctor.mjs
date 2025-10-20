#!/usr/bin/env node
import { createServer } from 'net';
import { existsSync } from 'fs';
import path from 'path';

const reqNode = '22.20.0'; // Updated for Node 22 support

/**
 * @typedef {Object} VersionCompareArgs
 * @property {string} a
 * @property {string} b
 */

/**
 * Compare two semantic version strings.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] || 0; const db = pb[i] || 0;
    if (da > db) return 1;
    if (da < db) return -1;
  }
  return 0;
}

/**
 * Check if a port is free.
 * @param {number} port
 * @returns {Promise<boolean>}
 */
function checkPort(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port, '127.0.0.1');
  });
}

/**
 * Log a message with a checkmark or cross.
 * @param {boolean} ok
 * @param {string} msg
 * @returns {void}
 */
function log(ok, msg) {
  const mark = ok ? '\u2705' : '\u274c';
  console.log(`${mark} ${msg}`);
}

/**
 * Main doctor routine.
 * @returns {Promise<void>}
 */
async function main() {
  console.log('Local env doctor\n');

  // Node version
  const node = process.versions.node;
  const nodeOk = compareVersions(node, '22.0.0') >= 0 && compareVersions(node, '25.0.0') < 0;
  log(nodeOk, `Node version ${node} (expected >=22 <25${reqNode ? `; recommended ${reqNode}` : ''})`);

  // Files
  const files = ['netlify.toml', 'package.json', 'public/sw.js'];
  files.forEach((f) => log(existsSync(path.resolve(f)), `File exists: ${f}`));

  // ENV
  const skip = process.env.NETLIFY_NEXT_PLUGIN_SKIP === 'true' || process.env.NETLIFY_NEXT_PLUGIN_SKIP === '1';
  log(skip, 'NETLIFY_NEXT_PLUGIN_SKIP is set for this shell');

  // DB URL redacted check
  const hasDb = !!process.env.DATABASE_URL || !!process.env.NETLIFY_DATABASE_URL || !!process.env.NETLIFY_DATABASE_URL_UNPOOLED;

  // Ports
  const p8888Free = await checkPort(8888);
  const p5173Free = await checkPort(5173);
  log(p8888Free, p8888Free ? 'Port 8888 is free (netlify dev can bind)' : 'Port 8888 is in use (netlify dev may already be running)');
  log(p5173Free, p5173Free ? 'Port 5173 is free (Vite can bind)' : 'Port 5173 is in use (Vite may already be running)');
  log(hasDb, 'Database URL detected in environment (optional for health check)');

  // If 8888 is in use, attempt to probe the Netlify functions health endpoint
  if (!p8888Free && typeof fetch === 'function') {
    try {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort('timeout'), 2000);
      const res = await fetch('http://127.0.0.1:8888/.netlify/functions/health', { signal: ac.signal });
      clearTimeout(t);
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        log(true, `Functions health reachable on 8888 (ok=${String(data?.ok)})`);
        if (!hasDb) {
          console.log('   Tip: set DATABASE_URL in .env to test db_test function.');
        }
      } else {
        log(false, `Functions health responded with HTTP ${res.status}`);
      }
    } catch (e) {
      let errMsg = '';
      if (typeof e === 'object' && e !== null && 'message' in e && typeof (e).message === 'string') {
        errMsg = e.message;
      } else {
        errMsg = String(e);
      }
      log(false, `Could not reach http://127.0.0.1:8888/.netlify/functions/health (${errMsg})`);
    }
  }

  log(hasDb, 'Database URL detected in environment (optional for health check)');
  // Netlify CLI
  try {
    const { execSync } = await import('node:child_process');
    const v = execSync('npx --yes netlify --version', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    log(true, `Netlify CLI available: ${v}`);
  } catch {
    log(false, 'Netlify CLI not available via npx');
  }

  console.log('\nTip: run "npm run dev:netlify" to start dev, then curl http://localhost:8888/.netlify/functions/health');
  console.log('If curl shows "exit code 7", the server is not listening on that port. Check the dev logs for the actual port.');
}

main().catch((e) => { console.error(e); process.exit(1); });
