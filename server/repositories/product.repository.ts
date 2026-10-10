import type { Category, Product, Taxonomy } from '#shared/types/product'
import { createJsonProductRepository } from './json-product.repository'

/**
 * Единственная точка доступа к данным каталога.
 * Чтобы перейти на SQLite/MongoDB, достаточно написать новую реализацию этого интерфейса
 * и вернуть её из `getProductRepository()` — API, страницы и компоненты не меняются.
 */
export interface ProductRepository {
  listProducts(): Promise<Product[]>
  getProductBySlug(slug: string): Promise<Product | null>
  getProductsByIds(ids: string[]): Promise<Product[]>
  listCategories(): Promise<Category[]>
  getTaxonomy(): Promise<Taxonomy>
}

let instance: ProductRepository | undefined

export function getProductRepository(): ProductRepository {
  instance ??= createJsonProductRepository()
  return instance
}
