#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';

async function assertNetlifyFunction() {
  const { handler } = await import('../../netlify/functions/health.js');
  const response = await handler({});
  if (!response || response.statusCode !== 200) {
    throw new Error(`Netlify health function returned unexpected status ${response?.statusCode}`);
  }
  const payload = JSON.parse(response.body || '{}');
  if (!payload.ok) {
    throw new Error('Netlify health function returned ok=false');
  }
  console.log('✓ Netlify health function responded ok');
}

async function assertManifest() {
  const manifestCandidates = [
    join('dist', 'manifest.json'),
    join('dist', '.vite', 'manifest.json')
  ];
  let manifestPath;
  let manifestRaw;
  for (const candidate of manifestCandidates) {
    try {
      manifestRaw = await readFile(candidate, 'utf8');
      manifestPath = candidate;
      break;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  if (!manifestRaw || !manifestPath) {
    throw new Error('Build manifest was not found in dist/');
  }

  const manifest = JSON.parse(manifestRaw);
  const entry = manifest['src/main.jsx'];
  if (!entry || !entry.file) {
    throw new Error('Build manifest missing src/main.jsx entry');
  }
  const assetPath = join('dist', entry.file);
  await access(assetPath);
  console.log(`✓ Build manifest present (${manifestPath}) -> ${entry.file}`);
}

async function run() {
  await assertNetlifyFunction();
  await assertManifest();
  console.log('Health checks complete');
}

run().catch((error) => {
  console.error('Health verification failed:', error.message);
  process.exit(1);
});
