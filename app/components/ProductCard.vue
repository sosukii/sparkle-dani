<script setup lang="ts">
import { maxQty, toCartLine } from '#shared/utils/cart'
import { formatPrice } from '#shared/utils/format'
import type { Product } from '#shared/types/product'

const props = defineProps<{ product: Product, priority?: boolean }>()

const cart = useCartStore()
// Корзина читается из localStorage уже после гидратации, поэтому до неё всегда показываем кнопку «В корзину».
const qty = computed(() => (cart.hydrated ? cart.quantityOf(props.product.id) : 0))
const limit = computed(() => maxQty(toCartLine(props.product)))
const soldOut = computed(() => limit.value === 0)

const add = () => cart.add(props.product, 1)
const increase = () => cart.setQty(props.product.id, qty.value + 1)
// На единице «минус» превращается в «убрать из корзины».
const decrease = () => (qty.value <= 1 ? cart.remove(props.product.id) : cart.setQty(props.product.id, qty.value - 1))
</script>

<template>
  <!-- Карточки в ряду одной высоты: название — 2 строки, цена под ним, статус и действие прижаты к низу. -->
  <article class="group relative flex h-full flex-col" data-testid="product-card">
    <div class="relative overflow-hidden rounded-card bg-raised shadow-soft">
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
          class="no-underline after:absolute after:inset-0 after:content-[''] hover:text-link"
        >
          {{ product.title }}
        </NuxtLink>
      </h3>
      <p class="mt-1.5 text-base font-bold">{{ formatPrice(product.price) }}</p>
      <p class="min-w-0 pt-2.5">
        <AvailabilityBadge :availability="product.availability" :lead-time="product.leadTimeDays" />
      </p>

      <!-- Действия поверх «растянутой» ссылки карточки (z-10), чтобы нажатия не уходили на страницу товара -->
      <div class="relative z-10 mt-auto pt-3" data-testid="card-actions">
        <p v-if="soldOut" class="grid h-10 place-items-center rounded-full bg-raised text-sm font-semibold text-fg-muted">Нет в наличии</p>
        <button
          v-else-if="qty === 0"
          type="button" class="btn btn-soft h-10 min-h-10 w-full px-4"
          :aria-label="`Добавить в корзину: ${product.title}`" data-testid="card-add"
          @click="add"
        >
          <AppIcon name="bag" :size="16" /> В корзину
        </button>
        <div
          v-else
          class="flex h-10 items-center justify-between rounded-full border border-line bg-surface" role="group"
          :aria-label="`В корзине: ${product.title}`" data-testid="card-stepper"
        >
          <button
            type="button" class="grid size-10 place-items-center rounded-full hover:bg-raised"
            :aria-label="qty <= 1 ? `Убрать из корзины: ${product.title}` : `Уменьшить количество: ${product.title}`"
            data-testid="card-minus" @click="decrease"
          >
            <AppIcon :name="qty <= 1 ? 'trash' : 'minus'" :size="16" />
          </button>
          <span class="min-w-6 text-center text-sm font-bold" aria-live="polite" data-testid="card-qty">{{ qty }}</span>
          <button
            type="button" class="grid size-10 place-items-center rounded-full hover:bg-raised disabled:opacity-40"
            :disabled="qty >= limit" :aria-label="`Увеличить количество: ${product.title}`"
            :title="qty >= limit ? 'Это всё, что есть в наличии' : undefined"
            data-testid="card-plus" @click="increase"
          >
            <AppIcon name="plus" :size="16" />
          </button>
        </div>
      </div>
    </div>
  </article>
</template>
