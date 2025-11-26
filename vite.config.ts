// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // ¡IMPORTANTE! Asegúrate de que tus archivos de íconos (pwa-192x192.png, etc.) 
      // y registerSW.js estén en la raíz de la carpeta 'dist' después de la compilación.
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg', 'pwa-192x192.png', 'pwa-512x512.png'], // Agregué los íconos para asegurar que sean copiados a 'dist'
      manifest: {
        name: 'FitGen',
        short_name: 'FitGen',
        description: 'Tu aplicación de fitness',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            // <-- CAMBIO CRÍTICO: Añadir la barra inicial (/)
            src: '/pwa-192x192.png', 
            sizes: '192x192',
            type: 'image/png'
          },
          {
            // <-- CAMBIO CRÍTICO: Añadir la barra inicial (/)
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            // <-- CAMBIO CRÍTICO: Añadir la barra inicial (/)
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