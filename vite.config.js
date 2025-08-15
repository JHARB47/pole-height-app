import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // bind to 0.0.0.0 so other devices can connect
    port: 5173,        // try 5173 first
    strictPort: false, // pick the next free port if 5173 is taken
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    target: 'es2015',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      external: (id) => {
        // Externalize specific problematic modules
        if (id.includes('globalThis')) return true
        return false
      },
      output: {
        manualChunks: {
          // Separate geospatial libraries into their own chunk for better caching
          geospatial: ['shpjs', '@tmcw/togeojson', 'jszip'],
          // Keep React libraries together
          vendor: ['react', 'react-dom', 'zustand'],
          // Lucide icons in separate chunk
          icons: ['lucide-react']
        }
      }
    }
  },
  define: {
    // Provide global for libraries that expect it
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Provide buffer polyfill for browser
      buffer: 'buffer',
    }
  }
})
