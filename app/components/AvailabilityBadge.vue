<script setup lang="ts">
import { formatLeadTime } from '#shared/utils/format'
import type { Availability } from '#shared/types/product'

/** Плашка статуса. `leadTime` — компактный вариант для карточек: «Под заказ · 7–12 дней» в одной строке. */
defineProps<{ availability: Availability, leadTime?: { min: number, max: number } }>()
</script>

<template>
  <span
    data-testid="availability-badge"
    class="inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold leading-4"
    :class="availability === 'in_stock' ? 'bg-mint-soft text-[#14543f]' : 'bg-lilac-soft text-[#4b2e86]'"
  >
    <span class="size-1.5 shrink-0 rounded-full" :class="availability === 'in_stock' ? 'bg-[#1f8a64]' : 'bg-lilac'" aria-hidden="true" />
    <span class="truncate">
      {{ availability === 'in_stock' ? 'В наличии' : 'Под заказ' }}<template v-if="availability === 'made_to_order' && leadTime"> · {{ formatLeadTime(leadTime) }}</template>
    </span>
  </span>
</template>
