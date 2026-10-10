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

type FacetGroup = 'fandom' | 'type' | 'color' | 'warmth'
const FACET_GROUPS: FacetGroup[] = ['fandom', 'type', 'color', 'warmth']
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
    fandom: toList(raw.fandom),
    type: toList(raw.type),
    color: toList(raw.color),
    warmth: toList(raw.warmth),
    minPrice,
    maxPrice,
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
    if (filters[group].length) query[group] = filters[group].join(',')
  }
  if (filters.minPrice !== undefined) query.min = String(filters.minPrice)
  if (filters.maxPrice !== undefined) query.max = String(filters.maxPrice)
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

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[«»"'“”.,;:!?()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function labelOf(list: { id: string, label: string }[], id: string | null): string {
  return (id && list.find((item) => item.id === id)?.label) || ''
}

function haystack(product: Product, ctx: CatalogContext): string {
  return normalizeText(
    [
      product.title,
      product.description,
      labelOf(ctx.taxonomy.fandoms, product.fandom),
      labelOf(ctx.taxonomy.types, product.type),
      ctx.categories.find((c) => c.id === product.category)?.title ?? '',
      ...product.colors.map((c) => labelOf(ctx.taxonomy.colors, c)),
    ].join(' '),
  )
}

// ───────────── фильтрация, сортировка, фасеты ─────────────

function matchesGroup(selected: string[], values: (string | null)[]): boolean {
  if (selected.length === 0) return true
  return values.some((v) => v !== null && selected.includes(v))
}

/** Применяет фильтры. `except` — пропустить одну группу (нужно для подсчёта фасетов). */
export function filterProducts(
  products: Product[],
  filters: CatalogFilters,
  ctx: CatalogContext,
  except?: FacetGroup | 'price',
): Product[] {
  const tokens = normalizeText(filters.q).split(' ').filter(Boolean)
  return products.filter((p) => {
    if (filters.category && p.category !== filters.category) return false
    if (tokens.length) {
      const text = haystack(p, ctx)
      if (!tokens.every((t) => text.includes(t))) return false
    }
    if (except !== 'fandom' && !matchesGroup(filters.fandom, [p.fandom])) return false
    if (except !== 'type' && !matchesGroup(filters.type, [p.type])) return false
    if (except !== 'color' && !matchesGroup(filters.color, p.colors)) return false
    if (except !== 'warmth' && !matchesGroup(filters.warmth, [p.warmth])) return false
    if (except !== 'price') {
      if (filters.minPrice !== undefined && p.price < filters.minPrice) return false
      if (filters.maxPrice !== undefined && p.price > filters.maxPrice) return false
    }
    return true
  })
}

export function sortProducts(products: Product[], sort: SortKey): Product[] {
  const list = [...products]
  switch (sort) {
    case 'price-asc':
      return list.sort((a, b) => a.price - b.price || a.title.localeCompare(b.title, 'ru'))
    case 'price-desc':
      return list.sort((a, b) => b.price - a.price || a.title.localeCompare(b.title, 'ru'))
    case 'title':
      return list.sort((a, b) => a.title.localeCompare(b.title, 'ru'))
    default:
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id))
  }
}

function buildFacets(scope: Product[], filters: CatalogFilters, ctx: CatalogContext): Facets {
  const dictionaries: Record<FacetGroup, { id: string, label: string, hex?: string, hint?: string }[]> = {
    fandom: ctx.taxonomy.fandoms,
    type: ctx.taxonomy.types,
    color: ctx.taxonomy.colors,
    warmth: ctx.taxonomy.warmth,
  }
  const valuesOf = (p: Product, group: FacetGroup): (string | null)[] =>
    group === 'color' ? p.colors : [p[group]]

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
  }
  const prices = scope.map((p) => p.price)
  return {
    ...facets,
    price: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
  }
}

export function queryCatalog(products: Product[], filters: CatalogFilters, ctx: CatalogContext): CatalogResult {
  // «Область» для фасетов: категория + поиск, но без остальных фильтров.
  const scope = filterProducts(
    products,
    { ...filters, fandom: [], type: [], color: [], warmth: [], minPrice: undefined, maxPrice: undefined },
    ctx,
  )
  const matched = sortProducts(filterProducts(products, filters, ctx), filters.sort)
  const totalPages = Math.max(1, Math.ceil(matched.length / filters.pageSize))
  const page = Math.min(filters.page, totalPages)
  const start = (page - 1) * filters.pageSize
  return {
    items: matched.slice(start, start + filters.pageSize),
    total: matched.length,
    page,
    pageSize: filters.pageSize,
    totalPages,
    facets: buildFacets(scope, filters, ctx),
  }
}
