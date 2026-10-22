<script setup lang="ts">
import { CONTACT_LABEL, OWNER_NAME, SITE_NAME, TELEGRAM_URL } from '#shared/utils/site'

const { data: categories } = await useCategories()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="mt-24 border-t border-line bg-surface">
    <div class="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <div>
        <p class="font-logo text-2xl font-semibold tracking-[0.12em]">{{ SITE_NAME }}</p>
        <p class="mt-3 max-w-xs text-sm leading-relaxed text-fg-muted">
          Авторский вязаный трикотаж ручной работы. Каждое изделие делает {{ OWNER_NAME }}.
        </p>
        <a :href="TELEGRAM_URL" target="_blank" rel="noopener noreferrer" class="btn btn-primary mt-5 no-underline">
          <AppIcon name="telegram" :size="18" /> {{ CONTACT_LABEL }}
        </a>
      </div>

      <nav aria-label="Категории">
        <h2 class="font-sans text-xs font-bold uppercase tracking-[0.18em] text-fg-muted">Категории</h2>
        <ul class="mt-4 space-y-2.5 text-sm">
          <li><NuxtLink to="/catalog" class="font-semibold no-underline hover:text-link">Весь каталог</NuxtLink></li>
          <li v-for="c in categories" :key="c.id">
            <NuxtLink :to="`/catalog/${c.slug}`" class="no-underline hover:text-link">{{ c.title }}</NuxtLink>
          </li>
        </ul>
      </nav>

      <nav aria-label="Информация">
        <h2 class="font-sans text-xs font-bold uppercase tracking-[0.18em] text-fg-muted">Магазин</h2>
        <ul class="mt-4 space-y-2.5 text-sm">
          <li><NuxtLink to="/custom" class="no-underline hover:text-link">Свой заказ</NuxtLink></li>
          <li><NuxtLink to="/about" class="no-underline hover:text-link">О бренде</NuxtLink></li>
          <li><NuxtLink to="/delivery" class="no-underline hover:text-link">Покупка и доставка</NuxtLink></li>
          <li><NuxtLink to="/info/sizes" class="no-underline hover:text-link">Размеры и мерки</NuxtLink></li>
          <li><NuxtLink to="/info/materials" class="no-underline hover:text-link">Материалы и уход</NuxtLink></li>
          <li><NuxtLink to="/cart" class="no-underline hover:text-link">Корзина</NuxtLink></li>
        </ul>
      </nav>

      <div>
        <h2 class="font-sans text-xs font-bold uppercase tracking-[0.18em] text-fg-muted">Связь</h2>
        <p class="mt-4 text-sm leading-relaxed text-fg-muted">
          Заказы и вопросы — в Telegram. Онлайн-оплаты на сайте нет: детали вы согласуете с {{ OWNER_NAME }} лично.
        </p>
      </div>
    </div>
    <p class="border-t border-line py-5 text-center text-xs text-fg-muted">
      © {{ year }} {{ SITE_NAME }}. Изделия ручной работы.
    </p>
  </footer>
</template>
