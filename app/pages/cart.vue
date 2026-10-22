<script setup lang="ts">
import { maxQty } from '#shared/utils/cart'
import { formatPrice, pluralRu } from '#shared/utils/format'
import { CONTACT_LABEL } from '#shared/utils/site'

const cart = useCartStore()
const dialog = ref<{ open: () => void }>()
const confirmClear = ref(false)

usePageSeo({ title: 'Корзина', description: 'Ваша корзина в магазине NOCTURNE.', noindex: true })

// Когда корзина прочитана из localStorage — подтягиваем свежие цены и остатки.
watch(() => cart.hydrated, (ready) => { if (ready) cart.refresh() }, { immediate: true })

const hasUnavailable = computed(() => cart.lines.some((l) => l.unavailable))
const activeLines = computed(() => cart.lines.filter((l) => !l.unavailable))

function clearAll() {
  cart.clear()
  confirmClear.value = false
}
</script>

<template>
  <div class="container-page py-8 lg:py-12">
    <h1 class="text-4xl sm:text-5xl lg:text-6xl">Корзина</h1>

    <!-- Загрузка: корзина лежит в браузере, на сервере её нет -->
    <div v-if="!cart.hydrated" class="mt-10 space-y-4" aria-busy="true" aria-label="Загружаем корзину" data-testid="cart-loading">
      <div v-for="n in 2" :key="n" class="h-32 animate-pulse rounded-card bg-raised motion-reduce:animate-none" />
    </div>

    <EmptyState
      v-else-if="!cart.lines.length"
      class="mt-10"
      title="В корзине пока пусто"
      text="Загляните в каталог — возможно, там уже ждёт ваш новый вязаный друг."
    >
      <NuxtLink to="/catalog" class="btn btn-primary no-underline">Перейти в каталог</NuxtLink>
    </EmptyState>

    <div v-else class="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
      <section aria-label="Товары в корзине">
        <p v-if="hasUnavailable" class="mb-4 rounded-2xl bg-raised px-5 py-3 text-sm font-semibold text-gold" role="status">
          Некоторых изделий больше нет в каталоге — они не учитываются в сумме. Удалите их из корзины.
        </p>
        <TransitionGroup tag="ul" name="line" class="divide-y divide-line rounded-card border border-line bg-surface">
          <li
            v-for="line in cart.lines" :key="line.productId"
            class="grid grid-cols-[5.5rem_1fr] gap-4 p-4 sm:grid-cols-[7rem_1fr_auto] sm:p-5"
            :class="line.unavailable ? 'opacity-60' : ''" data-testid="cart-line"
          >
            <NuxtLink :to="`/product/${line.slug}`" class="self-start overflow-hidden rounded-2xl bg-raised" tabindex="-1" aria-hidden="true">
              <AppImage :src="line.image.src" :alt="line.image.alt" :width="line.image.width" :height="line.image.height" sizes="112px" img-class="aspect-[4/5] w-full object-cover" />
            </NuxtLink>

            <div class="min-w-0">
              <h2 class="font-display text-xl leading-tight">
                <NuxtLink :to="`/product/${line.slug}`" class="no-underline hover:text-link">{{ line.title }}</NuxtLink>
              </h2>
              <p class="mt-1 text-sm text-fg-muted">{{ formatPrice(line.price) }} за шт.</p>
              <p v-if="line.unavailable" class="mt-2 text-sm font-bold text-link">Больше недоступно</p>
              <AvailabilityBadge v-else class="mt-2" :availability="line.availability" />

              <div class="mt-3 flex flex-wrap items-center gap-3">
                <QuantityStepper
                  v-if="!line.unavailable" :model-value="line.qty" :max="Math.max(maxQty(line), 1)"
                  :label="`Количество: ${line.title}`" @update:model-value="cart.setQty(line.productId, $event)"
                />
                <button type="button" class="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-semibold text-fg-muted hover:text-link" :aria-label="`Удалить: ${line.title}`" data-testid="remove-line" @click="cart.remove(line.productId)">
                  <AppIcon name="trash" :size="16" /> Удалить
                </button>
              </div>
              <p v-if="!line.unavailable && line.availability === 'in_stock' && typeof line.stock === 'number' && line.qty >= line.stock" class="mt-2 text-xs font-semibold text-fg-muted">
                Это всё, что есть в наличии
              </p>
            </div>

            <p v-if="!line.unavailable" class="col-span-2 text-right text-lg font-bold sm:col-span-1" data-testid="line-total">
              {{ formatPrice(line.price * line.qty) }}
            </p>
          </li>
        </TransitionGroup>

        <div class="mt-4">
          <button v-if="!confirmClear" type="button" class="min-h-11 text-sm font-semibold text-fg-muted underline underline-offset-4 hover:text-link" data-testid="clear-cart" @click="confirmClear = true">
            Очистить корзину
          </button>
          <p v-else class="flex flex-wrap items-center gap-3 text-sm font-semibold" role="alert">
            Удалить все изделия из корзины?
            <button type="button" class="btn btn-primary btn-sm" data-testid="confirm-clear" @click="clearAll">Да, очистить</button>
            <button type="button" class="btn btn-ghost btn-sm" @click="confirmClear = false">Отмена</button>
          </p>
        </div>
      </section>

      <aside class="h-fit rounded-card bg-raised p-6 lg:sticky lg:top-28" aria-labelledby="summary-title">
        <h2 id="summary-title" class="text-2xl">Ваш заказ</h2>
        <dl class="mt-5 space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-fg-muted">{{ pluralRu(cart.count, ['изделие', 'изделия', 'изделий']) }}</dt>
            <dd class="font-bold" data-testid="cart-items-count">{{ cart.count }}</dd>
          </div>
          <div class="flex items-baseline justify-between border-t border-line-strong pt-3">
            <dt class="font-display text-xl">Итого</dt>
            <dd class="font-display text-3xl font-semibold" data-testid="cart-total">{{ formatPrice(cart.total) }}</dd>
          </div>
        </dl>
        <p class="mt-4 text-xs leading-relaxed text-fg-muted">
          Оплаты на сайте нет. Нажмите кнопку — вы увидите состав заказа и сможете отправить его мастеру в Telegram. Доставку и оплату вы согласуете лично.
        </p>
        <button type="button" class="btn btn-primary mt-5 w-full" :disabled="!activeLines.length" data-testid="contact-button" @click="dialog?.open()">
          <AppIcon name="telegram" :size="18" /> {{ CONTACT_LABEL }}
        </button>
      </aside>
    </div>

    <OrderDialog ref="dialog" :lines="activeLines" />
  </div>
</template>
