import { expect, test } from '../fixtures'
import { addToCart, cards } from '../helpers'

const IN_STOCK_ONE = 'mishka-amigurumi' // 3 200 ₽, в наличии: 1 шт. (демо-товар)
const MADE_TO_ORDER = 'lisenok-amigurumi' // 3 400 ₽, под заказ, 7–12 дней

const digits = (text: string | null) => Number((text ?? '').replace(/\D/g, ''))

test('путь покупателя: главная → категория → товар → корзина', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Основная навигация' }).getByRole('link', { name: 'Каталог' }).click()
  await expect(page).toHaveURL(/\/catalog$/)

  await page.getByRole('list', { name: 'Категории' }).getByRole('link', { name: 'Амигуруми' }).click()
  await expect(page).toHaveURL(/\/catalog\/amigurumi$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Амигуруми')

  await cards(page).first().getByRole('link').click()
  await expect(page).toHaveURL(/\/product\//)
  const title = await page.getByTestId('product-title').innerText()
  const price = digits(await page.getByTestId('product-price').innerText())

  await page.getByTestId('add-to-cart').click()
  await expect(page.getByTestId('cart-count')).toHaveText('1')

  await page.getByRole('banner').getByRole('link', { name: /^Корзина/ }).click()
  await expect(page).toHaveURL(/\/cart$/)
  await expect(page.getByTestId('cart-line')).toHaveCount(1)
  await expect(page.getByTestId('cart-line')).toContainText(title)
  expect(digits(await page.getByTestId('cart-total').innerText())).toBe(price)
})

test('корзина: количество, сумма, удаление и очистка', async ({ page }) => {
  await addToCart(page, MADE_TO_ORDER)
  await addToCart(page, IN_STOCK_ONE)
  await page.goto('/cart')

  await expect(page.getByTestId('cart-line')).toHaveCount(2)
  expect(digits(await page.getByTestId('cart-total').innerText())).toBe(3400 + 3200)
  await expect(page.getByTestId('cart-items-count')).toHaveText('2')

  // Увеличиваем «под заказ» до 3 штук
  const orderLine = page.getByTestId('cart-line').filter({ hasText: 'Лисёнок амигуруми' })
  await orderLine.getByTestId('qty-plus').click()
  await orderLine.getByTestId('qty-plus').click()
  await expect(orderLine.getByTestId('qty-input')).toHaveValue('3')
  expect(digits(await orderLine.getByTestId('line-total').innerText())).toBe(3400 * 3)
  expect(digits(await page.getByTestId('cart-total').innerText())).toBe(3400 * 3 + 3200)

  // Товар «в наличии: 1» нельзя увеличить
  const stockLine = page.getByTestId('cart-line').filter({ hasText: 'Мишка амигуруми' })
  await expect(stockLine.getByTestId('qty-plus')).toBeDisabled()

  // Удаление одной позиции
  await stockLine.getByTestId('remove-line').click()
  await expect(page.getByTestId('cart-line')).toHaveCount(1)
  expect(digits(await page.getByTestId('cart-total').innerText())).toBe(3400 * 3)

  // Очистка требует подтверждения
  await page.getByTestId('clear-cart').click()
  await page.getByTestId('confirm-clear').click()
  await expect(page.getByTestId('empty-state')).toContainText('В корзине пока пусто')
  await expect(page.getByTestId('cart-count')).toHaveCount(0)
})

test('корзина сохраняется при навигации и после перезагрузки', async ({ page }) => {
  await addToCart(page, MADE_TO_ORDER, 2)
  await page.goto('/about')
  await expect(page.getByTestId('cart-count')).toHaveText('2')
  await page.reload()
  await expect(page.getByTestId('cart-count')).toHaveText('2')
  await page.goto('/cart')
  await expect(page.getByTestId('cart-line')).toContainText('Лисёнок амигуруми')
  await expect(page.getByTestId('qty-input')).toHaveValue('2')
})

test('нельзя добавить больше, чем есть в наличии, и это объясняется', async ({ page }) => {
  await page.goto(`/product/${IN_STOCK_ONE}`)
  await expect(page.getByText('Осталось: 1 шт.')).toBeVisible()
  await page.getByTestId('add-to-cart').click()
  await expect(page.getByTestId('add-to-cart')).toBeDisabled()
  await expect(page.getByTestId('add-to-cart')).toContainText('Всё уже в корзине')
  await expect(page.getByTestId('in-cart-note')).toContainText('В корзине: 1')
})

test('«под заказ»: показан срок, лимит по остатку не выдумывается', async ({ page }) => {
  await page.goto(`/product/${MADE_TO_ORDER}`)
  await expect(page.getByTestId('lead-time')).toHaveText('Срок изготовления: 7–12 дней')
  await expect(page.getByText('Под заказ').first()).toBeVisible()
  for (let i = 0; i < 4; i++) await page.getByTestId('qty-plus').click()
  await page.getByTestId('add-to-cart').click()
  await expect(page.getByTestId('cart-count')).toHaveText('5')
})

test('пустая корзина показывает понятное состояние', async ({ page }) => {
  await page.goto('/cart')
  await expect(page.getByTestId('empty-state')).toContainText('В корзине пока пусто')
  await page.getByRole('link', { name: 'Перейти в каталог' }).click()
  await expect(page).toHaveURL(/\/catalog$/)
})

test('связь с мастером: виден состав заказа и сумма, переход в Telegram без автоотправки', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await addToCart(page, MADE_TO_ORDER, 2)
  await page.goto('/cart')
  await page.getByTestId('contact-button').click()

  const text = page.getByTestId('order-text')
  await expect(text).toBeVisible()
  const value = await text.inputValue()
  expect(value).toContain('Лисёнок амигуруми — 2 ×')
  expect(value.replace(/\s/g, ' ')).toMatch(/Итого: 6 800/)

  await page.getByTestId('copy-order').click()
  await expect(page.getByTestId('copy-order')).toContainText('Скопировано')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(value)

  const link = page.getByTestId('open-telegram')
  await expect(link).toHaveAttribute('href', 'https://t.me/sosukii')
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link).toHaveAttribute('rel', /noopener/)
})

test('удалённый из каталога товар в корзине помечается и не попадает в сумму', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('sparkle-dani:cart:v1', JSON.stringify([
      { productId: 'product-999', slug: 'net-takogo-999', title: 'Исчезнувшая игрушка', price: 1000, qty: 2, availability: 'made_to_order', image: { src: '/images/products/product-022-1.jpg', alt: 'x', width: 1200, height: 1500 } },
    ]))
  })
  await page.goto('/cart')
  await expect(page.getByText('Больше недоступно')).toBeVisible()
  expect(digits(await page.getByTestId('cart-total').innerText())).toBe(0)
  await expect(page.getByTestId('contact-button')).toBeDisabled()
})

test('битые данные в localStorage не ломают сайт', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sparkle-dani:cart:v1', '{не json'))
  await page.goto('/cart')
  await expect(page.getByTestId('empty-state')).toBeVisible()
})
