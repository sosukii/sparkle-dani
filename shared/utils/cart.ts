import { MAX_QTY_PER_LINE, OWNER_NAME } from './site'
import { formatPrice } from './format'
import type { Availability, Product } from '../types/product'

/** Снимок товара в корзине: цена и название на момент добавления; актуализируются с сервера. */
export interface CartLine {
  productId: string
  slug: string
  title: string
  price: number
  image: { src: string, alt: string, width: number, height: number }
  /** null — наличие не известно (товар можно заказать, детали согласуются с Дани). */
  availability: Availability | null
  stock?: number
  /** Выбранный размер (id из справочника); null/не задан — размер не выбирался или не применим. */
  size?: string | null
  /** Подпись размера на момент добавления: «M», «Один размер». */
  sizeLabel?: string | null
  qty: number
  /** true — товар больше нет в каталоге (удалён/скрыт). */
  unavailable?: boolean
}

/** Товар с неизвестной ценой в корзину не кладётся: сумма заказа не должна строиться на выдуманных числах. */
export type OrderableProduct = Product & { price: number }
export const isOrderable = (product: Product): product is OrderableProduct => product.price !== null

/** Позиция корзины = товар + размер: один свитер в M и в L это две разные позиции. */
export const lineKey = (l: Pick<CartLine, 'productId' | 'size'>): string => (l.size ? `${l.productId}:${l.size}` : l.productId)

export function toCartLine(product: OrderableProduct, qty = 1, size: { id: string, label: string } | null = null): CartLine {
  const first = product.images[0]!
  return {
    productId: product.id,
    slug: product.slug,
    title: product.title,
    price: product.price,
    image: { src: first.src, alt: first.alt, width: first.width, height: first.height },
    availability: product.availability,
    stock: product.availability === 'in_stock' ? product.stock : undefined,
    size: size?.id ?? null,
    sizeLabel: size?.label ?? null,
    qty,
  }
}

/** Максимум для позиции: остаток, если он задан в данных, иначе технический потолок. */
export function maxQty(line: Pick<CartLine, 'availability' | 'stock'>): number {
  if (line.availability === 'in_stock' && typeof line.stock === 'number') return Math.max(line.stock, 0)
  return MAX_QTY_PER_LINE
}

export interface AddResult {
  lines: CartLine[]
  /** Сколько штук реально добавлено. */
  added: number
  /** true — запрошенное количество упёрлось в остаток. */
  limited: boolean
}

/** Сколько штук товара уже в корзине во всех размерах (остаток общий на изделие, а не на размер). */
export function productQty(lines: CartLine[], productId: string): number {
  return lines.filter((l) => l.productId === productId).reduce((sum, l) => sum + l.qty, 0)
}

export function addLine(lines: CartLine[], incoming: CartLine, qty = 1): AddResult {
  const wanted = Math.max(1, Math.floor(qty))
  const key = lineKey(incoming)
  const existing = lines.find((l) => lineKey(l) === key)
  const limit = maxQty(incoming)
  const current = productQty(lines, incoming.productId)
  const next = Math.min(current + wanted, limit)
  const added = next - current
  if (added <= 0) return { lines, added: 0, limited: true }
  const updated = { ...(existing ?? incoming), ...incoming, qty: (existing?.qty ?? 0) + added }
  const result = existing
    ? lines.map((l) => (lineKey(l) === key ? updated : l))
    : [...lines, updated]
  return { lines: result, added, limited: added < wanted }
}

/** `key` — ключ позиции (`lineKey`); для товаров без размера он совпадает с id товара. */
export function setLineQty(lines: CartLine[], key: string, qty: number): CartLine[] {
  if (!Number.isFinite(qty) || qty < 1) return lines.filter((l) => lineKey(l) !== key)
  return lines.map((l) => {
    if (lineKey(l) !== key) return l
    const others = productQty(lines, l.productId) - l.qty
    return { ...l, qty: Math.min(Math.floor(qty), Math.max(maxQty(l) - others, 1)) }
  })
}

export function removeLine(lines: CartLine[], key: string): CartLine[] {
  return lines.filter((l) => lineKey(l) !== key)
}

export function cartTotals(lines: CartLine[]): { count: number, total: number } {
  return lines
    .filter((l) => !l.unavailable)
    .reduce((acc, l) => ({ count: acc.count + l.qty, total: acc.total + l.price * l.qty }), { count: 0, total: 0 })
}

/** Подтягивает свежие данные каталога в позиции корзины; пропавшие товары помечает. */
export function reconcileLines(lines: CartLine[], fresh: Product[]): CartLine[] {
  const byId = new Map(fresh.map((p) => [p.id, p]))
  return lines.map((l) => {
    const product = byId.get(l.productId)
    if (!product || !isOrderable(product)) return { ...l, unavailable: true }
    // Выбранный размер больше не предлагается: позицию нельзя оформить как есть.
    if (l.size && !product.sizes?.includes(l.size)) return { ...l, unavailable: true }
    const next = toCartLine(product, l.qty, l.size ? { id: l.size, label: l.sizeLabel ?? l.size } : null)
    return { ...next, qty: Math.min(l.qty, Math.max(maxQty(next), 1)) }
  })
}

/** Текст заказа для ручной отправки в Telegram. */
export function buildOrderText(lines: CartLine[], origin = ''): string {
  const active = lines.filter((l) => !l.unavailable)
  const { total } = cartTotals(active)
  const rows = active.map(
    (l, i) =>
      `${i + 1}. ${l.title}${l.sizeLabel ? `, размер ${l.sizeLabel}` : ''} — ${l.qty} × ${formatPrice(l.price)} = ${formatPrice(l.price * l.qty)}${origin ? `\n   ${origin}/product/${l.slug}` : ''}`,
  )
  return [`Здравствуйте, ${OWNER_NAME}! Хочу заказать:`, '', ...rows, '', `Итого: ${formatPrice(total)}`].join('\n')
}
