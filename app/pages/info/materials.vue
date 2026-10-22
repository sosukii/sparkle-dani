<script setup lang="ts">
import { OWNER_NAME } from '#shared/utils/site'
import { buildBreadcrumbJsonLd } from '#shared/utils/seo'

usePageSeo({
  title: 'Материалы и уход',
  description: 'Что означают материалы в составе изделий и как за ними ухаживать. Общие сведения; детали конкретного изделия уточняйте у Дани.',
  canonicalPath: '/info/materials',
})
const siteUrl = useSiteUrl()
useJsonLd(() => buildBreadcrumbJsonLd([{ name: 'Главная', path: '/' }, { name: 'Материалы и уход', path: '/info/materials' }], siteUrl))

const { data } = await useAsyncData('info-materials', async () => {
  const catalog = await loadCatalog()
  return { materials: catalog.materials, care: catalog.care }
})
</script>

<template>
  <div class="container-page py-8 lg:py-12">
    <BackToProduct />
    <h1 class="mt-4 text-4xl sm:text-5xl lg:text-6xl">Материалы и уход</h1>
    <p class="mt-4 max-w-2xl text-lg text-fg-muted">
      Здесь общие сведения о материалах, которые встречаются в составах. Это справка, а не обещание про конкретное изделие: итог зависит от пряжи, плотности вязки и кроя.
    </p>

    <section class="mt-12" aria-labelledby="not-from-composition">
      <h2 id="not-from-composition" class="text-3xl">Чего по составу сказать нельзя</h2>
      <ul class="mt-4 max-w-2xl list-disc space-y-2 pl-5 text-fg-muted">
        <li>при какой температуре изделие будет комфортным;</li>
        <li>будет ли оно колоться на вашей коже;</li>
        <li>будет ли оно давать катышки и как долго прослужит;</li>
        <li>подойдёт ли оно для любой погоды.</li>
      </ul>
      <p class="mt-4 max-w-2xl text-fg-muted">Если что-то из этого важно, спросите {{ OWNER_NAME }} про конкретное изделие.</p>
    </section>

    <section class="mt-12" aria-labelledby="materials-title">
      <h2 id="materials-title" class="text-3xl">Материалы</h2>
      <dl class="mt-6 grid gap-4 md:grid-cols-2" data-testid="materials-list">
        <div v-for="m in data?.materials" :id="m.id" :key="m.id" class="rounded-card border border-line bg-surface p-6">
          <dt class="font-display text-2xl">{{ m.title }}</dt>
          <dd class="mt-2 leading-relaxed text-fg-muted">{{ m.summary }}</dd>
        </div>
      </dl>
    </section>

    <section id="care" class="mt-12 scroll-mt-24" aria-labelledby="care-title">
      <h2 id="care-title" class="text-3xl">Как ухаживать</h2>
      <p class="mt-3 max-w-2xl text-fg-muted">Общие рекомендации для вязаных изделий. У конкретного изделия могут быть свои, они указаны на его странице.</p>
      <ul class="mt-6 grid gap-4 md:grid-cols-2" data-testid="care-list">
        <li v-for="c in data?.care" :key="c.id" class="rounded-card border border-line bg-surface p-6">
          <p class="font-semibold">{{ c.label }}</p>
          <p class="mt-2 leading-relaxed text-fg-muted">{{ c.text }}</p>
        </li>
      </ul>
    </section>

    <AskBanner class="mt-16" title="Остались вопросы про материал?" />
  </div>
</template>
