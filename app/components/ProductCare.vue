<script setup lang="ts">
import type { CareItem } from '#shared/types/product'
import { OWNER_NAME } from '#shared/utils/site'

defineProps<{ care: CareItem[] | null, slug: string }>()
const emit = defineEmits<{ ask: [topic: string] }>()
</script>

<template>
  <section aria-labelledby="product-care" data-testid="product-care">
    <h2 id="product-care" class="text-2xl">Уход</h2>
    <ul v-if="care" class="mt-4 space-y-3 rounded-card border border-line bg-surface p-5 text-sm">
      <li v-for="item in care" :key="item.id">
        <p class="font-semibold">{{ item.label }}</p>
        <p class="mt-0.5 text-fg-muted">{{ item.text }}</p>
      </li>
    </ul>
    <p v-else class="mt-4 text-sm text-fg-muted" data-testid="care-unknown">
      Рекомендации по уходу для этого изделия пока не указаны.
      <button type="button" class="font-semibold text-link underline underline-offset-4" @click="emit('ask', 'как ухаживать за изделием')">Спросить {{ OWNER_NAME }}</button>
    </p>
    <p class="mt-3 text-sm">
      <NuxtLink :to="{ path: '/info/materials', query: { from: slug }, hash: '#care' }" class="font-semibold text-link underline underline-offset-4">Подробнее об уходе</NuxtLink>
    </p>
  </section>
</template>
