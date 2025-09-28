#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const directionArgIndex = process.argv.findIndex(arg => ['up', 'down', 'redo'].includes(arg));
const direction = directionArgIndex >= 0 ? process.argv[directionArgIndex] : 'up';

const args = ['--config', resolve(__dirname, '..', '..', 'server', 'db', 'migrate.config.cjs'), direction];
const child = spawn(process.execPath, [resolve(process.cwd(), 'node_modules', '.bin', 'node-pg-migrate'), ...args], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
