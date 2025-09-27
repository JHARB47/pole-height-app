/// <reference path="./eslint-env.d.ts" />
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', 'coverage', 'node_modules', '**/*.ts'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react': react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': 'warn',
    },
  },
  // Node contexts: scripts and build/config files
  {
    files: ['**/*.{test,spec}.{js,jsx}', '**/__tests__/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest, // provide describe/it/expect globals for tests
      }
    },
    rules: {
      // tests often have dev-only helpers
      'react-refresh/only-export-components': 'off'
    }
  },
  // Netlify Functions (Node runtime)
  {
    files: ['netlify/functions/**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: globals.node,
      sourceType: 'module',
      ecmaVersion: 'latest'
    },
    rules: {
      // serverless handlers may receive event/context even if not used
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-empty': ['error', { allowEmptyCatch: true }]
    }
  },
  {
    files: [
      'scripts/**/*.{js,mjs,cjs}',
      '*.config.{js,cjs,mjs,ts}',
      'vite.config.js',
      'postcss.config.js',
      'tailwind.config.js',
      'eslint.config.js',
      'stylelint.config.cjs'
    ],
    languageOptions: {
      globals: globals.node,
      sourceType: 'module'
    },
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-refresh/only-export-components': 'off'
    }
  }
];
