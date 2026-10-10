<script setup lang="ts">
const route = useRoute()
const slug = computed(() => String(route.params.category))

const { data: categories } = await useFetch('/api/categories', { key: 'categories' })
if (!categories.value?.some((c) => c.slug === slug.value)) {
  throw createError({ statusCode: 404, statusMessage: 'Категория не найдена', fatal: true })
}
</script>

<template>
  <CatalogView :category="slug" />
</template>
