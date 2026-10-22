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
    expect(f).toMatchObject({ q: '', type: [], fit: [], size: [], material: [], sort: 'new', page: 1, pageSize: 12 })
    expect(f.minPrice).toBeUndefined()
  })

  it('понимает списки через запятую и повторяющиеся параметры, убирает дубли', () => {
    expect(parseCatalogQuery({ color: 'cocoa,olive,cocoa' }).color).toEqual(['cocoa', 'olive'])
    expect(parseCatalogQuery({ color: ['cocoa', 'olive,gray'] }).color).toEqual(['cocoa', 'olive', 'gray'])
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
    expect(parseCatalogQuery({ category: 'accessories' }, { category: 'sweaters' }).category).toBe('sweaters')
  })
})

describe('serializeCatalogFilters', () => {
  it('пишет только непустые и нестандартные значения', () => {
    const f = parseCatalogQuery({ fit: 'oversize', color: 'cocoa,olive', size: 's', material: 'wool', min: '100', sort: 'price-asc', page: '2' })
    expect(serializeCatalogFilters(f)).toEqual({
      fit: 'oversize',
      color: 'cocoa,olive',
      size: 's',
      material: 'wool',
      min: '100',
      sort: 'price-asc',
      page: '2',
    })
    expect(serializeCatalogFilters(parseCatalogQuery({}))).toEqual({})
  })

  it('hasActiveFilters ориентируется на фильтры, но не на поиск и сортировку', () => {
    expect(hasActiveFilters(parseCatalogQuery({ q: 'свитер', sort: 'title' }))).toBe(false)
    expect(hasActiveFilters(parseCatalogQuery({ min: '10' }))).toBe(true)
    expect(hasActiveFilters(parseCatalogQuery({ size: 'm' }))).toBe(true)
  })
})

describe('фильтры работают вместе', () => {
  it('категория + посадка + цвет + цена', () => {
    expect(ids({ category: 'sweaters', fit: 'oversize', color: 'cocoa', min: '20000', max: '30000' })).toEqual(['a'])
  })

  it('внутри одной группы значения объединяются через ИЛИ, между группами — через И', () => {
    expect(ids({ fit: 'oversize,regular' }).sort()).toEqual(['a', 'b'])
    expect(ids({ fit: 'oversize,regular', color: 'olive' })).toEqual(['b'])
  })

  it('цвет: товар с несколькими цветами находится по любому из них', () => {
    expect(ids({ color: 'olive' }).sort()).toEqual(['b', 'c', 'd'])
  })

  it('размер и материал фильтруют по данным товара', () => {
    expect(ids({ size: 'm' }).sort()).toEqual(['a', 'b'])
    expect(ids({ size: 'one-size' })).toEqual(['d'])
    expect(ids({ material: 'cotton' })).toEqual(['b'])
  })

  it('граничные значения цены включаются', () => {
    expect(ids({ min: '14500', max: '14500' })).toEqual(['b'])
  })

  it('пустой результат не ломает ответ и отдаёт валидные фасеты', () => {
    const r = run({ fit: 'oversize', color: 'olive' })
    expect(r.total).toBe(0)
    expect(r.items).toEqual([])
    expect(r.totalPages).toBe(1)
    expect(r.page).toBe(1)
  })

  it('неизвестные сведения не совпадают ни с одним значением фильтра', () => {
    // «c» без посадки, размеров, состава и цены: он не попадает ни под один фильтр по этим полям
    expect(ids({ fit: 'oversize,regular' })).not.toContain('c')
    expect(ids({ size: 's,m,one-size' })).not.toContain('c')
    expect(ids({ material: 'wool,cotton' })).not.toContain('c')
    expect(ids({ max: '1000000' })).not.toContain('c')
    expect(ids({ min: '0' })).not.toContain('c')
  })

  it('без фильтров товар с неизвестными сведениями виден', () => {
    expect(ids({})).toContain('c')
  })
})

describe('изделия с неизвестными сведениями', () => {
  it('по умолчанию не попадают под фильтры по этим сведениям, но считаются отдельно', () => {
    expect(run({ fit: 'oversize' }).hiddenUnknown).toBe(2) // c и d: посадка не указана
    expect(run({ max: '30000' }).hiddenUnknown).toBe(1) // c: цена не известна
    expect(run({ color: 'cocoa' }).hiddenUnknown).toBe(0) // цвет известен всегда
    expect(run({}).hiddenUnknown).toBe(0)
  })

  it('includeUnknown добавляет их к выборке и обнуляет счётчик скрытых', () => {
    const r = run({ fit: 'oversize', unknown: '1' })
    expect(r.items.map((p) => p.id).sort()).toEqual(['a', 'c', 'd'])
    expect(r.hiddenUnknown).toBe(0)
    expect(ids({ max: '10000', unknown: '1' })).toEqual(['d', 'c'])
  })

  it('не отменяет известные несовпадения: другая посадка по-прежнему не подходит', () => {
    expect(ids({ fit: 'oversize', unknown: '1' })).not.toContain('b') // b точно «обычная»
  })

  it('сохраняется в адресе и не считается активным фильтром сам по себе', () => {
    const f = parseCatalogQuery({ unknown: '1' })
    expect(f.includeUnknown).toBe(true)
    expect(serializeCatalogFilters(f)).toEqual({ unknown: '1' })
    expect(hasActiveFilters(f)).toBe(false)
    expect(parseCatalogQuery({ unknown: '0' }).includeUnknown).toBe(false)
  })
})

describe('поиск', () => {
  it('нечувствителен к регистру и ё/е', () => {
    expect(ids({ q: 'ЕЛКА' })).toEqual(['d'])
    expect(normalizeText('Шарф «Ёлка»!')).toBe('шарф елка')
  })

  it('все слова запроса должны встретиться (И)', () => {
    expect(ids({ q: 'свитер крупной' })).toEqual(['a'])
    expect(ids({ q: 'свитер ёлка' })).toEqual([])
  })

  it('ищет по типу, категории, цвету и материалу', () => {
    expect(ids({ q: 'шарф' })).toEqual(['d'])
    expect(ids({ q: 'свитеры' }).sort()).toEqual(['a', 'b', 'c'])
    expect(ids({ q: 'оливковый' }).sort()).toEqual(['b', 'c', 'd'])
    expect(ids({ q: 'хлопок' })).toEqual(['b'])
  })

  it('работает вместе с фильтрами и сортировкой', () => {
    expect(ids({ q: 'оливковый', sort: 'price-asc' })).toEqual(['d', 'b', 'c'])
    expect(ids({ q: 'оливковый', fit: 'regular' })).toEqual(['b'])
  })
})

describe('сортировка', () => {
  it('по цене: товар без цены всегда в конце, а не «самый дешёвый»', () => {
    expect(ids({ sort: 'price-asc' })).toEqual(['d', 'b', 'a', 'c'])
    expect(ids({ sort: 'price-desc' })).toEqual(['a', 'b', 'd', 'c'])
  })

  it('по названию', () => {
    expect(ids({ sort: 'title' })).toEqual(['a', 'b', 'c', 'd'])
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
    const r = run({ color: 'cocoa' })
    const fit = Object.fromEntries(r.facets.fit.map((o) => [o.id, o.count]))
    expect(fit).toEqual({ regular: 0, oversize: 1 })
    // группа «цвет» не сужает сама себя: выбранный какао не обнуляет оливковый
    const color = Object.fromEntries(r.facets.color.map((o) => [o.id, o.count]))
    expect(color).toEqual({ cocoa: 2, olive: 3 })
  })

  it('показывает только те опции, которые есть в категории', () => {
    const r = run({ category: 'sweaters' })
    expect(r.facets.fit.map((o) => o.id)).toEqual(['regular', 'oversize'])
    expect(r.facets.size.map((o) => o.id)).toEqual(['s', 'm'])
    expect(r.facets.material.map((o) => o.id)).toEqual(['wool', 'cotton'])
    expect(r.facets.color.map((o) => o.id)).toEqual(['cocoa', 'olive'])
  })

  it('группа, которая ничего не сужает, скрыта: все изделия области одного типа или без таких сведений', () => {
    const r = run({ category: 'accessories' }) // в области одно изделие «d»
    expect(r.facets.type).toEqual([])
    expect(r.facets.fit).toEqual([])
    expect(r.facets.material).toEqual([])
    // а у категории свитеров тип один на всех, поэтому и там группа не нужна
    expect(run({ category: 'sweaters' }).facets.type).toEqual([])
  })

  it('скрытая группа появляется, если по ней уже что-то выбрано', () => {
    expect(run({ category: 'accessories', material: 'wool' }).facets.material.map((o) => o.id)).toEqual(['wool'])
  })

  it('границы цены считаются только по известным ценам', () => {
    expect(run({ category: 'sweaters' }).facets.price).toEqual({ min: 14500, max: 28500 })
  })

  it('выбранная опция остаётся видимой, даже если в области её нет', () => {
    const r = run({ category: 'accessories', fit: 'oversize' })
    expect(r.facets.fit.map((o) => o.id)).toEqual(['oversize'])
  })
})
