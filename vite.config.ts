import { VitePWA } from 'vite-plugin-pwa';
import react from '@vitejs/plugin-react';
import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'maskable-icon-512x512.png'],
      manifest: {
        name: 'My Recovery Toolkit',
        short_name: 'MRT',
        description: 'A Buddhist-inspired and 12-step recovery companion toolkit.',
        theme_color: '#2563eb',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        navigateFallbackDenylist: [
            /^\/__\/auth/, 
            /^\/__\/firebase/
        ],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
            {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'google-fonts-cache',
                    expiration: {
                        maxEntries: 10,
                        maxAgeSeconds: 60 * 60 * 24 * 365
                    },
                    cacheableResponse: {
                        statuses: [0, 200]
                    }
                }
            },
            {
                urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'firebase-storage-cache',
                    expiration: {
                        maxEntries: 50
                    }
                }
            }
        ]
      }
    })
  ],
  server: {
    host: true, 
    port: 5175, 
    strictPort: true,
    watch: {
        usePolling: true,
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    // functions/ is a separate npm workspace with its own vitest.config.ts and
    // dependency tree — the root suite must never sweep it in (CI never installs
    // functions/node_modules for this job, so firebase-functions can't resolve).
    exclude: [...configDefaults.exclude, 'functions/**'],
  },
  build: {
    chunkSizeWarningLimit: 1000, 
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'firebase';
            }
            if (id.includes('recharts')) {
              return 'recharts';
            }
            if (id.includes('@google/generative-ai')) {
              return 'gemini';
            }
            return 'vendor';
          }
        }
      }
    }
  }
});
