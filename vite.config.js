import { fileURLToPath, URL } from 'node:url'

// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/ably/auth': {
        target: 'https://assitance.storehive.com.ng/public',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/ably\/auth/, '/ably/auth'),
      },
    },
  },
})
