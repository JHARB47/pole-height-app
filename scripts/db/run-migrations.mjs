#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cliArgs = process.argv.slice(2);
const directionIndex = cliArgs.findIndex(arg => ['up', 'down', 'redo'].includes(arg));
const direction = directionIndex >= 0 ? cliArgs[directionIndex] : 'up';
const extraArgs = cliArgs.filter((_, index) => index !== directionIndex);

const args = ['--config', resolve(__dirname, '..', '..', 'server', 'db', 'migrate.config.cjs'), direction, ...extraArgs];
const child = spawn(process.execPath, [resolve(process.cwd(), 'node_modules', '.bin', 'node-pg-migrate'), ...args], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
