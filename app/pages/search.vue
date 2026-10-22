<script setup lang="ts">
import { parseCatalogQuery, queryCatalog } from '#shared/utils/catalog-query'
import { pluralRu } from '#shared/utils/format'
import { POPULAR_QUERIES, matchSitePages } from '#shared/utils/site-search'

const router = useRouter()
const NuxtLink = resolveComponent('NuxtLink')
const appliedQuery = useAppliedQuery()
// На статике HTML собран без запроса: до гидратации держим пустое место под результаты, чтобы они не «выталкивали» страницу.
const settled = ref(!useRuntimeConfig().public.isStatic)
onNuxtReady(() => { settled.value = true })
const q = computed(() => (typeof appliedQuery.value.q === 'string' ? appliedQuery.value.q.trim().slice(0, 100) : ''))
const input = ref(q.value)
watch(q, (value) => { input.value = value })

// Разделы сайта берутся из словаря ответов, изделия — из каталога; оба считаются в браузере за доли миллисекунды.
const { data } = await useAsyncData(
  () => `search:${q.value}`,
  async () => {
    const catalog = await loadCatalog()
    return {
      pages: matchSitePages(q.value),
      result: q.value ? queryCatalog(catalog.products, parseCatalogQuery({ q: q.value, pageSize: 12 }), catalog) : null,
    }
  },
  { watch: [q] },
)
const { data: categories } = await useCategories()

function submit() {
  const value = input.value.trim()
  // Убираем фокус: на телефоне закрывается клавиатура, страница не остаётся приближенной.
  ;(document.activeElement as HTMLElement | null)?.blur()
  router.push({ path: '/search', query: value ? { q: value } : {} })
}

const total = computed(() => data.value?.result?.total ?? 0)
const nothing = computed(() => !!q.value && !data.value?.pages.length && total.value === 0)

usePageSeo(() => ({
  title: q.value ? `Поиск: ${q.value}` : 'Поиск по сайту',
  description: 'Поиск по изделиям, доставке и заказу своего изделия в магазине NOCTURNE.',
  canonicalPath: '/search',
  noindex: true,
}))
</script>

<template>
  <div class="container-page py-8 lg:py-12">
    <h1 class="text-4xl sm:text-5xl lg:text-6xl">
      <template v-if="q">Поиск: <span class="em-accent">{{ q }}</span></template>
      <template v-else>Поиск по сайту</template>
    </h1>

    <form class="mt-6 flex max-w-2xl gap-2" role="search" @submit.prevent="submit">
      <label for="search-page-input" class="sr-only">Что вы ищете?</label>
      <div class="relative flex-1">
        <AppIcon name="search" :size="18" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted" />
        <input
          id="search-page-input" v-model="input" type="search" enterkeyhint="search" autocomplete="off"
          placeholder="Серьги, в наличии, доставка…" class="field rounded-full pl-10" data-testid="search-input"
        >
      </div>
      <button type="submit" class="btn btn-primary">Найти</button>
    </form>

    <p class="sr-only" role="status" aria-live="polite" data-testid="search-summary">
      <template v-if="q">Найдено разделов: {{ data?.pages.length ?? 0 }}, изделий: {{ total }}</template>
    </p>

    <div class="min-h-[70vh]" data-testid="search-results">
      <template v-if="settled">
    <!-- Подсказки: пустой запрос или ничего не найдено -->
    <section v-if="!q || nothing" class="mt-10" :class="nothing ? 'rounded-card border border-dashed border-line bg-surface/60 px-6 py-10' : ''" data-testid="search-suggestions">
      <template v-if="nothing">
        <AppIcon name="sparkle" :size="28" class="text-gold" />
        <h2 class="mt-3 text-2xl">Ничего не нашлось</h2>
        <p class="mt-2 max-w-xl text-fg-muted">Попробуйте другое слово или выберите из популярного. Если вы ищете что-то особенное — можно заказать своё.</p>
      </template>
      <h2 v-else class="text-2xl">Часто ищут</h2>
      <ul class="mt-4 flex flex-wrap gap-2">
        <li v-for="query in POPULAR_QUERIES" :key="query">
          <NuxtLink :to="{ path: '/search', query: { q: query } }" class="chip chip-plain no-underline">{{ query }}</NuxtLink>
        </li>
      </ul>
      <ul class="mt-4 flex flex-wrap gap-2" aria-label="Категории">
        <li v-for="c in categories" :key="c.id">
          <NuxtLink :to="`/catalog/${c.slug}`" class="chip chip-plain no-underline">{{ c.title }}</NuxtLink>
        </li>
      </ul>
    </section>

    <!-- Разделы сайта -->
    <section v-if="data?.pages.length" class="mt-10" aria-labelledby="search-pages">
      <h2 id="search-pages" class="text-2xl">Разделы</h2>
      <ul class="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <li v-for="page in data.pages" :key="page.id">
          <component
            :is="page.external ? 'a' : NuxtLink"
            v-bind="page.external ? { href: page.path, target: '_blank', rel: 'noopener noreferrer' } : { to: page.path }"
            class="group block h-full rounded-card border border-line bg-surface p-6 no-underline transition-colors hover:border-line-strong"
            :data-testid="`search-page-${page.id}`"
          >
            <h3 class="flex items-center justify-between gap-3 font-display text-2xl group-hover:text-link">
              {{ page.title }} <AppIcon name="arrow-right" :size="18" class="shrink-0" />
            </h3>
            <p class="mt-2 leading-relaxed text-fg-muted">{{ page.answer }}</p>
          </component>
        </li>
      </ul>
    </section>

    <!-- Изделия -->
    <section v-if="data?.result && total > 0" class="mt-12" aria-labelledby="search-products">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <h2 id="search-products" class="text-2xl">Изделия <span class="text-fg-muted">· {{ total }} {{ pluralRu(total, ['изделие', 'изделия', 'изделий']) }}</span></h2>
        <NuxtLink v-if="total > data.result.items.length" :to="{ path: '/catalog', query: { q } }" class="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold no-underline hover:text-link" data-testid="search-all">
          Все в каталоге <AppIcon name="arrow-right" :size="16" />
        </NuxtLink>
      </div>
      <div class="mt-6 grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
        <ProductCard v-for="p in data.result.items" :key="p.id" :product="p" />
      </div>
    </section>
      </template>
    </div>
  </div>
</template>
