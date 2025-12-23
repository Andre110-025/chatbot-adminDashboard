import { fileURLToPath, URL } from 'node:url'

// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // this is a google libriry service for cache
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module', // Important for development
        navigateFallback: 'index.html',
      },
      manifest: {
        name: 'Bot Dashboard',
        short_name: 'SBot convo dashboard',
        description: 'Management Dashboard',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#05716c',
        lang: 'en',
        categories: ['business', 'productivity'],
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'Go to Dashboard',
            url: '/',
            icons: [{ src: '/smilechatFavicon_192x192.jpg', sizes: '192x192' }],
          },
        ],
        icons: [
          {
            src: '/smilechatFavicon_192x192.jpg',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/smilechatFavicon_2_512x512.jpg',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/smilechatFavicon_3_180x180.jpg',
            sizes: '180x180',
            type: 'image/png',
            // purpose: 'any maskable',
          },
          {
            src: '/smilechatFavicon_4_32x32.jpg',
            sizes: '32x32',
            type: 'image/png',
          },
          {
            src: '/smilechatFavicon_5_16x16.jpg',
            sizes: '16x16',
            type: 'image/png',
          },
        ],
        screenshots: [
          {
            src: '/tempBot-mobile.png',
            type: 'image/png',
            sizes: '540x720',
            form_factor: 'narrow',
            label: 'Mobile Dashboard',
          },
          {
            src: '/tempBot-convo.png',
            type: 'image/png',
            sizes: '1280x720',
            form_factor: 'wide',
            label: 'Desktop Dashboard',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
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
