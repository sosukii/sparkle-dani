import { expect, test } from '../fixtures'

// Демо-изделия: полностью описанный свитер (3 размера, измерения, модель), свитер без сведений и шарф без состава и ухода.
const FULL = '/product/sviter-krupnoy-vyazki-kakao'
const UNKNOWN = '/product/sviter-olivkovyy'
const NO_COMPOSITION = '/product/sharf-palantin-seryy'

test.describe('характеристики и пояснения', () => {
  test('состав объясняется рядом с характеристикой, по запросу и без потери контекста', async ({ page }) => {
    await page.goto(FULL)
    const row = page.getByTestId('spec-composition')
    await expect(row).toContainText('80% шерсть, 20% акрил')

    const explainer = row.getByTestId('explainer')
    await expect(explainer).not.toHaveAttribute('open', '')
    await explainer.getByText('Что означает такой состав?').click()
    await expect(explainer).toHaveAttribute('open', '')
    await expect(explainer).toContainText('Шерсть.')
    await expect(explainer).toContainText('общие сведения о материалах, а не обещания')
    await expect(explainer).toContainText('нельзя точно сказать')

    await explainer.getByText('Что означает такой состав?').click()
    await expect(explainer).not.toHaveAttribute('open', '')
    await expect(page.getByTestId('product-title')).toBeVisible() // контекст товара на месте
  })

  test('пояснение открывается с клавиатуры', async ({ page }) => {
    await page.goto(FULL)
    const summary = page.getByTestId('spec-composition').locator('summary')
    await summary.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('spec-composition').getByTestId('explainer')).toHaveAttribute('open', '')
  })

  test('посадка и уход показаны, пояснение к оверсайзу доступно', async ({ page }) => {
    await page.goto(FULL)
    await expect(page.getByTestId('spec-fit')).toContainText('Оверсайз')
    await page.getByTestId('spec-fit').getByText('Что это значит?').click()
    await expect(page.getByTestId('spec-fit')).toContainText('Свободный крой')
    await expect(page.getByTestId('product-care')).toContainText('Ручная стирка при 30 °C')
  })

  test('неизвестные сведения названы неизвестными и предлагают уточнить у Дани', async ({ page }) => {
    await page.goto(UNKNOWN)
    await expect(page.getByTestId('product-price')).toHaveText('Цена уточняется')
    await expect(page.getByTestId('availability-badge').first()).toContainText('Наличие уточняйте у Дани')
    await expect(page.getByTestId('composition-unknown')).toBeVisible()
    await expect(page.getByTestId('spec-sizes')).toContainText('Размеры пока не указаны')
    await expect(page.getByTestId('care-unknown')).toBeVisible()
    await expect(page.getByTestId('add-to-cart')).toHaveCount(0) // выдуманной цены в корзине быть не может
    await expect(page.getByTestId('price-unknown')).toBeVisible()

    await page.goto(NO_COMPOSITION)
    await expect(page.getByTestId('composition-unknown')).toBeVisible()
    await expect(page.getByTestId('care-unknown')).toBeVisible()
  })

  test('честно сказано, что картинка временная', async ({ page }) => {
    await page.goto(FULL)
    await expect(page.getByTestId('gallery-placeholder')).toContainText('Временная картинка')
  })
})

test.describe('размер и покупка', () => {
  test('без выбранного размера в корзину не добавить, с выбранным — добавляется с размером', async ({ page }) => {
    await page.goto(FULL)
    await page.getByTestId('add-to-cart').click()
    await expect(page.getByTestId('size-required')).toBeVisible()
    await expect(page.getByTestId('cart-count')).toHaveCount(0)

    await page.getByTestId('size-m').check()
    await expect(page.getByTestId('size-required')).toHaveCount(0)
    await page.getByTestId('add-to-cart').click()
    await expect(page.getByTestId('cart-count')).toHaveText('1')

    await page.goto('/cart')
    await expect(page.getByTestId('line-size')).toHaveText('Размер: M')
    await page.getByTestId('contact-button').click()
    await expect(page.getByTestId('order-text')).toHaveValue(/Свитер крупной вязки «Какао», размер M — 1 ×/)
  })

  test('размер выбирается с клавиатуры', async ({ page }) => {
    await page.goto(FULL)
    await page.getByTestId('size-l').focus()
    await page.keyboard.press('Space')
    await expect(page.getByTestId('size-l')).toBeChecked()
  })

  test('справка по размеру: таблица, модель, выбор из неё; контекст и выбор сохраняются', async ({ page }) => {
    await page.goto(FULL)
    await page.getByTestId('size-s').check()
    await page.getByTestId('size-help').click()

    const dialog = page.getByRole('dialog', { name: 'Как выбрать размер' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByTestId('size-table').getByRole('row')).toHaveCount(4) // заголовок + S, M, L
    await expect(dialog.getByTestId('size-model')).toContainText('рост 172 см, размер S')
    await expect(dialog).toContainText('Свободный крой')

    await dialog.getByTestId('size-choose-l').click()
    await expect(dialog).toBeHidden()
    await expect(page.getByTestId('size-l')).toBeChecked() // выбор из справки применился
    await expect(page.getByTestId('product-title')).toBeVisible()
    await expect(page.getByTestId('size-help')).toBeFocused() // фокус вернулся туда, откуда открывали
  })

  test('справка закрывается по Escape, ранее выбранный размер не сбрасывается', async ({ page }) => {
    await page.goto(FULL)
    await page.getByTestId('size-m').check()
    await page.getByTestId('size-help').click()
    await expect(page.getByRole('dialog', { name: 'Как выбрать размер' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Как выбрать размер' })).toBeHidden()
    await expect(page.getByTestId('size-m')).toBeChecked()
  })

  test('в справке есть путь на страницу «Размеры и мерки» и обратно к изделию', async ({ page }) => {
    await page.goto(FULL)
    await page.getByTestId('size-help').click()
    await page.getByTestId('size-more').click()
    await expect(page).toHaveURL(/\/info\/sizes\/?\?from=sviter-krupnoy-vyazki-kakao/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Размеры и мерки')
    await expect(page.getByTestId('fits-list')).toContainText('Оверсайз')
    await page.getByTestId('back-to-product').click()
    await expect(page).toHaveURL(/\/product\/sviter-krupnoy-vyazki-kakao$/)
  })

  test('изделие в одном размере не требует выбора', async ({ page }) => {
    await page.goto('/product/mishka-amigurumi')
    await expect(page.getByTestId('size-picker')).toHaveCount(0)
    await page.getByTestId('add-to-cart').click()
    await expect(page.getByTestId('cart-count')).toHaveText('1')
    await page.goto('/cart')
    await expect(page.getByTestId('line-size')).toHaveCount(0) // «один размер» в заказ строкой не пишем
  })

  test('понятно, что будет после нажатия: оплаты и заказа на сайте нет', async ({ page }) => {
    await page.goto(FULL)
    await expect(page.getByTestId('what-next')).toContainText('Оплаты на сайте нет')
    await expect(page.getByTestId('what-next')).toContainText('скопируете и отправите сами')
    await expect(page.getByTestId('product-terms')).toContainText('согласуете')
  })
})

test.describe('вопрос Дани про изделие', () => {
  test('сообщение содержит изделие, размер и ссылку, видно целиком и ничего не отправляется само', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto(FULL)
    await page.getByTestId('size-m').check()
    await page.getByTestId('ask-open').click()

    const dialog = page.getByRole('dialog', { name: /Сообщение для Дани/ })
    await expect(dialog).toBeVisible()
    const text = await page.getByTestId('ask-text').inputValue()
    expect(text).toContain('«Свитер крупной вязки «Какао»», размер M')
    expect(text).toMatch(/\/product\/sviter-krupnoy-vyazki-kakao/)

    await page.getByTestId('copy-ask').click()
    await expect(page.getByTestId('copy-ask')).toContainText('Скопировано')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text)
    const link = page.getByTestId('open-telegram-ask')
    await expect(link).toHaveAttribute('href', 'https://t.me/sosukii')
    await expect(link).toHaveAttribute('target', '_blank')

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page.getByTestId('size-m')).toBeChecked()
  })

  test('для изделия без цены главное действие — уточнить цену и наличие', async ({ page }) => {
    await page.goto(UNKNOWN)
    await page.getByTestId('ask-product').click()
    const text = await page.getByTestId('ask-text').inputValue()
    expect(text).toContain('«Свитер «Оливковый»»')
    expect(text).toContain('цена и наличие')
  })
})

test.describe('информационные страницы', () => {
  test('«Материалы и уход» открывается из пояснения и возвращает к изделию', async ({ page }) => {
    await page.goto(FULL)
    await page.getByTestId('spec-composition').getByText('Что означает такой состав?').click()
    await page.getByTestId('materials-more').click()
    await expect(page).toHaveURL(/\/info\/materials\/?\?from=/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Материалы и уход')
    await expect(page.getByTestId('materials-list')).toContainText('Шерсть')
    await expect(page.getByTestId('care-list')).toContainText('Сушить горизонтально')
    await page.getByTestId('back-to-product').click()
    await expect(page.getByTestId('product-title')).toHaveText('Свитер крупной вязки «Какао»')
  })

  test('без параметра from ссылки «назад» нет, а страницы открываются напрямую', async ({ page }) => {
    for (const path of ['/info/materials', '/info/sizes']) {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      await expect(page.getByTestId('back-to-product')).toHaveCount(0)
    }
  })

  test('поиск по сайту знает про размеры и материалы', async ({ page }) => {
    await page.goto('/search?q=какой размер')
    await expect(page.getByTestId('search-page-sizes')).toBeVisible()
    await page.goto('/search?q=уход')
    await expect(page.getByTestId('search-page-materials')).toBeVisible()
  })
})
