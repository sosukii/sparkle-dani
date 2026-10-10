import { expect, test as base, type Page } from '@playwright/test'

/**
 * Страницы рендерятся на сервере, и до гидратации кнопки и чекбоксы ещё «мёртвые».
 * Чтобы тесты не кликали раньше времени, после каждой полной загрузки ждём конца гидратации Nuxt.
 */
async function waitForHydration(page: Page) {
  await page
    .waitForFunction(() => {
      const nuxt = (window as unknown as { useNuxtApp?: () => { isHydrating: boolean } }).useNuxtApp?.()
      return nuxt ? nuxt.isHydrating === false : false
    }, undefined, { timeout: 15_000 })
    .catch(() => {
      // Страница без приложения (например, ответ-заглушка) — продолжаем без ожидания.
    })
}

export const test = base.extend({
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page)
    const reload = page.reload.bind(page)
    page.goto = async (url, options) => {
      const response = await goto(url, options)
      await waitForHydration(page)
      return response
    }
    page.reload = async (options) => {
      const response = await reload(options)
      await waitForHydration(page)
      return response
    }
    await use(page)
  },
})

export { expect }
