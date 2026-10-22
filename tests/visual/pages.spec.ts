import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures'
import { addToCart, dialogSettled, settle } from '../helpers'

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
      await page.goto('/catalog?fit=oversize&color=cocoa&sort=price-desc')
      await shot(page, `catalog-filtered-${device}`)
    })

    test('каталог: пустой результат', async ({ page }) => {
      await page.goto('/catalog?q=абракадабра')
      await shot(page, `catalog-empty-${device}`)
    })

    test('категория, вторая страница', async ({ page }) => {
      await page.goto('/catalog?page=2')
      await shot(page, `catalog-page2-${device}`)
    })

    test('товар в наличии', async ({ page }) => {
      await page.goto('/product/mishka-amigurumi')
      await shot(page, `product-in-stock-${device}`)
    })

    test('товар под заказ', async ({ page }) => {
      await page.goto('/product/lisenok-amigurumi')
      await shot(page, `product-made-to-order-${device}`)
    })

    test('корзина с товарами', async ({ page }) => {
      await addToCart(page, 'lisenok-amigurumi', 2)
      await addToCart(page, 'mishka-amigurumi')
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
      await addToCart(page, 'lisenok-amigurumi', 2)
      await page.goto('/cart')
      await page.getByTestId('contact-button').click()
      await expect(page.getByTestId('order-text')).toBeVisible()
      await dialogSettled(page)
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

    test('свой заказ', async ({ page }) => {
      await page.goto('/custom')
      await shot(page, `custom-${device}`)
    })

    test('поиск: разделы и изделия', async ({ page }) => {
      await page.goto('/search?q=доставка')
      await shot(page, `search-section-${device}`)
    })

    test('поиск: синонимы (джемпер → свитер)', async ({ page }) => {
      await page.goto('/search?q=джемпер')
      await shot(page, `search-products-${device}`)
    })

    test('поиск: ничего не нашлось', async ({ page }) => {
      await page.goto('/search?q=абракадабра')
      await shot(page, `search-empty-${device}`)
    })

    test('каталог: много выбранных фильтров в одну строку', async ({ page }) => {
      await page.goto('/catalog?type=sweater,cardigan,scarf&color=cocoa,olive,wine&fit=oversize,regular&avail=in_stock&min=3000&max=30000')
      await shot(page, `catalog-many-filters-${device}`, false)
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
    await page.goto('/catalog/sweaters')
    await settle(page)
    await page.getByTestId('open-filters').click()
    await expect(page.getByRole('dialog', { name: 'Фильтры' })).toBeVisible()
    await dialogSettled(page)
    await expect(page).toHaveScreenshot('filters-sheet-mobile.png')
  })
})
