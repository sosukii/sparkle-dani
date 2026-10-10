<script setup lang="ts">
import type { CatalogFilters, CatalogResult } from '#shared/types/catalog'
import {
  DEFAULT_SORT,
  hasActiveFilters,
  parseCatalogQuery,
  serializeCatalogFilters,
} from '#shared/utils/catalog-query'
import { pluralRu, formatPrice } from '#shared/utils/format'

const props = defineProps<{ category?: string }>()

const route = useRoute()
const router = useRouter()

const { data: categories } = await useFetch('/api/categories', { key: 'categories' })
const currentCategory = computed(() => categories.value?.find((c) => c.slug === props.category))

const filters = computed(() => parseCatalogQuery(route.query, { category: currentCategory.value?.id }))
const apiQuery = computed(() => ({
  ...serializeCatalogFilters(filters.value),
  ...(filters.value.category ? { category: filters.value.category } : {}),
}))

const { data, error, pending, refresh } = await useFetch<CatalogResult>('/api/products', {
  query: apiQuery,
  key: computed(() => `catalog:${JSON.stringify(apiQuery.value)}`),
})

// ── обновление URL ──
type Patch = Partial<Pick<CatalogFilters, 'q' | 'fandom' | 'type' | 'color' | 'warmth' | 'minPrice' | 'maxPrice' | 'sort' | 'page'>>
function update(patch: Patch, mode: 'replace' | 'push' = 'replace') {
  const next = { ...filters.value, ...patch, page: patch.page ?? 1 }
  const query = serializeCatalogFilters(next)
  return router[mode]({ query })
}
const setPage = async () => {
  await nextTick()
  document.getElementById('catalog-results')?.scrollIntoView({ block: 'start' })
}

const clearFilters = () => update({ fandom: [], type: [], color: [], warmth: [], minPrice: undefined, maxPrice: undefined })
const clearAll = () => update({ q: '', fandom: [], type: [], color: [], warmth: [], minPrice: undefined, maxPrice: undefined, sort: DEFAULT_SORT })

// ── поиск ──
const searchText = ref(filters.value.q)
watch(() => filters.value.q, (q) => { searchText.value = q })
let searchTimer: ReturnType<typeof setTimeout> | undefined
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => update({ q: searchText.value.trim() }), 400)
}
function submitSearch() {
  clearTimeout(searchTimer)
  update({ q: searchText.value.trim() })
}
onBeforeUnmount(() => clearTimeout(searchTimer))

// ── активные фильтры (чипсы) ──
const activeChips = computed(() => {
  const f = filters.value
  const facets = data.value?.facets
  const chips: { key: string, label: string, remove: () => void }[] = []
  if (!facets) return chips
  for (const group of ['fandom', 'type', 'color', 'warmth'] as const) {
    for (const id of f[group]) {
      const label = facets[group].find((o) => o.id === id)?.label ?? id
      chips.push({ key: `${group}:${id}`, label, remove: () => update({ [group]: f[group].filter((x) => x !== id) }) })
    }
  }
  if (f.minPrice !== undefined || f.maxPrice !== undefined) {
    const label = f.minPrice !== undefined && f.maxPrice !== undefined
      ? `${formatPrice(f.minPrice)} — ${formatPrice(f.maxPrice)}`
      : f.minPrice !== undefined ? `от ${formatPrice(f.minPrice)}` : `до ${formatPrice(f.maxPrice!)}`
    chips.push({ key: 'price', label, remove: () => update({ minPrice: undefined, maxPrice: undefined }) })
  }
  return chips
})
const activeCount = computed(() => activeChips.value.length)

// ── мобильная панель фильтров ──
const sheet = ref<HTMLDialogElement>()
const openSheet = () => sheet.value?.showModal()
const closeSheet = () => sheet.value?.close()
function onSheetClick(event: MouseEvent) {
  if (event.target === sheet.value) closeSheet() // клик по подложке
}

// ── SEO ──
const title = computed(() => currentCategory.value?.title ?? 'Каталог')
const isFilteredView = computed(() => !!filters.value.q || hasActiveFilters(filters.value) || filters.value.sort !== DEFAULT_SORT)
usePageSeo(() => ({
  title: filters.value.q ? `Поиск: ${filters.value.q}` : (filters.value.page > 1 ? `${title.value}, страница ${filters.value.page}` : title.value),
  description: currentCategory.value?.description
    ? `${currentCategory.value.description} Изделия ручной работы в магазине Sparkle Dani.`
    : 'Каталог изделий ручной работы: вязаные игрушки, шарфы и шапки, украшения, сумки и вещи для дома. Фильтры по фандому, цвету и цене.',
  canonicalPath: props.category ? `/catalog/${props.category}` : '/catalog',
  noindex: isFilteredView.value,
}))

const sortOptions = [
  { value: 'new', label: 'Сначала новые' },
  { value: 'price-asc', label: 'Сначала дешевле' },
  { value: 'price-desc', label: 'Сначала дороже' },
  { value: 'title', label: 'По названию' },
]
const paginationQuery = computed(() => serializeCatalogFilters({ ...filters.value, page: 1 }))
</script>

<template>
  <div class="container-page py-8 lg:py-12">
    <!-- Шапка -->
    <header>
      <nav aria-label="Хлебные крошки" class="mb-4 text-sm text-ink-soft">
        <ol class="flex flex-wrap items-center gap-2">
          <li><NuxtLink to="/" class="no-underline hover:text-berry">Главная</NuxtLink></li>
          <li aria-hidden="true">/</li>
          <li v-if="currentCategory"><NuxtLink to="/catalog" class="no-underline hover:text-berry">Каталог</NuxtLink></li>
          <li v-if="currentCategory" aria-hidden="true">/</li>
          <li aria-current="page" class="font-semibold text-ink">{{ title }}</li>
        </ol>
      </nav>
      <h1 class="text-4xl sm:text-5xl lg:text-6xl">
        <template v-if="filters.q">Поиск: <span class="em-accent">{{ filters.q }}</span></template>
        <template v-else>{{ title }}</template>
      </h1>
      <p v-if="currentCategory?.description && !filters.q" class="mt-3 max-w-2xl text-lg text-ink-soft">{{ currentCategory.description }}</p>

      <ul class="mt-6 flex flex-wrap gap-2" aria-label="Категории">
        <li>
          <NuxtLink to="/catalog" class="chip no-underline" :aria-current="!currentCategory ? 'page' : undefined">Все</NuxtLink>
        </li>
        <li v-for="c in categories" :key="c.id">
          <NuxtLink :to="`/catalog/${c.slug}`" class="chip no-underline" :aria-current="currentCategory?.id === c.id ? 'page' : undefined">
            {{ c.title }}
          </NuxtLink>
        </li>
      </ul>
    </header>

    <ErrorState v-if="error && !data" class="mt-10" @retry="refresh()" />

    <div v-else-if="data" class="mt-8 grid gap-8 lg:grid-cols-[17rem_1fr] lg:gap-12">
      <!-- Фильтры: десктоп -->
      <aside class="hidden lg:block" aria-label="Фильтры">
        <div class="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-6 pr-2">
          <CatalogFilterPanel :facets="data.facets" :filters="filters" id-prefix="d" @update="update($event)" />
        </div>
      </aside>

      <section id="catalog-results" class="min-w-0 scroll-mt-24" aria-label="Результаты" :aria-busy="pending">
        <h2 class="sr-only">Изделия</h2>
        <!-- Панель: поиск, сортировка, мобильный фильтр -->
        <div class="flex flex-wrap items-end gap-3">
          <form class="min-w-[12rem] flex-1" role="search" @submit.prevent="submitSearch">
            <label for="catalog-search" class="mb-1 block text-xs font-semibold text-ink-soft">Поиск по каталогу</label>
            <div class="relative">
              <AppIcon name="search" :size="18" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                id="catalog-search" v-model="searchText" type="search" enterkeyhint="search" autocomplete="off"
                placeholder="Название, фандом, цвет…" class="field pl-10" data-testid="catalog-search" @input="onSearchInput"
              >
            </div>
          </form>
          <div>
            <label for="catalog-sort" class="mb-1 block text-xs font-semibold text-ink-soft">Сортировка</label>
            <select
              id="catalog-sort" class="field w-auto pr-8" :value="filters.sort" data-testid="catalog-sort"
              @change="update({ sort: ($event.target as HTMLSelectElement).value as CatalogFilters['sort'] })"
            >
              <option v-for="o in sortOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
          <button type="button" class="btn btn-soft lg:hidden" data-testid="open-filters" @click="openSheet">
            <AppIcon name="filter" :size="18" /> Фильтры
            <span v-if="activeCount" class="grid min-w-5 place-items-center rounded-full bg-berry px-1 text-xs leading-5 text-white">{{ activeCount }}</span>
          </button>
        </div>

        <!-- Счётчик и активные фильтры -->
        <div class="mt-5 flex flex-wrap items-center gap-2" aria-live="polite">
          <p class="mr-2 text-sm font-semibold text-ink-soft" data-testid="result-count">
            {{ data.total }} {{ pluralRu(data.total, ['изделие', 'изделия', 'изделий']) }}
          </p>
          <button
            v-for="chip in activeChips" :key="chip.key" type="button" class="chip" :aria-label="`Убрать фильтр: ${chip.label}`" @click="chip.remove()"
          >
            {{ chip.label }} <AppIcon name="close" :size="14" />
          </button>
          <button v-if="activeCount || filters.q" type="button" class="min-h-9 px-2 text-sm font-bold text-berry underline underline-offset-4" data-testid="clear-filters" @click="clearAll()">
            Сбросить всё
          </button>
        </div>

        <!-- Сетка -->
        <div v-if="data.items.length" class="mt-6 transition-opacity" :class="pending ? 'opacity-50' : ''">
          <div class="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-5 md:grid-cols-3">
            <ProductCard v-for="(p, i) in data.items" :key="p.id" :product="p" :priority="i < 2" />
          </div>
          <PaginationNav :page="data.page" :total-pages="data.totalPages" :query="paginationQuery" @click.capture="setPage" />
        </div>

        <EmptyState
          v-else
          class="mt-6"
          title="Ничего не нашлось"
          :text="filters.q ? `По запросу «${filters.q}» с выбранными фильтрами ничего нет. Попробуйте изменить запрос или сбросить фильтры.` : 'С такими фильтрами изделий нет. Попробуйте убрать часть условий.'"
        >
          <button type="button" class="btn btn-primary" @click="clearAll()">Сбросить фильтры</button>
          <NuxtLink v-if="currentCategory" to="/catalog" class="btn btn-ghost no-underline">Весь каталог</NuxtLink>
        </EmptyState>

        <ErrorState v-if="error" class="mt-6" title="Не удалось обновить список" @retry="refresh()" />
      </section>
    </div>

    <!-- Фильтры: мобильная панель -->
    <dialog
      ref="sheet"
      class="m-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-hidden rounded-t-3xl bg-paper p-0 text-ink backdrop:bg-ink/50 lg:hidden"
      aria-labelledby="sheet-title"
      @click="onSheetClick"
    >
      <div class="flex max-h-[88dvh] flex-col">
        <div class="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="sheet-title" class="text-2xl">Фильтры</h2>
          <button type="button" class="grid size-11 place-items-center rounded-full hover:bg-cream" aria-label="Закрыть фильтры" @click="closeSheet">
            <AppIcon name="close" :size="22" />
          </button>
        </div>
        <div class="overflow-y-auto px-5 py-5">
          <CatalogFilterPanel v-if="data" :facets="data.facets" :filters="filters" id-prefix="m" @update="update($event)" />
        </div>
        <div class="flex gap-3 border-t border-line px-5 py-4">
          <button v-if="activeCount" type="button" class="btn btn-ghost" @click="clearFilters()">Сбросить</button>
          <button type="button" class="btn btn-primary flex-1" @click="closeSheet">
            Показать {{ data?.total ?? '' }} {{ pluralRu(data?.total ?? 0, ['изделие', 'изделия', 'изделий']) }}
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>
