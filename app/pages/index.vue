<script setup lang="ts">
import { CONTACT_LABEL, OWNER_NAME, SITE_NAME, TELEGRAM_URL } from '#shared/utils/site'
import { pluralRu } from '#shared/utils/format'
import type { CatalogResult } from '#shared/types/catalog'

const [categoriesReq, latestReq] = await Promise.all([
  useFetch('/api/categories', { key: 'categories' }),
  useFetch<CatalogResult>('/api/products', { key: 'home-latest', query: { pageSize: 8 } }),
])
const categories = categoriesReq.data
const latest = latestReq.data
const failed = computed(() => categoriesReq.error.value || latestReq.error.value)
const retry = () => Promise.all([categoriesReq.refresh(), latestReq.refresh()])

const heroImages = computed(() => (categories.value ?? []).map((c) => c.cover).filter((c) => !!c).slice(0, 3))
const fandoms = computed(() => latest.value?.facets.fandom ?? [])

usePageSeo({
  title: 'Вязаные игрушки, шарфы и украшения ручной работы',
  description: `${SITE_NAME} — интернет-магазин изделий ручной работы: вязаные игрушки, тёплые вещи, украшения и вещи для дома. Мастер — ${OWNER_NAME}.`,
  canonicalPath: '/',
})
useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: useRuntimeConfig().public.siteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${useRuntimeConfig().public.siteUrl}/catalog?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    }),
  }],
})

const steps = [
  { n: '01', title: 'Выберите изделие', text: 'Листайте каталог, фильтруйте по фандому, цвету и цене. Есть вещи в наличии и под заказ.' },
  { n: '02', title: 'Соберите корзину', text: 'Добавьте всё, что понравилось. Корзина сохранится, даже если вы закроете сайт.' },
  { n: '03', title: `Напишите ${OWNER_NAME}`, text: 'Состав заказа можно скопировать одним нажатием и отправить в Telegram — дальше договоритесь о деталях.' },
]
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="container-page grid items-center gap-10 py-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-20">
      <div>
        <p class="eyebrow">Handmade · ручная работа</p>
        <h1 class="mt-5 text-[2.75rem] sm:text-6xl lg:text-7xl">
          Вязаные друзья и <span class="em-accent">тёплые мелочи</span> для вашего мира
        </h1>
        <p class="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
          Игрушки-амигуруми, шарфы, украшения и вещи для дома по мотивам любимых историй. Каждое изделие связано вручную — {{ OWNER_NAME }} вкладывает в него настроение.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <NuxtLink to="/catalog" class="btn btn-primary px-7 no-underline">Смотреть каталог <AppIcon name="arrow-right" :size="18" /></NuxtLink>
          <a :href="TELEGRAM_URL" target="_blank" rel="noopener noreferrer" class="btn btn-ghost no-underline">
            <AppIcon name="telegram" :size="18" /> {{ CONTACT_LABEL }}
          </a>
        </div>
        <ul class="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-ink-soft">
          <li class="flex items-center gap-2"><AppIcon name="sparkle" :size="14" class="text-berry" /> Всё делается вручную</li>
          <li class="flex items-center gap-2"><AppIcon name="sparkle" :size="14" class="text-berry" /> В наличии и под заказ</li>
          <li class="flex items-center gap-2"><AppIcon name="sparkle" :size="14" class="text-berry" /> Заказ через Telegram</li>
        </ul>
      </div>

      <div
        v-if="heroImages.length === 3"
        class="relative mx-auto grid aspect-[11/10] w-full max-w-xl grid-cols-[1.1fr_1fr] grid-rows-2 gap-4"
      >
        <AppIcon name="sparkle" :size="44" class="absolute -left-3 top-8 z-10 text-rose" />
        <AppIcon name="sparkle" :size="26" class="absolute -right-1 bottom-24 z-10 text-lilac" />
        <div class="row-span-2 min-h-0 overflow-hidden rounded-t-[999px] rounded-b-card bg-cream shadow-soft">
          <AppImage
            :src="heroImages[0]!.src" :alt="heroImages[0]!.alt" :width="heroImages[0]!.width" :height="heroImages[0]!.height"
            sizes="(min-width: 1024px) 30vw, 52vw" priority img-class="size-full object-cover"
          />
        </div>
        <div class="min-h-0 overflow-hidden rounded-card bg-cream shadow-soft">
          <AppImage
            :src="heroImages[1]!.src" :alt="heroImages[1]!.alt" :width="heroImages[1]!.width" :height="heroImages[1]!.height"
            sizes="(min-width: 1024px) 24vw, 44vw" img-class="size-full object-cover"
          />
        </div>
        <div class="min-h-0 overflow-hidden rounded-card bg-cream shadow-soft">
          <AppImage
            :src="heroImages[2]!.src" :alt="heroImages[2]!.alt" :width="heroImages[2]!.width" :height="heroImages[2]!.height"
            sizes="(min-width: 1024px) 24vw, 44vw" img-class="size-full object-cover"
          />
        </div>
      </div>
    </section>

    <div v-if="failed" class="container-page py-10">
      <ErrorState title="Каталог не загрузился" @retry="retry" />
    </div>

    <template v-else>
      <!-- Категории -->
      <section class="container-page py-14 lg:py-20" aria-labelledby="home-categories">
        <SectionHead id="home-categories" eyebrow="Категории" title="Выберите настроение" to="/catalog" link-label="Весь каталог" />
        <ul class="mt-8 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-5">
          <li v-for="(c, i) in categories" :key="c.id" :class="i % 2 ? 'md:mt-10' : ''">
            <NuxtLink :to="`/catalog/${c.slug}`" class="group block no-underline">
              <div class="overflow-hidden rounded-card bg-cream shadow-soft">
                <AppImage
                  v-if="c.cover" :src="c.cover.src" :alt="c.cover.alt" :width="c.cover.width" :height="c.cover.height"
                  sizes="(min-width: 768px) 18vw, 46vw" img-class="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none"
                />
              </div>
              <h3 class="mt-3 font-display text-xl group-hover:text-berry">{{ c.title }}</h3>
              <p class="text-sm text-ink-soft">{{ c.count }} {{ pluralRu(c.count, ['изделие', 'изделия', 'изделий']) }}</p>
            </NuxtLink>
          </li>
        </ul>
      </section>

      <!-- Новинки -->
      <section class="container-page py-8 lg:py-14" aria-labelledby="home-new">
        <SectionHead id="home-new" eyebrow="Новинки" title="Только что связано" to="/catalog" />
        <div class="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
          <ProductCard v-for="p in latest?.items" :key="p.id" :product="p" />
        </div>
      </section>

      <!-- Фандомы -->
      <section v-if="fandoms.length" class="container-page py-14" aria-labelledby="home-fandoms">
        <div class="rounded-[2rem] bg-lilac-soft px-6 py-12 text-center sm:px-12">
          <p class="eyebrow">Фандомы</p>
          <h2 id="home-fandoms" class="mt-2 text-3xl sm:text-4xl">Найдите свой <span class="em-accent">любимый мир</span></h2>
          <ul class="mt-8 flex flex-wrap justify-center gap-3">
            <li v-for="f in fandoms" :key="f.id">
              <NuxtLink :to="{ path: '/catalog', query: { fandom: f.id } }" class="chip no-underline">
                <AppIcon name="sparkle" :size="12" class="text-berry" /> {{ f.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </section>
    </template>

    <!-- Как это работает -->
    <section class="container-page py-14 lg:py-20" aria-labelledby="home-how">
      <SectionHead id="home-how" eyebrow="Как купить" title="Три простых шага" />
      <ol class="mt-8 grid gap-5 md:grid-cols-3">
        <li v-for="s in steps" :key="s.n" class="rounded-card border border-line bg-white p-7">
          <span class="font-display text-4xl italic text-rose-deep">{{ s.n }}</span>
          <h3 class="mt-3 text-2xl">{{ s.title }}</h3>
          <p class="mt-2 leading-relaxed text-ink-soft">{{ s.text }}</p>
        </li>
      </ol>
    </section>

    <!-- О мастере -->
    <section class="container-page py-8 lg:py-14" aria-labelledby="home-about">
      <div class="grid items-stretch overflow-hidden rounded-[2rem] bg-rose-soft md:grid-cols-2">
        <div class="p-8 sm:p-12">
          <p class="eyebrow">Обо мне</p>
          <h2 id="home-about" class="mt-2 text-3xl sm:text-4xl">Привет, я <span class="em-accent">{{ OWNER_NAME }}</span></h2>
          <p class="mt-4 leading-relaxed text-ink-soft">Вяжу маленькие радости и очень люблю, когда они находят своего человека. Расскажу, как рождаются мои изделия.</p>
          <NuxtLink to="/about" class="btn btn-primary mt-6 no-underline">Познакомиться <AppIcon name="arrow-right" :size="18" /></NuxtLink>
        </div>
        <div class="relative min-h-72 md:min-h-[24rem]">
          <AppImage
            src="/images/about/workspace.jpg" alt="Рабочий стол мастера: клубки пряжи и вязаный зайчик (демо-иллюстрация)"
            :width="1200" :height="900" sizes="(min-width: 768px) 45vw, 100vw" img-class="absolute inset-0 size-full object-cover"
          />
        </div>
      </div>
    </section>
  </div>
</template>
