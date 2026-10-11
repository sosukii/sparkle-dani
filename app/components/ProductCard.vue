<script setup lang="ts">
import { formatPrice } from '#shared/utils/format'
import type { Product } from '#shared/types/product'

defineProps<{ product: Product, priority?: boolean }>()
</script>

<template>
  <!-- Карточки в ряду одной высоты: название всегда занимает 2 строки, цена под ним, статус прижат к низу. -->
  <article class="group relative flex h-full flex-col" data-testid="product-card">
    <div class="relative overflow-hidden rounded-card bg-cream shadow-soft">
      <AppImage
        :src="product.images[0]!.src"
        :alt="product.images[0]!.alt"
        :width="product.images[0]!.width"
        :height="product.images[0]!.height"
        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
        :priority="priority"
        img-class="aspect-[4/5] w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
      />
    </div>
    <div class="mt-3 flex flex-1 flex-col px-1">
      <h3 class="line-clamp-2 min-h-[2.5em] hyphens-auto break-words font-display text-lg leading-tight">
        <NuxtLink
          :to="`/product/${product.slug}`"
          class="no-underline after:absolute after:inset-0 after:content-[''] hover:text-berry"
        >
          {{ product.title }}
        </NuxtLink>
      </h3>
      <p class="mt-1.5 text-base font-bold">{{ formatPrice(product.price) }}</p>
      <p class="mt-auto min-w-0 pt-2.5">
        <AvailabilityBadge :availability="product.availability" :lead-time="product.leadTimeDays" />
      </p>
    </div>
  </article>
</template>
