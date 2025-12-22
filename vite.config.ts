import { VitePWA } from 'vite-plugin-pwa';
import react from '@vitejs/plugin-react';
// We remove the standard 'defineConfig' from 'vite' and use the vitest-augmented version 
// to satisfy both the TypeScript compiler and ESLint rules.
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
      // --- NEW SECTION: THE FIX FOR FIREBASE AUTH ---
      workbox: {
        // 1. CRITICAL: Ignore Firebase Auth URLs so the popup works
        navigateFallbackDenylist: [
            /^\/__\/auth/, 
            /^\/__\/firebase/
        ],
        
        // 2. Performance Caching (The extra lines you noticed)
        // These cache fonts and images so the app looks good offline
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
  test: {
    // Enable global APIs like 'describe', 'it', and 'expect'
    globals: true,
    // Simulate a browser environment using jsdom for React component testing
    environment: 'jsdom',
    // Path to the setup file that extends DOM matchers
    setupFiles: './src/test/setup.ts',
    // Ensure CSS is processed so tests can verify styles or visibility
    css: true,
  },
});