<script setup lang="ts">
import { OWNER_NAME } from '#shared/utils/site'
import { buildBreadcrumbJsonLd } from '#shared/utils/seo'

usePageSeo({
  title: 'Размеры и мерки',
  description: 'Как выбрать размер вязаного изделия: обычная и свободная посадка, как снять мерки и сравнить их с таблицей.',
  canonicalPath: '/info/sizes',
})
const siteUrl = useSiteUrl()
useJsonLd(() => buildBreadcrumbJsonLd([{ name: 'Главная', path: '/' }, { name: 'Размеры и мерки', path: '/info/sizes' }], siteUrl))

const { data } = await useAsyncData('info-sizes', async () => {
  const catalog = await loadCatalog()
  return { fits: catalog.taxonomy.fits, measures: catalog.taxonomy.measures }
})
</script>

<template>
  <div class="container-page py-8 lg:py-12">
    <BackToProduct />
    <h1 class="mt-4 text-4xl sm:text-5xl lg:text-6xl">Размеры и мерки</h1>
    <p class="mt-4 max-w-2xl text-lg text-fg-muted">
      У каждого изделия свои измерения: они указаны в таблице на его странице. Сравните их с вещью, которая сидит на вас так, как вы хотите.
    </p>

    <section class="mt-12" aria-labelledby="howto">
      <h2 id="howto" class="text-3xl">Как сравнить</h2>
      <ol class="mt-4 max-w-2xl list-decimal space-y-3 pl-5 text-fg-muted">
        <li>Возьмите вещь, которая сидит так, как вам нравится, и положите её ровно.</li>
        <li>Измерьте ширину по груди (от шва до шва под рукавами), длину от плеча до низа и длину рукава.</li>
        <li>Сравните с таблицей изделия и выберите ближайший размер.</li>
      </ol>
      <ul v-if="data?.measures.length" class="mt-6 grid max-w-2xl gap-2 text-sm text-fg-muted sm:grid-cols-2">
        <li v-for="m in data.measures" :key="m.id" class="rounded-md border border-line bg-surface px-3 py-2">{{ m.label }}</li>
      </ul>
      <p class="mt-3 text-sm text-fg-muted">Это виды измерений, которые могут быть указаны у изделий. Для каждого изделия показаны только известные.</p>
    </section>

    <section class="mt-12" aria-labelledby="fits">
      <h2 id="fits" class="text-3xl">Посадка</h2>
      <dl class="mt-6 grid gap-4 md:grid-cols-2" data-testid="fits-list">
        <div v-for="f in data?.fits" :key="f.id" class="rounded-card border border-line bg-surface p-6">
          <dt class="font-display text-2xl">{{ f.label }}</dt>
          <dd class="mt-2 leading-relaxed text-fg-muted">{{ f.hint }}</dd>
        </div>
      </dl>
    </section>

    <p class="mt-10 max-w-2xl text-fg-muted">Сомневаетесь? Напишите {{ OWNER_NAME }}: она подскажет размер по вашим меркам.</p>
    <AskBanner class="mt-6" title="Нужна помощь с размером?" />
  </div>
</template>
