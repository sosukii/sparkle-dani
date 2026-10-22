<script setup lang="ts">
import type { ProductImage } from '#shared/types/product'

const props = defineProps<{ images: ProductImage[] }>()
const index = ref(0)
watch(() => props.images, () => { index.value = 0 })
const current = computed(() => props.images[index.value] ?? props.images[0]!)
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-[5rem_1fr] sm:gap-4">
    <ul v-if="images.length > 1" class="order-2 flex gap-3 sm:order-1 sm:flex-col" aria-label="Фотографии товара">
      <li v-for="(img, i) in images" :key="img.src">
        <button
          type="button"
          class="block size-16 overflow-hidden rounded-2xl border-2 bg-raised transition-colors sm:size-20"
          :class="i === index ? 'border-line-strong' : 'border-transparent hover:border-line'"
          :aria-pressed="i === index"
          :aria-label="`Показать фото ${i + 1} из ${images.length}`"
          :data-testid="`thumb-${i}`"
          @click="index = i"
        >
          <AppImage :src="img.src" :alt="img.alt" :width="img.width" :height="img.height" sizes="80px" img-class="size-full object-cover" />
        </button>
      </li>
    </ul>
    <div class="order-1 sm:order-2">
    <div class="grid overflow-hidden rounded-[1.75rem] bg-raised shadow-soft">
      <Transition name="fade">
        <AppImage
          :key="current.src"
          :src="current.src" :alt="current.alt" :width="current.width" :height="current.height"
          sizes="(min-width: 1024px) 42vw, 100vw" priority img-class="aspect-[4/5] max-h-[50dvh] sm:max-h-[62dvh] w-full object-cover [grid-area:1/1] lg:max-h-none" data-testid="gallery-main"
        />
      </Transition>
    </div>
    <p v-if="current.placeholder" class="mt-2 text-xs text-fg-muted" data-testid="gallery-placeholder">
      Временная картинка: фотографии этого изделия будут добавлены.
    </p>
    <p v-else-if="images.length > 1" class="mt-2 text-xs text-fg-muted" aria-live="polite">
      Фото {{ index + 1 }} из {{ images.length }}<template v-if="current.kind === 'detail'">: деталь вязки</template><template v-else-if="current.kind === 'on-model'">: на модели</template>
    </p>
    </div>
  </div>
</template>
