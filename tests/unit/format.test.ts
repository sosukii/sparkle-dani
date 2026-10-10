import { describe, expect, it } from 'vitest'
import { formatLeadTime, formatPrice, pluralRu } from '#shared/utils/format'

describe('format', () => {
  it('форматирует цену в рублях без копеек', () => {
    expect(formatPrice(3200).replace(/\s/g, ' ')).toBe('3 200 ₽')
    expect(formatPrice(0).replace(/\s/g, ' ')).toBe('0 ₽')
  })

  it('склоняет существительные', () => {
    const f: [string, string, string] = ['товар', 'товара', 'товаров']
    expect([1, 2, 5, 11, 12, 21, 22, 25, 111].map((n) => pluralRu(n, f))).toEqual([
      'товар', 'товара', 'товаров', 'товаров', 'товаров', 'товар', 'товара', 'товаров', 'товаров',
    ])
  })

  it('форматирует срок изготовления', () => {
    expect(formatLeadTime({ min: 7, max: 12 })).toBe('7–12 дней')
    expect(formatLeadTime({ min: 1, max: 2 })).toBe('1–2 дня')
    expect(formatLeadTime({ min: 5, max: 5 })).toBe('5 дней')
  })
})
