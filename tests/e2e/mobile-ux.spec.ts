import { expect, test } from '../fixtures'
import { cards } from '../helpers'

test.describe('мобильное удобство', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('двойной тап не увеличивает страницу на кнопках, но масштабирование разрешено', async ({ page }) => {
    await page.goto('/catalog')
    const result = await page.evaluate(() => {
      const touch = (selector: string) => getComputedStyle(document.querySelector(selector)!).touchAction
      return { button: touch('button'), link: touch('a'), input: touch('input') }
    })
    expect(result).toEqual({ button: 'manipulation', link: 'manipulation', input: 'manipulation' })
    // Масштабирование щипком не запрещено в viewport
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
    expect(viewport).not.toMatch(/user-scalable\s*=\s*(no|0)/)
    expect(viewport).not.toMatch(/maximum-scale\s*=\s*1(\.0)?\b/)
  })

  test('поля ввода 16px+, чтобы iOS не приближал страницу при фокусе', async ({ page }) => {
    for (const url of ['/catalog', '/search']) {
      await page.goto(url)
      const sizes = await page.evaluate(() =>
        [...document.querySelectorAll('input:not([type=range]):not([type=checkbox]), select, textarea')]
          .filter((el) => (el as HTMLElement).offsetParent !== null)
          .map((el) => parseFloat(getComputedStyle(el).fontSize)))
      expect(sizes.length, url).toBeGreaterThan(0)
      expect(Math.min(...sizes), url).toBeGreaterThanOrEqual(16)
    }
  })

  test('в шапке мобильный поиск тоже без автозума', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Поиск', exact: true }).click()
    const size = await page.locator('#mobile-search-input').evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    expect(size).toBeGreaterThanOrEqual(16)
  })
})

test.describe('каталог: подписи и выбранные фильтры', () => {
  test('подписи «Поиск» и «Сортировка» скрыты визуально, но доступны скринридеру', async ({ page }) => {
    await page.goto('/catalog')
    const sort = page.locator('label[for="catalog-sort"]')
    await expect(sort).toHaveText('Сортировка')
    const box = await sort.boundingBox()
    expect(box!.width).toBeLessThanOrEqual(1)
    await expect(page.getByLabel('Сортировка')).toBeVisible()
    await expect(page.getByLabel('Поиск по каталогу')).toBeVisible()
  })

  test('выбранные фильтры — одна прокручиваемая строка, «Сбросить всё» вне её', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/catalog?fandom=ghibli,sailor-moon,genshin&color=pink,green,blue,lilac&type=amigurumi,keychain&avail=in_stock&min=500&max=3000')
    const scroller = page.getByTestId('active-filters')
    await expect(scroller).toBeVisible()
    const info = await scroller.evaluate((el) => {
      const tops = [...el.querySelectorAll('button')].map((b) => Math.round(b.getBoundingClientRect().top))
      return { rows: new Set(tops).size, canScroll: el.scrollWidth > el.clientWidth, overflowX: getComputedStyle(el).overflowX, chips: tops.length }
    })
    expect(info.chips).toBeGreaterThan(6)
    expect(info.rows).toBe(1)
    expect(info.canScroll).toBe(true)
    expect(info.overflowX).toBe('auto')
    // Кнопка сброса не внутри прокручиваемой строки и видна без прокрутки
    const reset = page.getByTestId('clear-filters')
    await expect(reset).toBeVisible()
    expect(await scroller.locator('[data-testid=clear-filters]').count()).toBe(0)
    const viewportWidth = page.viewportSize()!.width
    expect((await reset.boundingBox())!.x + (await reset.boundingBox())!.width).toBeLessThanOrEqual(viewportWidth)
    await reset.click()
    await expect(page).toHaveURL(/\/catalog$/)
  })

  test('на десктопе фильтры тоже в одну строку', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/catalog?fandom=ghibli,sailor-moon,genshin,arcane&color=pink,green,blue,lilac,red&avail=in_stock')
    const rows = await page.getByTestId('active-filters').evaluate((el) => new Set([...el.querySelectorAll('button')].map((b) => Math.round(b.getBoundingClientRect().top))).size)
    expect(rows).toBe(1)
  })

  test('фильтр «Наличие» работает вместе с остальными', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/catalog')
    const side = page.getByRole('complementary', { name: 'Фильтры' })
    await side.getByTestId('filter-availability-made_to_order').check()
    await expect(page).toHaveURL(/avail=made_to_order/)
    // Список обновляется после смены адреса, поэтому ждём итоговое состояние, а не читаем сразу.
    await expect
      .poll(async () => {
        const badges = await cards(page).getByTestId('availability-badge').allInnerTexts()
        return badges.length > 0 && badges.every((t) => t.includes('Под заказ'))
      })
      .toBe(true)
    await page.getByRole('button', { name: 'Убрать фильтр: Под заказ' }).click()
    await expect(page).not.toHaveURL(/avail=/)
  })
})

test.describe('главная', () => {
  test('три изделия в коллаже кликабельны и ведут на страницы товаров', async ({ page }) => {
    await page.goto('/')
    for (const i of [0, 1, 2]) {
      await page.goto('/')
      const item = page.getByTestId(`hero-item-${i}`)
      await expect(item).toHaveAttribute('href', /\/product\//)
      await expect(item).toHaveAccessibleName(/Открыть: .+/)
      await item.click()
      await expect(page).toHaveURL(/\/product\//)
      await expect(page.getByTestId('product-title')).toBeVisible()
    }
  })

  test('блок категорий и «Новинки» визуально разделены (разный фон)', async ({ page }) => {
    await page.goto('/')
    const bg = (id: string) => page.locator(`#${id}`).evaluate((el) => {
      let node: HTMLElement | null = el
      while (node && getComputedStyle(node).backgroundColor === 'rgba(0, 0, 0, 0)') node = node.parentElement
      return getComputedStyle(node!).backgroundColor
    })
    const categories = await bg('home-categories')
    const news = await bg('home-new')
    expect(categories).not.toBe(news)
  })
})
