import type { Product } from './product'

export const SORT_KEYS = ['new', 'price-asc', 'price-desc', 'title'] as const
export type SortKey = (typeof SORT_KEYS)[number]

export interface CatalogFilters {
  q: string
  category?: string
  type: string[]
  color: string[]
  fit: string[]
  size: string[]
  material: string[]
  /** Наличие: `in_stock` / `made_to_order`. */
  availability: string[]
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
  type: FacetOption[]
  color: FacetOption[]
  fit: FacetOption[]
  size: FacetOption[]
  material: FacetOption[]
  availability: FacetOption[]
  /** Границы известных цен в текущем наборе (категория + поиск) — для подсказок в полях. */
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
  materials: import('./product').Material[]
}
