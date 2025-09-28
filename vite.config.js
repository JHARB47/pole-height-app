// @ts-nocheck
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Return a chunk name for the given module id.
 * This small helper keeps the manualChunks hook trivial while preserving
 * the previous chunking behavior extracted from the original function.
 */
function isExternalId(id) {
  const external = new Set(['tokml', 'shpjs']);
  return external.has(id);
}

function chunkForPdfLib(id) {
  if (!id.includes('pdf-lib')) return undefined;
  if (id.includes('pdf-lib/es/core')) return 'pdf-core';
  if (id.includes('pdf-lib/es/api')) return 'pdf-api';
  return 'pdf-libs';
}

function chunkForSimple(id) {
  if (id.includes('@tmcw/togeojson')) return 'geojson-utils';
  if (id.includes('jszip')) return 'zip-utils';
  if (id.includes('react-dom')) return 'react-dom';
  if (id.includes('react') && !id.includes('react-dom')) return 'react';
  if (id.includes('zustand')) return 'state-vendor';
  if (['clsx', 'tailwind', 'postcss'].some(s => id.includes(s))) return 'ui-vendor';
  if (id.includes('moment') || id.includes('date-fns')) return 'date-vendor';
  return undefined;
}

function chunkForSrcUtils(id) {
  if (!id.includes('/src/utils/')) return undefined;
  if (['calculations.js'].some(s => id.includes(s))) return 'app-calculations';
  if (['permits.js', 'permitSummary.js', 'pdfFormFiller.js', 'pdfFieldMapper.js'].some(s => id.includes(s))) return 'app-permits';
  if (['exporters.js', 'importers.js'].some(s => id.includes(s))) return 'app-io';
  if (['geodata.js', 'targets.js'].some(s => id.includes(s))) return 'app-geodata';
  return 'app-utils';
}

function chunkForSrcComponents(id) {
  if (!id.includes('/src/components/')) return undefined;
  if (['SpansEditor', 'ExistingLinesEditor'].some(s => id.includes(s))) return 'app-editors';
  if (['SpanDiagram', 'PoleSketch'].some(s => id.includes(s))) return 'app-diagrams';
  if (id.includes('ProposedLineCalculator')) return 'app-calculator';
  return 'app-components';
}

/**
 * @typedef {'polyfills' | 'vendor' | undefined} NodeModulesChunk
 * @typedef {string | undefined} ChunkName
 * @typedef {(id: string | undefined) => ChunkName} ChunkFn
 */

/**
 * Determine the chunk name for a given module id.
 * @param {string | undefined} id
 * @returns {ChunkName}
 */
function chunkForId(id) {
  if (!id) return undefined;

  if (isExternalId(id)) return undefined;

  /** @type {NodeModulesChunk} */
  let nodeModulesChunk;
  if (id.includes('node_modules')) {
    if (['buffer', 'stream', 'util'].some(s => id.includes(s))) {
      nodeModulesChunk = 'polyfills';
    } else {
      nodeModulesChunk = 'vendor';
    }
  } else {
    nodeModulesChunk = undefined;
  }

  return chunkForPdfLib(id)
    || chunkForSimple(id)
    || chunkForSrcUtils(id)
    || chunkForSrcComponents(id)
    || nodeModulesChunk;
}



export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: [
      { find: '@', replacement: '/src' },
    ],
  },
  build: {
    target: 'es2022', // Align with modern evergreen browsers & Node 22 toolchain
    treeshake: true,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: (id) => chunkForId(id)
  }
    }
  },
  // Avoid forcing prebundling of unused deps; keep defaults
  define: {
    // Provide global for libraries that expect it
    global: 'globalThis',
  },
})

