import type { CatalogContext } from '#shared/types/catalog'
import type { OrderableProduct } from '#shared/utils/cart'
import type { Product } from '#shared/types/product'

export const ctx: CatalogContext = {
  taxonomy: {
    types: [
      { id: 'sweater', label: 'Свитер' },
      { id: 'scarf', label: 'Шарф' },
    ],
    colors: [
      { id: 'cocoa', label: 'Какао', hex: '#442d1c' },
      { id: 'olive', label: 'Оливковый', hex: '#9d9167' },
    ],
    fits: [
      { id: 'regular', label: 'Обычная' },
      { id: 'oversize', label: 'Оверсайз' },
    ],
    sizes: [
      { id: 's', label: 'S' },
      { id: 'm', label: 'M' },
      { id: 'one-size', label: 'Один размер' },
    ],
    measures: [{ id: 'chest', label: 'Ширина изделия по груди' }],
  },
  categories: [
    { id: 'sweaters', slug: 'sweaters', title: 'Свитеры', description: '' },
    { id: 'accessories', slug: 'accessories', title: 'Шарфы и аксессуары', description: '' },
  ],
  materials: [
    { id: 'wool', title: 'Шерсть', summary: 'Волокно животного происхождения.' },
    { id: 'cotton', title: 'Хлопок', summary: 'Растительное волокно.' },
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
    category: 'sweaters',
    type: 'sweater',
    fit: null,
    fitNote: null,
    colors: [],
    composition: null,
    sizes: null,
    measurements: null,
    model: null,
    care: null,
    availability: 'in_stock',
    images: [image],
    attributes: [],
    createdAt: '2026-01-01',
    isDemo: true,
    ...overrides,
  }
}

/** Товар с известной ценой: только такой можно положить в корзину. */
export function orderable(overrides: Partial<Product> & Pick<Product, 'id'>): OrderableProduct {
  return { ...product({ price: 1000, ...overrides }), price: overrides.price ?? 1000 }
}

export const products: Product[] = [
  product({ id: 'a', title: 'Свитер крупной вязки', price: 28500, fit: 'oversize', colors: ['cocoa'], composition: [{ material: 'wool', percent: 100 }], sizes: ['s', 'm'], createdAt: '2026-03-01' }),
  product({ id: 'b', title: 'Свитер лёгкий', price: 14500, fit: 'regular', colors: ['olive'], composition: [{ material: 'cotton', percent: 100 }], sizes: ['m'], createdAt: '2026-02-01' }),
  // Все сведения неизвестны: цена, наличие, состав, размеры, посадка.
  product({ id: 'c', title: 'Свитер оливковый', price: null, availability: null, colors: ['olive'], createdAt: '2026-01-15' }),
  product({ id: 'd', title: 'Шарф «ёлка»', price: 6800, category: 'accessories', type: 'scarf', colors: ['cocoa', 'olive'], composition: [{ material: 'wool', percent: 100 }], sizes: ['one-size'], createdAt: '2026-04-01' }),
]
