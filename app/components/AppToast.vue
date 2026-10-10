<script setup lang="ts">
const cart = useCartStore()
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4" aria-live="polite" role="status">
    <Transition name="toast">
      <p
        v-if="cart.notice"
        :key="cart.notice.id"
        class="pointer-events-auto flex items-center gap-3 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper shadow-soft"
      >
        <AppIcon :name="cart.notice.tone === 'success' ? 'check' : 'alert'" :size="18" class="text-rose" />
        {{ cart.notice.text }}
        <NuxtLink to="/cart" class="font-bold text-rose underline underline-offset-4">В корзину</NuxtLink>
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: opacity 0.2s, transform 0.2s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }
</style>
