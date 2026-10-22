<script setup lang="ts">
import { formatLeadTime, formatPrice } from '#shared/utils/format'
import { buildBreadcrumbJsonLd, buildProductJsonLd, truncate } from '#shared/utils/seo'
import { OWNER_NAME } from '#shared/utils/site'
import { buildAskText } from '#shared/utils/telegram'
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

// ── размер: выбор живёт на странице, поэтому справка и сообщение его не сбрасывают ──
const sizeOptions = computed(() => labels.value.sizes ?? [])
const needsSize = computed(() => sizeOptions.value.length > 1)
const selectedSizeId = ref<string | null>(null)
const sizeInvalid = ref(false)
// Если размер единственный, выбирать нечего. «Один размер» в заказ отдельной строкой не пишем.
watch(product, () => { selectedSizeId.value = null; sizeInvalid.value = false }, { immediate: true })
const size = computed(() => {
  if (needsSize.value) return sizeOptions.value.find((s) => s.id === selectedSizeId.value) ?? null
  const only = sizeOptions.value[0]
  return only && only.id !== 'one-size' ? only : null
})
watch(selectedSizeId, () => { sizeInvalid.value = false })

const sizeDialog = ref<{ open: () => void }>()
const askDialog = ref<{ open: () => void }>()
const askTopics = ref<string[]>([])
const askText = computed(() => buildAskText({ title: product.value.title, url: `${siteUrl}/product/${product.value.slug}`, sizeLabel: size.value?.label, topics: askTopics.value }))
function ask(topic?: string) {
  const defaults = product.value.price === null || product.value.availability === null ? ['цена и наличие'] : []
  askTopics.value = topic ? [topic] : defaults
  askDialog.value?.open()
}

const modelInfo = computed(() => data.value!.model)
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
        <h1 class="text-4xl sm:text-5xl" data-testid="product-title">{{ product.title }}</h1>
        <p class="mt-4 font-display text-4xl font-semibold" data-testid="product-price">{{ product.price === null ? 'Цена уточняется' : formatPrice(product.price) }}</p>

        <div class="mt-4 flex flex-wrap items-center gap-3">
          <AvailabilityBadge :availability="product.availability" />
          <p v-if="product.availability === 'made_to_order' && product.leadTimeDays" class="text-sm font-semibold text-fg-muted" data-testid="lead-time">
            Срок изготовления: {{ formatLeadTime(product.leadTimeDays) }}
          </p>
        </div>

        <p v-if="product.description" class="mt-6 max-w-xl text-lg leading-relaxed text-fg-muted">{{ product.description }}</p>

        <!-- Покупка: размер → корзина → понятно, что будет дальше -->
        <div class="mt-8 space-y-6">
          <SizePicker v-if="needsSize" v-model="selectedSizeId" :sizes="sizeOptions" :invalid="sizeInvalid" @help="sizeDialog?.open()" />
          <AddToCart :product="product" :size="size" :needs-size="needsSize" :size-invalid="sizeInvalid" @need-size="sizeInvalid = true" @ask="ask()" />

          <div class="rounded-md border border-line bg-surface p-4 text-sm" data-testid="what-next">
            <p class="font-semibold">Что дальше</p>
            <p class="mt-1 text-fg-muted">
              Корзина соберёт готовое сообщение для {{ OWNER_NAME }}: вы увидите его целиком, скопируете и отправите сами в Telegram.
              Оплаты на сайте нет, заказ не оформляется, пока вы не договоритесь с {{ OWNER_NAME }}.
            </p>
            <button type="button" class="mt-2 inline-flex min-h-11 items-center gap-2 font-semibold text-link underline underline-offset-4" data-testid="ask-open" @click="ask()">
              <AppIcon name="telegram" :size="18" /> Задать вопрос про это изделие
            </button>
          </div>
        </div>

        <div class="mt-12 space-y-12">
          <ProductSpecs :product="product" :labels="labels" :slug="product.slug" @ask="ask($event)" />
          <ProductCare :care="labels.care" :slug="product.slug" @ask="ask($event)" />

          <section aria-labelledby="product-terms" data-testid="product-terms">
            <h2 id="product-terms" class="text-2xl">Доставка, оплата и возврат</h2>
            <p class="mt-4 text-sm leading-relaxed text-fg-muted">
              Способ получения, сроки и оплату вы согласуете с {{ OWNER_NAME }} в переписке. Условия возврата тоже лучше уточнить до заказа:
              задайте вопрос, и они будут зафиксированы в вашем диалоге.
            </p>
            <p class="mt-3 text-sm">
              <NuxtLink to="/delivery" class="font-semibold text-link underline underline-offset-4">Как проходит покупка</NuxtLink>
            </p>
          </section>
        </div>
      </div>
    </div>

    <SizeDialog
      v-if="labels.sizes" ref="sizeDialog" :title="product.title" :slug="product.slug" :labels="labels" :model="modelInfo" :selected="selectedSizeId"
      @select="selectedSizeId = $event" @ask="ask('размер')"
    />
    <MessageDialog
      ref="askDialog" :text="askText" :title="`Сообщение для ${OWNER_NAME}`"
      :ids="{ text: 'ask-text', copy: 'copy-ask', open: 'open-telegram-ask' }"
    />

    <section v-if="data.related.length" class="mt-20" aria-labelledby="related">
      <SectionHead id="related" eyebrow="Вам может понравиться" title="Похожие изделия" :to="labels.category ? `/catalog/${labels.category.slug}` : '/catalog'" />
      <div class="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
        <ProductCard v-for="p in data.related" :key="p.id" :product="p" />
      </div>
    </section>
  </div>
</template>
