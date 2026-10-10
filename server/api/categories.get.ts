import { getProductRepository } from '../repositories/product.repository'

export default defineEventHandler(async () => {
  const repo = getProductRepository()
  const [categories, products] = await Promise.all([repo.listCategories(), repo.listProducts()])
  return categories.map((category) => {
    const items = products.filter((p) => p.category === category.id)
    return { ...category, count: items.length, cover: items[0]?.images[0] ?? null }
  })
})
