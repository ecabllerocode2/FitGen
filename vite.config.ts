// vite.config.ts
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  resolve: {
    alias: {
      '@fitgen/visual': path.resolve(__dirname, 'packages/fitgen-visual/src'),
    },
  },
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      
      // 🎯 CRÍTICO 1: Usar el nombre de archivo robusto para evitar colisiones
      filename: 'service-worker.js', 
      
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'pwa-192x192.png', 'pwa-512x512.png'], 
      manifest: {
        name: 'FitGen',
        short_name: 'FitGen',
        description: 'Tu aplicación de fitness',
        theme_color: '#18181B',
        background_color: '#18181B',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            // 🎯 CRÍTICO 2: Rutas absolutas (con /)
            src: '/pwa-192x192.png', 
            sizes: '192x192',
            type: 'image/png'
          },
          {
            // 🎯 CRÍTICO 2: Rutas absolutas (con /)
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            // 🎯 CRÍTICO 2: Rutas absolutas (con /)
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})