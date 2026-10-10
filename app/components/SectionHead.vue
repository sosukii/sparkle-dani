<script setup lang="ts">
defineProps<{ eyebrow?: string, title: string, to?: string, linkLabel?: string }>()
</script>

<template>
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div>
      <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
      <h2 class="mt-2 text-3xl sm:text-4xl lg:text-[2.75rem]"><slot>{{ title }}</slot></h2>
    </div>
    <NuxtLink v-if="to" :to="to" class="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold no-underline hover:text-berry">
      {{ linkLabel ?? 'Смотреть все' }} <AppIcon name="arrow-right" :size="16" />
    </NuxtLink>
  </div>
</template>
