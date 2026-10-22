import type {
  CatalogContext,
  CatalogFilters,
  CatalogResult,
  FacetOption,
  Facets,
  SortKey,
} from '../types/catalog'
import { SORT_KEYS } from '../types/catalog'
import type { Product } from '../types/product'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './site'
import { analyzeQuery, matchesAllGroups, normalizeText, stemsOfText } from './search'

export { normalizeText }

type FacetGroup = 'type' | 'color' | 'fit' | 'size' | 'material' | 'availability'
const FACET_GROUPS: FacetGroup[] = ['type', 'color', 'fit', 'size', 'material', 'availability']
const AVAILABILITY_LABELS = [
  { id: 'in_stock', label: 'В наличии' },
  { id: 'made_to_order', label: 'Под заказ' },
]
const MAX_LIST_ITEMS = 30
const MAX_QUERY_LENGTH = 100

export const DEFAULT_SORT: SortKey = 'new'

// ───────────── разбор и сериализация параметров ─────────────

function toList(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? [value] : []
  const flat = raw
    .flatMap((item) => (typeof item === 'string' ? item.split(',') : []))
    .map((item) => item.trim())
    .filter(Boolean)
  return [...new Set(flat)].slice(0, MAX_LIST_ITEMS)
}

function toPrice(value: unknown): number | undefined {
  const first = Array.isArray(value) ? value[0] : value
  if (typeof first !== 'string' && typeof first !== 'number') return undefined
  if (typeof first === 'string' && first.trim() === '') return undefined
  const n = Number(first)
  if (!Number.isFinite(n) || n < 0) return undefined
  return Math.floor(n)
}

function toInt(value: unknown, fallback: number, min: number, max: number): number {
  const first = Array.isArray(value) ? value[0] : value
  const n = Number(first)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.floor(n)))
}

/** Превращает произвольные query-параметры в безопасные фильтры. Мусор отбрасывается, а не падает. */
export function parseCatalogQuery(
  raw: Record<string, unknown>,
  fixed: { category?: string } = {},
): CatalogFilters {
  let minPrice = toPrice(raw.min)
  let maxPrice = toPrice(raw.max)
  // Перепутанный диапазон «от 3000 до 500» не ломает каталог — просто меняем границы местами.
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    ;[minPrice, maxPrice] = [maxPrice, minPrice]
  }
  const sortRaw = Array.isArray(raw.sort) ? raw.sort[0] : raw.sort
  const q = typeof raw.q === 'string' ? raw.q.trim().slice(0, MAX_QUERY_LENGTH) : ''
  const category = fixed.category ?? (typeof raw.category === 'string' ? raw.category : undefined)
  return {
    q,
    category: category || undefined,
    type: toList(raw.type),
    color: toList(raw.color),
    fit: toList(raw.fit),
    size: toList(raw.size),
    material: toList(raw.material),
    availability: toList(raw.avail).filter((v) => v === 'in_stock' || v === 'made_to_order'),
    minPrice,
    maxPrice,
    includeUnknown: raw.unknown === '1' || raw.unknown === 1 || raw.unknown === true,
    sort: (SORT_KEYS as readonly string[]).includes(sortRaw as string) ? (sortRaw as SortKey) : DEFAULT_SORT,
    page: toInt(raw.page, 1, 1, 10_000),
    pageSize: toInt(raw.pageSize, DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE),
  }
}

/** Фильтры → компактный query для URL: значения по умолчанию не пишем. */
export function serializeCatalogFilters(filters: CatalogFilters): Record<string, string> {
  const query: Record<string, string> = {}
  if (filters.q) query.q = filters.q
  for (const group of FACET_GROUPS) {
    if (filters[group].length) query[group === 'availability' ? 'avail' : group] = filters[group].join(',')
  }
  if (filters.minPrice !== undefined) query.min = String(filters.minPrice)
  if (filters.maxPrice !== undefined) query.max = String(filters.maxPrice)
  if (filters.includeUnknown) query.unknown = '1'
  if (filters.sort !== DEFAULT_SORT) query.sort = filters.sort
  if (filters.page > 1) query.page = String(filters.page)
  return query
}

export function hasActiveFilters(filters: CatalogFilters): boolean {
  return (
    FACET_GROUPS.some((g) => filters[g].length > 0)
    || filters.minPrice !== undefined
    || filters.maxPrice !== undefined
  )
}

// ───────────── поиск ─────────────

type SearchIndex = WeakMap<Product, string[]>
const indexes = new WeakMap<object, SearchIndex>()

function labelOf(list: { id: string, label: string }[], id: string | null): string {
  return (id && list.find((item) => item.id === id)?.label) || ''
}

/** Основы всех слов товара (название, описание, подписи справочников). Считается один раз на товар. */
function searchStems(product: Product, ctx: CatalogContext): string[] {
  let byProduct = indexes.get(ctx.taxonomy)
  if (!byProduct) indexes.set(ctx.taxonomy, (byProduct = new WeakMap()))
  let stems = byProduct.get(product)
  if (!stems) {
    stems = stemsOfText(
      [
        product.title,
        product.description,
        labelOf(ctx.taxonomy.types, product.type),
        labelOf(ctx.taxonomy.fits, product.fit),
        ctx.categories.find((c) => c.id === product.category)?.title ?? '',
        ...product.colors.map((c) => labelOf(ctx.taxonomy.colors, c)),
        ...(product.composition ?? []).map((m) => ctx.materials.find((x) => x.id === m.material)?.title ?? ''),
      ].join(' '),
    )
    byProduct.set(product, stems)
  }
  return stems
}

// ───────────── фильтрация, сортировка, фасеты ─────────────

function matchesGroup(selected: string[], values: (string | null)[], unknown = false, includeUnknown = false): boolean {
  if (selected.length === 0) return true
  if (unknown && includeUnknown) return true
  return values.some((v) => v !== null && selected.includes(v))
}

/** Сведения этого вида у товара не известны (а не «нет»). Цвет и тип известны всегда. */
function isUnknown(p: Product, group: FacetGroup): boolean {
  switch (group) {
    case 'fit': return p.fit === null
    case 'size': return p.sizes === null
    case 'material': return p.composition === null
    case 'availability': return p.availability === null
    default: return false
  }
}

/** Значения товара по группе фильтра. Неизвестное (null) не совпадает ни с одним выбранным значением. */
function valuesOf(p: Product, group: FacetGroup): (string | null)[] {
  switch (group) {
    case 'type': return [p.type]
    case 'color': return p.colors
    case 'fit': return [p.fit]
    case 'size': return p.sizes ?? []
    case 'material': return (p.composition ?? []).map((m) => m.material)
    default: return [p.availability]
  }
}

/** Применяет фильтры. `except` — пропустить одну группу (нужно для подсчёта фасетов). */
export function filterProducts(
  products: Product[],
  filters: CatalogFilters,
  ctx: CatalogContext,
  except?: FacetGroup | 'price',
): Product[] {
  const intent = filters.q ? analyzeQuery(filters.q) : undefined
  // «в наличии», «до 2000» и т. п. из строки поиска работают как обычные условия.
  return products.filter((p) => {
    if (filters.category && p.category !== filters.category) return false
    if (intent) {
      if (intent.availability && p.availability !== intent.availability) return false
      // Товар с неизвестной ценой не попадает под условие по цене: показывать его как «дешёвый» было бы выдумкой.
      if (intent.minPrice !== undefined && (p.price === null || p.price < intent.minPrice)) return false
      if (intent.maxPrice !== undefined && (p.price === null || p.price > intent.maxPrice)) return false
      if (intent.groups.length && !matchesAllGroups(searchStems(p, ctx), intent.groups)) return false
    }
    for (const group of FACET_GROUPS) {
      if (except !== group && !matchesGroup(filters[group], valuesOf(p, group), isUnknown(p, group), filters.includeUnknown)) return false
    }
    if (except !== 'price') {
      const priceFiltered = filters.minPrice !== undefined || filters.maxPrice !== undefined
      if (p.price === null) {
        if (priceFiltered && !filters.includeUnknown) return false
      }
      else {
        if (filters.minPrice !== undefined && p.price < filters.minPrice) return false
        if (filters.maxPrice !== undefined && p.price > filters.maxPrice) return false
      }
    }
    return true
  })
}

export function sortProducts(products: Product[], sort: SortKey): Product[] {
  const list = [...products]
  // Товары без цены в сортировке по цене всегда в конце: неизвестная цена не «самая низкая» и не «самая высокая».
  const byPrice = (dir: 1 | -1) => (a: Product, b: Product) => {
    if (a.price === null || b.price === null) return a.price === b.price ? 0 : a.price === null ? 1 : -1
    return (a.price - b.price) * dir || a.title.localeCompare(b.title, 'ru')
  }
  switch (sort) {
    case 'price-asc':
      return list.sort(byPrice(1))
    case 'price-desc':
      return list.sort(byPrice(-1))
    case 'title':
      return list.sort((a, b) => a.title.localeCompare(b.title, 'ru'))
    default:
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id))
  }
}

function buildFacets(scope: Product[], filters: CatalogFilters, ctx: CatalogContext): Facets {
  const dictionaries: Record<FacetGroup, { id: string, label: string, hex?: string, hint?: string }[]> = {
    type: ctx.taxonomy.types,
    color: ctx.taxonomy.colors,
    fit: ctx.taxonomy.fits,
    size: ctx.taxonomy.sizes,
    material: ctx.materials.map((m) => ({ id: m.id, label: m.title })),
    availability: AVAILABILITY_LABELS,
  }

  const facets = {} as Record<FacetGroup, FacetOption[]>
  for (const group of FACET_GROUPS) {
    // Счётчик показывает, сколько товаров найдётся, если выбрать эту опцию при остальных активных фильтрах.
    const others = filterProducts(scope, filters, ctx, group)
    facets[group] = dictionaries[group]
      .map((option) => ({
        id: option.id,
        label: option.label,
        hex: option.hex,
        hint: option.hint,
        count: others.filter((p) => valuesOf(p, group).includes(option.id)).length,
        presentInScope: scope.some((p) => valuesOf(p, group).includes(option.id)),
      }))
      // Показываем только то, что вообще есть в этой категории — либо уже выбрано пользователем.
      .filter((o) => o.presentInScope || filters[group].includes(o.id))
      .map(({ presentInScope: _unused, ...rest }) => rest)
    // Группа, в которой каждый вариант есть у всех изделий области (например, один «Свитер» в категории свитеров),
    // ничего не сужает, поэтому её не показываем — если только что-то уже не выбрано.
    const universal = (id: string) => scope.every((p) => valuesOf(p, group).includes(id))
    if (scope.length > 0 && filters[group].length === 0 && facets[group].every((o) => universal(o.id))) facets[group] = []
  }
  const prices = scope.map((p) => p.price).filter((v): v is number => v !== null)
  return {
    ...facets,
    price: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
  }
}

export function queryCatalog(products: Product[], filters: CatalogFilters, ctx: CatalogContext): CatalogResult {
  // «Область» для фасетов: категория + поиск, но без остальных фильтров.
  const scope = filterProducts(
    products,
    { ...filters, type: [], color: [], fit: [], size: [], material: [], availability: [], minPrice: undefined, maxPrice: undefined },
    ctx,
  )
  // «дешёвые» / «дорогие» в строке поиска меняют сортировку, если пользователь не выбрал её сам.
  const intentSort = filters.q && filters.sort === DEFAULT_SORT ? analyzeQuery(filters.q).sort : undefined
  const matched = sortProducts(filterProducts(products, filters, ctx), intentSort ?? filters.sort)
  const totalPages = Math.max(1, Math.ceil(matched.length / filters.pageSize))
  const page = Math.min(filters.page, totalPages)
  const start = (page - 1) * filters.pageSize
  // Изделия, которые отсеяны только из-за неизвестных сведений: покупателю важно знать, что они есть.
  const hiddenUnknown = filters.includeUnknown || !hasActiveFilters(filters)
    ? 0
    : filterProducts(products, { ...filters, includeUnknown: true }, ctx).length - matched.length
  return {
    items: matched.slice(start, start + filters.pageSize),
    total: matched.length,
    page,
    pageSize: filters.pageSize,
    totalPages,
    facets: buildFacets(scope, filters, ctx),
    hiddenUnknown,
    labels: { fits: Object.fromEntries(ctx.taxonomy.fits.map((f) => [f.id, f.label])), sizes: ctx.taxonomy.sizes },
  }
}
