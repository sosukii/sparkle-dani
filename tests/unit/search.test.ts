import { describe, expect, it } from 'vitest'
import { analyzeQuery, expandStem, stem } from '#shared/utils/search'
import { matchSitePages } from '#shared/utils/site-search'
import { parseCatalogQuery, queryCatalog } from '#shared/utils/catalog-query'
import { ctx, product } from './fixtures'

const shop = [
  product({ id: 'e1', title: 'Серьги «полумесяц»', category: 'toys', price: 1200, availability: 'in_stock', colors: ['pink'] }),
  product({ id: 'e2', title: 'Серьги «листики»', price: 2600, availability: 'made_to_order', colors: ['green'] }),
  product({ id: 'h1', title: 'Шапка с помпоном', price: 2200, availability: 'in_stock', colors: ['pink'], warmth: 'warm' }),
  product({ id: 'w1', title: 'Варежки «клюква»', price: 1800, availability: 'in_stock' }),
]
const found = (q: string, extra: Record<string, unknown> = {}) =>
  queryCatalog(shop, parseCatalogQuery({ q, ...extra }), ctx).items.map((p) => p.id).sort()

describe('основы слов и синонимы', () => {
  it('приводит формы одного слова к одной основе', () => {
    expect(stem('серьги')).toBe(stem('серьга'))
    expect(stem('розовая')).toBe(stem('розовый'))
    expect(stem('варежки')).toBe(stem('варежка'))
    expect(stem('игрушки')).toBe(stem('игрушка'))
  })

  it('«сережки» и «серьги» — одно и то же', () => {
    expect(expandStem('сережки')).toContain(stem('серьги'))
    expect(found('сережки')).toEqual(['e1', 'e2'])
    expect(found('серёжки')).toEqual(['e1', 'e2'])
    expect(found('серьги')).toEqual(['e1', 'e2'])
  })

  it('понимает уменьшительные и формы слова', () => {
    expect(found('шапочка')).toEqual(['h1'])
    expect(found('рукавицы')).toEqual(['w1'])
    expect(found('розовые')).toEqual(['e1', 'h1'])
    expect(found('зимнее')).toEqual(['h1']) // «Тёплое» в справочнике теплоты
  })

  it('находит по началу слова (набор на лету)', () => {
    expect(found('серьг')).toEqual(['e1', 'e2'])
    expect(found('шап')).toEqual([]) // слишком коротко для префикса (< 4 букв), чтобы не находить лишнего
  })

  it('все слова запроса должны совпасть', () => {
    expect(found('розовые серьги')).toEqual(['e1'])
    expect(found('розовые варежки')).toEqual([])
  })
})

describe('намерения в строке поиска', () => {
  it('«в наличии» — фильтр по наличию, а не слова для поиска', () => {
    expect(analyzeQuery('в наличии').availability).toBe('in_stock')
    expect(analyzeQuery('в наличии').groups).toEqual([])
    expect(found('в наличии')).toEqual(['e1', 'h1', 'w1'])
    expect(found('серьги в наличии')).toEqual(['e1'])
    expect(found('есть в наличии шапка')).toEqual(['h1'])
  })

  it('«под заказ» и «на заказ»', () => {
    expect(found('под заказ')).toEqual(['e2'])
    expect(found('на заказ')).toEqual(['e2'])
  })

  it('цена в запросе: «до 2000», «от 2 тыс», «до 2000 ₽»', () => {
    expect(analyzeQuery('до 2000').maxPrice).toBe(2000)
    expect(analyzeQuery('от 2 тыс').minPrice).toBe(2000)
    expect(found('до 2000')).toEqual(['e1', 'w1'])
    expect(found('до 2000 ₽ серьги')).toEqual(['e1'])
    expect(found('от 2 тыс')).toEqual(['e2', 'h1'])
  })

  it('«дешёвые» меняют сортировку, если пользователь не выбрал свою', () => {
    const ids = queryCatalog(shop, parseCatalogQuery({ q: 'недорогие' }), ctx).items.map((p) => p.price)
    expect(ids).toEqual([...ids].sort((a, b) => a - b))
  })

  it('не падает на мусоре', () => {
    for (const q of ['', '   ', '???', '123', 'до', 'в', 'a'.repeat(500)]) expect(() => found(q)).not.toThrow()
  })
})

describe('поиск по разделам сайта', () => {
  const ids = (q: string) => matchSitePages(q).map((p) => p.id)

  it('вопросы про получение, город и карту ведут в «Покупку и доставку»', () => {
    for (const q of ['доставка', 'как получить', 'где магазин', 'местоположение', 'где на карте', 'какой город', 'сдэк', 'самовывоз', 'москва'])
      expect(ids(q), q).toContain('delivery')
  })

  it('кастом и материалы ведут на страницу «Свой заказ»', () => {
    for (const q of ['индивидуальный заказ', 'свой дизайн', 'премиум', 'размеры', 'по фото'])
      expect(ids(q), q).toContain('custom')
  })

  it('цены и стоимость → каталог, связь → Telegram', () => {
    expect(ids('цены')).toContain('catalog')
    expect(ids('сколько стоит')).toContain('catalog')
    expect(ids('написать')).toContain('contact')
    expect(ids('телеграм')).toContain('contact')
  })

  it('обычные названия товаров не тащат за собой лишние разделы', () => {
    expect(ids('серьги')).toEqual([])
    expect(ids('розовый шарф')).toEqual([])
  })

  it('пустой запрос — пустой ответ', () => {
    expect(ids('')).toEqual([])
    expect(ids('   ')).toEqual([])
  })
})
