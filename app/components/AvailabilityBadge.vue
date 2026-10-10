<script setup lang="ts">
import type { Availability } from '#shared/types/product'

defineProps<{ availability: Availability, stock?: number }>()
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
    :class="availability === 'in_stock' ? 'bg-mint-soft text-[#14543f]' : 'bg-lilac-soft text-[#4b2e86]'"
  >
    <span class="size-1.5 rounded-full" :class="availability === 'in_stock' ? 'bg-[#1f8a64]' : 'bg-lilac'" aria-hidden="true" />
    {{ availability === 'in_stock' ? 'В наличии' : 'Под заказ' }}
  </span>
</template>
