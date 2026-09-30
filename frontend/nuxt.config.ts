// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  // Server-side rendering for the web; Capacitor builds (CAPACITOR=1) are a static SPA.
  ssr: !process.env.CAPACITOR,

  devtools: { enabled: false },
  modules: ['@vite-pwa/nuxt', 'nuxt-quasar-ui'],
  css: ['~/assets/css/main.css'],

  // Quasar components (QBtn, QDialog, ...) are auto-imported. Its global styles are
  // neutralised at the end of main.css so the existing design is unchanged.
  quasar: {
    plugins: [],
  },

  runtimeConfig: {
    public: {
      // Overridden at runtime by NUXT_PUBLIC_API_URL.
      apiUrl: 'http://localhost:4000',
      // Overridden by NUXT_PUBLIC_GOOGLE_CLIENT_ID. Empty hides the Google button.
      googleClientId: '',
    },
  },

  app: {
    head: {
      title: 'GameVault',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Manage your gaming collection' },
        { name: 'theme-color', content: '#8b5cf6' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon-180x180.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800&family=Rajdhani:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
    manifest: {
      name: 'GameVault',
      short_name: 'GameVault',
      description: 'Manage your gaming collection',
      theme_color: '#8b5cf6',
      background_color: '#0b0a14',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      scope: '/',
      icons: [
        { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      // Pages are server-rendered, so there is no static index.html to fall back to.
      navigateFallback: null,
      globPatterns: ['**/*.{js,css,svg,png,ico,woff2}'],
      runtimeCaching: [
        {
          // Pages: use the network, fall back to the last cached copy when offline.
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: { cacheName: 'gamevault-pages', networkTimeoutSeconds: 5 },
        },
        {
          // API reads: same strategy, so the list still shows offline.
          urlPattern: ({ url, request }) => request.method === 'GET' && url.pathname.startsWith('/api/'),
          handler: 'NetworkFirst',
          options: { cacheName: 'gamevault-api', networkTimeoutSeconds: 5 },
        },
        {
          urlPattern: ({ url }) =>
            url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'google-fonts' },
        },
      ],
    },
    client: { installPrompt: false },
    devOptions: { enabled: false },
  },
});
