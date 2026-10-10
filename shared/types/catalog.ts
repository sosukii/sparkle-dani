import type { Product } from './product'

export const SORT_KEYS = ['new', 'price-asc', 'price-desc', 'title'] as const
export type SortKey = (typeof SORT_KEYS)[number]

export interface CatalogFilters {
  q: string
  category?: string
  fandom: string[]
  type: string[]
  color: string[]
  warmth: string[]
  minPrice?: number
  maxPrice?: number
  sort: SortKey
  page: number
  pageSize: number
}

export interface FacetOption {
  id: string
  label: string
  count: number
  hex?: string
  hint?: string
}

export interface Facets {
  fandom: FacetOption[]
  type: FacetOption[]
  color: FacetOption[]
  warmth: FacetOption[]
  /** Границы цен в текущем наборе (категория + поиск) — для подсказок в полях. */
  price: { min: number, max: number } | null
}

export interface CatalogResult {
  items: Product[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  facets: Facets
}

export interface CatalogContext {
  taxonomy: import('./product').Taxonomy
  categories: import('./product').Category[]
}
