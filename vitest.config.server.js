import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

process.env.NODE_ENV ??= 'test';
process.env.LOG_LEVEL ??= 'fatal';
process.env.DOTENV_CONFIG_QUIET ??= 'true';

export default defineConfig({
  resolve: {
    alias: [{ find: '@', replacement: resolve(__dirname, 'src') }],
  },
  test: {
    include: [
      'server/**/*.{test,spec}.{js,mjs}',
      'netlify/tests/**/*.{test,spec}.{js,mjs}',
    ],
    exclude: ['coverage/**', 'node_modules/**'],
    passWithNoTests: true,
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['server/**/*.{js,mjs}'],
      exclude: [
        'server/**/*.{test,spec}.{js,mjs}',
        'server/migrations/**',
        'server/.env.example',
        '**/*.d.ts',
      ],
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage/server',
      thresholds: {
        lines: 60,
        statements: 60,
        functions: 55,
        branches: 50,
      },
    },
  },
});