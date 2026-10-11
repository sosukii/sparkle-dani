import { expect, test } from '../fixtures'

test.describe('страницы ошибок', () => {
  test('несуществующий товар → 404', async ({ page }) => {
    const response = await page.goto('/product/net-takogo-tovara')
    expect(response?.status()).toBe(404)
    await expect(page.getByTestId('error-page')).toContainText('Такой страницы')
    await expect(page.getByRole('link', { name: 'В каталог' })).toBeVisible()
  })

  test('несуществующая категория → 404', async ({ page }) => {
    const response = await page.goto('/catalog/net-takoy')
    expect(response?.status()).toBe(404)
    await expect(page.getByTestId('error-page')).toBeVisible()
  })

  test('несуществующий адрес → 404', async ({ page }) => {
    const response = await page.goto('/chto-to-ne-to')
    expect(response?.status()).toBe(404)
    await expect(page.getByTestId('error-page')).toBeVisible()
  })

  test('каталог отдаётся одним статичным JSON, старых API-ручек больше нет', async ({ request }) => {
    const response = await request.get('/api/catalog.json')
    expect(response.status()).toBe(200)
    const catalog = await response.json()
    expect(catalog.products).toHaveLength(54)
    expect(catalog.categories).toHaveLength(5)
    expect(catalog.taxonomy.fandoms.length).toBeGreaterThan(0)
    expect((await request.get('/api/products')).status()).toBe(404)
  })
})

test.describe('SEO', () => {
  test('главная: title, description, OG и canonical', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Sparkle Dani/)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/)
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/)
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^http.+og-default\.jpg$/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^http.+\/$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru')
  })

  test('товар: уникальные метаданные', async ({ page }) => {
    await page.goto('/product/lesnoy-duh-001')
    await expect(page).toHaveTitle('Лесной дух — Sparkle Dani')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/product\/lesnoy-duh-001$/)
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /product-001-1\.jpg$/)
    // Для демо-товаров структурированные данные не отдаём
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0)
  })

  test('фильтры, поиск и корзина не индексируются', async ({ page }) => {
    await page.goto('/catalog?fandom=ghibli')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/catalog$/)
    await page.goto('/cart')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await page.goto('/catalog')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index/)
  })

  test('robots.txt и sitemap.xml', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toMatch(/Disallow: \/cart/)
    expect(robots).toMatch(/Sitemap: .+sitemap\.xml/)

    const sitemap = await (await request.get('/sitemap.xml')).text()
    for (const path of ['/catalog', '/about', '/delivery', '/catalog/toys', '/product/lesnoy-duh-001'])
      expect(sitemap, path).toContain(`${path}</loc>`)
    expect(sitemap).not.toContain('/cart</loc>')
  })

  test('сжатие: HTML отдаётся в br/gzip и корректно разворачивается @server', async ({ playwright }) => {
    for (const encoding of ['br', 'gzip']) {
      const ctx = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:3100', extraHTTPHeaders: { 'accept-encoding': encoding, accept: 'text/html' } })
      for (const path of ['/', '/catalog', '/product/nope']) {
        const response = await ctx.get(path, { failOnStatusCode: false })
        const html = await response.text() // Playwright сам разворачивает br/gzip
        expect(html, `${encoding} ${path}`).toContain('<html')
        expect(html, `${encoding} ${path}`).not.toContain('\uFFFD')
      }
      await ctx.dispose()
    }
  })

  test('у каждой страницы один h1', async ({ page }) => {
    for (const path of ['/', '/catalog', '/catalog/toys', '/product/lesnoy-duh-001', '/cart', '/about', '/delivery']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 }), path).toHaveCount(1)
    }
  })
})

test.describe('доступность и вёрстка', () => {
  const paths = ['/', '/catalog', '/catalog/jewelry', '/product/zayka-lunnitsa-004', '/cart', '/about', '/delivery']

  for (const width of [360, 768, 1280]) {
    for (const path of paths) {
      test(`нет горизонтальной прокрутки: ${path} @${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow).toBeLessThanOrEqual(0)
      })
    }
  }

  test('у всех картинок есть alt, у всех полей — подпись', async ({ page }) => {
    for (const path of ['/', '/catalog', '/product/lesnoy-duh-001', '/about']) {
      await page.goto(path)
      const noAlt = await page.evaluate(() => [...document.images].filter((i) => !i.hasAttribute('alt')).length)
      expect(noAlt, `${path}: картинки без alt`).toBe(0)
      const unlabeled = await page.evaluate(() =>
        [...document.querySelectorAll('input:not([type=hidden]), select, textarea')].filter((el) => {
          const input = el as HTMLInputElement
          return !(input.labels?.length || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby'))
        }).length)
      expect(unlabeled, `${path}: поля без подписи`).toBe(0)
    }
  })

  test('есть ссылка «Перейти к содержимому» и видимый фокус', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Перейти к содержимому' })
    await expect(skip).toBeFocused()
    await expect(skip).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#main$/)
  })
})
