import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures'
import { addToCart, settle } from '../helpers'

const viewports = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
} as const

async function shot(page: Page, name: string, fullPage = true) {
  await settle(page)
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage })
}

for (const [device, viewport] of Object.entries(viewports)) {
  test.describe(device, () => {
    test.use({ viewport })

    test('главная', async ({ page }) => {
      await page.goto('/')
      await shot(page, `home-${device}`)
    })

    test('каталог', async ({ page }) => {
      await page.goto('/catalog')
      await shot(page, `catalog-${device}`)
    })

    test('каталог с активными фильтрами', async ({ page }) => {
      await page.goto('/catalog?fandom=sailor-moon&color=pink&sort=price-desc')
      await shot(page, `catalog-filtered-${device}`)
    })

    test('каталог: пустой результат', async ({ page }) => {
      await page.goto('/catalog?q=абракадабра')
      await shot(page, `catalog-empty-${device}`)
    })

    test('категория, вторая страница', async ({ page }) => {
      await page.goto('/catalog/toys?page=2')
      await shot(page, `catalog-toys-page2-${device}`)
    })

    test('товар в наличии', async ({ page }) => {
      await page.goto('/product/lesnoy-duh-001')
      await shot(page, `product-in-stock-${device}`)
    })

    test('товар под заказ', async ({ page }) => {
      await page.goto('/product/zayka-lunnitsa-004')
      await shot(page, `product-made-to-order-${device}`)
    })

    test('корзина с товарами', async ({ page }) => {
      await addToCart(page, 'zayka-lunnitsa-004', 2)
      await addToCart(page, 'lesnoy-duh-001')
      await page.goto('/cart')
      await expect(page.getByTestId('cart-line')).toHaveCount(2)
      await shot(page, `cart-filled-${device}`)
    })

    test('пустая корзина', async ({ page }) => {
      await page.goto('/cart')
      await expect(page.getByTestId('empty-state')).toBeVisible()
      await shot(page, `cart-empty-${device}`)
    })

    test('диалог заказа', async ({ page }) => {
      await addToCart(page, 'zayka-lunnitsa-004', 2)
      await page.goto('/cart')
      await page.getByTestId('contact-button').click()
      await expect(page.getByTestId('order-text')).toBeVisible()
      await shot(page, `order-dialog-${device}`, false)
    })

    test('обо мне', async ({ page }) => {
      await page.goto('/about')
      await shot(page, `about-${device}`)
    })

    test('покупка и доставка', async ({ page }) => {
      await page.goto('/delivery')
      await shot(page, `delivery-${device}`)
    })

    test('страница 404', async ({ page }) => {
      await page.goto('/net-takoy-stranicy')
      await shot(page, `not-found-${device}`)
    })
  })
}

test.describe('мобильная панель фильтров', () => {
  test.use({ viewport: viewports.mobile })

  test('открыта', async ({ page }) => {
    await page.goto('/catalog/warm-wear')
    await settle(page)
    await page.getByTestId('open-filters').click()
    await expect(page.getByRole('dialog', { name: 'Фильтры' })).toBeVisible()
    await expect(page).toHaveScreenshot('filters-sheet-mobile.png')
  })
})
