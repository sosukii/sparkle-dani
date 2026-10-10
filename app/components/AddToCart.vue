<script setup lang="ts">
import { maxQty, toCartLine } from '#shared/utils/cart'
import type { Product } from '#shared/types/product'

const props = defineProps<{ product: Product }>()
const cart = useCartStore()
const qty = ref(1)

const limit = computed(() => maxQty(toCartLine(props.product)))
const inCart = computed(() => (cart.hydrated ? cart.quantityOf(props.product.id) : 0))
const available = computed(() => Math.max(limit.value - inCart.value, 0))
const soldOut = computed(() => limit.value === 0)
const allInCart = computed(() => !soldOut.value && available.value === 0)

watch(available, (value) => { qty.value = Math.min(Math.max(qty.value, 1), Math.max(value, 1)) })

function add() {
  if (available.value === 0) return
  cart.add(props.product, qty.value)
  qty.value = 1
}
</script>

<template>
  <div>
    <div v-if="!soldOut" class="flex flex-wrap items-center gap-3">
      <QuantityStepper v-model="qty" :max="Math.max(available, 1)" />
      <button type="button" class="btn btn-primary flex-1 whitespace-nowrap px-8 sm:flex-none" :disabled="available === 0" data-testid="add-to-cart" @click="add">
        <AppIcon name="bag" :size="18" /> {{ allInCart ? 'Всё уже в корзине' : 'Добавить в корзину' }}
      </button>
    </div>
    <p v-else class="rounded-2xl bg-cream px-4 py-3 text-sm font-semibold text-ink-soft">Сейчас нет в наличии</p>

    <p v-if="inCart > 0" class="mt-3 flex flex-wrap items-center gap-x-3 text-sm text-ink-soft" data-testid="in-cart-note">
      <span>В корзине: <strong class="text-ink">{{ inCart }}</strong></span>
      <NuxtLink to="/cart" class="font-bold text-berry underline underline-offset-4">Перейти в корзину</NuxtLink>
    </p>
    <p v-if="product.availability === 'in_stock' && typeof product.stock === 'number' && product.stock > 0 && available === product.stock && product.stock <= 5" class="mt-3 text-sm font-semibold text-ink-soft">
      Осталось: {{ product.stock }} шт.
    </p>
  </div>
</template>
