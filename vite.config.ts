import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { getPort } from 'portfinder'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig(async () => {
  // Check if port 5173 is available, fallback to 5174
  let port = 5173
  let message = '' 
  
  try {
    // Try to get port 5173
    port = await getPort({ port: 5173 })
    message = `🚀 Port 5173 is available, starting development server on port ${port}`
  } catch (error) {
    // If 5173 is not available, try 5174
    try {
      port = await getPort({ port: 5174 })
      message = `⚠️  Port 5173 is in use, starting development server on port ${port}`
    } catch (error2) {
      // If both ports are busy, let portfinder find any available port
      port = await getPort({ port: 5175 })
      message = `⚠️  Ports 5173 and 5174 are in use, starting development server on port ${port}`
    }
  }
  
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                }
              }
            },
            {
              urlPattern: /\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 5 // 5 minutes
                },
                networkTimeoutSeconds: 10
              }
            }
          ]
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'نظام الإدارة - Urux',
          short_name: 'الإدارة',
          description: 'نظام إدارة التفعيل والتراخيص - Urux Activation Management System',
          theme_color: '#12789f',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          lang: 'ar',
          dir: 'rtl',
          categories: ['business', 'productivity', 'utilities'],
          prefer_related_applications: false,
          icons: [
            {
              src: '/icons/icon-72x72.png',
              sizes: '72x72',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/icons/icon-96x96.png',
              sizes: '96x96',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/icons/icon-128x128.png',
              sizes: '128x128',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/icons/icon-144x144.png',
              sizes: '144x144',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/icons/icon-152x152.png',
              sizes: '152x152',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/icons/icon-384x384.png',
              sizes: '384x384',
              type: 'image/png',
              purpose: 'maskable any'
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable any'
            }
          ],
          shortcuts: [
            {
              name: 'لوحة التحكم',
              short_name: 'الرئيسية',
              description: 'الانتقال إلى لوحة التحكم الرئيسية',
              url: '/',
              icons: [
                {
                  src: '/icons/icon-96x96.png',
                  sizes: '96x96'
                }
              ]
            },
            {
              name: 'إدارة المستخدمين',
              short_name: 'المستخدمين',
              description: 'إدارة المستخدمين والصلاحيات',
              url: '/manage-users',
              icons: [
                {
                  src: '/icons/icon-96x96.png',
                  sizes: '96x96'
                }
              ]
            },
            {
              name: 'رموز التفعيل',
              short_name: 'الرموز',
              description: 'إدارة رموز التفعيل',
              url: '/activation-codes',
              icons: [
                {
                  src: '/icons/icon-96x96.png',
                  sizes: '96x96'
                }
              ]
            }
          ]
        }
      })
    ],
    server: {
      port: port,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
        },
      },
    },
    base: './', // Use relative paths for assets
  }
})
