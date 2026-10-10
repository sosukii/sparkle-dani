<script setup lang="ts">
import { formatLeadTime, formatPrice } from '#shared/utils/format'
import type { Product } from '#shared/types/product'

defineProps<{ product: Product, priority?: boolean }>()
</script>

<template>
  <article class="group relative flex flex-col" data-testid="product-card">
    <div class="relative overflow-hidden rounded-card bg-cream shadow-soft">
      <AppImage
        :src="product.images[0]!.src"
        :alt="product.images[0]!.alt"
        :width="product.images[0]!.width"
        :height="product.images[0]!.height"
        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
        :priority="priority"
        img-class="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
      />
    </div>
    <div class="mt-3 flex flex-1 flex-col gap-1.5 px-1">
      <h3 class="font-display text-lg leading-tight">
        <NuxtLink
          :to="`/product/${product.slug}`"
          class="no-underline after:absolute after:inset-0 after:content-[''] hover:text-berry"
        >
          {{ product.title }}
        </NuxtLink>
      </h3>
      <p class="text-base font-bold">{{ formatPrice(product.price) }}</p>
      <p class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <AvailabilityBadge :availability="product.availability" />
        <span v-if="product.availability === 'made_to_order' && product.leadTimeDays" class="text-xs font-semibold text-ink-soft">
          {{ formatLeadTime(product.leadTimeDays) }}
        </span>
      </p>
    </div>
  </article>
</template>
