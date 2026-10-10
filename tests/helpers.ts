import { expect, type Page } from '@playwright/test'

/** Добавляет товар в корзину через интерфейс, как это делает покупатель. */
export async function addToCart(page: Page, slug: string, times = 1) {
  await page.goto(`/product/${slug}`)
  const button = page.getByTestId('add-to-cart')
  await expect(button).toBeEnabled()
  for (let i = 0; i < times; i++) {
    if (await button.isDisabled()) break
    await button.click()
  }
  await expect(page.getByTestId('cart-count')).toBeVisible()
}

/** Количество карточек товаров в сетке. */
export const cards = (page: Page) => page.getByTestId('product-card')

/** Ждёт, пока на странице всё стабилизируется: шрифты, ленивые картинки, сетевая активность. */
export async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
  // Прокручиваем страницу, чтобы сработал lazy-loading у всех картинок.
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight - 100, 300)
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 60))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForFunction(() => [...document.images].every((img) => img.complete && img.naturalWidth > 0), undefined, { timeout: 20_000 })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForLoadState('networkidle')
}
