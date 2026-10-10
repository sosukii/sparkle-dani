import { getProductRepository } from '../../repositories/product.repository'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') ?? ''
  const repo = getProductRepository()
  const product = await repo.getProductBySlug(slug)
  if (!product) throw createError({ statusCode: 404, message: 'Товар не найден' })

  const all = await repo.listProducts()
  const related = all
    .filter((p) => p.category === product.category && p.id !== product.id)
    .sort((a, b) => Number(b.fandom === product.fandom) - Number(a.fandom === product.fandom) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4)
  return { product, related }
})
