import type { Category, Product, Taxonomy } from './product'

/** Весь каталог целиком — то, что отдаёт `/api/catalog.json`. */
export interface CatalogData {
  products: Product[]
  categories: Category[]
  taxonomy: Taxonomy
}

export interface CategorySummary extends Category {
  count: number
  cover: Product['images'][number] | null
  /** Товар, чья фотография стала обложкой: на главной обложки кликабельны и ведут на его страницу. */
  coverProduct: { slug: string, title: string } | null
}

export interface ProductLabels {
  category: { slug: string, title: string } | null
  type: string | null
  fandom: { id: string, label: string } | null
  colors: Taxonomy['colors']
  warmth: { id: string, label: string, hint?: string } | null
}

export interface ProductPageData {
  product: Product
  related: Product[]
  labels: ProductLabels
}
