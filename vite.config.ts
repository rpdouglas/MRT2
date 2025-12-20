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
      }
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