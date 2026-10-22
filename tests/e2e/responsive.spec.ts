import { expect, test } from '../fixtures'

// Контрольные ширины из ТЗ (1280, 768, 390) и промежуточные (360, 430, 820, 1024): без горизонтальной прокрутки
// и без слишком мелких кнопок и полей на всех основных страницах.
const widths = [360, 390, 430, 768, 820, 1024, 1280]
const pages = [
  '/', '/catalog', '/catalog/sweaters', '/product/sviter-krupnoy-vyazki-kakao', '/product/sviter-olivkovyy', '/cart',
  '/about', '/delivery', '/custom', '/info/materials', '/info/sizes', '/search?q=свитер',
]

for (const width of widths) {
  test.describe(`ширина ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } })

    for (const path of pages) {
      test(`без горизонтальной прокрутки и мелких элементов: ${path}`, async ({ page }) => {
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        expect(overflow, 'горизонтальная прокрутка страницы').toBeLessThanOrEqual(0)

        // Интерактивные элементы, которые покупатель нажимает пальцем, не меньше 36×36 px (кроме скрытых и текстовых ссылок).
        const small = await page.evaluate(() => {
          const out: string[] = []
          const nodes = document.querySelectorAll<HTMLElement>('button, input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]), select, summary, .btn')
          for (const el of nodes) {
            const r = el.getBoundingClientRect()
            const style = getComputedStyle(el)
            if (r.width === 0 || r.height === 0 || style.visibility === 'hidden' || el.closest('[inert], dialog:not([open])')) continue
            if (r.height < 36 || r.width < 36) out.push(`${el.tagName.toLowerCase()}${el.getAttribute('data-testid') ? `[${el.getAttribute('data-testid')}]` : ''} ${Math.round(r.width)}×${Math.round(r.height)}: ${(el.textContent ?? '').trim().slice(0, 30)}`)
          }
          return out
        })
        expect(small, 'слишком мелкие элементы управления').toEqual([])
      })
    }
  })
}
