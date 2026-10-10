<script setup lang="ts">
import { SITE_NAME } from '#shared/utils/site'
import manropeCyrillic from '@fontsource-variable/manrope/files/manrope-cyrillic-wght-normal.woff2?url'
import manropeLatin from '@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2?url'
import playfairCyrillic from '@fontsource-variable/playfair-display/files/playfair-display-cyrillic-wght-normal.woff2?url'
import playfairCyrillicItalic from '@fontsource-variable/playfair-display/files/playfair-display-cyrillic-wght-italic.woff2?url'
import playfairLatin from '@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2?url'

// Шрифты первого экрана грузим сразу, параллельно с CSS: без этого заголовок «прыгает» при подмене шрифта.
const criticalFonts = [manropeCyrillic, manropeLatin, playfairCyrillic, playfairCyrillicItalic, playfairLatin]

useHead({
  link: criticalFonts.map((href) => ({ rel: 'preload', as: 'font', type: 'font/woff2', href, crossorigin: 'anonymous' })),
  titleTemplate: (title) => (title && title !== SITE_NAME ? `${title} — ${SITE_NAME}` : SITE_NAME),
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
