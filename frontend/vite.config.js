import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        '.ngrok-free.app', // Allow all ngrok-free.app subdomains
        '.ngrok.io' // Allow all ngrok.io subdomains (for paid accounts)
      ]
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production', // Only generate sourcemaps in dev mode
      minify: mode === 'production',
      target: 'es2018', // Ensures compatibility with most browsers
      rollupOptions: {
        output: {
          // Chunk assets
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            ethers: ['ethers'],
            web3: ['web3'],
          }
        }
      }
    },
    // Base path for GitHub Pages or other hosting
    base: env.VITE_APP_BASE_PATH || '/',
    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __APP_BUILD_DATE__: JSON.stringify(new Date().toISOString())
    }
  }
})
