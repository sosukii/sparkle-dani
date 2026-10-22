<script setup lang="ts">
import type { CatalogFilters, CatalogResult } from '#shared/types/catalog'
import {
  DEFAULT_SORT,
  hasActiveFilters,
  parseCatalogQuery,
  queryCatalog,
  serializeCatalogFilters,
} from '#shared/utils/catalog-query'
import { pluralRu, formatPrice } from '#shared/utils/format'
import { buildBreadcrumbJsonLd } from '#shared/utils/seo'
import { OWNER_NAME, TELEGRAM_URL } from '#shared/utils/site'

const props = defineProps<{ category?: string }>()

const router = useRouter()

const { data: categories } = await useCategories()
const currentCategory = computed(() => categories.value?.find((c) => c.slug === props.category))

const appliedQuery = useAppliedQuery()
const filters = computed(() => parseCatalogQuery(appliedQuery.value, { category: currentCategory.value?.id }))
const queryKey = computed(() => `catalog:${JSON.stringify({ ...serializeCatalogFilters(filters.value), category: filters.value.category })}`)

// Фильтры считаются теми же функциями, что и на сервере: при SSR в HTML попадает готовый срез,
// а дальше пересчёт идёт в браузере по загруженному каталогу (работает и без сервера).
const { data, error, pending, refresh } = await useAsyncData<CatalogResult>(
  queryKey,
  async () => {
    const catalog = await loadCatalog()
    return queryCatalog(catalog.products, filters.value, catalog)
  },
  { watch: [queryKey] },
)

// ── обновление URL ──
type Patch = Partial<Pick<CatalogFilters, 'q' | 'type' | 'color' | 'fit' | 'size' | 'material' | 'availability' | 'minPrice' | 'maxPrice' | 'includeUnknown' | 'sort' | 'page'>>
function update(patch: Patch, mode: 'replace' | 'push' = 'replace') {
  const next = { ...filters.value, ...patch, page: patch.page ?? 1 }
  const query = serializeCatalogFilters(next)
  return router[mode]({ query })
}
const setPage = async () => {
  await nextTick()
  document.getElementById('catalog-results')?.scrollIntoView({ block: 'start' })
}

const clearFilters = () => update({ type: [], color: [], fit: [], size: [], material: [], availability: [], minPrice: undefined, maxPrice: undefined, includeUnknown: false })
const clearAll = () => update({ q: '', type: [], color: [], fit: [], size: [], material: [], availability: [], minPrice: undefined, maxPrice: undefined, includeUnknown: false, sort: DEFAULT_SORT })

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
  for (const group of ['availability', 'type', 'size', 'fit', 'color', 'material'] as const) {
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
  if (f.includeUnknown && chips.length) {
    chips.push({ key: 'unknown', label: 'Включая изделия без сведений', remove: () => update({ includeUnknown: false }) })
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
const siteUrl = useSiteUrl()
useJsonLd(() => buildBreadcrumbJsonLd([
  { name: 'Главная', path: '/' },
  { name: 'Каталог', path: '/catalog' },
  ...(currentCategory.value ? [{ name: currentCategory.value.title, path: `/catalog/${currentCategory.value.slug}` }] : []),
], siteUrl))
const title = computed(() => currentCategory.value?.title ?? 'Каталог')
const isFilteredView = computed(() => !!filters.value.q || hasActiveFilters(filters.value) || filters.value.sort !== DEFAULT_SORT)
usePageSeo(() => ({
  title: filters.value.q ? `Поиск: ${filters.value.q}` : (filters.value.page > 1 ? `${title.value}, страница ${filters.value.page}` : title.value),
  description: currentCategory.value?.description
    ? `${currentCategory.value.description} Изделия ручной работы в магазине NOCTURNE.`
    : 'Каталог авторского вязаного трикотажа ручной работы: свитеры, кардиганы, шарфы и шапки. Фильтры по типу, размеру, посадке, материалу, цвету и цене.',
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
      <nav aria-label="Хлебные крошки" class="mb-4 text-sm text-fg-muted">
        <ol class="flex flex-wrap items-center gap-2">
          <li><NuxtLink to="/" class="no-underline hover:text-link">Главная</NuxtLink></li>
          <li aria-hidden="true">/</li>
          <li v-if="currentCategory"><NuxtLink to="/catalog" class="no-underline hover:text-link">Каталог</NuxtLink></li>
          <li v-if="currentCategory" aria-hidden="true">/</li>
          <li aria-current="page" class="font-semibold text-fg">{{ title }}</li>
        </ol>
      </nav>
      <h1 class="text-4xl sm:text-5xl lg:text-6xl">
        <template v-if="filters.q">Поиск: <span class="em-accent">{{ filters.q }}</span></template>
        <template v-else>{{ title }}</template>
      </h1>
      <p v-if="currentCategory?.description && !filters.q" class="mt-3 max-w-2xl text-lg text-fg-muted">{{ currentCategory.description }}</p>

      <ul class="chip-scroller chip-scroller-wrap -mx-4 mt-6 px-4 sm:mx-0 sm:px-0" aria-label="Категории">
        <li>
          <NuxtLink to="/catalog" class="chip whitespace-nowrap no-underline" :aria-current="!currentCategory ? 'page' : undefined">Все</NuxtLink>
        </li>
        <li v-for="c in categories" :key="c.id">
          <NuxtLink :to="`/catalog/${c.slug}`" class="chip whitespace-nowrap no-underline" :aria-current="currentCategory?.id === c.id ? 'page' : undefined">
            {{ c.title }}
          </NuxtLink>
        </li>
      </ul>
    </header>

    <ErrorState v-if="error && !data" class="mt-10" @retry="refresh()" />

    <div v-else-if="data" class="mt-8 grid gap-8 lg:grid-cols-[17rem_1fr] lg:gap-12">
      <!-- Фильтры: десктоп -->
      <aside class="hidden lg:block" aria-label="Фильтры">
        <div class="thin-scroll sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-6 pr-5">
          <CatalogFilterPanel :facets="data.facets" :filters="filters" id-prefix="d" @update="update($event)" />
        </div>
      </aside>

      <section id="catalog-results" class="min-w-0 scroll-mt-24" aria-label="Результаты" :aria-busy="pending">
        <h2 class="sr-only">Изделия</h2>
        <!-- Панель: поиск, сортировка, мобильный фильтр -->
        <div class="flex flex-wrap items-center gap-3">
          <form class="w-full sm:min-w-[12rem] sm:flex-1" role="search" @submit.prevent="submitSearch">
            <label for="catalog-search" class="sr-only">Поиск по каталогу</label>
            <div class="relative">
              <AppIcon name="search" :size="18" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted" />
              <input
                id="catalog-search" v-model="searchText" type="search" enterkeyhint="search" autocomplete="off"
                placeholder="Название, цвет, материал…" class="field pl-10" data-testid="catalog-search" @input="onSearchInput"
              >
            </div>
          </form>
          <div class="min-w-0 flex-1 sm:flex-none">
            <label for="catalog-sort" class="sr-only">Сортировка</label>
            <select
              id="catalog-sort" class="field select-field w-full sm:w-auto" :value="filters.sort" data-testid="catalog-sort"
              @change="update({ sort: ($event.target as HTMLSelectElement).value as CatalogFilters['sort'] })"
            >
              <option v-for="o in sortOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
          <button type="button" class="btn btn-soft shrink-0 lg:hidden" data-testid="open-filters" @click="openSheet">
            <AppIcon name="filter" :size="18" /> Фильтры
            <span v-if="activeCount" class="grid min-w-5 place-items-center rounded-full bg-accent px-1 text-xs leading-5 text-fg">{{ activeCount }}</span>
          </button>
        </div>

        <!-- Счётчик и активные фильтры -->
        <div class="mt-4 flex items-center gap-3" aria-live="polite">
          <p class="shrink-0 text-sm font-semibold text-fg-muted" data-testid="result-count">
            {{ data.total }} {{ pluralRu(data.total, ['изделие', 'изделия', 'изделий']) }}
          </p>
          <!-- Выбранные фильтры — одна прокручиваемая строка; «Сбросить всё» вынесено из неё и всегда на виду -->
          <div v-if="activeChips.length" class="chip-scroller min-w-0 flex-1" data-testid="active-filters">
            <button
              v-for="chip in activeChips" :key="chip.key" type="button" class="chip shrink-0 whitespace-nowrap" :aria-label="`Убрать фильтр: ${chip.label}`" @click="chip.remove()"
            >
              {{ chip.label }} <AppIcon name="close" :size="14" />
            </button>
          </div>
          <button v-if="activeCount || filters.q" type="button" class="ml-auto min-h-9 shrink-0 px-1 text-sm font-bold text-link underline underline-offset-4" data-testid="clear-filters" @click="clearAll()">
            Сбросить всё
          </button>
        </div>

        <!-- Изделия, у которых нужные сведения не известны: не прячем молча, а говорим о них и даём выбор -->
        <p v-if="data.hiddenUnknown > 0" class="mt-3 rounded-md border border-line bg-surface px-4 py-3 text-sm text-fg-muted" data-testid="hidden-unknown">
          Ещё {{ data.hiddenUnknown }} {{ pluralRu(data.hiddenUnknown, ['изделие', 'изделия', 'изделий']) }}
          не вошло в выборку: {{ data.hiddenUnknown === 1 ? 'о нём' : 'о них' }} нет сведений по выбранным условиям (посадка, размер, состав, цена или наличие).
          <button type="button" class="font-semibold text-link underline underline-offset-4" data-testid="show-unknown" @click="update({ includeUnknown: true })">Показать</button>
          <span class="whitespace-nowrap"> или <a :href="TELEGRAM_URL" target="_blank" rel="noopener noreferrer" class="font-semibold text-link underline underline-offset-4">спросить {{ OWNER_NAME }}</a></span>
        </p>

        <!-- Сетка -->
        <div v-if="data.items.length" class="mt-6 transition-opacity duration-150" :class="pending ? 'opacity-50' : ''">
          <div class="grid grid-cols-2 gap-x-4 gap-y-9 sm:gap-x-5 md:grid-cols-3">
            <ProductCard v-for="(p, i) in data.items" :key="p.id" :product="p" :priority="i < 2" :labels="data.labels" />
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
          <a :href="TELEGRAM_URL" target="_blank" rel="noopener noreferrer" class="btn btn-ghost no-underline">
            <AppIcon name="telegram" :size="18" /> Спросить {{ OWNER_NAME }}
          </a>
          <NuxtLink v-if="currentCategory" to="/catalog" class="btn btn-ghost no-underline">Весь каталог</NuxtLink>
        </EmptyState>

        <ErrorState v-if="error" class="mt-6" title="Не удалось обновить список" @retry="refresh()" />

        <AskBanner class="mt-14" />
      </section>
    </div>

    <!-- Фильтры: мобильная панель -->
    <dialog
      ref="sheet"
      class="sheet m-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-hidden rounded-t-3xl bg-canvas p-0 text-fg lg:hidden"
      aria-labelledby="sheet-title"
      @click="onSheetClick"
    >
      <div class="flex max-h-[88dvh] flex-col">
        <div class="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="sheet-title" class="text-2xl">Фильтры</h2>
          <button type="button" class="grid size-11 place-items-center rounded-full hover:bg-raised" aria-label="Закрыть фильтры" @click="closeSheet">
            <AppIcon name="close" :size="22" />
          </button>
        </div>
        <div class="thin-scroll overflow-y-auto px-5 py-5">
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
