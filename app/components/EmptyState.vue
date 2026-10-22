<script setup lang="ts">
defineProps<{ title: string, text?: string }>()
</script>

<template>
  <div class="grid place-items-center rounded-card border border-dashed border-line bg-surface/60 px-6 py-16 text-center" data-testid="empty-state">
    <AppIcon name="sparkle" :size="32" class="text-gold" />
    <h2 class="mt-4 text-2xl">{{ title }}</h2>
    <p v-if="text" class="mt-2 max-w-md text-fg-muted">{{ text }}</p>
    <div class="mt-6 flex flex-wrap justify-center gap-3">
      <slot />
    </div>
  </div>
</template>
