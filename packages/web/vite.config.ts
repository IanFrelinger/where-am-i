import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: undefined,
      },
    },
  },
  optimizeDeps: {
    include: ['mapbox-gl'],
  },
  resolve: {
    alias: {
      'mapbox-gl': 'mapbox-gl',
    },
  },
})
