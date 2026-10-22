import { expect, test } from '../fixtures'
import { cards } from '../helpers'

const cardOf = (page: import('@playwright/test').Page, title: string) => cards(page).filter({ hasText: title })
const count = (page: import('@playwright/test').Page) => page.getByTestId('cart-count')

test('прямо из каталога: добавить, увеличить, уменьшить и убрать из корзины', async ({ page }) => {
  await page.goto('/catalog/amigurumi')
  const card = cardOf(page, 'Лисёнок амигуруми') // под заказ, лимита нет

  await card.getByTestId('card-add').click()
  await expect(card.getByTestId('card-stepper')).toBeVisible()
  await expect(card.getByTestId('card-qty')).toHaveText('1')
  await expect(count(page)).toHaveText('1')

  await card.getByTestId('card-plus').click()
  await card.getByTestId('card-plus').click()
  await expect(card.getByTestId('card-qty')).toHaveText('3')
  await expect(count(page)).toHaveText('3')

  await card.getByTestId('card-minus').click()
  await expect(card.getByTestId('card-qty')).toHaveText('2')
  await expect(count(page)).toHaveText('2')

  // На единице «минус» убирает изделие из корзины
  await card.getByTestId('card-minus').click()
  await expect(card.getByTestId('card-qty')).toHaveText('1')
  await expect(card.getByTestId('card-minus')).toHaveAccessibleName(/Убрать из корзины/)
  await card.getByTestId('card-minus').click()
  await expect(card.getByTestId('card-add')).toBeVisible()
  await expect(count(page)).toHaveCount(0)
})

test('нажатия на кнопки карточки не открывают страницу товара', async ({ page }) => {
  await page.goto('/catalog/amigurumi')
  const card = cardOf(page, 'Лисёнок амигуруми')
  await card.getByTestId('card-add').click()
  await card.getByTestId('card-plus').click()
  await expect(page).toHaveURL(/\/catalog\/amigurumi\/?$/)
  // а клик по картинке/названию — открывает
  await card.locator('h3 a').click()
  await expect(page).toHaveURL(/\/product\/lisenok-amigurumi/)
})

test('лимит остатка: «+» блокируется, когда всё в корзине', async ({ page }) => {
  await page.goto('/catalog/amigurumi')
  const card = cardOf(page, 'Мишка амигуруми') // в наличии: 1 шт.
  await card.getByTestId('card-add').click()
  await expect(card.getByTestId('card-plus')).toBeDisabled()
  await expect(card.getByTestId('card-plus')).toHaveAttribute('title', 'Это всё, что есть в наличии')
})

test('состояние карточки совпадает со страницей товара и корзиной', async ({ page }) => {
  await page.goto('/catalog/amigurumi')
  const card = cardOf(page, 'Лисёнок амигуруми')
  await card.getByTestId('card-add').click()
  await card.getByTestId('card-plus').click()

  await page.goto('/product/lisenok-amigurumi')
  await expect(page.getByTestId('in-cart-note')).toContainText('В корзине: 2')

  await page.goto('/cart')
  await expect(page.getByTestId('qty-input')).toHaveValue('2')

  await page.goto('/catalog/amigurumi')
  await expect(cardOf(page, 'Лисёнок амигуруми').getByTestId('card-qty')).toHaveText('2')
})

test('карточки остаются выровненными с кнопками и степпером в ряду', async ({ page }) => {
  await page.goto('/catalog/amigurumi')
  await cardOf(page, 'Лисёнок амигуруми').getByTestId('card-add').click() // одна карточка в ряду со степпером
  const tops = await cards(page).evaluateAll((nodes) => {
    const rows = new Map<number, number[]>()
    for (const card of nodes) {
      const key = Math.round(card.getBoundingClientRect().top)
      const actions = card.querySelector('[data-testid=card-actions]')!.getBoundingClientRect()
      rows.set(key, [...(rows.get(key) ?? []), Math.round(actions.top - card.getBoundingClientRect().top)])
    }
    return [...rows.values()]
  })
  for (const row of tops) expect(Math.max(...row) - Math.min(...row)).toBeLessThanOrEqual(1)
})

test('кнопки карточек работают и на телефоне (и без пересечения с соседями)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/catalog/amigurumi')
  const card = cardOf(page, 'Лисёнок амигуруми')
  await card.getByTestId('card-add').click()
  await card.getByTestId('card-plus').click()
  await expect(card.getByTestId('card-qty')).toHaveText('2')
  const box = await card.getByTestId('card-stepper').boundingBox()
  expect(box!.height).toBeGreaterThanOrEqual(40)
})
