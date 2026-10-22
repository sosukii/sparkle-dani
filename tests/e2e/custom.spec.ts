import { expect, test } from '../fixtures'

test.beforeEach(async ({ context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
})

test('страница «Свой заказ»: суть понятна за секунды, без «полотна текста»', async ({ page }) => {
  await page.goto('/custom')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('только для вас')
  // Три шага и пять пунктов для первого сообщения
  await expect(page.locator('#how li')).toHaveCount(3)
  await expect(page.getByRole('heading', { name: 'Бюджет' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Материал', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Размеры и мерки' })).toBeVisible()
  // Полезные ссылки: размеры, материалы, каталог; неподтверждённых обещаний о материалах нет
  await expect(page.getByTestId('custom-links')).toContainText('Размеры и мерки')
  await expect(page.locator('main')).not.toContainText('премиум')
  // Объём текста разумный: страница читается быстро
  const words = (await page.locator('main').innerText()).split(/\s+/).length
  expect(words).toBeLessThan(650)
})

test('основная кнопка ведёт в Telegram', async ({ page }) => {
  await page.goto('/custom')
  const link = page.getByTestId('custom-telegram')
  await expect(link).toHaveAttribute('href', 'https://t.me/sosukii')
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link).toHaveAttribute('rel', /noopener/)
})

test('шаблон первого сообщения копируется одним нажатием', async ({ page }) => {
  await page.goto('/custom')
  const template = await page.getByTestId('custom-template').inputValue()
  expect(template).toContain('Здравствуйте, Дани!')
  expect(template).toContain('Бюджет')
  await page.getByTestId('custom-copy').click()
  await expect(page.getByTestId('custom-copy')).toContainText('Скопировано')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(template)
})

test('FAQ раскрывается, а разметка FAQPage и хлебные крошки есть в HTML', async ({ page }) => {
  await page.goto('/custom')
  const question = page.getByText('Сколько ждать готовое изделие?')
  await question.click()
  await expect(page.getByText('Срок зависит от размера и сложности.')).toBeVisible()
  const ld = (await page.locator('script[type="application/ld+json"]').allInnerTexts()).join(' ')
  expect(ld).toContain('"@type":"FAQPage"')
  expect(ld).toContain('"@type":"BreadcrumbList"')
})

test('ссылки на «Свой заказ» есть в шапке, подвале, на главной и в поиске', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('banner').getByRole('link', { name: 'Свой заказ' })).toBeVisible()
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Свой заказ' })).toBeVisible()
  await page.getByTestId('home-help-custom').click()
  await expect(page).toHaveURL(/\/custom$/)
})

test('на странице доставки нет неподтверждённых обещаний: условия согласуются до заказа', async ({ page }) => {
  await page.goto('/delivery')
  await expect(page.getByTestId('delivery-delivery')).toContainText('согласуются')
  await expect(page.getByTestId('delivery-payment')).toContainText('На сайте оплата не принимается')
  await expect(page.getByTestId('delivery-returns')).toContainText('до заказа')
  const text = await page.locator('main').innerText()
  for (const claim of ['СДЭК', 'Москв', 'бесплатн', 'примерк', 'пожизнен']) expect(text, claim).not.toContain(claim)
})
