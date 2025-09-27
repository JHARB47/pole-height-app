import { defineConfig } from 'vitest/config';

const nodeMajor = Number(process.versions.node.split('.')[0]);
const useThreads = nodeMajor < 23; // disable threads on Node >= 23 to avoid tinypool conflicts

export default defineConfig({
  resolve: {
    alias: [
      { find: '@', replacement: '/src' },
    ],
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,jsx}', 'src/**/*.test.js'],
    exclude: ['coverage/**'],
    passWithNoTests: true,
    // Avoid tinypool thread conflicts on newer Node versions (>=23)
    threads: useThreads,
    // For Node < 23 where threads are enabled, set conservative limits
    poolOptions: useThreads ? { threads: { minThreads: 1, maxThreads: 4 } } : undefined,
    hookTimeout: 10000,
    testTimeout: 10000,
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/testSetup.js',
    coverage: {
      // Only measure coverage for actual application code in src/
      provider: 'v8',
      include: [
        'src/**/*.{js,jsx}',
      ],
      exclude: [
        // tests and helpers
        'src/**/*.{test,spec}.{js,jsx}',
        'src/**/__tests__/**',
        'src/testSetup.js',
        // type defs and generated files
        '**/*.d.ts',
        // configs, scripts, public assets and serverless functions
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
      // Conservative thresholds to guard regressions while unblocking CI
      thresholds: {
        lines: 60,
        functions: 55,
        statements: 60,
        branches: 50,
      },
      // Keep defaults for enabled=false so regular `npm test` isn’t slowed down
    }
  }
});
