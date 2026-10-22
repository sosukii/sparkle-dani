import type { CareItem, Category, Material, Product, Taxonomy } from './product'

/** Весь каталог целиком — то, что отдаёт `/api/catalog.json`. */
export interface CatalogData {
  products: Product[]
  categories: Category[]
  taxonomy: Taxonomy
  materials: Material[]
  care: CareItem[]
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
  fit: { id: string, label: string } | null
  colors: Taxonomy['colors']
  /** Состав с названиями и общими сведениями о материалах; null — состав не известен. */
  composition: { id: string, title: string, summary: string, percent: number | null }[] | null
  /** Названия доступных размеров; null — размеры не известны. */
  sizes: { id: string, label: string }[] | null
  /** Измерения с подписями; null — измерений нет. */
  measurements: { size: { id: string, label: string }, values: { id: string, label: string, cm: number }[] }[] | null
  /** Рекомендации по уходу; null — не заданы. */
  care: CareItem[] | null
}

export interface ProductPageData {
  product: Product
  related: Product[]
  labels: ProductLabels
}
