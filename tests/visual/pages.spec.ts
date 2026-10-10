import { expect, test } from '@playwright/test'

test('главная — десктоп', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await expect(page).toHaveScreenshot('home-desktop.png', { fullPage: true })
})
