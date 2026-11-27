import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const backendTarget = process.env.VITE_BACKEND_URL || 'http://localhost:8082'

const apiProxy = {
  '/api': {
    target: backendTarget,
    changeOrigin: true,
  },
  '/uploads': {
    target: backendTarget,
    changeOrigin: true,
  },
  '/v3/api-docs': {
    target: backendTarget,
    changeOrigin: true,
  },
  '/swagger-ui': {
    target: backendTarget,
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: apiProxy,
  },
  preview: {
    proxy: apiProxy,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
            return 'leaflet'
          }
          if (id.includes('node_modules/qrcode')) {
            return 'qrcode'
          }
        },
      },
    },
  },
})
