import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.VITE_PORT || process.env.PORT,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET, // Node.js backend server
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
