import { getProductRepository } from '../repositories/product.repository'

/** Динамические URL для sitemap.xml: категории и товары. */
export default defineEventHandler(async () => {
  const repo = getProductRepository()
  const [categories, products] = await Promise.all([repo.listCategories(), repo.listProducts()])
  return [
    ...categories.map((c) => ({ loc: `/catalog/${c.slug}` })),
    ...products.map((p) => ({ loc: `/product/${p.slug}`, lastmod: p.createdAt })),
  ]
})
