import type { CatalogData } from '#shared/types/catalog-data'

const cache = new WeakMap<object, Promise<CatalogData>>()

/**
 * Загружает весь каталог один раз на приложение (на сервере — на запрос, в браузере — на сессию).
 * Страницы работают с ним через `useAsyncData`: при SSR/пререндере в HTML попадает только нужный срез,
 * а дальше фильтры считаются в браузере — поэтому сайт работает и на статическом хостинге без сервера.
 */
export function loadCatalog(): Promise<CatalogData> {
  const nuxtApp = useNuxtApp()
  let promise = cache.get(nuxtApp)
  if (!promise) {
    promise = $fetch<CatalogData>('/api/catalog.json')
    promise.catch(() => cache.delete(nuxtApp))
    cache.set(nuxtApp, promise)
  }
  return promise
}
