<script setup lang="ts">
/** «Вернуться к изделию»: на информационную страницу покупатель пришёл с карточки товара (?from=slug), и путь обратно сохраняется. */
// Query применяется после гидратации (на статике HTML собран без него), чтобы разметка совпала.
const query = useAppliedQuery()
const slug = computed(() => (typeof query.value.from === 'string' ? query.value.from : ''))
const { data } = await useAsyncData(
  () => `back:${slug.value}`,
  async () => {
    if (!slug.value) return null
    const product = (await loadCatalog()).products.find((p) => p.slug === slug.value)
    return product ? { slug: product.slug, title: product.title } : null
  },
  { watch: [slug] },
)
</script>

<template>
  <NuxtLink v-if="data" :to="`/product/${data.slug}`" class="inline-flex min-h-11 items-center gap-2 text-sm font-semibold no-underline hover:text-link" data-testid="back-to-product">
    <AppIcon name="arrow-left" :size="16" /> Вернуться к изделию «{{ data.title }}»
  </NuxtLink>
</template>
