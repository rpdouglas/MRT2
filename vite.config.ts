import { VitePWA } from 'vite-plugin-pwa';
import react from '@vitejs/plugin-react';
// We use the vitest-augmented version to satisfy both the TypeScript compiler and ESLint rules.
import { defineConfig as defineVitestConfig } from 'vitest/config';

export default defineVitestConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'My Recovery Toolkit',
        short_name: 'MRT',
        description: 'A Buddhist-inspired and 12-step recovery companion toolkit.',
        theme_color: '#2563eb',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      // --- PRESERVED: FIREBASE AUTH & CACHING FIXES ---
      workbox: {
        // 1. CRITICAL: Ignore Firebase Auth URLs so the popup works
        navigateFallbackDenylist: [
            /^\/__\/auth/, 
            /^\/__\/firebase/
        ],
        
        // 2. Performance Caching
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
            {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'google-fonts-cache',
                    expiration: {
                        maxEntries: 10,
                        maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
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
      // ----------------------------------------------
    })
  ],
  // --- PRESERVED: VITEST CONFIGURATION ---
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
  // --- NEW ADDITION: CHUNK SIZE OPTIMIZATION ---
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