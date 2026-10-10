<script setup lang="ts">
import { DEMO_MODE } from '#shared/utils/site'
</script>

<template>
  <div v-if="DEMO_MODE" class="bg-ink text-paper" role="note">
    <p class="container-page py-2 text-center text-xs font-semibold">
      <AppIcon name="sparkle" :size="12" class="mr-1 inline text-rose" />
      Демо-версия: товары, фото и тексты — примеры. Настоящие изделия Мари появятся здесь позже.
    </p>
  </div>
</template>
