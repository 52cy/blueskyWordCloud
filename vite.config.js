import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/xrpc': {
        target: 'https://bsky.social',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
