import { describe, expect, it } from 'vitest'
import { buildProductPage, summarizeCategories } from '#shared/utils/catalog-views'
import type { CatalogData } from '#shared/types/catalog-data'
import { ctx, product } from './fixtures'

const catalog: CatalogData = {
  ...ctx,
  products: [
    product({ id: 'a', slug: 'a-1', fandom: 'ghibli', colors: ['green'], warmth: null, createdAt: '2026-03-01' }),
    product({ id: 'b', slug: 'b-1', fandom: 'sailor-moon', createdAt: '2026-02-01' }),
    product({ id: 'c', slug: 'c-1', fandom: 'ghibli', createdAt: '2026-01-01' }),
    product({ id: 'd', slug: 'd-1', category: 'warm-wear', type: 'scarf', warmth: 'warm' }),
  ],
}

describe('summarizeCategories', () => {
  it('считает изделия и берёт обложку из первого товара', () => {
    const result = summarizeCategories(catalog)
    expect(result.map((c) => [c.slug, c.count])).toEqual([['toys', 3], ['warm-wear', 1]])
    expect(result[0]!.cover).toEqual(catalog.products[0]!.images[0])
  })

  it('категория без товаров получает cover = null', () => {
    const empty = summarizeCategories({ ...catalog, products: [] })
    expect(empty.every((c) => c.cover === null && c.count === 0)).toBe(true)
  })
})

describe('buildProductPage', () => {
  it('возвращает null для неизвестного адреса', () => {
    expect(buildProductPage(catalog, 'net-takogo')).toBeNull()
  })

  it('подписывает справочники и не показывает пустые характеристики', () => {
    const page = buildProductPage(catalog, 'a-1')!
    expect(page.labels.category).toEqual({ slug: 'toys', title: 'Игрушки' })
    expect(page.labels.fandom).toEqual({ id: 'ghibli', label: 'Studio Ghibli' })
    expect(page.labels.type).toBe('Игрушка-амигуруми')
    expect(page.labels.colors.map((c) => c.id)).toEqual(['green'])
    expect(page.labels.warmth).toBeNull()
  })

  it('«похожие» — из той же категории, без самого товара, сначала тот же фандом', () => {
    const page = buildProductPage(catalog, 'a-1')!
    expect(page.related.map((p) => p.id)).toEqual(['c', 'b'])
  })
})
