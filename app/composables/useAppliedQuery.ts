/**
 * Query-параметры адреса, безопасные для гидратации.
 * Статический HTML (GitHub Pages) собирается без query, а ссылка может прийти с ним (?page=2, ?q=…).
 * Чтобы первый рендер на клиенте совпал с HTML, на статике он идёт без query, а настоящие параметры
 * применяются сразу после гидратации. На Node-сервере (SSR) query есть с самого начала.
 */
export function useAppliedQuery() {
  const route = useRoute()
  const nuxtApp = useNuxtApp()
  const applied = ref(!useRuntimeConfig().public.isStatic || import.meta.server || !nuxtApp.isHydrating)
  onNuxtReady(() => { applied.value = true })
  return computed(() => (applied.value ? route.query : {}))
}
