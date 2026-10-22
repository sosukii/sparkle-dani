import { getProductRepository } from '../repositories/product.repository'

/**
 * Весь каталог одним JSON: товары, категории и справочники (таксономия, материалы, уход).
 * Для статического хостинга (GitHub Pages) этот файл создаётся при сборке, а фильтры, поиск и сортировка
 * выполняются уже в браузере теми же функциями, что и на сервере (`shared/utils/catalog-query.ts`).
 */
export default defineEventHandler(async () => {
  const repo = getProductRepository()
  const [products, categories, taxonomy, materials, care] = await Promise.all([
    repo.listProducts(),
    repo.listCategories(),
    repo.getTaxonomy(),
    repo.listMaterials(),
    repo.listCare(),
  ])
  return { products, categories, taxonomy, materials, care }
})
