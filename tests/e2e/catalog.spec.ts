import { expect, test } from '../fixtures'
import { cards } from '../helpers'

const count = (page: import('@playwright/test').Page) => page.getByTestId('result-count')

test('все фильтры применяются одновременно и не сбрасывают друг друга', async ({ page }) => {
  await page.goto('/catalog')
  await expect(count(page)).toHaveText('54 изделия')
  const sidebar = page.getByRole('complementary', { name: 'Фильтры' })

  await sidebar.getByTestId('filter-fandom-sailor-moon').check()
  await expect(count(page)).toHaveText(/^\d+ изделий$|^\d+ изделия$|^\d+ изделие$/)
  const sailorOnly = await count(page).innerText()

  await sidebar.getByTestId('filter-color-pink').check()
  await expect(count(page)).toHaveText('6 изделий')
  await expect(page).toHaveURL(/fandom=sailor-moon/)
  await expect(page).toHaveURL(/color=pink/)

  // Цена: до 2000 ₽
  await sidebar.getByTestId('price-max').fill('2000')
  await sidebar.getByTestId('price-max').press('Enter')
  await expect(count(page)).toHaveText('3 изделия')
  await expect(page).toHaveURL(/max=2000/)

  // Сортировка не сбрасывает фильтры
  await page.getByTestId('catalog-sort').selectOption('price-desc')
  await expect(page).toHaveURL(/sort=price-desc/)
  await expect(page).toHaveURL(/fandom=sailor-moon/)
  await expect(count(page)).toHaveText('3 изделия')
  // Счётчик при смене сортировки не меняется, поэтому ждём именно итоговый порядок, а не читаем сразу.
  await expect
    .poll(async () => (await cards(page).getByText(/₽/).allInnerTexts()).map((t) => Number(t.replace(/\D/g, ''))))
    .toEqual([1100, 950, 950])

  // Поиск работает вместе с фильтрами
  await page.getByTestId('catalog-search').fill('браслет')
  await expect(count(page)).toHaveText('1 изделие')

  // Один клик сбрасывает всё
  await page.getByTestId('clear-filters').click()
  await expect(count(page)).toHaveText('54 изделия')
  await expect(page).toHaveURL(/\/catalog$/)
  expect(sailorOnly).toBeTruthy()
})

test('фильтры можно включить с клавиатуры', async ({ page }) => {
  await page.goto('/catalog')
  const box = page.getByRole('complementary', { name: 'Фильтры' }).getByTestId('filter-fandom-ghibli')
  await box.focus()
  await page.keyboard.press('Space')
  await expect(box).toBeChecked()
  await expect(page).toHaveURL(/fandom=ghibli/)
  await expect(count(page)).toHaveText(/изделия|изделий|изделие/)
})

test('состояние каталога хранится в URL и переживает перезагрузку', async ({ page }) => {
  await page.goto('/catalog?fandom=ghibli&color=green&sort=price-asc')
  const before = await count(page).innerText()
  await page.reload()
  await expect(count(page)).toHaveText(before)
  await expect(page.getByRole('complementary', { name: 'Фильтры' }).getByTestId('filter-fandom-ghibli')).toBeChecked()
  await expect(page.getByTestId('catalog-sort')).toHaveValue('price-asc')
})

test('перепутанный диапазон цены не ломает каталог', async ({ page }) => {
  await page.goto('/catalog?min=5000&max=1000')
  const swapped = await count(page).innerText()
  await expect(page.getByTestId('price-min').first()).toHaveValue('1000')
  await expect(page.getByTestId('price-max').first()).toHaveValue('5000')
  await page.goto('/catalog?min=1000&max=5000')
  await expect(count(page)).toHaveText(swapped)

  // Мусор в параметрах тоже безопасен
  const response = await page.goto('/catalog?min=abc&max=-1&page=zzz&sort=hack')
  expect(response?.status()).toBe(200)
  await expect(count(page)).toHaveText('54 изделия')
})

test('поиск: находит, показывает пустое состояние и позволяет сбросить', async ({ page }) => {
  await page.goto('/catalog')
  await page.getByTestId('catalog-search').fill('лунница')
  await expect(count(page)).toHaveText('1 изделие')
  await expect(cards(page).first()).toContainText('Зайка-лунница')

  await page.getByTestId('catalog-search').fill('абракадабра')
  await expect(page.getByTestId('empty-state')).toContainText('Ничего не нашлось')
  await page.getByTestId('empty-state').getByRole('button', { name: 'Сбросить фильтры' }).click()
  await expect(count(page)).toHaveText('54 изделия')
})

test('поиск из шапки открывает каталог с запросом', async ({ page }) => {
  await page.goto('/about')
  await page.locator('#site-search').fill('шарф')
  await page.locator('#site-search').press('Enter')
  await expect(page).toHaveURL(/\/catalog\?q=%D1%88%D0%B0%D1%80%D1%84/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('шарф')
  expect(await cards(page).count()).toBeGreaterThan(0)
})

test('пагинация: в «Игрушках» две страницы', async ({ page }) => {
  await page.goto('/catalog/toys')
  await expect(count(page)).toHaveText('18 изделий')
  await expect(cards(page)).toHaveCount(12)
  const nav = page.getByRole('navigation', { name: 'Страницы каталога' })
  await expect(nav.getByRole('link', { name: 'Страница 1' })).toHaveAttribute('aria-current', 'page')

  await nav.getByRole('link', { name: 'Вперёд' }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(cards(page)).toHaveCount(6)
  await page.reload()
  await expect(cards(page)).toHaveCount(6)
  await expect(nav.getByRole('link', { name: 'Страница 2' })).toHaveAttribute('aria-current', 'page')

  // Страница за пределами диапазона не ломается
  await page.goto('/catalog/toys?page=99')
  await expect(cards(page)).toHaveCount(6)
})

test('в каждой категории фильтры работают, а лишних групп нет', async ({ page }) => {
  await page.goto('/catalog/toys')
  const side = page.getByRole('complementary', { name: 'Фильтры' })
  await expect(side.getByText('Фандом', { exact: true })).toBeVisible()
  await expect(side.getByText('Теплота / сезон')).toHaveCount(0) // у игрушек теплота не задана

  await page.goto('/catalog/warm-wear')
  await expect(side.getByText('Теплота / сезон')).toBeVisible()
  await side.getByTestId('filter-warmth-warm').check()
  await expect(count(page)).toHaveText(/^\d+ изделий$/)
  await side.getByTestId('filter-type-scarf').check()
  await expect(page).toHaveURL(/type=scarf/)
  await expect(page).toHaveURL(/warmth=warm/)
})

test('недоступные опции блокируются, а выбранные можно снять чипсом', async ({ page }) => {
  // Розовых изделий из Studio Ghibli нет — такая опция блокируется, чтобы не вести в тупик
  await page.goto('/catalog?color=pink')
  const side = page.getByRole('complementary', { name: 'Фильтры' })
  await expect(side.getByTestId('filter-fandom-ghibli')).toBeDisabled()
  await expect(side.getByTestId('filter-fandom-sailor-moon')).toBeEnabled()
  await page.getByRole('button', { name: 'Убрать фильтр: Розовый' }).click()
  await expect(count(page)).toHaveText('54 изделия')
  await expect(side.getByTestId('filter-fandom-ghibli')).toBeEnabled()
})

test.describe('мобильная версия', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('фильтры открываются в панели и применяются', async ({ page }) => {
    await page.goto('/catalog')
    await expect(page.getByRole('complementary', { name: 'Фильтры' })).toBeHidden()
    await page.getByTestId('open-filters').click()
    const sheet = page.getByRole('dialog', { name: 'Фильтры' })
    await expect(sheet).toBeVisible()
    await sheet.getByTestId('filter-fandom-genshin').check()
    await sheet.getByRole('button', { name: /^Показать/ }).click()
    await expect(sheet).toBeHidden()
    await expect(page).toHaveURL(/fandom=genshin/)
    await expect(page.getByTestId('open-filters')).toContainText('1')
  })

  test('мобильное меню открывается и закрывается по Escape', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Открыть меню' }).click()
    await expect(page.getByRole('navigation', { name: 'Мобильная навигация' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('navigation', { name: 'Мобильная навигация' })).toBeHidden()
  })
})
