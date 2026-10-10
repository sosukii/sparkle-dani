import { getProductRepository } from '../../repositories/product.repository'

/** Актуальные данные для позиций корзины. */
export default defineEventHandler(async (event) => {
  const raw = String(getQuery(event).ids ?? '')
  const ids = [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))].slice(0, 100)
  return ids.length ? getProductRepository().getProductsByIds(ids) : []
})
