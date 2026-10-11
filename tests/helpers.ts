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
  // Курсор остаётся там, где был последний клик, и подсвечивает случайный элемент (hover) — уводим его в угол.
  await page.mouse.move(0, 0)
}

/** Ждёт, пока открытый диалог/шторка закончит анимацию появления (иначе скриншот поймает промежуточный кадр). */
export async function dialogSettled(page: Page) {
  await page.mouse.move(0, 0)
  await page.waitForFunction(() => {
    const dialog = document.querySelector('dialog[open]')
    if (!dialog) return false
    const style = getComputedStyle(dialog)
    const backdrop = getComputedStyle(dialog, '::backdrop')
    return style.opacity === '1'
      && (style.transform === 'none' || style.transform === 'matrix(1, 0, 0, 1, 0, 0)')
      && backdrop.backgroundColor === 'rgba(43, 27, 46, 0.5)'
  })
}
