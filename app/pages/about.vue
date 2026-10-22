<script setup lang="ts">
import { CONTACT_LABEL, OWNER_NAME, SITE_NAME, TELEGRAM_URL } from '#shared/utils/site'
import { buildBreadcrumbJsonLd } from '#shared/utils/seo'
import { pluralRu } from '#shared/utils/format'

const siteUrl = useSiteUrl()
useJsonLd(() => buildBreadcrumbJsonLd([{ name: 'Главная', path: '/' }, { name: 'О бренде', path: '/about' }], siteUrl))
usePageSeo({
  title: 'О бренде',
  description: `${SITE_NAME} — магазин авторского вязаного трикотажа ручной работы. Что здесь продаётся и как устроена покупка.`,
  canonicalPath: '/about',
})
const { data: categories } = await useCategories()

const principles = [
  { title: 'Всё описано до покупки', text: 'У изделия указаны состав, размеры, измерения и уход. Чего пока не известно, названо неизвестным, и это можно уточнить.' },
  { title: 'Без давления', text: 'Нет таймеров, «последних штук» и скидок на один день. Вы выбираете в своём темпе.' },
  { title: 'Покупка через Telegram', text: `Сайт готовит сообщение, а договариваетесь вы с ${OWNER_NAME} лично. Оплаты на сайте нет.` },
]
</script>

<template>
  <div>
    <section class="container-page py-10 lg:py-20">
      <p class="eyebrow">О бренде</p>
      <h1 class="mt-4 max-w-3xl text-5xl sm:text-6xl lg:text-7xl">{{ SITE_NAME }}: авторский <span class="em-accent">вязаный трикотаж</span></h1>
      <p class="mt-6 max-w-2xl text-lg leading-relaxed text-fg-muted">
        Изделия делаются вручную: мастер — {{ OWNER_NAME }}. Здесь можно спокойно рассмотреть вещь, понять, подходит ли она вам по размеру и материалу, и написать, если нужны подробности.
      </p>
      <div class="mt-8 flex flex-wrap gap-3">
        <NuxtLink to="/catalog" class="btn btn-primary px-7 no-underline">Смотреть каталог <AppIcon name="arrow-right" :size="18" /></NuxtLink>
        <a :href="TELEGRAM_URL" target="_blank" rel="noopener noreferrer" class="btn btn-ghost no-underline">
          <AppIcon name="telegram" :size="18" /> {{ CONTACT_LABEL }}
        </a>
      </div>
    </section>

    <section v-if="categories?.length" class="container-page py-8 lg:py-12" aria-labelledby="about-range">
      <h2 id="about-range" class="text-3xl sm:text-4xl">Что в каталоге</h2>
      <ul class="mt-6 flex flex-wrap gap-3" data-testid="about-categories">
        <li v-for="c in categories" :key="c.id">
          <NuxtLink :to="`/catalog/${c.slug}`" class="chip no-underline">{{ c.title }} · {{ c.count }} {{ pluralRu(c.count, ['изделие', 'изделия', 'изделий']) }}</NuxtLink>
        </li>
      </ul>
    </section>

    <section class="container-page py-8 lg:py-12" aria-labelledby="about-principles">
      <h2 id="about-principles" class="text-3xl sm:text-4xl">Как здесь всё устроено</h2>
      <ul class="mt-8 grid gap-5 md:grid-cols-3">
        <li v-for="p in principles" :key="p.title" class="rounded-card border border-line bg-surface p-7">
          <h3 class="font-display text-2xl">{{ p.title }}</h3>
          <p class="mt-2 leading-relaxed text-fg-muted">{{ p.text }}</p>
        </li>
      </ul>
      <p class="mt-8 text-sm"><NuxtLink to="/delivery" class="font-semibold text-link underline underline-offset-4">Как проходит покупка</NuxtLink></p>
    </section>
  </div>
</template>
