import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { careItemSchema, categorySchema, materialSchema, productSchema, taxonomySchema } from '#shared/types/product'

const root = join(import.meta.dirname, '../..')
const readJson = (path: string) => JSON.parse(readFileSync(join(root, path), 'utf8'))

const taxonomy = taxonomySchema.parse(readJson('data/taxonomy.json'))
const categories = categorySchema.array().parse(readJson('data/categories.json'))
const materials = materialSchema.array().parse(readJson('data/materials.json'))
const care = careItemSchema.array().parse(readJson('data/care.json'))
const files = readdirSync(join(root, 'data/products')).filter((f) => f.endsWith('.json'))
const items = files.map((f) => ({ file: f, product: productSchema.parse(readJson(`data/products/${f}`)) }))
const products = items.map((i) => i.product)
const has = (list: { id: string }[], id: string) => list.some((o) => o.id === id)

describe('данные каталога', () => {
  it('товары найдены и проходят схему', () => {
    expect(items.length).toBeGreaterThan(0)
  })

  it('id и slug уникальны, имя файла совпадает с id', () => {
    const ids = products.map((p) => p.id)
    const slugs = products.map((p) => p.slug)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const { file, product } of items) expect(file).toBe(`${product.id}.json`)
  })

  it('справочники не содержат повторяющихся id', () => {
    for (const list of [categories, materials, care, taxonomy.types, taxonomy.colors, taxonomy.fits, taxonomy.sizes, taxonomy.measures])
      expect(new Set(list.map((o) => o.id)).size).toBe(list.length)
  })

  it('все ссылки на справочники существуют', () => {
    for (const p of products) {
      expect(has(categories, p.category), `${p.id}: category`).toBe(true)
      expect(has(taxonomy.types, p.type), `${p.id}: type`).toBe(true)
      if (p.fit) expect(has(taxonomy.fits, p.fit), `${p.id}: fit`).toBe(true)
      for (const c of p.colors) expect(has(taxonomy.colors, c), `${p.id}: color ${c}`).toBe(true)
      for (const s of p.sizes ?? []) expect(has(taxonomy.sizes, s), `${p.id}: size ${s}`).toBe(true)
      for (const m of p.composition ?? []) expect(has(materials, m.material), `${p.id}: material ${m.material}`).toBe(true)
      for (const c of p.care ?? []) expect(has(care, c), `${p.id}: care ${c}`).toBe(true)
      for (const row of p.measurements ?? []) {
        expect(p.sizes ?? [], `${p.id}: измерения для размера ${row.size}`).toContain(row.size)
        for (const key of Object.keys(row.values)) expect(has(taxonomy.measures, key), `${p.id}: measure ${key}`).toBe(true)
      }
      if (p.model) expect(p.sizes ?? [], `${p.id}: размер на модели`).toContain(p.model.wearsSize)
    }
  })

  it('файлы изображений существуют', () => {
    for (const p of products)
      for (const img of p.images) expect(existsSync(join(root, 'public', img.src)), `${p.id}: ${img.src}`).toBe(true)
  })

  it('демо-товары помечены, а их картинки-заглушки не выдают себя за фото', () => {
    for (const p of products)
      if (p.isDemo) for (const img of p.images) expect(img.placeholder, `${p.id}: ${img.src}`).toBe(true)
  })

  it('«под заказ» имеет срок, а «в наличии» не обещает срок изготовления', () => {
    for (const p of products) {
      if (p.availability === 'made_to_order') expect(p.leadTimeDays, p.id).toBeDefined()
      if (p.availability !== 'made_to_order') expect(p.leadTimeDays, p.id).toBeUndefined()
    }
  })
})

describe('демо-каталог показывает все возможности интерфейса', () => {
  it('у каждой категории достаточно товаров', () => {
    for (const c of categories) expect(products.filter((p) => p.category === c.id).length, c.id).toBeGreaterThanOrEqual(3)
  })

  it('есть вторая страница каталога (пагинация)', () => {
    expect(products.length).toBeGreaterThan(12)
  })

  it('каждое значение каждого фильтра встречается хотя бы у одного товара', () => {
    const used = (get: (p: (typeof products)[number]) => (string | null)[]) => new Set(products.flatMap(get))
    for (const [name, list, values] of [
      ['type', taxonomy.types, used((p) => [p.type])],
      ['color', taxonomy.colors, used((p) => p.colors)],
      ['fit', taxonomy.fits, used((p) => [p.fit])],
      ['size', taxonomy.sizes, used((p) => p.sizes ?? [])],
      ['material', materials, used((p) => (p.composition ?? []).map((m) => m.material))],
    ] as const) {
      for (const option of list) expect(values.has(option.id), `${name}: ${option.id}`).toBe(true)
    }
  })

  it('есть оба статуса наличия и случаи неизвестных сведений', () => {
    expect(products.some((p) => p.availability === 'in_stock')).toBe(true)
    expect(products.some((p) => p.availability === 'made_to_order')).toBe(true)
    expect(products.some((p) => p.availability === null)).toBe(true)
    expect(products.some((p) => p.price === null)).toBe(true)
    expect(products.some((p) => p.composition === null)).toBe(true)
    expect(products.some((p) => p.sizes === null)).toBe(true)
    expect(products.some((p) => p.measurements !== null)).toBe(true)
    expect(products.some((p) => p.model !== null)).toBe(true)
  })
})
