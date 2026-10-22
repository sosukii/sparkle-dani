import { expect, test } from '../fixtures'
import { cards } from '../helpers'

const search = async (page: import('@playwright/test').Page, q: string) => {
  await page.goto(`/search?q=${encodeURIComponent(q)}`)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(q)
}
const titles = async (page: import('@playwright/test').Page) =>
  (await cards(page).locator('h3').allInnerTexts()).map((t) => t.trim())

test.describe('поиск по сайту: изделия', () => {
  test('«сережки» находит серьги, «серёжки» тоже', async ({ page }) => {
    for (const q of ['сережки', 'серёжки', 'серьги']) {
      await search(page, q)
      const found = await titles(page)
      expect(found.length, q).toBeGreaterThanOrEqual(6)
      expect(found.every((t) => t.startsWith('Серьги')), `${q}: ${found.join(', ')}`).toBe(true)
    }
  })

  test('«в наличии» отдаёт только изделия в наличии', async ({ page }) => {
    await search(page, 'в наличии')
    const badges = await page.getByTestId('availability-badge').allInnerTexts()
    expect(badges.length).toBeGreaterThan(0)
    expect(badges.every((t) => t.includes('В наличии'))).toBe(true)
  })

  test('«серьги в наличии» и «до 1200» работают как условия, а не как слова', async ({ page }) => {
    await search(page, 'серьги в наличии')
    expect((await titles(page)).every((t) => t.startsWith('Серьги'))).toBe(true)
    await search(page, 'до 1200')
    const prices = (await cards(page).getByText(/₽/).allInnerTexts()).map((t) => Number(t.replace(/\D/g, '')))
    expect(prices.length).toBeGreaterThan(0)
    expect(Math.max(...prices)).toBeLessThanOrEqual(1200)
  })

  test('формы слов: «розовая шапочка» находит шапку', async ({ page }) => {
    await search(page, 'розовая шапочка')
    expect(await titles(page)).toEqual(['Шапка с помпоном «зефир»'])
  })
})

test.describe('поиск по сайту: разделы', () => {
  const cases: [string, string][] = [
    ['доставка', 'delivery'],
    ['как получить', 'delivery'],
    ['где магазин', 'delivery'],
    ['какой город', 'delivery'],
    ['где на карте', 'delivery'],
    ['местоположение', 'delivery'],
    ['цены', 'catalog'],
    ['индивидуальный заказ', 'custom'],
    ['премиум', 'custom'],
    ['написать', 'contact'],
  ]
  for (const [query, id] of cases) {
    test(`«${query}» предлагает нужный раздел`, async ({ page }) => {
      await search(page, query)
      await expect(page.getByTestId(`search-page-${id}`)).toBeVisible()
    })
  }

  test('карточка раздела отвечает сразу и ведёт на страницу', async ({ page }) => {
    await search(page, 'какой город')
    const card = page.getByTestId('search-page-delivery')
    await expect(card).toContainText('СДЭК')
    await expect(card).toContainText('Москве')
    await card.click()
    await expect(page).toHaveURL(/\/delivery$/)
  })

  test('Telegram-карточка открывается в новой вкладке без передачи данных', async ({ page }) => {
    await search(page, 'телеграм')
    const link = page.getByTestId('search-page-contact')
    await expect(link).toHaveAttribute('href', 'https://t.me/sosukii')
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /noopener/)
  })
})

test.describe('поиск по сайту: состояния', () => {
  test('пустой запрос показывает популярное, а не пустоту', async ({ page }) => {
    await page.goto('/search')
    await expect(page.getByTestId('search-suggestions')).toContainText('Часто ищут')
    await page.getByTestId('search-suggestions').getByRole('link', { name: 'серьги' }).click()
    await expect(page).toHaveURL(/q=%D1%81%D0%B5%D1%80%D1%8C%D0%B3%D0%B8/)
  })

  test('подсказки выглядят как обычные чипы, а не как «выбранные»', async ({ page }) => {
    await page.goto('/search')
    const colors = await page.getByTestId('search-suggestions').getByRole('link', { name: 'серьги', exact: true }).evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(colors).toBe('rgb(42, 23, 8)')
    await search(page, 'абракадабра')
    const again = await page.getByTestId('search-suggestions').getByRole('link', { name: 'шарф', exact: true }).evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(again).toBe('rgb(42, 23, 8)')
  })

  test('ничего не нашлось — понятное сообщение и подсказки', async ({ page }) => {
    await search(page, 'абракадабра')
    await expect(page.getByTestId('search-suggestions')).toContainText('Ничего не нашлось')
    await expect(page.getByTestId('search-suggestions').getByRole('link', { name: 'Игрушки' })).toBeVisible()
  })

  test('результаты озвучиваются скринридеру, страница не индексируется', async ({ page }) => {
    await search(page, 'шарф')
    await expect(page.getByTestId('search-summary')).toContainText('изделий')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })

  test('после отправки фокус уходит с поля (на телефоне закрывается клавиатура)', async ({ page }) => {
    await page.goto('/about')
    await page.locator('#site-search').fill('плед')
    await page.locator('#site-search').press('Enter')
    await expect(page).toHaveURL(/\/search/)
    expect(await page.evaluate(() => document.activeElement?.id)).not.toBe('site-search')
  })

  test('мобильная лупа ведёт на страницу поиска', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Поиск', exact: true }).click()
    await page.locator('#mobile-search-input').fill('цены')
    await page.locator('#mobile-search-input').press('Enter')
    await expect(page).toHaveURL(/\/search\/?\?q=/)
    await expect(page.getByTestId('search-page-catalog')).toBeVisible()
  })
})
