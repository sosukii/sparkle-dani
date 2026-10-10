import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import type { NitroConfig } from 'nitropack'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  modules: ['@nuxt/eslint', '@nuxt/image', '@pinia/nuxt', '@nuxtjs/sitemap', '@nuxtjs/robots'],
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  typescript: { strict: true, typeCheck: false },
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    name: 'Sparkle Dani',
  },
  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
  },
  image: {
    format: ['avif', 'webp'],
    quality: 82,
    screens: { sm: 480, md: 768, lg: 1024, xl: 1280 },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'ru' },
      meta: [{ name: 'theme-color', content: '#fbf6f1' }],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
  robots: {
    disallow: ['/cart'],
  },
  sitemap: {
    urls: ['/', '/catalog', '/about', '/delivery'],
    sources: ['/api/_sitemap-urls'],
    exclude: ['/cart', '/search'],
  },
  hooks: {
    // data/ не публичная: JSON читается только серверным слоем и попадает в production-сборку как server asset.
    'nitro:config'(config) {
      const nitroConfig = config as NitroConfig
      nitroConfig.serverAssets ??= []
      nitroConfig.serverAssets.push({ baseName: 'data', dir: fileURLToPath(new URL('./data', import.meta.url)) })
    },
  },
  routeRules: {
    '/about': { prerender: true },
    '/delivery': { prerender: true },
  },
})
