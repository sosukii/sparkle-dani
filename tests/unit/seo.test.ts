import { describe, expect, it } from 'vitest'
import { buildProductJsonLd, truncate } from '#shared/utils/seo'
import { product } from './fixtures'

describe('truncate', () => {
  it('не трогает короткий текст и режет длинный по границе слова', () => {
    expect(truncate('Короткий текст')).toBe('Короткий текст')
    const long = 'слово '.repeat(60)
    const result = truncate(long, 50)
    expect(result.length).toBeLessThanOrEqual(50)
    expect(result.endsWith('…')).toBe(true)
    expect(result).not.toMatch(/сло…$/)
  })
})

describe('buildProductJsonLd', () => {
  it('не отдаёт разметку для демо-товаров', () => {
    expect(buildProductJsonLd(product({ id: 'x', isDemo: true }), 'https://example.com')).toBeNull()
  })

  it('без цены или наличия предложение (offers) не выдумывается', () => {
    const base = { id: 'x', slug: 'x-1', isDemo: false }
    expect(buildProductJsonLd(product({ ...base, price: null }), 'https://example.com')).not.toHaveProperty('offers')
    expect(buildProductJsonLd(product({ ...base, availability: null }), 'https://example.com')).not.toHaveProperty('offers')
  })

  it('строит корректный Product для настоящего товара', () => {
    const ld = buildProductJsonLd(product({ id: 'x', slug: 'mishka-1', price: 1900, isDemo: false, availability: 'made_to_order' }), 'https://example.com/')
    expect(ld).toMatchObject({
      '@type': 'Product',
      offers: { price: 1900, priceCurrency: 'RUB', availability: 'https://schema.org/PreOrder', url: 'https://example.com/product/mishka-1' },
    })
  })
})
