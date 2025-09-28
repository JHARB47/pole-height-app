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
    include: ['src/**/*.{test,spec}.{js,jsx}'],
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
    hookTimeout: 10_000,
    testTimeout: 10_000,
    globals: true,
    environment: 'jsdom',
    setupFiles: resolve(__dirname, 'src/testSetup.js'),
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/**/*.{test,spec}.{js,jsx}',
        'src/**/__tests__/**',
        'src/testSetup.js',
        '**/*.d.ts',
        '**/vite.config.*',
        '**/vitest.config.*',
        '**/postcss.config.*',
        '**/tailwind.config.*',
        '**/stackbit.config.*',
        'scripts/**',
        'public/**',
        'netlify/**',
      ],
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 60,
        functions: 55,
        statements: 60,
        branches: 50,
      },
    },
  },
});
