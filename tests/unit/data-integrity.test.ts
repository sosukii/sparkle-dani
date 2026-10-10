import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { categorySchema, productSchema, taxonomySchema } from '#shared/types/product'

const root = join(import.meta.dirname, '../..')
const readJson = (path: string) => JSON.parse(readFileSync(join(root, path), 'utf8'))

const taxonomy = taxonomySchema.parse(readJson('data/taxonomy.json'))
const categories = categorySchema.array().parse(readJson('data/categories.json'))
const files = readdirSync(join(root, 'data/products')).filter((f) => f.endsWith('.json'))
const products = files.map((f) => ({ file: f, product: productSchema.parse(readJson(`data/products/${f}`)) }))

describe('данные каталога', () => {
  it('товары найдены и проходят схему', () => {
    expect(products.length).toBeGreaterThan(0)
  })

  it('id и slug уникальны', () => {
    const ids = products.map((p) => p.product.id)
    const slugs = products.map((p) => p.product.slug)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('имя файла совпадает с id товара', () => {
    for (const { file, product } of products) expect(file).toBe(`${product.id}.json`)
  })

  it('все ссылки на справочники существуют', () => {
    const has = (list: { id: string }[], id: string) => list.some((o) => o.id === id)
    for (const { product: p } of products) {
      expect(has(categories, p.category), `${p.id}: category`).toBe(true)
      expect(has(taxonomy.types, p.type), `${p.id}: type`).toBe(true)
      if (p.fandom) expect(has(taxonomy.fandoms, p.fandom), `${p.id}: fandom`).toBe(true)
      if (p.warmth) expect(has(taxonomy.warmth, p.warmth), `${p.id}: warmth`).toBe(true)
      for (const c of p.colors) expect(has(taxonomy.colors, c), `${p.id}: color ${c}`).toBe(true)
    }
  })

  it('файлы изображений существуют', () => {
    for (const { product: p } of products)
      for (const img of p.images) expect(existsSync(join(root, 'public', img.src)), `${p.id}: ${img.src}`).toBe(true)
  })

  it('в каждой категории достаточно товаров для демонстрации фильтров', () => {
    for (const c of categories) {
      const inCategory = products.filter((p) => p.product.category === c.id)
      expect(inCategory.length, c.id).toBeGreaterThanOrEqual(8)
    }
  })

  it('хотя бы в одной категории есть вторая страница (пагинация)', () => {
    expect(categories.some((c) => products.filter((p) => p.product.category === c.id).length > 12)).toBe(true)
  })
})
