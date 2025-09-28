import { defineConfig } from 'vitest/config';

// Vitest worker threads have shown instability (Tinypool config conflicts) when
// coverage is enabled or when running under CI. Run tests in-process instead.
const useThreads = false;
console.log('[vitest.config] threads enabled:', useThreads);

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
  // Avoid tinypool thread conflicts by running tests without worker threads.
  pool: 'forks',
  threads: useThreads,
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
