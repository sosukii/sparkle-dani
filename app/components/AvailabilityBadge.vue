<script setup lang="ts">
import { formatLeadTime } from '#shared/utils/format'
import type { Availability } from '#shared/types/product'

/** Плашка статуса. `leadTime` — компактный вариант для карточек: «Под заказ · 7–12 дней» в одной строке. */
defineProps<{ availability: Availability | null, leadTime?: { min: number, max: number } }>()
</script>

<template>
  <span
    data-testid="availability-badge"
    class="inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-md border border-line bg-surface px-2.5 py-1 text-xs font-medium leading-4 text-fg"
  >
    <span class="size-1.5 shrink-0 rounded-full" :class="availability === 'in_stock' ? 'bg-olive' : availability === 'made_to_order' ? 'bg-gold' : 'bg-line-strong'" aria-hidden="true" />
    <span class="truncate">
      <template v-if="availability === null">Наличие уточняйте у Дани</template>
      <template v-else>{{ availability === 'in_stock' ? 'В наличии' : 'Под заказ' }}</template><template v-if="availability === 'made_to_order' && leadTime"> · {{ formatLeadTime(leadTime) }}</template>
    </span>
  </span>
</template>
