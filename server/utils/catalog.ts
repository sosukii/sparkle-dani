import { getProductRepository } from '../repositories/product.repository'

/** Контекст справочников для поиска и фасетов. */
export async function getCatalogContext() {
  const repo = getProductRepository()
  const [taxonomy, categories] = await Promise.all([repo.getTaxonomy(), repo.listCategories()])
  return { taxonomy, categories }
}
