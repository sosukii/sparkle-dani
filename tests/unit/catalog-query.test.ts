import { describe, expect, it } from 'vitest'
import {
  hasActiveFilters,
  normalizeText,
  parseCatalogQuery,
  queryCatalog,
  serializeCatalogFilters,
} from '#shared/utils/catalog-query'
import { ctx, product, products } from './fixtures'

const run = (raw: Record<string, unknown>) => queryCatalog(products, parseCatalogQuery(raw), ctx)
const ids = (raw: Record<string, unknown>) => run(raw).items.map((p) => p.id)

describe('parseCatalogQuery', () => {
  it('использует значения по умолчанию', () => {
    const f = parseCatalogQuery({})
    expect(f).toMatchObject({ q: '', fandom: [], sort: 'new', page: 1, pageSize: 12 })
    expect(f.minPrice).toBeUndefined()
  })

  it('понимает списки через запятую и повторяющиеся параметры, убирает дубли', () => {
    expect(parseCatalogQuery({ color: 'pink,green,pink' }).color).toEqual(['pink', 'green'])
    expect(parseCatalogQuery({ color: ['pink', 'green,blue'] }).color).toEqual(['pink', 'green', 'blue'])
  })

  it('меняет местами перепутанный диапазон цены', () => {
    const f = parseCatalogQuery({ min: '5000', max: '1000' })
    expect([f.minPrice, f.maxPrice]).toEqual([1000, 5000])
  })

  it('отбрасывает мусор в цене и странице', () => {
    const f = parseCatalogQuery({ min: 'abc', max: '-5', page: '-3', sort: 'hack', pageSize: '9999' })
    expect(f.minPrice).toBeUndefined()
    expect(f.maxPrice).toBeUndefined()
    expect(f.page).toBe(1)
    expect(f.sort).toBe('new')
    expect(f.pageSize).toBe(48)
  })

  it('пустые поля цены не превращаются в 0', () => {
    expect(parseCatalogQuery({ min: '', max: ' ' }).minPrice).toBeUndefined()
  })

  it('фиксированная категория важнее query', () => {
    expect(parseCatalogQuery({ category: 'home' }, { category: 'toys' }).category).toBe('toys')
  })
})

describe('serializeCatalogFilters', () => {
  it('пишет только непустые и нестандартные значения', () => {
    const f = parseCatalogQuery({ fandom: 'ghibli', color: 'pink,green', min: '100', sort: 'price-asc', page: '2' })
    expect(serializeCatalogFilters(f)).toEqual({
      fandom: 'ghibli',
      color: 'pink,green',
      min: '100',
      sort: 'price-asc',
      page: '2',
    })
    expect(serializeCatalogFilters(parseCatalogQuery({}))).toEqual({})
  })

  it('hasActiveFilters ориентируется на фильтры, но не на поиск и сортировку', () => {
    expect(hasActiveFilters(parseCatalogQuery({ q: 'мишка', sort: 'title' }))).toBe(false)
    expect(hasActiveFilters(parseCatalogQuery({ min: '10' }))).toBe(true)
  })
})

describe('фильтры работают вместе', () => {
  it('категория + фандом + цвет + цена', () => {
    expect(ids({ category: 'toys', fandom: 'ghibli', color: 'green', min: '3000', max: '3300' })).toEqual(['a'])
  })

  it('внутри одной группы значения объединяются через ИЛИ, между группами — через И', () => {
    expect(ids({ fandom: 'ghibli,sailor-moon' }).sort()).toEqual(['a', 'b'])
    expect(ids({ fandom: 'ghibli,sailor-moon', color: 'pink' })).toEqual(['b'])
  })

  it('цвет: товар с несколькими цветами находится по любому из них', () => {
    expect(ids({ color: 'green' }).sort()).toEqual(['a', 'c', 'd'])
  })

  it('граничные значения цены включаются', () => {
    expect(ids({ min: '1900', max: '1900' })).toEqual(['c'])
  })

  it('пустой результат не ломает ответ и отдаёт валидные фасеты', () => {
    const r = run({ fandom: 'ghibli', color: 'pink' })
    expect(r.total).toBe(0)
    expect(r.items).toEqual([])
    expect(r.totalPages).toBe(1)
    expect(r.page).toBe(1)
  })

  it('необязательные поля (fandom/warmth = null) не мешают', () => {
    expect(ids({ warmth: 'warm' })).toEqual(['d'])
    expect(ids({ category: 'toys', warmth: 'warm' })).toEqual([])
  })
})

describe('поиск', () => {
  it('нечувствителен к регистру и ё/е', () => {
    expect(ids({ q: 'ЕЛКА' })).toEqual(['d'])
    expect(normalizeText('Шарф «Ёлка»!')).toBe('шарф елка')
  })

  it('все слова запроса должны встретиться (И)', () => {
    expect(ids({ q: 'лесной дух' })).toEqual(['a'])
    expect(ids({ q: 'лесной зайка' })).toEqual([])
  })

  it('ищет по фандому, типу, категории и цвету', () => {
    expect(ids({ q: 'ghibli' })).toEqual(['a'])
    expect(ids({ q: 'шарф' })).toEqual(['d'])
    expect(ids({ q: 'игрушки' }).sort()).toEqual(['a', 'b', 'c'])
    expect(ids({ q: 'розовый' }).sort()).toEqual(['b', 'c'])
  })

  it('работает вместе с фильтрами и сортировкой', () => {
    expect(ids({ q: 'розовый', sort: 'price-asc' })).toEqual(['c', 'b'])
    expect(ids({ q: 'розовый', fandom: 'sailor-moon' })).toEqual(['b'])
  })
})

describe('сортировка', () => {
  it('по цене и названию', () => {
    expect(ids({ sort: 'price-asc' })).toEqual(['c', 'd', 'a', 'b'])
    expect(ids({ sort: 'price-desc' })).toEqual(['b', 'a', 'd', 'c'])
    expect(ids({ sort: 'title' })).toEqual(['b', 'a', 'c', 'd'])
  })

  it('по умолчанию — сначала новые', () => {
    expect(ids({})).toEqual(['d', 'a', 'b', 'c'])
  })
})

describe('пагинация', () => {
  const many = Array.from({ length: 30 }, (_, i) =>
    product({ id: `p${String(i).padStart(2, '0')}`, createdAt: `2026-01-${String(i + 1).padStart(2, '0')}` }),
  )

  it('делит на страницы и считает total', () => {
    const r = queryCatalog(many, parseCatalogQuery({ page: '3' }), ctx)
    expect(r.total).toBe(30)
    expect(r.totalPages).toBe(3)
    expect(r.items).toHaveLength(6)
  })

  it('страница за пределами диапазона сжимается до последней', () => {
    const r = queryCatalog(many, parseCatalogQuery({ page: '99' }), ctx)
    expect(r.page).toBe(3)
    expect(r.items).toHaveLength(6)
  })
})

describe('фасеты', () => {
  it('счётчики учитывают остальные фильтры, но не собственную группу', () => {
    const r = run({ color: 'pink' })
    const fandom = Object.fromEntries(r.facets.fandom.map((o) => [o.id, o.count]))
    expect(fandom).toEqual({ ghibli: 0, 'sailor-moon': 1 })
    // группа «цвет» не сужает сама себя: выбранный розовый не обнуляет зелёный
    const color = Object.fromEntries(r.facets.color.map((o) => [o.id, o.count]))
    expect(color).toEqual({ pink: 2, green: 3 })
  })

  it('показывает только те опции, которые есть в категории', () => {
    const r = run({ category: 'warm-wear' })
    expect(r.facets.fandom).toEqual([])
    expect(r.facets.warmth.map((o) => o.id)).toEqual(['warm'])
    expect(r.facets.price).toEqual({ min: 2900, max: 2900 })
  })

  it('выбранная опция остаётся видимой, даже если в области её нет', () => {
    const r = run({ category: 'toys', warmth: 'warm' })
    expect(r.facets.warmth.map((o) => o.id)).toEqual(['warm'])
  })
})
