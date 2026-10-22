import type { ZodType } from 'zod'
import { careItemSchema, categorySchema, materialSchema, productSchema, taxonomySchema } from '#shared/types/product'
import type { CareItem, Category, Material, Product, Taxonomy } from '#shared/types/product'
import type { ProductRepository } from './product.repository'

interface Snapshot {
  products: Product[]
  categories: Category[]
  taxonomy: Taxonomy
  materials: Material[]
  care: CareItem[]
}

const storage = () => useStorage('assets:data')

async function readJson<T>(key: string, schema: ZodType<T>): Promise<T> {
  const raw = await storage().getItem<unknown>(key)
  if (raw === null || raw === undefined) throw new Error(`Файл данных не найден: data/${key.replace(/:/g, '/')}`)
  const value = typeof raw === 'string' ? JSON.parse(raw) : raw
  return schema.parse(value)
}

function describeIssues(error: unknown): string {
  const issues = (error as { issues?: { path: (string | number)[], message: string }[] })?.issues
  return issues ? issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ') : String(error)
}

/** Читает и проверяет все JSON-файлы. Битый товар пропускается с понятным сообщением, а не роняет весь сайт. */
async function load(): Promise<Snapshot> {
  const taxonomy = await readJson('taxonomy.json', taxonomySchema)
  const categories = await readJson('categories.json', categorySchema.array())
  const materials = await readJson('materials.json', materialSchema.array())
  const care = await readJson('care.json', careItemSchema.array())
  const keys = (await storage().getKeys('products')).filter((k) => k.endsWith('.json')).sort()

  const known = {
    categories: new Set(categories.map((c) => c.id)),
    types: new Set(taxonomy.types.map((o) => o.id)),
    colors: new Set(taxonomy.colors.map((o) => o.id)),
    fits: new Set(taxonomy.fits.map((o) => o.id)),
    sizes: new Set(taxonomy.sizes.map((o) => o.id)),
    measures: new Set(taxonomy.measures.map((o) => o.id)),
    materials: new Set(materials.map((o) => o.id)),
    care: new Set(care.map((o) => o.id)),
  }
  const ids = new Set<string>()
  const slugs = new Set<string>()
  const products: Product[] = []

  for (const key of keys) {
    const file = `data/${key.replace(/:/g, '/')}`
    try {
      const product = await readJson(key, productSchema)
      const problems: string[] = []
      if (!known.categories.has(product.category)) problems.push(`неизвестная категория «${product.category}»`)
      if (!known.types.has(product.type)) problems.push(`неизвестный тип «${product.type}»`)
      if (product.fit && !known.fits.has(product.fit)) problems.push(`неизвестная посадка «${product.fit}»`)
      for (const c of product.colors) if (!known.colors.has(c)) problems.push(`неизвестный цвет «${c}»`)
      for (const s of product.sizes ?? []) if (!known.sizes.has(s)) problems.push(`неизвестный размер «${s}»`)
      for (const m of product.composition ?? []) if (!known.materials.has(m.material)) problems.push(`неизвестный материал «${m.material}»`)
      for (const c of product.care ?? []) if (!known.care.has(c)) problems.push(`неизвестная рекомендация по уходу «${c}»`)
      for (const row of product.measurements ?? []) {
        if (!(product.sizes ?? []).includes(row.size)) problems.push(`измерения для размера «${row.size}», которого нет в sizes`)
        for (const key of Object.keys(row.values)) if (!known.measures.has(key)) problems.push(`неизвестное измерение «${key}»`)
      }
      if (product.model && !(product.sizes ?? []).includes(product.model.wearsSize)) problems.push(`на модели размер «${product.model.wearsSize}», которого нет в sizes`)
      if (ids.has(product.id)) problems.push(`повторяющийся id «${product.id}»`)
      if (slugs.has(product.slug)) problems.push(`повторяющийся slug «${product.slug}»`)
      if (problems.length) throw new Error(problems.join('; '))
      ids.add(product.id)
      slugs.add(product.slug)
      products.push(product)
    }
    catch (error) {
      console.error(`[catalog] ${file} пропущен: ${describeIssues(error)}`)
    }
  }
  return { products, categories, taxonomy, materials, care }
}

export function createJsonProductRepository(): ProductRepository {
  let cache: Promise<Snapshot> | undefined

  // В dev перечитываем файлы при каждом запросе, чтобы правки JSON были видны сразу.
  const snapshot = (): Promise<Snapshot> => {
    if (import.meta.dev || !cache) {
      cache = load().catch((error) => {
        cache = undefined
        throw createError({
          statusCode: 500,
          statusMessage: 'Catalog unavailable',
          message: String((error as Error).message),
        })
      })
    }
    return cache
  }

  return {
    async listProducts() {
      return (await snapshot()).products
    },
    async getProductBySlug(slug) {
      return (await snapshot()).products.find((p) => p.slug === slug) ?? null
    },
    async getProductsByIds(ids) {
      const wanted = new Set(ids)
      return (await snapshot()).products.filter((p) => wanted.has(p.id))
    },
    async listCategories() {
      return (await snapshot()).categories
    },
    async getTaxonomy() {
      return (await snapshot()).taxonomy
    },
    async listMaterials() {
      return (await snapshot()).materials
    },
    async listCare() {
      return (await snapshot()).care
    },
  }
}
