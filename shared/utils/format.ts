const priceFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

export function formatPrice(value: number): string {
  return priceFormatter.format(value)
}

/** Склонение: pluralRu(2, ['товар', 'товара', 'товаров']) → «товара». */
export function pluralRu(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return forms[2]
  if (last > 1 && last < 5) return forms[1]
  if (last === 1) return forms[0]
  return forms[2]
}

export function formatLeadTime(range: { min: number, max: number }): string {
  const unit = pluralRu(range.max, ['день', 'дня', 'дней'])
  return range.min === range.max ? `${range.max} ${unit}` : `${range.min}–${range.max} ${unit}`
}
