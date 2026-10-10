import { z } from 'zod'

const id = z.string().min(1)
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug: только a-z, 0-9 и дефис')

export const availabilitySchema = z.enum(['in_stock', 'made_to_order'])

export const productImageSchema = z.object({
  src: z.string().startsWith('/'),
  alt: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

export const productSchema = z
  .object({
    id,
    slug,
    title: z.string().min(1),
    description: z.string().default(''),
    /** Цена в целых рублях. */
    price: z.number().int().nonnegative(),
    currency: z.literal('RUB').default('RUB'),
    /** id категории из data/categories.json */
    category: id,
    /** id типа изделия из data/taxonomy.json */
    type: id,
    /** id фандома; null — изделие без фандома */
    fandom: id.nullable().default(null),
    /** id цветов; может быть пустым */
    colors: z.array(id).default([]),
    /** id теплоты/сезона; null — не указано */
    warmth: id.nullable().default(null),
    availability: availabilitySchema,
    /** Остаток для товара «в наличии». Если не задан, лимита нет (кроме технического). */
    stock: z.number().int().nonnegative().optional(),
    /** Срок изготовления для «под заказ», в днях. */
    leadTimeDays: z
      .object({ min: z.number().int().positive(), max: z.number().int().positive() })
      .refine((v) => v.min <= v.max, 'leadTimeDays: min не может быть больше max')
      .optional(),
    images: z.array(productImageSchema).min(1),
    attributes: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).default([]),
    /** Дата добавления, YYYY-MM-DD. Нужна для сортировки «сначала новые». */
    createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** true — демонстрационный товар, не настоящее изделие Мари. */
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
  fandoms: z.array(option),
  types: z.array(option),
  colors: z.array(option.extend({ hex: z.string().regex(/^#[0-9a-fA-F]{6}$/) })),
  warmth: z.array(option.extend({ hint: z.string().optional() })),
})
export type Taxonomy = z.infer<typeof taxonomySchema>
