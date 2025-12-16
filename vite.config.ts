import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

icons: [
          {
            // Note: The generator usually names them like this
            src: 'pwa-192x192.png', 
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // 'maskable' ensures it fills the circle on Android
          }
        ]

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
