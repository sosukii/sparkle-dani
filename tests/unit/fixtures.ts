import type { CatalogContext } from '#shared/types/catalog'
import type { Product } from '#shared/types/product'

export const ctx: CatalogContext = {
  taxonomy: {
    fandoms: [
      { id: 'ghibli', label: 'Studio Ghibli' },
      { id: 'sailor-moon', label: 'Сейлор Мун' },
    ],
    types: [
      { id: 'amigurumi', label: 'Игрушка-амигуруми' },
      { id: 'scarf', label: 'Шарф' },
    ],
    colors: [
      { id: 'pink', label: 'Розовый', hex: '#f4a6c0' },
      { id: 'green', label: 'Зелёный', hex: '#6fae7a' },
    ],
    warmth: [{ id: 'warm', label: 'Тёплое' }],
  },
  categories: [
    { id: 'toys', slug: 'toys', title: 'Игрушки', description: '' },
    { id: 'warm-wear', slug: 'warm-wear', title: 'Шарфы и шапки', description: '' },
  ],
}

const image = { src: '/images/x.jpg', alt: 'x', width: 10, height: 10 }

export function product(overrides: Partial<Product> & Pick<Product, 'id'>): Product {
  return {
    slug: overrides.id,
    title: overrides.id,
    description: '',
    price: 1000,
    currency: 'RUB',
    category: 'toys',
    type: 'amigurumi',
    fandom: null,
    colors: [],
    warmth: null,
    availability: 'in_stock',
    images: [image],
    attributes: [],
    createdAt: '2026-01-01',
    isDemo: true,
    ...overrides,
  }
}

export const products: Product[] = [
  product({ id: 'a', title: 'Лесной дух', price: 3200, fandom: 'ghibli', colors: ['green'], createdAt: '2026-03-01' }),
  product({ id: 'b', title: 'Зайка-лунница', price: 3400, fandom: 'sailor-moon', colors: ['pink'], createdAt: '2026-02-01' }),
  product({ id: 'c', title: 'Мишка', price: 1900, colors: ['pink', 'green'], createdAt: '2026-01-15' }),
  product({ id: 'd', title: 'Шарф «ёлка»', price: 2900, category: 'warm-wear', type: 'scarf', colors: ['green'], warmth: 'warm', createdAt: '2026-04-01' }),
]
