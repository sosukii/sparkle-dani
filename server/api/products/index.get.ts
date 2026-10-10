import { parseCatalogQuery, queryCatalog } from '#shared/utils/catalog-query'
import { getProductRepository } from '../../repositories/product.repository'
import { getCatalogContext } from '../../utils/catalog'

export default defineEventHandler(async (event) => {
  const filters = parseCatalogQuery(getQuery(event))
  const [products, ctx] = await Promise.all([getProductRepository().listProducts(), getCatalogContext()])
  if (filters.category && !ctx.categories.some((c) => c.id === filters.category)) {
    throw createError({ statusCode: 404, message: 'Категория не найдена' })
  }
  return queryCatalog(products, filters, ctx)
})
