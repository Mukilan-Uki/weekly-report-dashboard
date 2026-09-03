import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      // Frontend calls /api/... -> forwarded to backend :5000
      // So browser never needs localhost:5000 directly (preview-safe)
      '/api': 'http://localhost:5000',
    },
  },
})
