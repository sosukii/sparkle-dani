<script setup lang="ts">
import { DEMO_MODE, OWNER_NAME } from '#shared/utils/site'
</script>

<template>
  <p v-if="DEMO_MODE" class="inline-flex items-center gap-2 rounded-full bg-butter px-4 py-2 text-xs font-bold text-[#6b4e00]">
    <AppIcon name="sparkle" :size="14" />
    <slot>Текст-пример: {{ OWNER_NAME }} заменит его на свой</slot>
  </p>
</template>
