import { describe, expect, it } from 'vitest'
import { buildProductPage, summarizeCategories } from '#shared/utils/catalog-views'
import type { CatalogData } from '#shared/types/catalog-data'
import { ctx, product } from './fixtures'

const catalog: CatalogData = {
  ...ctx,
  care: [
    { id: 'hand-wash-30', label: 'Ручная стирка при 30 °C', text: 'Стирайте вручную.' },
    { id: 'dry-flat', label: 'Сушить горизонтально', text: 'Сушите на ровной поверхности.' },
  ],
  products: [
    product({
      id: 'a', slug: 'a-1', fit: 'oversize', colors: ['cocoa'], createdAt: '2026-03-01',
      composition: [{ material: 'wool', percent: 80 }, { material: 'cotton', percent: null }],
      sizes: ['s', 'm'], measurements: [{ size: 's', values: { chest: 56 } }], care: ['dry-flat'],
    }),
    product({ id: 'b', slug: 'b-1', createdAt: '2026-02-01' }),
    product({ id: 'c', slug: 'c-1', createdAt: '2026-01-01' }),
    product({ id: 'd', slug: 'd-1', category: 'accessories', type: 'scarf' }),
  ],
}

describe('summarizeCategories', () => {
  it('считает изделия и берёт обложку из первого товара', () => {
    const result = summarizeCategories(catalog)
    expect(result.map((c) => [c.slug, c.count])).toEqual([['sweaters', 3], ['accessories', 1]])
    expect(result[0]!.cover).toEqual(catalog.products[0]!.images[0])
    expect(result[0]!.coverProduct).toEqual({ slug: 'a-1', title: catalog.products[0]!.title })
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

  it('подписывает справочники: состав, размеры, измерения и уход', () => {
    const { labels } = buildProductPage(catalog, 'a-1')!
    expect(labels.category).toEqual({ slug: 'sweaters', title: 'Свитеры' })
    expect(labels.fit).toEqual({ id: 'oversize', label: 'Оверсайз' })
    expect(labels.type).toBe('Свитер')
    expect(labels.colors.map((c) => c.id)).toEqual(['cocoa'])
    expect(labels.composition?.map((m) => [m.title, m.percent])).toEqual([['Шерсть', 80], ['Хлопок', null]])
    expect(labels.composition?.[0]?.summary).toContain('Волокно')
    expect(labels.sizes?.map((s) => s.label)).toEqual(['S', 'M'])
    expect(labels.measurements?.[0]).toEqual({ size: { id: 's', label: 'S' }, values: [{ id: 'chest', label: 'Ширина изделия по груди', cm: 56 }] })
    expect(labels.care?.map((c) => c.id)).toEqual(['dry-flat'])
  })

  it('неизвестные сведения остаются null, а не пустыми значениями', () => {
    const { labels } = buildProductPage(catalog, 'b-1')!
    expect(labels.fit).toBeNull()
    expect(labels.composition).toBeNull()
    expect(labels.sizes).toBeNull()
    expect(labels.measurements).toBeNull()
    expect(labels.care).toBeNull()
  })

  it('«похожие» — из той же категории, без самого товара, сначала новые', () => {
    const page = buildProductPage(catalog, 'a-1')!
    expect(page.related.map((p) => p.id)).toEqual(['b', 'c'])
  })
})
