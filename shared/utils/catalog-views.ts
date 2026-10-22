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
  const { taxonomy, categories, materials, care } = catalog
  const sizeOf = (id: string) => taxonomy.sizes.find((s) => s.id === id) ?? { id, label: id }
  const category = categories.find((c) => c.id === product.category)
  const related = catalog.products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .sort((a, b) => Number(b.type === product.type) - Number(a.type === product.type) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4)
  return {
    product,
    related,
    labels: {
      category: category ? { slug: category.slug, title: category.title } : null,
      type: taxonomy.types.find((t) => t.id === product.type)?.label ?? null,
      fit: product.fit ? (taxonomy.fits.find((f) => f.id === product.fit) ?? null) : null,
      colors: taxonomy.colors.filter((c) => product.colors.includes(c.id)),
      composition: product.composition
        ? product.composition.map((item) => {
          const material = materials.find((m) => m.id === item.material)
          return { id: item.material, title: material?.title ?? item.material, summary: material?.summary ?? '', percent: item.percent }
        })
        : null,
      sizes: product.sizes ? product.sizes.map(sizeOf) : null,
      measurements: product.measurements
        ? product.measurements.map((row) => ({
          size: sizeOf(row.size),
          values: Object.entries(row.values).map(([id, cm]) => ({ id, label: taxonomy.measures.find((m) => m.id === id)?.label ?? id, cm })),
        }))
        : null,
      care: product.care ? care.filter((c) => product.care!.includes(c.id)) : null,
    },
  }
}
