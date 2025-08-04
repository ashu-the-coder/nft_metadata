import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '5ed8baca4475.ngrok-free.app', // Add your current ngrok domain
      '.ngrok-free.app', // Allow all ngrok-free.app subdomains
      '.ngrok.io' // Allow all ngrok.io subdomains (for paid accounts)
    ],
    proxy: {
      '/api': {
        target: 'http://164.52.203.17:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
