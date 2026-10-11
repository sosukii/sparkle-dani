import type { CatalogData, CategorySummary, ProductPageData } from '../types/catalog-data'

/** Категории со счётчиками и обложкой (первое фото первого товара). */
export function summarizeCategories(catalog: CatalogData): CategorySummary[] {
  return catalog.categories.map((category) => {
    const items = catalog.products.filter((p) => p.category === category.id)
    return {
      ...category,
      count: items.length,
      cover: items[0]?.images[0] ?? null,
      coverProduct: items[0] ? { slug: items[0].slug, title: items[0].title } : null,
    }
  })
}

/** Данные страницы товара: сам товар, «похожие» из той же категории и подписи справочников. */
export function buildProductPage(catalog: CatalogData, slug: string): ProductPageData | null {
  const product = catalog.products.find((p) => p.slug === slug)
  if (!product) return null
  const { taxonomy, categories } = catalog
  const category = categories.find((c) => c.id === product.category)
  const related = catalog.products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .sort((a, b) => Number(b.fandom === product.fandom) - Number(a.fandom === product.fandom) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4)
  return {
    product,
    related,
    labels: {
      category: category ? { slug: category.slug, title: category.title } : null,
      type: taxonomy.types.find((t) => t.id === product.type)?.label ?? null,
      fandom: product.fandom ? (taxonomy.fandoms.find((f) => f.id === product.fandom) ?? null) : null,
      colors: taxonomy.colors.filter((c) => product.colors.includes(c.id)),
      warmth: product.warmth ? (taxonomy.warmth.find((w) => w.id === product.warmth) ?? null) : null,
    },
  }
}
