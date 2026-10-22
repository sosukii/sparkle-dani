import { describe, expect, it } from 'vitest'
import { analyzeQuery, expandStem, stem } from '#shared/utils/search'
import { matchSitePages } from '#shared/utils/site-search'
import { parseCatalogQuery, queryCatalog } from '#shared/utils/catalog-query'
import { ctx, product } from './fixtures'

const shop = [
  product({ id: 's1', title: 'Свитер «Какао»', price: 12000, availability: 'in_stock', colors: ['cocoa'] }),
  product({ id: 's2', title: 'Свитер с косами', price: 21900, availability: 'made_to_order', colors: ['olive'] }),
  product({ id: 'h1', title: 'Шапка с помпоном', price: 3500, availability: 'in_stock', colors: ['cocoa'], category: 'accessories', type: 'scarf' }),
  product({ id: 'w1', title: 'Варежки «клюква»', price: 3600, availability: 'in_stock', category: 'accessories', type: 'scarf' }),
]
const found = (q: string, extra: Record<string, unknown> = {}) =>
  queryCatalog(shop, parseCatalogQuery({ q, ...extra }), ctx).items.map((p) => p.id).sort()

describe('основы слов и синонимы', () => {
  it('приводит формы одного слова к одной основе', () => {
    expect(stem('свитера')).toBe(stem('свитер'))
    expect(stem('варежки')).toBe(stem('варежка'))
    expect(stem('шапки')).toBe(stem('шапка'))
  })

  it('«джемпер» и «свитер» — одно и то же', () => {
    expect(expandStem('джемпер')).toContain(stem('свитер'))
    expect(found('джемпер')).toEqual(['s1', 's2'])
    expect(found('свитера')).toEqual(['s1', 's2'])
  })

  it('понимает уменьшительные и формы слова', () => {
    expect(found('шапочка')).toEqual(['h1'])
    expect(found('рукавицы')).toEqual(['w1'])
    expect(found('шоколадный')).toEqual(['h1', 's1']) // синоним цвета «какао»
  })

  it('находит по началу слова (набор на лету)', () => {
    expect(found('свитер')).toEqual(['s1', 's2'])
    expect(found('свит')).toEqual(['s1', 's2'])
    expect(found('шап')).toEqual([]) // слишком коротко для префикса (< 4 букв), чтобы не находить лишнего
  })

  it('все слова запроса должны совпасть', () => {
    expect(found('какао свитер')).toEqual(['s1'])
    expect(found('какао варежки')).toEqual([])
  })
})

describe('намерения в строке поиска', () => {
  it('«в наличии» — фильтр по наличию, а не слова для поиска', () => {
    expect(analyzeQuery('в наличии').availability).toBe('in_stock')
    expect(analyzeQuery('в наличии').groups).toEqual([])
    expect(found('в наличии')).toEqual(['h1', 's1', 'w1'])
    expect(found('свитер в наличии')).toEqual(['s1'])
    expect(found('есть в наличии шапка')).toEqual(['h1'])
  })

  it('«под заказ» и «на заказ»', () => {
    expect(found('под заказ')).toEqual(['s2'])
    expect(found('на заказ')).toEqual(['s2'])
  })

  it('цена в запросе: «до 5000», «от 10 тыс», «до 5000 ₽»', () => {
    expect(analyzeQuery('до 5000').maxPrice).toBe(5000)
    expect(analyzeQuery('от 10 тыс').minPrice).toBe(10000)
    expect(found('до 5000')).toEqual(['h1', 'w1'])
    expect(found('до 5000 ₽ шапка')).toEqual(['h1'])
    expect(found('от 10 тыс')).toEqual(['s1', 's2'])
  })

  it('товар без цены не попадает под условие по цене', () => {
    const unknown = [product({ id: 'u', title: 'Свитер без цены', price: null })]
    const r = queryCatalog(unknown, parseCatalogQuery({ q: 'свитер до 5000' }), ctx)
    expect(r.items).toEqual([])
    expect(queryCatalog(unknown, parseCatalogQuery({ q: 'свитер' }), ctx).items).toHaveLength(1)
  })

  it('«дешёвые» меняют сортировку, если пользователь не выбрал свою', () => {
    const prices = queryCatalog(shop, parseCatalogQuery({ q: 'недорогие' }), ctx).items.map((p) => p.price as number)
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
  })

  it('не падает на мусоре', () => {
    for (const q of ['', '   ', '???', '123', 'до', 'в', 'a'.repeat(500)]) expect(() => found(q)).not.toThrow()
  })
})

describe('поиск по разделам сайта', () => {
  const ids = (q: string) => matchSitePages(q).map((p) => p.id)

  it('вопросы про получение, оплату и возврат ведут в «Покупку и доставку»', () => {
    for (const q of ['доставка', 'как получить', 'оплата', 'сроки', 'возврат'])
      expect(ids(q), q).toContain('delivery')
  })

  it('кастом и материалы ведут на страницу «Свой заказ»', () => {
    for (const q of ['индивидуальный заказ', 'свой дизайн', 'по фото'])
      expect(ids(q), q).toContain('custom')
  })

  it('вопросы про размер и мерки ведут на «Размеры и мерки», про состав и уход — на «Материалы и уход»', () => {
    for (const q of ['размеры', 'какой размер', 'мерки', 'оверсайз']) expect(ids(q), q).toContain('sizes')
    for (const q of ['состав', 'уход', 'стирка', 'колется', 'шерсть']) expect(ids(q), q).toContain('materials')
  })

  it('цены и стоимость → каталог, связь → Telegram', () => {
    expect(ids('цены')).toContain('catalog')
    expect(ids('сколько стоит')).toContain('catalog')
    expect(ids('написать')).toContain('contact')
    expect(ids('телеграм')).toContain('contact')
  })

  it('обычные названия товаров не тащат за собой лишние разделы', () => {
    expect(ids('свитер')).toEqual([])
    expect(ids('оливковый шарф')).toEqual([])
  })

  it('пустой запрос — пустой ответ', () => {
    expect(ids('')).toEqual([])
    expect(ids('   ')).toEqual([])
  })
})
