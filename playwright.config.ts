import { defineConfig, devices } from '@playwright/test'

const PORT = 3100
const baseURL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Картинки кодируются на лету (AVIF) и нагружают процессор: много воркеров только замедляют сервер и дают случайные тайм-ауты.
  workers: 2,
  timeout: 60_000,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  outputDir: 'test-results',
  // Снимки лежат отдельно для каждой платформы: шрифты и сглаживание в macOS и Linux отличаются.
  snapshotPathTemplate: '{testDir}/__screenshots__/{platform}/{testFileName}/{arg}{ext}',
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      // Допуск — только на единичные пиксели сглаживания. Относительный порог (ratio) не используем:
      // на длинной странице он съедает целые строки текста и прячет реальные поломки.
      maxDiffPixels: 40,
      // Порог цвета на пиксель почти нулевой: при 0.15 бежевый на белом считался «тем же цветом»
      // и низкоконтрастные поломки (растянутый блок, сдвиг фона) проходили незамеченными.
      threshold: 0.01,
      animations: 'disabled',
      caret: 'hide',
    },
  },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    reducedMotion: 'reduce',
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
  },
  projects: [
    {
      name: 'e2e',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'visual',
      testDir: './tests/visual',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Тесты идут против production-сборки: сначала `npm run build`.
    command: 'node .output/server/index.mjs',
    url: baseURL,
    env: { PORT: String(PORT), HOST: '127.0.0.1', NUXT_PUBLIC_SITE_URL: baseURL },
    // Всегда поднимаем свежий сервер: старый процесс на порту мог бы отдавать устаревшую сборку.
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
