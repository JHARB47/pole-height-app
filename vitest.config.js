import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      { find: '@', replacement: '/src' },
    ],
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,jsx}', 'src/**/*.test.js'],
    exclude: ['coverage/**'],
    maxWorkers: 4,
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
