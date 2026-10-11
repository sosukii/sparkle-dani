import { summarizeCategories } from '#shared/utils/catalog-views'

/** Категории со счётчиками и обложками. Один ключ на всё приложение — данные не дублируются между страницами. */
export function useCategories() {
  return useAsyncData('categories', async () => summarizeCategories(await loadCatalog()))
}
