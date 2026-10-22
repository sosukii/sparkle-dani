import { describe, expect, it } from 'vitest'
import {
  addLine,
  isOrderable,
  buildOrderText,
  cartTotals,
  maxQty,
  reconcileLines,
  removeLine,
  setLineQty,
  toCartLine,
} from '#shared/utils/cart'
import { orderable, product } from './fixtures'

const plush = toCartLine(orderable({ id: 'p1', title: 'Мишка', price: 1000, stock: 2 }))
const order = toCartLine(orderable({ id: 'p2', title: 'Плед', price: 500, availability: 'made_to_order' }))
const free = toCartLine(orderable({ id: 'p3', title: 'Шарф', price: 700 })) // остаток не задан

describe('товар без цены', () => {
  it('не считается заказываемым и не попадает в корзину', () => {
    expect(isOrderable(product({ id: 'x', price: null }))).toBe(false)
    expect(isOrderable(product({ id: 'x', price: 0 }))).toBe(true) // 0 ₽ это цена, а null — «цена не известна»
  })

  it('товар, у которого цену убрали, помечается недоступным в корзине', () => {
    const fresh = [product({ id: 'p1', title: 'Мишка', price: null })]
    expect(reconcileLines([plush], fresh)[0]!.unavailable).toBe(true)
  })
})

describe('корзина', () => {
  it('добавляет новую позицию и увеличивает количество существующей', () => {
    let { lines } = addLine([], plush)
    expect(lines).toHaveLength(1)
    ;({ lines } = addLine(lines, plush))
    expect(lines).toHaveLength(1)
    expect(lines[0]!.qty).toBe(2)
  })

  it('не превышает остаток и сообщает об ограничении', () => {
    const r = addLine(addLine([], plush).lines, plush, 5)
    expect(r.lines[0]!.qty).toBe(2)
    expect(r.limited).toBe(true)
    expect(r.added).toBe(1)
    const again = addLine(r.lines, plush)
    expect(again.added).toBe(0)
    expect(again.limited).toBe(true)
  })

  it('не выдумывает ограничений, если остаток не задан или товар под заказ', () => {
    expect(maxQty(order)).toBe(99)
    expect(maxQty(free)).toBe(99)
    expect(addLine([], order, 10).lines[0]!.qty).toBe(10)
  })

  it('setLineQty ограничивает сверху и удаляет при количестве < 1', () => {
    const { lines } = addLine([], plush)
    expect(setLineQty(lines, 'p1', 10)[0]!.qty).toBe(2)
    expect(setLineQty(lines, 'p1', 0)).toEqual([])
    expect(setLineQty(lines, 'p1', Number.NaN)).toEqual([])
  })

  it('считает количество и сумму; недоступные позиции не учитываются', () => {
    let lines = addLine([], plush, 2).lines
    lines = addLine(lines, order, 3).lines
    expect(cartTotals(lines)).toEqual({ count: 5, total: 2 * 1000 + 3 * 500 })
    lines = lines.map((l) => (l.productId === 'p2' ? { ...l, unavailable: true } : l))
    expect(cartTotals(lines)).toEqual({ count: 2, total: 2000 })
  })

  it('удаляет позицию', () => {
    const lines = addLine(addLine([], plush).lines, order).lines
    expect(removeLine(lines, 'p1').map((l) => l.productId)).toEqual(['p2'])
  })
})

describe('reconcileLines', () => {
  it('обновляет цену и остаток, помечает исчезнувшие товары, подрезает количество', () => {
    const lines = addLine(addLine([], plush, 2).lines, order, 1).lines
    const fresh = [product({ id: 'p1', title: 'Мишка', price: 1200, stock: 1 })]
    const result = reconcileLines(lines, fresh)
    expect(result[0]).toMatchObject({ price: 1200, qty: 1, stock: 1 })
    expect(result[1]).toMatchObject({ productId: 'p2', unavailable: true })
  })
})

describe('buildOrderText', () => {
  it('содержит состав, суммы и итог', () => {
    const lines = addLine(addLine([], plush, 2).lines, order, 1).lines
    const text = buildOrderText(lines, 'https://example.com')
    expect(text).toContain('Дани')
    expect(text).toContain('1. Мишка — 2 ×')
    expect(text).toContain('https://example.com/product/p1')
    expect(text).toMatch(/Итого: 2\s?500/)
  })
})
