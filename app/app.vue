<script setup lang="ts">
import { SITE_NAME } from '#shared/utils/site'

useHead({
  titleTemplate: (title) => (title && title !== SITE_NAME ? `${title} — ${SITE_NAME}` : SITE_NAME),
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
