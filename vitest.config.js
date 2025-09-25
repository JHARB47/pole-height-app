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
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage'
    }
  }
});
