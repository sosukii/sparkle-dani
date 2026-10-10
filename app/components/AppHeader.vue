<script setup lang="ts">
import { SITE_NAME } from '#shared/utils/site'

const cart = useCartStore()
const route = useRoute()
const menuOpen = ref(false)
const searchOpen = ref(false)
const search = ref('')

const links = [
  { to: '/catalog', label: 'Каталог' },
  { to: '/about', label: 'Обо мне' },
  { to: '/delivery', label: 'Покупка и доставка' },
]

watch(() => route.fullPath, () => {
  menuOpen.value = false
  searchOpen.value = false
})
watch(() => route.query.q, (q) => { search.value = typeof q === 'string' ? q : '' }, { immediate: true })

function submitSearch() {
  const q = search.value.trim()
  navigateTo({ path: '/catalog', query: q ? { q } : {} })
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    menuOpen.value = false
    searchOpen.value = false
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

const isActive = (to: string) => route.path === to || route.path.startsWith(`${to}/`)
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-line/70 bg-paper/95 backdrop-blur">
    <div class="container-page flex h-16 items-center gap-3 lg:h-[4.5rem] lg:gap-8">
      <NuxtLink to="/" class="flex items-center gap-2 no-underline" aria-label="Sparkle Dani — на главную">
        <AppIcon name="sparkle" :size="22" class="text-berry" />
        <span class="font-display text-xl font-semibold tracking-tight lg:text-2xl">{{ SITE_NAME }}</span>
      </NuxtLink>

      <nav class="ml-4 hidden items-center gap-1 lg:flex" aria-label="Основная навигация">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="rounded-full px-4 py-2 text-sm font-semibold no-underline transition-colors hover:bg-cream"
          :class="isActive(link.to) ? 'bg-cream text-berry' : 'text-ink'"
          :aria-current="isActive(link.to) ? 'page' : undefined"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <form class="ml-auto hidden w-72 lg:block" role="search" @submit.prevent="submitSearch">
        <label for="site-search" class="sr-only">Поиск по сайту</label>
        <div class="relative">
          <AppIcon name="search" :size="18" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            id="site-search"
            v-model="search"
            type="search"
            enterkeyhint="search"
            autocomplete="off"
            placeholder="Поиск: мишка, шарф, Ghibli…"
            class="field rounded-full pl-10"
          >
        </div>
      </form>

      <div class="ml-auto flex items-center gap-1 lg:ml-0">
        <button
          type="button"
          class="grid size-11 place-items-center rounded-full hover:bg-cream lg:hidden"
          :aria-expanded="searchOpen"
          aria-controls="mobile-search"
          aria-label="Поиск"
          @click="searchOpen = !searchOpen; menuOpen = false"
        >
          <AppIcon name="search" :size="22" />
        </button>
        <NuxtLink
          to="/cart"
          class="relative grid size-11 place-items-center rounded-full no-underline hover:bg-cream"
          :aria-label="cart.hydrated && cart.count ? `Корзина, товаров: ${cart.count}` : 'Корзина'"
        >
          <AppIcon name="bag" :size="22" />
          <span
            v-if="cart.hydrated && cart.count"
            data-testid="cart-count"
            class="absolute right-0.5 top-0.5 grid min-w-5 place-items-center rounded-full bg-berry px-1 text-[0.7rem] font-bold leading-5 text-white"
          >{{ cart.count }}</span>
        </NuxtLink>
        <button
          type="button"
          class="grid size-11 place-items-center rounded-full hover:bg-cream lg:hidden"
          :aria-expanded="menuOpen"
          aria-controls="mobile-menu"
          :aria-label="menuOpen ? 'Закрыть меню' : 'Открыть меню'"
          @click="menuOpen = !menuOpen; searchOpen = false"
        >
          <AppIcon :name="menuOpen ? 'close' : 'menu'" :size="22" />
        </button>
      </div>
    </div>

    <div v-show="searchOpen" id="mobile-search" class="border-t border-line/70 lg:hidden">
      <form class="container-page py-3" role="search" @submit.prevent="submitSearch">
        <label for="mobile-search-input" class="sr-only">Поиск по сайту</label>
        <input
          id="mobile-search-input"
          v-model="search"
          type="search"
          enterkeyhint="search"
          autocomplete="off"
          placeholder="Поиск: мишка, шарф, Ghibli…"
          class="field rounded-full"
        >
      </form>
    </div>

    <nav v-show="menuOpen" id="mobile-menu" class="border-t border-line/70 lg:hidden" aria-label="Мобильная навигация">
      <ul class="container-page flex flex-col py-3">
        <li v-for="link in links" :key="link.to">
          <NuxtLink
            :to="link.to"
            class="flex min-h-12 items-center rounded-xl px-3 font-display text-xl no-underline hover:bg-cream"
            :class="isActive(link.to) ? 'text-berry' : 'text-ink'"
            :aria-current="isActive(link.to) ? 'page' : undefined"
          >
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </header>
</template>
