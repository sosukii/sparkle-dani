<script setup lang="ts">
import { CONTACT_LABEL, OWNER_NAME, SITE_NAME, TELEGRAM_URL } from '#shared/utils/site'

const { data: categories } = await useCategories()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="mt-24 border-t border-line bg-cream/60">
    <div class="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <div>
        <p class="flex items-center gap-2 font-display text-2xl font-semibold">
          <AppIcon name="sparkle" :size="22" class="text-berry" /> {{ SITE_NAME }}
        </p>
        <p class="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
          Вязаные игрушки, тёплые вещи и украшения ручной работы. Каждое изделие делает {{ OWNER_NAME }}.
        </p>
        <a :href="TELEGRAM_URL" target="_blank" rel="noopener noreferrer" class="btn btn-primary mt-5 no-underline">
          <AppIcon name="telegram" :size="18" /> {{ CONTACT_LABEL }}
        </a>
      </div>

      <nav aria-label="Категории">
        <h2 class="font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">Категории</h2>
        <ul class="mt-4 space-y-2.5 text-sm">
          <li><NuxtLink to="/catalog" class="font-semibold no-underline hover:text-berry">Весь каталог</NuxtLink></li>
          <li v-for="c in categories" :key="c.id">
            <NuxtLink :to="`/catalog/${c.slug}`" class="no-underline hover:text-berry">{{ c.title }}</NuxtLink>
          </li>
        </ul>
      </nav>

      <nav aria-label="Информация">
        <h2 class="font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">Магазин</h2>
        <ul class="mt-4 space-y-2.5 text-sm">
          <li><NuxtLink to="/custom" class="no-underline hover:text-berry">Свой заказ</NuxtLink></li>
          <li><NuxtLink to="/about" class="no-underline hover:text-berry">Обо мне</NuxtLink></li>
          <li><NuxtLink to="/delivery" class="no-underline hover:text-berry">Покупка и доставка</NuxtLink></li>
          <li><NuxtLink to="/cart" class="no-underline hover:text-berry">Корзина</NuxtLink></li>
        </ul>
      </nav>

      <div>
        <h2 class="font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">Связь</h2>
        <p class="mt-4 text-sm leading-relaxed text-ink-soft">
          Заказы и вопросы — в Telegram. Онлайн-оплаты на сайте нет: детали вы согласуете с {{ OWNER_NAME }} лично.
        </p>
      </div>
    </div>
    <p class="border-t border-line py-5 text-center text-xs text-ink-soft">
      © {{ year }} {{ SITE_NAME }}. Сделано с любовью и крючком.
    </p>
  </footer>
</template>
