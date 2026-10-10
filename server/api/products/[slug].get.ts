import { getProductRepository } from '../../repositories/product.repository'
import { getCatalogContext } from '../../utils/catalog'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') ?? ''
  const repo = getProductRepository()
  const product = await repo.getProductBySlug(slug)
  if (!product) throw createError({ statusCode: 404, message: 'Товар не найден' })

  const [all, ctx] = await Promise.all([repo.listProducts(), getCatalogContext()])
  const related = all
    .filter((p) => p.category === product.category && p.id !== product.id)
    .sort((a, b) => Number(b.fandom === product.fandom) - Number(a.fandom === product.fandom) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4)

  const { taxonomy, categories } = ctx
  const category = categories.find((c) => c.id === product.category)
  const labels = {
    category: category ? { slug: category.slug, title: category.title } : null,
    type: taxonomy.types.find((t) => t.id === product.type)?.label ?? null,
    fandom: product.fandom ? taxonomy.fandoms.find((f) => f.id === product.fandom) ?? null : null,
    colors: taxonomy.colors.filter((c) => product.colors.includes(c.id)),
    warmth: product.warmth ? taxonomy.warmth.find((w) => w.id === product.warmth) ?? null : null,
  }
  return { product, related, labels }
})
