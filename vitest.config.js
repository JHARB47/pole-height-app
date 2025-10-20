import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

process.env.VITEST_MIN_THREADS ??= '1';
process.env.VITEST_MAX_THREADS ??= '1';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  resolve: {
    alias: [{ find: '@', replacement: resolve(__dirname, 'src') }],
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,jsx}', 'server/**/*.{test,spec}.{js,mjs}'],
    exclude: ['coverage/**'],
    passWithNoTests: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 1,
        singleThread: true,
      },
    },
    hookTimeout: 20_000,
    testTimeout: 20_000,
    globals: true,
    environment: 'jsdom',
    environmentMatchGlobs: [
      ['server/**', 'node'],
    ],
    setupFiles: resolve(__dirname, 'src/testSetup.js'),
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}', 'server/**/*.{js,mjs}'],
      exclude: [
        'src/**/*.{test,spec}.{js,jsx}',
        'src/**/__tests__/**',
        'src/testSetup.js',
        'server/**/*.{test,spec}.{js,mjs}',
        'server/db/migrations/**',
        '**/*.d.ts',
        '**/vite.config.*',
        '**/vitest.config.*',
        '**/postcss.config.*',
        '**/tailwind.config.*',

        'scripts/**',
        'public/**',
        'netlify/**',
      ],
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 60,
        statements: 60,
        functions: 55,
        branches: 50,
      },
    },
  },
});
