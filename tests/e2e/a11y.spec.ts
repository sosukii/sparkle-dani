import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '../fixtures'

// Автоматическая проверка доступности (WCAG 2.0/2.1 A и AA) основных страниц. Ловит серьёзные и критические нарушения:
// контраст, подписи полей, имена кнопок и ссылок, структуру заголовков. Ручная проверка клавиатурой — в других тестах.
const pages = [
  '/', '/catalog', '/catalog/sweaters', '/catalog?fit=oversize', '/product/sviter-krupnoy-vyazki-kakao', '/product/sviter-olivkovyy',
  '/product/mishka-amigurumi', '/cart', '/about', '/delivery', '/custom', '/info/materials', '/info/sizes', '/search?q=свитер', '/net-takoy-stranitsy',
]

for (const path of pages) {
  test(`доступность: ${path}`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    expect(
      serious.map((v) => `${v.id}: ${v.help} (${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')})`),
    ).toEqual([])
  })
}

test('доступность: открытая справка по размеру и сообщение Дани', async ({ page }) => {
  await page.goto('/product/sviter-krupnoy-vyazki-kakao')
  await page.getByTestId('size-help').click()
  await expect(page.getByRole('dialog', { name: 'Как выбрать размер' })).toBeVisible()
  let results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([])
  await page.keyboard.press('Escape')
  await page.getByTestId('ask-open').click()
  await expect(page.getByRole('dialog', { name: /Сообщение для/ })).toBeVisible()
  results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([])
})
