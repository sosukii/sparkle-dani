import { getProductRepository } from '../repositories/product.repository'

/** Все адреса для sitemap.xml: страницы, категории и товары (корзина и фильтры не включаются). */
export default defineEventHandler(async () => {
  const repo = getProductRepository()
  const [categories, products] = await Promise.all([repo.listCategories(), repo.listProducts()])
  return [
    { loc: '/' },
    { loc: '/catalog' },
    { loc: '/about' },
    { loc: '/delivery' },
    { loc: '/custom' },
    ...categories.map((c) => ({ loc: `/catalog/${c.slug}` })),
    ...products.map((p) => ({ loc: `/product/${p.slug}`, lastmod: p.createdAt })),
  ]
})
