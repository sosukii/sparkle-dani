/** Добавляет в <head> блок JSON-LD (структурированные данные для поисковиков). */
export function useJsonLd(data: Record<string, unknown> | null | (() => Record<string, unknown> | null)) {
  useHead(() => {
    const value = typeof data === 'function' ? data() : data
    return { script: value ? [{ type: 'application/ld+json', innerHTML: JSON.stringify(value) }] : [] }
  })
}
