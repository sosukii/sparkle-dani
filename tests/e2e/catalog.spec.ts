import { expect, test } from '../fixtures'
import { cards } from '../helpers'

const count = (page: import('@playwright/test').Page) => page.getByTestId('result-count')

test('все фильтры применяются одновременно и не сбрасывают друг друга', async ({ page }) => {
  await page.goto('/catalog')
  await expect(count(page)).toHaveText('24 изделия')
  const sidebar = page.getByRole('complementary', { name: 'Фильтры' })

  await sidebar.getByTestId('filter-fit-oversize').check()
  await expect(count(page)).toHaveText('5 изделий')

  await sidebar.getByTestId('filter-size-one-size').check()
  await expect(count(page)).toHaveText('3 изделия')
  await expect(page).toHaveURL(/fit=oversize/)
  await expect(page).toHaveURL(/size=one-size/)

  // Цена: до 33 000 ₽ (кардиган за 33 500 ₽ не проходит)
  await sidebar.getByTestId('price-max').fill('33000')
  await sidebar.getByTestId('price-max').press('Enter')
  await expect(count(page)).toHaveText('2 изделия')
  await expect(page).toHaveURL(/max=33000/)

  // Сортировка не сбрасывает фильтры
  await page.getByTestId('catalog-sort').selectOption('price-desc')
  await expect(page).toHaveURL(/sort=price-desc/)
  await expect(page).toHaveURL(/fit=oversize/)
  await expect(count(page)).toHaveText('2 изделия')
  // Счётчик при смене сортировки не меняется, поэтому ждём именно итоговый порядок, а не читаем сразу.
  await expect
    .poll(async () => (await cards(page).getByText(/₽/).allInnerTexts()).map((t) => Number(t.replace(/\D/g, ''))))
    .toEqual([32000, 4200])

  // Поиск работает вместе с фильтрами
  await page.getByTestId('catalog-search').fill('шапка')
  await expect(count(page)).toHaveText('1 изделие')

  // Один клик сбрасывает всё
  await page.getByTestId('clear-filters').click()
  await expect(count(page)).toHaveText('24 изделия')
  await expect(page).toHaveURL(/\/catalog$/)
})

test('фильтры можно включить с клавиатуры', async ({ page }) => {
  await page.goto('/catalog')
  const box = page.getByRole('complementary', { name: 'Фильтры' }).getByTestId('filter-fit-oversize')
  await box.focus()
  await page.keyboard.press('Space')
  await expect(box).toBeChecked()
  await expect(page).toHaveURL(/fit=oversize/)
  await expect(count(page)).toHaveText('5 изделий')
})

test('состояние каталога хранится в URL и переживает перезагрузку', async ({ page }) => {
  await page.goto('/catalog?fit=oversize&color=cocoa&sort=price-asc')
  // На статике параметры адреса применяются после гидратации, поэтому ждём итог, а не читаем сразу.
  await expect(count(page)).toHaveText('2 изделия')
  await page.reload()
  await expect(count(page)).toHaveText('2 изделия')
  await expect(page.getByRole('complementary', { name: 'Фильтры' }).getByTestId('filter-fit-oversize')).toBeChecked()
  await expect(page.getByTestId('catalog-sort')).toHaveValue('price-asc')
})

test('перепутанный диапазон цены не ломает каталог', async ({ page }) => {
  await page.goto('/catalog?min=5000&max=1000')
  await expect(count(page)).not.toHaveText('24 изделия') // фильтр применился (на статике — после гидратации)
  const swapped = await count(page).innerText()
  await expect(page.getByTestId('price-min').first()).toHaveValue('1000')
  await expect(page.getByTestId('price-max').first()).toHaveValue('5000')
  await page.goto('/catalog?min=1000&max=5000')
  await expect(count(page)).toHaveText(swapped)

  // Мусор в параметрах тоже безопасен
  const response = await page.goto('/catalog?min=abc&max=-1&page=zzz&sort=hack')
  expect(response?.status()).toBe(200)
  await expect(count(page)).toHaveText('24 изделия')
})

test('поиск: находит, показывает пустое состояние и позволяет сбросить', async ({ page }) => {
  await page.goto('/catalog')
  await page.getByTestId('catalog-search').fill('лисёнок')
  await expect(count(page)).toHaveText('1 изделие')
  await expect(cards(page).first()).toContainText('Лисёнок амигуруми')

  await page.getByTestId('catalog-search').fill('абракадабра')
  await expect(page.getByTestId('empty-state')).toContainText('Ничего не нашлось')
  await page.getByTestId('empty-state').getByRole('button', { name: 'Сбросить фильтры' }).click()
  await expect(count(page)).toHaveText('24 изделия')
})

test('поиск из шапки открывает страницу поиска по сайту', async ({ page }) => {
  await page.goto('/about')
  await page.locator('#site-search').fill('шарф')
  await page.locator('#site-search').press('Enter')
  await expect(page).toHaveURL(/\/search\/?\?q=%D1%88%D0%B0%D1%80%D1%84/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('шарф')
  await expect(cards(page).first()).toBeVisible() // на статике результаты появляются после гидратации
})

test('пагинация: в каталоге две страницы по 12 изделий', async ({ page }) => {
  await page.goto('/catalog')
  await expect(count(page)).toHaveText('24 изделия')
  await expect(cards(page)).toHaveCount(12)
  const nav = page.getByRole('navigation', { name: 'Страницы каталога' })
  await expect(nav.getByRole('link', { name: 'Страница 1' })).toHaveAttribute('aria-current', 'page')

  await nav.getByRole('link', { name: 'Вперёд' }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(cards(page)).toHaveCount(12)
  await page.reload()
  await expect(cards(page)).toHaveCount(12)
  await expect(nav.getByRole('link', { name: 'Страница 2' })).toHaveAttribute('aria-current', 'page')

  // Страница за пределами диапазона не ломается
  await page.goto('/catalog?page=99')
  await expect(cards(page)).toHaveCount(12)
})

test('в каждой категории показываются только те группы фильтров, для которых есть данные', async ({ page }) => {
  await page.goto('/catalog/amigurumi')
  const side = page.getByRole('complementary', { name: 'Фильтры' })
  await expect(side.getByText('Материал', { exact: true })).toBeVisible()
  await expect(side.getByText('Посадка', { exact: true })).toHaveCount(0) // у игрушек посадка не применима

  await page.goto('/catalog/sweaters')
  await expect(side.getByText('Посадка', { exact: true })).toBeVisible()
  await side.getByTestId('filter-fit-oversize').check()
  await expect(count(page)).toHaveText('2 изделия')
  await side.getByTestId('filter-size-s').check()
  await expect(count(page)).toHaveText('1 изделие')
  await expect(page).toHaveURL(/fit=oversize/)
  await expect(page).toHaveURL(/size=s/)
})

test('недоступные опции блокируются, а выбранные можно снять чипсом', async ({ page }) => {
  // Оверсайза в оливковом цвете нет — такая опция блокируется, чтобы не вести в тупик
  await page.goto('/catalog?color=olive')
  const side = page.getByRole('complementary', { name: 'Фильтры' })
  await expect(side.getByTestId('filter-fit-oversize')).toBeDisabled()
  await expect(side.getByTestId('filter-fit-regular')).toBeEnabled()
  await page.getByRole('button', { name: 'Убрать фильтр: Оливковый' }).click()
  await expect(count(page)).toHaveText('24 изделия')
  await expect(side.getByTestId('filter-fit-oversize')).toBeEnabled()
})

test('ползунок цены и поля «от/до» синхронизированы в обе стороны', async ({ page }) => {
  await page.goto('/catalog')
  const side = page.getByRole('complementary', { name: 'Фильтры' })
  const sliderMin = side.getByTestId('price-slider-min')
  const sliderMax = side.getByTestId('price-slider-max')
  const inputMin = side.getByTestId('price-min')
  const inputMax = side.getByTestId('price-max')
  await expect(sliderMin).toHaveValue('3200')
  await expect(sliderMax).toHaveValue('36000')

  // Ползунок → поле: «до» сдвигаем на шаг влево с клавиатуры
  await sliderMax.focus()
  await page.keyboard.press('ArrowLeft')
  await expect(inputMax).toHaveValue('35950')
  await expect(page).toHaveURL(/max=35950/)
  // товар без цены при фильтре по цене не показывается: цена не известна
  await expect(count(page)).toHaveText('22 изделия')

  // Поле → ползунок
  await inputMin.fill('10000')
  await inputMin.press('Enter')
  await expect(sliderMin).toHaveValue('10000')
  await expect(page).toHaveURL(/min=10000/)

  // Ползунки не пересекаются: «от» нельзя увести правее «до»
  await sliderMin.focus()
  await page.keyboard.press('End')
  await expect(inputMin).toHaveValue('35950')
  await expect(sliderMin).toHaveValue('35950')
  await expect(count(page)).toHaveText(/^0 изделий$|^\d+ изделие$|^\d+ изделия$|^\d+ изделий$/)

  // Край диапазона = «без ограничения»: поле очищается
  await sliderMax.focus()
  await page.keyboard.press('End')
  await expect(inputMax).toHaveValue('')
  await expect(page).not.toHaveURL(/max=/)
})

for (const [name, viewport] of [['десктоп', { width: 1280, height: 900 }], ['телефон', { width: 390, height: 844 }]] as const) {
  test(`карточки в ряду выровнены: заголовки, цены и плашки на одной линии (${name})`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/catalog')
    await expect(cards(page).first()).toBeVisible()
    const rows = await cards(page).evaluateAll((nodes) => {
      const byRow = new Map<number, { h: number, price: number, badge: number }[]>()
      for (const card of nodes) {
        const box = card.getBoundingClientRect()
        const price = card.querySelector('p.font-bold')!.getBoundingClientRect()
        const badge = card.querySelector('[data-testid=availability-badge]')!.getBoundingClientRect()
        const key = Math.round(box.top)
        byRow.set(key, [...(byRow.get(key) ?? []), { h: box.height, price: price.top - box.top, badge: badge.top - box.top }])
      }
      return [...byRow.values()]
    })
    expect(rows.length).toBeGreaterThan(2)
    for (const row of rows) {
      for (const card of row) {
        expect(Math.abs(card.h - row[0]!.h), 'высота карточки').toBeLessThanOrEqual(1)
        expect(Math.abs(card.price - row[0]!.price), 'позиция цены').toBeLessThanOrEqual(1)
        expect(Math.abs(card.badge - row[0]!.badge), 'позиция плашки').toBeLessThanOrEqual(1)
      }
    }
  })
}

test('плашка «под заказ» не ломает карточку и показывает срок', async ({ page }) => {
  await page.goto('/catalog/amigurumi')
  const card = cards(page).filter({ hasText: 'Лисёнок амигуруми' })
  await expect(card).toContainText('Под заказ · 7–12 дней')
})

test('карточка показывает посадку и размеры, если они известны', async ({ page }) => {
  await page.goto('/catalog/sweaters')
  await expect(cards(page).filter({ hasText: 'Свитер крупной вязки' }).getByTestId('card-meta')).toHaveText('Посадка: оверсайз · S–L')
  // сведения не известны → строка пустая, но место под неё сохранено (карточки остаются выровненными)
  await expect(cards(page).filter({ hasText: 'Свитер «Оливковый»' }).getByTestId('card-meta')).toHaveText('')
})

test('изделия без нужных сведений не прячутся молча: о них сказано, их можно показать', async ({ page }) => {
  await page.goto('/catalog?fit=oversize')
  await expect(count(page)).toHaveText('5 изделий')
  const note = page.getByTestId('hidden-unknown')
  await expect(note).toContainText('Ещё 11 изделий')
  await expect(note.getByRole('link', { name: /спросить Дани/ })).toHaveAttribute('href', 'https://t.me/sosukii')

  await note.getByTestId('show-unknown').click()
  await expect(page).toHaveURL(/unknown=1/)
  await expect(count(page)).toHaveText('16 изделий')
  await expect(note).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Убрать фильтр: Включая изделия без сведений' })).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Фильтры' }).getByTestId('filter-include-unknown')).toBeChecked()

  await page.getByRole('button', { name: 'Убрать фильтр: Включая изделия без сведений' }).click()
  await expect(count(page)).toHaveText('5 изделий')
})

test('переключатель «включая изделия без сведений» появляется только вместе с такими фильтрами', async ({ page }) => {
  await page.goto('/catalog')
  const side = page.getByRole('complementary', { name: 'Фильтры' })
  await expect(side.getByTestId('filter-include-unknown')).toHaveCount(0)
  await side.getByTestId('filter-color-cocoa').check() // цвет известен у всех
  await expect(side.getByTestId('filter-include-unknown')).toHaveCount(0)
  await side.getByTestId('filter-fit-oversize').check()
  await side.getByTestId('filter-include-unknown').check()
  await expect(page).toHaveURL(/unknown=1/)
})

test('внизу каталога есть приглашение написать Дани, а в пустом результате тоже', async ({ page }) => {
  await page.goto('/catalog')
  const banner = page.getByTestId('ask-banner')
  await expect(banner.getByRole('link', { name: /Связаться с Дани/ })).toHaveAttribute('href', 'https://t.me/sosukii')
  await expect(banner.getByRole('link', { name: 'Свой заказ' })).toHaveAttribute('href', /\/custom/)

  await page.goto('/catalog?q=абракадабра')
  await expect(page.getByTestId('empty-state').getByRole('link', { name: /Спросить Дани/ })).toHaveAttribute('href', 'https://t.me/sosukii')
})

test.describe('мобильная версия', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('фильтры открываются в панели и применяются', async ({ page }) => {
    await page.goto('/catalog')
    await expect(page.getByRole('complementary', { name: 'Фильтры' })).toBeHidden()
    await page.getByTestId('open-filters').click()
    const sheet = page.getByRole('dialog', { name: 'Фильтры' })
    await expect(sheet).toBeVisible()
    await sheet.getByTestId('filter-fit-oversize').check()
    await sheet.getByRole('button', { name: /^Показать/ }).click()
    await expect(sheet).toBeHidden()
    await expect(page).toHaveURL(/fit=oversize/)
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
