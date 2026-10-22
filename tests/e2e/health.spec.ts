import { expect, test } from '../fixtures'

// Страницы без ошибок и предупреждений в консоли: битый шрифт, неудачный запрос или ошибка гидратации сразу видны.
const pages = ['/', '/catalog', '/catalog/hats', '/product/lisenok-amigurumi', '/cart', '/about', '/delivery', '/custom', '/search?q=свитер']

for (const path of pages) {
  test(`консоль и сеть без ошибок: ${path}`, async ({ page }) => {
    const problems: string[] = []
    page.on('console', (message) => {
      if (['error', 'warning'].includes(message.type())) problems.push(`${message.type()}: ${message.text()}`)
    })
    page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
    page.on('response', (response) => {
      if (response.status() >= 400) problems.push(`HTTP ${response.status()}: ${response.url()}`)
    })
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    // Прокрутка до низа, чтобы загрузились ленивые картинки и шрифты, нужные только внизу страницы.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)) }
    })
    await page.waitForLoadState('networkidle')
    expect(problems, problems.join('\n')).toEqual([])
  })
}

test('все шрифты страницы действительно загрузились (кроме ₽ — его рисует системный шрифт)', async ({ page }) => {
  await page.goto('/product/lisenok-amigurumi')
  await page.waitForLoadState('networkidle')
  const faces = await page.evaluate(async () => {
    await document.fonts.ready
    return [...document.fonts].map((f) => ({ family: f.family, style: f.style, status: f.status }))
  })
  expect(faces.length).toBeGreaterThan(0)
  expect(faces.filter((f) => f.status === 'error')).toEqual([])
  expect(faces.some((f) => f.family.includes('Playfair') && f.status === 'loaded')).toBe(true)
  expect(faces.some((f) => f.family.includes('Inter') && f.status === 'loaded')).toBe(true)
})
