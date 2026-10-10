import type { Product } from '../types/product'
import { OWNER_NAME, SITE_NAME } from './site'

/** Обрезает описание для meta description по границе слова. */
export function truncate(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 40))}…`
}

/**
 * Schema.org Product. Отдаём только для настоящих товаров: демо-изделия не должны
 * попадать в поисковую выдачу как реальные предложения.
 */
export function buildProductJsonLd(product: Product, siteUrl: string): Record<string, unknown> | null {
  if (product.isDemo) return null
  const base = siteUrl.replace(/\/$/, '')
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description || undefined,
    image: product.images.map((i) => `${base}${i.src}`),
    sku: product.id,
    brand: { '@type': 'Brand', name: SITE_NAME },
    manufacturer: { '@type': 'Person', name: OWNER_NAME },
    offers: {
      '@type': 'Offer',
      url: `${base}/product/${product.slug}`,
      price: product.price,
      priceCurrency: product.currency,
      availability: product.availability === 'in_stock' ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
    },
  }
}
