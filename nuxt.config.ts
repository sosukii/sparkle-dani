import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import type { NitroConfig } from 'nitropack'

const BASE = process.env.NUXT_APP_BASE_URL || '/'

/** Адреса для статической сборки (GitHub Pages): все товары и категории + статичный JSON каталога. */
function staticRoutes(): string[] {
  const dir = fileURLToPath(new URL('./data/products', import.meta.url))
  const products = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => `/product/${JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')).slug}`)
  const categories = JSON.parse(readFileSync(fileURLToPath(new URL('./data/categories.json', import.meta.url)), 'utf8'))
    .map((c: { slug: string }) => `/catalog/${c.slug}`)
  return ['/api/catalog.json', '/cart', '/search', '/custom', ...categories, ...products]
}

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  modules: ['@nuxt/eslint', '@pinia/nuxt', '@nuxtjs/sitemap', '@nuxtjs/robots'],
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  typescript: { strict: true, typeCheck: false },
  // Данные страницы лежат прямо в HTML, а не в отдельном _payload.json: на один запрос на критическом пути меньше.
  experimental: { payloadExtraction: false },
  site: {
    // Только origin (без /sparkle-dani): sitemap/robots сами добавляют baseURL. Берётся из NUXT_PUBLIC_SITE_URL.
    url: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    name: 'NOCTURNE',
  },
  runtimeConfig: {
    public: {
      /** true при сборке для статического хостинга (GitHub Pages): HTML создаётся без query-параметров. */
      isStatic: process.env.NUXT_STATIC === '1',
    },
  },
  app: {
    // Для GitHub Pages сайт живёт в подпапке (/sparkle-dani/); локально и в тестах — в корне.
    baseURL: BASE,
    head: {
      htmlAttrs: { lang: 'ru' },
      meta: [{ name: 'theme-color', content: '#210f03' }],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: `${BASE}favicon.svg` }],
    },
  },
  robots: {
    disallow: ['/cart', '/search'],
    // robots.txt обязан лежать в корне домена; при размещении в подпапке (GitHub Pages) его создать нельзя.
    robotsTxt: BASE === '/',
  },
  sitemap: {
    sources: ['/api/_sitemap-urls'],
    // Адреса отдаёт только наш источник: автообнаружение страниц краулером добавляет лишний дубль главной в подпапке.
    excludeAppSources: true,
  },
  hooks: {
    'prerender:routes'(ctx) {
      if (process.env.NUXT_STATIC !== '1') return
      for (const route of staticRoutes()) ctx.routes.add(route)
    },
    // data/ не публичная: JSON читается только серверным слоем и попадает в production-сборку как server asset.
    'nitro:config'(config) {
      const nitroConfig = config as NitroConfig
      if (process.env.NUXT_STATIC === '1') {
        // Статическая сборка живёт отдельно от серверной, чтобы тесты могли гонять обе; хостинг сам сжимает ответы.
        nitroConfig.output = { ...nitroConfig.output, dir: fileURLToPath(new URL('./.output-static', import.meta.url)), publicDir: fileURLToPath(new URL('./.output-static/public', import.meta.url)) }
      }
      else {
        // Предсжатые gzip/brotli-версии статики: сервер отдаёт их сам, без прокси.
        nitroConfig.compressPublicAssets = { gzip: true, brotli: true }
      }
      nitroConfig.serverAssets ??= []
      nitroConfig.serverAssets.push({ baseName: 'data', dir: fileURLToPath(new URL('./data', import.meta.url)) })
    },
  },
  routeRules: {
    '/about': { prerender: true },
    '/delivery': { prerender: true },
  },
})
