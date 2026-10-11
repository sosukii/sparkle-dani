/**
 * Полный адрес сайта для абсолютных ссылок (canonical, Open Graph, текст заказа):
 * origin из конфигурации сайта + подпапка хостинга (для GitHub Pages — /sparkle-dani).
 * Без завершающего слэша.
 */
export function useSiteUrl(): string {
  const origin = String(useSiteConfig().url || '').replace(/\/$/, '')
  const base = useRuntimeConfig().app.baseURL.replace(/\/$/, '')
  return `${origin}${base}`
}
