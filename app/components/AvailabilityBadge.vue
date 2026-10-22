<script setup lang="ts">
import { formatLeadTime } from '#shared/utils/format'
import type { Availability } from '#shared/types/product'

/** Плашка статуса. `leadTime` — компактный вариант для карточек: «Под заказ · 7–12 дней» в одной строке. */
defineProps<{ availability: Availability, leadTime?: { min: number, max: number } }>()
</script>

<template>
  <span
    data-testid="availability-badge"
    class="inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-md border border-line bg-surface px-2.5 py-1 text-xs font-medium leading-4 text-fg"
  >
    <span class="size-1.5 shrink-0 rounded-full" :class="availability === 'in_stock' ? 'bg-olive' : 'bg-gold'" aria-hidden="true" />
    <span class="truncate">
      {{ availability === 'in_stock' ? 'В наличии' : 'Под заказ' }}<template v-if="availability === 'made_to_order' && leadTime"> · {{ formatLeadTime(leadTime) }}</template>
    </span>
  </span>
</template>
