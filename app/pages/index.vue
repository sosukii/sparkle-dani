<script setup lang="ts">
import { CONTACT_LABEL, OWNER_NAME, SITE_NAME, TELEGRAM_URL } from '#shared/utils/site'
import { pluralRu } from '#shared/utils/format'
import { parseCatalogQuery, queryCatalog } from '#shared/utils/catalog-query'

const [categoriesReq, latestReq] = await Promise.all([
  useCategories(),
  useAsyncData('home-latest', async () => {
    const catalog = await loadCatalog()
    return queryCatalog(catalog.products, parseCatalogQuery({ pageSize: 8 }), catalog)
  }),
])
const categories = categoriesReq.data
const latest = latestReq.data
const failed = computed(() => categoriesReq.error.value || latestReq.error.value)
const retry = () => Promise.all([categoriesReq.refresh(), latestReq.refresh()])

// Три изделия из разных категорий для коллажа; каждое кликабельно и ведёт на страницу товара.
const heroItems = computed(() =>
  (categories.value ?? []).filter((c) => c.cover && c.coverProduct).slice(0, 3).map((c) => ({ image: c.cover!, product: c.coverProduct! })),
)

usePageSeo({
  title: 'Авторский вязаный трикотаж ручной работы',
  description: `${SITE_NAME} — магазин авторского вязаного трикотажа ручной работы: свитеры, кардиганы, шарфы и шапки. Мастер — ${OWNER_NAME}.`,
  canonicalPath: '/',
})
const siteUrl = useSiteUrl()
useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: siteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    }),
  }],
})

const steps = [
  { n: '01', title: 'Выберите изделие', text: 'Листайте каталог, фильтруйте по размеру, посадке, материалу, цвету и цене. Есть вещи в наличии и под заказ.' },
  { n: '02', title: 'Выберите размер и соберите корзину', text: 'У каждого изделия есть таблица измерений и справка по выбору размера. Корзина сохранится, даже если вы закроете сайт.' },
  { n: '03', title: `Напишите ${OWNER_NAME}`, text: 'Сайт подготовит сообщение с составом заказа. Вы увидите его целиком, скопируете и отправите в Telegram сами; оплаты на сайте нет.' },
]

const help = [
  { to: '/info/sizes', title: 'Размеры и мерки', text: 'Как сравнить изделие со своей любимой вещью и выбрать размер.' },
  { to: '/info/materials', title: 'Материалы и уход', text: 'Что означает состав и как ухаживать за вязаными вещами.' },
  { to: '/custom', title: 'Свой заказ', text: 'Нужно по своим меркам или идее? Опишите, что хотите.' },
]
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="container-page grid items-center gap-10 py-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-20">
      <div>
        <p class="eyebrow">Handmade · ручная работа</p>
        <h1 class="mt-5 text-[2.75rem] sm:text-6xl lg:text-[3.6rem] xl:text-7xl">
          Авторский <span class="em-accent">вязаный трикотаж</span> ручной работы
        </h1>
        <p class="mt-6 max-w-xl text-lg leading-relaxed text-fg-muted">
          Свитеры, кардиганы, шарфы, шапки и амигуруми. Каждое изделие связано вручную, а вопросы по размеру и составу можно задать {{ OWNER_NAME }} в Telegram.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <NuxtLink to="/catalog" class="btn btn-primary px-7 no-underline">Смотреть каталог <AppIcon name="arrow-right" :size="18" /></NuxtLink>
          <a :href="TELEGRAM_URL" target="_blank" rel="noopener noreferrer" class="btn btn-ghost no-underline">
            <AppIcon name="telegram" :size="18" /> {{ CONTACT_LABEL }}
          </a>
        </div>
        <ul class="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-fg-muted">
          <li class="flex items-center gap-2"><AppIcon name="sparkle" :size="14" class="text-link" /> Всё делается вручную</li>
          <li class="flex items-center gap-2"><AppIcon name="sparkle" :size="14" class="text-link" /> В наличии и под заказ</li>
          <li class="flex items-center gap-2"><AppIcon name="sparkle" :size="14" class="text-link" /> Заказ через Telegram</li>
        </ul>
      </div>

      <div
        v-if="heroItems.length === 3"
        class="relative mx-auto grid aspect-[11/10] w-full max-w-xl grid-cols-[1.1fr_1fr] grid-rows-2 gap-4"
      >
        <AppIcon name="sparkle" :size="44" class="pointer-events-none absolute -left-3 top-8 z-10 text-gold" />
        <AppIcon name="sparkle" :size="26" class="pointer-events-none absolute -right-1 bottom-24 z-10 text-gold" />
        <NuxtLink
          v-for="(item, i) in heroItems" :key="item.product.slug"
          :to="`/product/${item.product.slug}`"
          :aria-label="`Открыть: ${item.product.title}`"
          class="group min-h-0 overflow-hidden bg-raised shadow-soft no-underline"
          :class="i === 0 ? 'row-span-2 rounded-t-[999px] rounded-b-card' : 'rounded-card'"
          :data-testid="`hero-item-${i}`"
        >
          <AppImage
            :src="item.image.src" :alt="item.image.alt" :width="item.image.width" :height="item.image.height"
            :sizes="i === 0 ? '(min-width: 1024px) 30vw, 52vw' : '(min-width: 1024px) 24vw, 44vw'" :priority="i === 0"
            img-class="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
          />
        </NuxtLink>
      </div>
    </section>

    <div v-if="failed" class="container-page py-10">
      <ErrorState title="Каталог не загрузился" @retry="retry" />
    </div>

    <template v-else>
      <!-- Категории: отдельная кремовая полоса на всю ширину -->
      <div class="border-y border-line bg-raised/60">
      <section class="container-page py-14 lg:py-20" aria-labelledby="home-categories">
        <SectionHead id="home-categories" eyebrow="Категории" title="Что здесь можно выбрать" to="/catalog" link-label="Весь каталог" />
        <ul class="mt-8 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-5">
          <li v-for="(c, i) in categories" :key="c.id" :class="i % 2 ? 'md:mt-10' : ''">
            <NuxtLink :to="`/catalog/${c.slug}`" class="group block no-underline">
              <div class="overflow-hidden rounded-card bg-raised shadow-soft">
                <AppImage
                  v-if="c.cover" :src="c.cover.src" :alt="c.cover.alt" :width="c.cover.width" :height="c.cover.height"
                  sizes="(min-width: 768px) 18vw, 46vw" img-class="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none"
                />
              </div>
              <h3 class="mt-3 font-display text-xl group-hover:text-link">{{ c.title }}</h3>
              <p class="text-sm text-fg-muted">{{ c.count }} {{ pluralRu(c.count, ['изделие', 'изделия', 'изделий']) }}</p>
            </NuxtLink>
          </li>
        </ul>
      </section>
      </div>

      <!-- Новинки: на светлом фоне страницы, с крупным заголовком -->
      <section class="container-page py-14 lg:py-20" aria-labelledby="home-new">
        <SectionHead id="home-new" eyebrow="Новинки" title="Новые изделия" to="/catalog" />
        <div class="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
          <ProductCard v-for="p in latest?.items" :key="p.id" :product="p" :labels="latest?.labels" />
        </div>
      </section>
    </template>

    <!-- Как купить -->
    <section class="container-page py-14 lg:py-20" aria-labelledby="home-how">
      <SectionHead id="home-how" eyebrow="Как купить" title="Три простых шага" />
      <ol class="mt-8 grid gap-5 md:grid-cols-3">
        <li v-for="s in steps" :key="s.n" class="rounded-card border border-line bg-surface p-7">
          <span class="font-display text-4xl italic text-gold">{{ s.n }}</span>
          <h3 class="mt-3 text-2xl">{{ s.title }}</h3>
          <p class="mt-2 leading-relaxed text-fg-muted">{{ s.text }}</p>
        </li>
      </ol>
    </section>

    <!-- Помощь с выбором -->
    <section class="container-page py-4 lg:py-8" aria-labelledby="home-help">
      <SectionHead id="home-help" eyebrow="Помощь" title="Если нужно разобраться" />
      <ul class="mt-8 grid gap-5 md:grid-cols-3">
        <li v-for="h in help" :key="h.to">
          <NuxtLink :to="h.to" class="group block h-full rounded-card border border-line bg-surface p-7 no-underline transition-colors hover:bg-raised" :data-testid="`home-help-${h.to.split('/').pop()}`">
            <h3 class="flex items-center justify-between gap-3 font-display text-2xl group-hover:text-link">{{ h.title }} <AppIcon name="arrow-right" :size="18" /></h3>
            <p class="mt-2 leading-relaxed text-fg-muted">{{ h.text }}</p>
          </NuxtLink>
        </li>
      </ul>
      <AskBanner class="mt-10" title="Остались вопросы?" />
    </section>
  </div>
</template>
