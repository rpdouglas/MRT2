import { VitePWA } from 'vite-plugin-pwa';
import react from '@vitejs/plugin-react';
import { defineConfig, configDefaults } from 'vitest/config';
import { visualizer } from 'rollup-plugin-visualizer';

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
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        id: 'ca.myrecoverytoolkit.app',
        orientation: 'portrait',
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
    }),
    visualizer({
      filename: 'stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
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
    // e2e/ is Playwright's suite (PROJ-23) — its own runner (`test:e2e`) picks
    // it up; Vitest must not also try to import these as unit tests.
    exclude: [...configDefaults.exclude, 'functions/**', 'e2e/**'],
  },
  esbuild: {
    // CODE-01, Production Readiness Audit 2026-07-28: tree-shake any stray
    // console.log out of production builds. Deliberately narrower than
    // esbuild's `drop: ['console']`, which would also strip console.error/warn
    // calls that carry real diagnostic value.
    pure: ['console.log'],
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
            // PERF-01, Production Readiness Audit 2026-07-28: the prior catch-all
            // 'vendor' bucket combined React, Router, TanStack Query, and both icon
            // libraries into one 1.83MB chunk. Split by update frequency/size so a
            // cold load doesn't block on one monolithic file.
            if (id.includes('react-router')) {
              return 'react-router';
            }
            // Matches the top-level react/react-dom/scheduler packages only —
            // a broader substring check also caught @use-gesture/react's "react"
            // subpath, which pulled in @use-gesture/core (bucketed as 'vendor')
            // and created a vendor <-> react-vendor circular-chunk warning.
            if (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
              return 'react-vendor';
            }
            if (id.includes('@tanstack')) {
              return 'tanstack-query';
            }
            if (id.includes('lucide-react') || id.includes('@heroicons')) {
              return 'icons';
            }
            if (id.includes('jspdf')) {
              return 'pdf-export';
            }
            if (id.includes('posthog')) {
              return 'posthog';
            }
            return 'vendor';
          }
        }
      }
    }
  }
});
