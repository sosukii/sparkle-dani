<script setup lang="ts">
import { formatLeadTime, formatPrice } from '#shared/utils/format'
import { buildBreadcrumbJsonLd, buildProductJsonLd, truncate } from '#shared/utils/seo'
import { CONTACT_LABEL, TELEGRAM_URL } from '#shared/utils/site'
import { buildProductPage } from '#shared/utils/catalog-views'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const siteUrl = useSiteUrl()

const { data } = await useAsyncData(
  () => `product:${slug.value}`,
  async () => buildProductPage(await loadCatalog(), slug.value),
  { watch: [slug] },
)
if (!data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Товар не найден', fatal: true })
}

const product = computed(() => data.value!.product)
const labels = computed(() => data.value!.labels)

usePageSeo(() => ({
  title: product.value.title,
  description: truncate(product.value.description || `${product.value.title} — изделие ручной работы.`),
  image: product.value.images[0]!.src,
  canonicalPath: `/product/${product.value.slug}`,
}))

useJsonLd(() => buildBreadcrumbJsonLd([
  { name: 'Главная', path: '/' },
  { name: 'Каталог', path: '/catalog' },
  ...(labels.value.category ? [{ name: labels.value.category.title, path: `/catalog/${labels.value.category.slug}` }] : []),
  { name: product.value.title, path: `/product/${product.value.slug}` },
], siteUrl))

const jsonLd = computed(() => buildProductJsonLd(product.value, siteUrl))
useHead(() => ({
  script: jsonLd.value ? [{ type: 'application/ld+json', innerHTML: JSON.stringify(jsonLd.value) }] : [],
}))

// Характеристики собираем только из того, что реально есть в данных.
const facts = computed(() => {
  const l = labels.value
  const rows: { label: string, value: string }[] = []
  if (l.type) rows.push({ label: 'Тип', value: l.type })
  if (l.fit) rows.push({ label: 'Посадка', value: l.fit.label })
  if (l.colors.length) rows.push({ label: l.colors.length > 1 ? 'Цвета' : 'Цвет', value: l.colors.map((c) => c.label).join(', ') })
  if (l.composition) rows.push({ label: 'Состав', value: l.composition.map((m) => (m.percent ? `${m.percent}% ${m.title.toLowerCase()}` : m.title.toLowerCase())).join(', ') })
  if (l.sizes) rows.push({ label: l.sizes.length > 1 ? 'Размеры' : 'Размер', value: l.sizes.map((s) => s.label).join(', ') })
  return [...rows, ...product.value.attributes]
})
</script>

<template>
  <div v-if="data" class="container-page py-8 lg:py-12">
    <nav aria-label="Хлебные крошки" class="mb-6 text-sm text-fg-muted">
      <ol class="flex flex-wrap items-center gap-2">
        <li><NuxtLink to="/" class="no-underline hover:text-link">Главная</NuxtLink></li>
        <li aria-hidden="true">/</li>
        <li><NuxtLink to="/catalog" class="no-underline hover:text-link">Каталог</NuxtLink></li>
        <template v-if="labels.category">
          <li aria-hidden="true">/</li>
          <li><NuxtLink :to="`/catalog/${labels.category.slug}`" class="no-underline hover:text-link">{{ labels.category.title }}</NuxtLink></li>
        </template>
        <li aria-hidden="true">/</li>
        <li aria-current="page" class="font-semibold text-fg">{{ product.title }}</li>
      </ol>
    </nav>

    <div class="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
      <div class="lg:sticky lg:top-28 lg:self-start">
        <ProductGallery :images="product.images" />
      </div>

      <div>
        <ul v-if="labels.category" class="flex flex-wrap gap-2">
          <li>
            <NuxtLink :to="`/catalog/${labels.category.slug}`" class="chip no-underline">{{ labels.category.title }}</NuxtLink>
          </li>
        </ul>

        <h1 class="mt-4 text-4xl sm:text-5xl" data-testid="product-title">{{ product.title }}</h1>
        <p class="mt-4 font-display text-4xl font-semibold" data-testid="product-price">{{ product.price === null ? 'Цена уточняется' : formatPrice(product.price) }}</p>

        <div class="mt-4 flex flex-wrap items-center gap-3">
          <AvailabilityBadge :availability="product.availability" />
          <p v-if="product.availability === 'made_to_order' && product.leadTimeDays" class="text-sm font-semibold text-fg-muted" data-testid="lead-time">
            Срок изготовления: {{ formatLeadTime(product.leadTimeDays) }}
          </p>
        </div>

        <p v-if="product.description" class="mt-6 max-w-xl text-lg leading-relaxed text-fg-muted">{{ product.description }}</p>

        <div class="mt-8">
          <AddToCart :product="product" />
          <a :href="TELEGRAM_URL" target="_blank" rel="noopener noreferrer" class="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold no-underline hover:text-link">
            <AppIcon name="telegram" :size="18" /> Есть вопрос? {{ CONTACT_LABEL }}
          </a>
        </div>

        <section v-if="facts.length" class="mt-10" aria-labelledby="product-facts">
          <h2 id="product-facts" class="text-2xl">Характеристики</h2>
          <dl class="mt-4 divide-y divide-line rounded-card border border-line bg-surface">
            <div v-for="row in facts" :key="row.label" class="grid grid-cols-[8.5rem_1fr] gap-4 px-5 py-3 text-sm sm:grid-cols-[11rem_1fr]">
              <dt class="font-semibold text-fg-muted">{{ row.label }}</dt>
              <dd class="font-semibold">{{ row.value }}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>

    <section v-if="data.related.length" class="mt-20" aria-labelledby="related">
      <SectionHead id="related" eyebrow="Вам может понравиться" title="Похожие изделия" :to="labels.category ? `/catalog/${labels.category.slug}` : '/catalog'" />
      <div class="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
        <ProductCard v-for="p in data.related" :key="p.id" :product="p" />
      </div>
    </section>
  </div>
</template>
