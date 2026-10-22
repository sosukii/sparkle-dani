<script setup lang="ts">
import { SITE_NAME } from '#shared/utils/site'
import interCyrillic from '~/assets/fonts/inter-cyrillic.woff2?url'
import interLatin from '~/assets/fonts/inter-latin.woff2?url'
import bodoniLatin from '~/assets/fonts/bodoni-latin.woff2?url'
import playfairCyrillic from '~/assets/fonts/playfair-cyrillic.woff2?url'
import playfairCyrillicItalic from '~/assets/fonts/playfair-cyrillic-italic.woff2?url'
import playfairLatin from '~/assets/fonts/playfair-latin.woff2?url'

// Шрифты первого экрана грузим сразу, параллельно с CSS: без этого заголовок «прыгает» при подмене шрифта.
const criticalFonts = [interCyrillic, interLatin, bodoniLatin, playfairCyrillic, playfairCyrillicItalic, playfairLatin]

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
