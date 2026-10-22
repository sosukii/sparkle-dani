<script setup lang="ts">
import { isOrderable, maxQty, toCartLine } from '#shared/utils/cart'
import { OWNER_NAME } from '#shared/utils/site'
import type { Product } from '#shared/types/product'

const props = defineProps<{
  product: Product
  /** Выбранный размер; null — не выбран или не применим. */
  size?: { id: string, label: string } | null
  /** Размер нужно выбрать до добавления (у изделия несколько размеров). */
  needsSize?: boolean
  /** Показать подсказку «выберите размер» (после попытки добавить без размера). */
  sizeInvalid?: boolean
}>()
const emit = defineEmits<{ ask: [], 'need-size': [] }>()
const cart = useCartStore()
const qty = ref(1)

const orderable = computed(() => isOrderable(props.product))
const limit = computed(() => (isOrderable(props.product) ? maxQty(toCartLine(props.product)) : 0))
const inCart = computed(() => (cart.hydrated ? cart.quantityOf(props.product.id) : 0))
const available = computed(() => Math.max(limit.value - inCart.value, 0))
const soldOut = computed(() => orderable.value && limit.value === 0)
const allInCart = computed(() => !soldOut.value && available.value === 0)

watch(available, (value) => { qty.value = Math.min(Math.max(qty.value, 1), Math.max(value, 1)) })

function add() {
  if (available.value === 0) return
  if (props.needsSize && !props.size) {
    emit('need-size')
    return
  }
  cart.add(props.product, qty.value, props.size ?? null)
  qty.value = 1
}
</script>

<template>
  <div>
    <div v-if="!orderable" data-testid="price-unknown">
      <p class="text-sm text-fg-muted">Цена пока не указана. {{ OWNER_NAME }} подскажет её в сообщении.</p>
      <button type="button" class="btn btn-primary mt-3" data-testid="ask-product" @click="emit('ask')">
        <AppIcon name="telegram" :size="18" /> Уточнить цену и наличие
      </button>
    </div>
    <div v-else-if="!soldOut" class="flex flex-wrap items-center gap-3">
      <QuantityStepper v-model="qty" :max="Math.max(available, 1)" />
      <button type="button" class="btn btn-primary flex-1 whitespace-nowrap px-8 sm:flex-none" :disabled="available === 0" data-testid="add-to-cart" :aria-describedby="sizeInvalid ? 'size-required' : undefined" @click="add">
        <AppIcon name="bag" :size="18" /> {{ allInCart ? 'Всё уже в корзине' : 'Добавить в корзину' }}
      </button>
    </div>
    <p v-else class="rounded-2xl bg-raised px-4 py-3 text-sm font-semibold text-fg-muted">Сейчас нет в наличии</p>

    <p v-if="inCart > 0" class="mt-3 flex flex-wrap items-center gap-x-3 text-sm text-fg-muted" data-testid="in-cart-note">
      <span>В корзине: <strong class="text-fg">{{ inCart }}</strong></span>
      <NuxtLink to="/cart" class="font-bold text-link underline underline-offset-4">Перейти в корзину</NuxtLink>
    </p>
    <p v-if="product.availability === 'in_stock' && typeof product.stock === 'number' && product.stock > 0 && available === product.stock && product.stock <= 5" class="mt-3 text-sm font-semibold text-fg-muted">
      Осталось: {{ product.stock }} шт.
    </p>
  </div>
</template>
