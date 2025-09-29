import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  resolve: {
    alias: [{ find: '@', replacement: resolve(__dirname, 'src') }],
  },
  test: {
    include: ['server/**/*.{test,spec}.{js,mjs}'],
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
        lines: 30,
        statements: 30,
        functions: 20,
        branches: 25,
      },
    },
  },
});