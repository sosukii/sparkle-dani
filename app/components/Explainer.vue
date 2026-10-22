<script setup lang="ts">
/** Короткое пояснение рядом с характеристикой. Нативный <details>: работает с клавиатуры и озвучивается скринридером. */
defineProps<{ label: string }>()
</script>

<template>
  <details class="explainer mt-2 rounded-md border border-line bg-raised/60 text-sm" data-testid="explainer">
    <summary class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 font-semibold text-link">
      <span>{{ label }}</span>
      <AppIcon name="chevron-down" :size="16" class="explainer-chevron" />
    </summary>
    <div class="space-y-2 border-t border-line px-3 py-3 leading-relaxed text-fg-muted">
      <slot />
    </div>
  </details>
</template>

<style scoped>
.explainer[open] .explainer-chevron { transform: rotate(180deg); }
summary::-webkit-details-marker { display: none; }
</style>
