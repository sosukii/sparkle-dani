<script setup lang="ts">
/**
 * Адаптивная картинка: AVIF → WebP → JPEG, явный srcset, width/height против сдвигов вёрстки.
 * Варианты нескольких ширин готовит `scripts/optimize-images.mjs` (public/images → public/_img),
 * поэтому компонент работает и на статическом хостинге без сервера обработки картинок.
 * `sizes` — обычный CSS-атрибут sizes, например "(min-width: 1024px) 22vw, 46vw".
 */
const props = withDefaults(defineProps<{
  src: string
  alt: string
  width: number
  height: number
  sizes: string
  /** true — главная картинка первого экрана (LCP): без lazy, с приоритетом и preload. */
  priority?: boolean
  imgClass?: string
}>(), { priority: false, imgClass: '' })

const WIDTHS = [360, 640, 960, 1200]
const base = useRuntimeConfig().app.baseURL.replace(/\/$/, '')

const match = computed(() => props.src.match(/^\/images\/(.+)\.(?:jpe?g|png)$/i))
// Ширины должны совпадать с теми, что делает scripts/optimize-images.mjs.
const widths = computed(() => [...new Set(WIDTHS.filter((w) => w < props.width).concat(Math.min(props.width, WIDTHS.at(-1)!)))])

const url = (width: number, format: 'avif' | 'webp' | 'jpg') => `${base}/_img/${match.value![1]}-w${width}.${format}`
const srcset = (format: 'avif' | 'webp' | 'jpg') => widths.value.map((w) => `${url(w, format)} ${w}w`).join(', ')
const fallback = computed(() => (match.value ? url(widths.value.find((w) => w >= 640) ?? widths.value.at(-1)!, 'jpg') : `${base}${props.src}`))

if (props.priority && match.value) {
  useHead({
    link: [{
      rel: 'preload',
      as: 'image',
      type: 'image/avif',
      imagesrcset: srcset('avif'),
      imagesizes: props.sizes,
      fetchpriority: 'high',
    }],
  })
}
</script>

<template>
  <picture v-if="match">
    <source type="image/avif" :srcset="srcset('avif')" :sizes="sizes">
    <source type="image/webp" :srcset="srcset('webp')" :sizes="sizes">
    <img
      :src="fallback"
      :srcset="srcset('jpg')"
      :sizes="sizes"
      :alt="alt"
      :width="width"
      :height="height"
      :class="imgClass"
      :loading="priority ? 'eager' : 'lazy'"
      :decoding="priority ? 'sync' : 'async'"
      :fetchpriority="priority ? 'high' : undefined"
    >
  </picture>
  <img
    v-else
    :src="fallback" :alt="alt" :width="width" :height="height" :class="imgClass"
    :loading="priority ? 'eager' : 'lazy'"
  >
</template>
