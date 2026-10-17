import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const backendTarget = process.env.VITE_BACKEND_URL || 'http://localhost:8082';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'favicon.ico',
        'favicon.svg',
        'apple-touch-icon.png',
        'pwa-icon.svg',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-512x512-maskable.png',
        'fonts/outfit-latin.woff2',
        'fonts/jetbrains-mono-latin.woff2',
      ],
      manifest: {
        name: "SamaAdresse",
        short_name: "SamaAdresse",
        description: "Une adresse pour votre maison, même sans nom de rue, au Sénégal.",
        lang: "fr",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#12304F",
        background_color: "#EADFC8",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Nouvelle adresse",
            short_name: "Nouvelle adresse",
            description: "Enregistrer une nouvelle adresse géolocalisée",
            url: "/addresses/new",
            icons: [
              {
                src: "pwa-192x192.png",
                sizes: "192x192",
              },
            ],
          },
          {
            name: "Mes adresses",
            short_name: "Mes adresses",
            description: "Consulter mes adresses enregistrées",
            url: "/addresses/mine",
            icons: [
              {
                src: "pwa-192x192.png",
                sizes: "192x192",
              },
            ],
          },
        ],
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: false,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
        runtimeCaching: [
          {
            // Fiche publique GET /api/addresses/{code} : NetworkFirst 3s, 30 jours, 50 entrées max
            urlPattern: ({ url, request }) =>
              request.method === 'GET' && /^\/api\/addresses\/[A-Z0-9-]+$/.test(url.pathname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'samaadresse-addresses-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 jours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              plugins: [
                {
                  fetchDidSucceed: async ({ response, request }) => {
                    if (response.status === 404 || response.status === 410) {
                      const cache = await (globalThis as any).caches?.open('samaadresse-addresses-cache');
                      if (cache) {
                        await cache.delete(request);
                      }
                    }
                    return response;
                  },
                },
              ],
            },
          },
          {
            // Photos /uploads/** : CacheFirst, 30 jours, 60 entrées max
            urlPattern: ({ url, request }) =>
              request.method === 'GET' && /^\/uploads\//.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'samaadresse-photos-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 jours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Tuiles de carte OpenStreetMap : CacheFirst, 14 jours, 300 entrées max
            urlPattern: ({ url }) => url.hostname.includes('tile.openstreetmap.org'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'samaadresse-map-tiles-cache',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 14 * 24 * 60 * 60, // 14 jours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true
      },
      '/uploads': {
        target: backendTarget,
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true
      },
      '/uploads': {
        target: backendTarget,
        changeOrigin: true
      }
    }
  },
  // @ts-expect-error Vitest configuration in vite.config
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}']
  }
});
