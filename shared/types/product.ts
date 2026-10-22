import { z } from 'zod'

const id = z.string().min(1)
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug: только a-z, 0-9 и дефис')

export const availabilitySchema = z.enum(['in_stock', 'made_to_order'])

export const productImageSchema = z.object({
  src: z.string().startsWith('/'),
  alt: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** Что на фото: общий вид, деталь вязки, изделие на модели. Нужно галерее для подписей. */
  kind: z.enum(['overview', 'detail', 'on-model']).optional(),
  /** true — временная картинка-заглушка, не настоящая фотография изделия. */
  placeholder: z.boolean().optional(),
})

/**
 * Товар. Правило для необязательных сведений: `null` означает «не известно», а не «нет» и не ноль.
 * Неизвестная цена не равна 0, неизвестное наличие не означает «нет в наличии»,
 * неизвестный состав не означает «без состава», неизвестные размеры не означают «универсальный размер».
 */
export const productSchema = z
  .object({
    id,
    slug,
    title: z.string().min(1),
    description: z.string().default(''),
    /** Цена в целых рублях; null — цена не определена (покупателю предлагается уточнить её у Дани). */
    price: z.number().int().nonnegative().nullable().default(null),
    currency: z.literal('RUB').default('RUB'),
    /** id категории из data/categories.json */
    category: id,
    /** id типа изделия из data/taxonomy.json */
    type: id,
    /** Посадка (id из taxonomy.fits); null — не указана или не применима (аксессуары, игрушки). */
    fit: id.nullable().default(null),
    /** Пояснение к посадке именно этой модели; null — нет сведений. */
    fitNote: z.string().min(1).nullable().default(null),
    /** id цветов; может быть пустым */
    colors: z.array(id).default([]),
    /**
     * Состав: материалы из data/materials.json и доли в процентах (null — доля неизвестна).
     * null вместо списка — состав не известен.
     */
    composition: z
      .array(z.object({ material: id, percent: z.number().int().min(1).max(100).nullable().default(null) }))
      .min(1)
      .nullable()
      .default(null)
      .refine(
        (c) => !c || c.some((m) => m.percent === null) || c.reduce((s, m) => s + (m.percent ?? 0), 0) === 100,
        'composition: проценты должны давать 100',
      ),
    /** Доступные размеры (id из taxonomy.sizes); null — размеры не известны. */
    sizes: z.array(id).min(1).nullable().default(null),
    /** Измерения изделия в сантиметрах по размерам; null — измерений нет. */
    measurements: z
      .array(z.object({ size: id, values: z.record(id, z.number().positive()) }))
      .min(1)
      .nullable()
      .default(null),
    /** Рост модели на фото и надетый размер; null — сведений нет. */
    model: z.object({ heightCm: z.number().int().positive(), wearsSize: id }).nullable().default(null),
    /** id рекомендаций из data/care.json; null — рекомендации по уходу не заданы. */
    care: z.array(id).min(1).nullable().default(null),
    /** Наличие; null — не известно (покупателю предлагается уточнить у Дани). */
    availability: availabilitySchema.nullable().default(null),
    /** Остаток для товара «в наличии». Если не задан, лимита нет (кроме технического). */
    stock: z.number().int().nonnegative().optional(),
    /** Срок изготовления для «под заказ», в днях. */
    leadTimeDays: z
      .object({ min: z.number().int().positive(), max: z.number().int().positive() })
      .refine((v) => v.min <= v.max, 'leadTimeDays: min не может быть больше max')
      .optional(),
    images: z.array(productImageSchema).min(1),
    /** Дополнительные характеристики (например, высота игрушки). Показываются только заданные. */
    attributes: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).default([]),
    /** Дата добавления, YYYY-MM-DD. Нужна для сортировки «сначала новые». */
    createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** true — демонстрационный товар, не настоящее изделие Дани. */
    isDemo: z.boolean().default(false),
  })

export type Product = z.infer<typeof productSchema>
export type ProductImage = z.infer<typeof productImageSchema>
export type Availability = z.infer<typeof availabilitySchema>

export const categorySchema = z.object({
  id,
  slug,
  title: z.string().min(1),
  description: z.string().default(''),
})
export type Category = z.infer<typeof categorySchema>

const option = z.object({ id, label: z.string().min(1) })
export const taxonomySchema = z.object({
  types: z.array(option),
  colors: z.array(option.extend({ hex: z.string().regex(/^#[0-9a-fA-F]{6}$/) })),
  fits: z.array(option),
  sizes: z.array(option),
  /** Какие измерения изделия бывают (ширина по груди, длина…). */
  measures: z.array(option),
})
export type Taxonomy = z.infer<typeof taxonomySchema>

/** Справочник материалов: общие сведения, не обещания про конкретное изделие. */
export const materialSchema = z.object({ id, title: z.string().min(1), summary: z.string().min(1) })
export type Material = z.infer<typeof materialSchema>

/** Справочник рекомендаций по уходу. */
export const careItemSchema = z.object({ id, label: z.string().min(1), text: z.string().min(1) })
export type CareItem = z.infer<typeof careItemSchema>
