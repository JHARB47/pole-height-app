import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.{js,jsx}', 'src/**/*.test.js'],
    exclude: ['coverage/**'],
    maxWorkers: 4,
    hookTimeout: 10000,
    testTimeout: 10000,
  }
});
