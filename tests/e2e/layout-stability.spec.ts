import { expect, test } from '../fixtures'

// На реальной сети шрифты приезжают позже первой отрисовки. Если запасной шрифт не подогнан под веб-шрифт,
// заголовки перестраиваются и страница «прыгает» (CLS). Здесь шрифты искусственно задерживаются, чтобы это было видно.
const pages = ['/', '/catalog', '/product/lisenok-amigurumi', '/product/sviter-krupnoy-vyazki-kakao', '/custom', '/about', '/info/materials']

// Тест зависит от тайминга загрузки: один повтор спасает от случайных скачков на загруженной машине.
test.describe.configure({ retries: 1 })

for (const path of pages) {
  test(`подмена шрифта не двигает вёрстку: ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.addInitScript(() => {
      const w = window as unknown as { __cls: number }
      w.__cls = 0
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as { value: number, hadRecentInput: boolean }[]) if (!entry.hadRecentInput) w.__cls += entry.value
      }).observe({ type: 'layout-shift', buffered: true })
    })
    await page.route('**/*.woff2', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200))
      await route.continue()
    })
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(300)
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls)
    // Настоящие регрессии давали 0.06–0.14, порог 0.03 их ловит с запасом.
    expect(cls, `CLS на ${path}`).toBeLessThan(0.03)
  })
}
