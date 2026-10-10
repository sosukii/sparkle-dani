<script setup lang="ts">
/**
 * Адаптивная картинка: AVIF → WebP → JPEG, явный srcset под ширину экрана,
 * width/height против сдвигов вёрстки. Качество фиксировано (82), чтобы не терять чёткость.
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

const QUALITY = 82
const WIDTHS = [240, 360, 480, 640, 800, 1000, 1200]

const img = useImage()
const widths = computed(() => {
  const list = WIDTHS.filter((w) => w < props.width)
  return [...list, props.width]
})
const url = (width: number, format: string) => img(props.src, { width, format, quality: QUALITY })
const srcset = (format: string) => widths.value.map((w) => `${url(w, format)} ${w}w`).join(', ')
const fallback = computed(() => url(Math.min(800, props.width), 'jpeg'))

if (props.priority) {
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
  <picture>
    <source type="image/avif" :srcset="srcset('avif')" :sizes="sizes">
    <source type="image/webp" :srcset="srcset('webp')" :sizes="sizes">
    <img
      :src="fallback"
      :srcset="srcset('jpeg')"
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
</template>
