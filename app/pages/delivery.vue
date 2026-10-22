<script setup lang="ts">
import { buildBreadcrumbJsonLd, buildFaqJsonLd } from '#shared/utils/seo'
import { CONTACT_LABEL, OWNER_NAME, TELEGRAM_URL } from '#shared/utils/site'

const siteUrl = useSiteUrl()

usePageSeo({
  title: 'Покупка и доставка',
  description: `Как заказать изделие ручной работы: корзина, связь с ${OWNER_NAME} в Telegram, доставка СДЭК по России или лично в руки в Москве.`,
})

const steps = [
  { title: 'Выберите изделие', text: 'Откройте каталог и воспользуйтесь фильтрами — по фандому, цвету, цене и теплоте.' },
  { title: 'Добавьте в корзину', text: 'Можно собрать несколько изделий. Корзина сохраняется в вашем браузере.' },
  { title: `Нажмите «Связаться с ${OWNER_NAME}»`, text: 'Вы увидите состав заказа и сумму. Скопируйте текст заказа и отправьте его в Telegram.' },
  { title: 'Договоритесь о деталях', text: 'Оплату и способ получения — СДЭК или лично в Москве — согласуете в переписке. Онлайн-оплаты на сайте нет.' },
]

const faq = [
  { q: 'Как получить заказ?', a: `Двумя способами: доставка СДЭК по России или лично в руки в Москве. Выбор вы обсуждаете с ${OWNER_NAME} в Telegram.` },
  { q: 'Где находится магазин и в каком вы городе?', a: `Это интернет-магазин. ${OWNER_NAME} находится в Москве: отправляет заказы СДЭКом по России, а в Москве можно встретиться и забрать лично.` },
  { q: 'Нужно ли регистрироваться?', a: 'Нет. Достаточно собрать корзину и написать мастеру в Telegram.' },
  { q: 'Что значит «в наличии» и «под заказ»?', a: 'Изделия «в наличии» уже связаны. Изделия «под заказ» мастер сделает после согласования — примерный срок изготовления указан на карточке товара.' },
  { q: 'Почему сайт не принимает оплату?', a: 'Мы работаем напрямую: детали оплаты и доставки обсуждаются в личной переписке, чтобы вы заранее понимали, что и когда получите.' },
  { q: 'Что делать, если нужного нет в каталоге?', a: `Закажите своё: ${OWNER_NAME} может сделать почти что угодно по вашей идее. Подробности — на странице «Свой заказ».` },
]

useJsonLd(() => buildBreadcrumbJsonLd([{ name: 'Главная', path: '/' }, { name: 'Покупка и доставка', path: '/delivery' }], siteUrl))
useJsonLd(() => buildFaqJsonLd(faq))
</script>

<template>
  <div>
    <section class="container-page py-10 lg:py-20">
      <p class="eyebrow">Информация</p>
      <h1 class="mt-4 max-w-3xl text-5xl sm:text-6xl lg:text-7xl">Покупка и <span class="em-accent">доставка</span></h1>
      <p class="mt-6 max-w-2xl text-lg leading-relaxed text-fg-muted">
        Покупать у нас просто: выбираете, собираете корзину и пишете {{ OWNER_NAME }}. Без регистрации и лишних форм.
      </p>
    </section>

    <section class="container-page py-8 lg:py-12" aria-labelledby="delivery-steps">
      <h2 id="delivery-steps" class="text-3xl sm:text-4xl">Как сделать заказ</h2>
      <ol class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="(s, i) in steps" :key="s.title" class="rounded-card border border-line bg-surface p-7">
          <span class="font-display text-4xl italic text-gold">0{{ i + 1 }}</span>
          <h3 class="mt-3 text-xl">{{ s.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-fg-muted">{{ s.text }}</p>
        </li>
      </ol>
    </section>

    <section class="container-page py-8 lg:py-12" aria-labelledby="delivery-status">
      <h2 id="delivery-status" class="text-3xl sm:text-4xl">В наличии и под заказ</h2>
      <div class="mt-8 grid gap-5 md:grid-cols-2">
        <div class="rounded-card bg-raised p-8">
          <AvailabilityBadge availability="in_stock" />
          <p class="mt-4 leading-relaxed text-fg-muted">Изделие уже готово. После согласования деталей мастер отправит его вам. Если остаток ограничен, корзина не даст добавить больше, чем есть.</p>
        </div>
        <div class="rounded-card bg-raised p-8">
          <AvailabilityBadge availability="made_to_order" />
          <p class="mt-4 leading-relaxed text-fg-muted">Изделие делается после вашего заказа. Примерный срок изготовления указан на карточке — например, «7–12 дней».</p>
        </div>
      </div>
    </section>

    <section class="container-page py-8 lg:py-12" aria-labelledby="delivery-pay">
      <div class="rounded-[2rem] bg-raised px-6 py-10 sm:px-12">
        <h2 id="delivery-pay" class="text-3xl sm:text-4xl">Как получить заказ</h2>
        <div class="mt-6 grid gap-4 md:grid-cols-2">
          <div class="rounded-2xl bg-surface p-6" data-testid="delivery-cdek">
            <h3 class="font-display text-2xl">СДЭК по России</h3>
            <p class="mt-2 leading-relaxed text-fg-muted">{{ OWNER_NAME }} отправит заказ СДЭКом. Стоимость и срок доставки зависят от города — вы узнаете их заранее.</p>
          </div>
          <div class="rounded-2xl bg-surface p-6" data-testid="delivery-moscow">
            <h3 class="font-display text-2xl">Лично в руки в Москве</h3>
            <p class="mt-2 leading-relaxed text-fg-muted">Если вы в Москве, можно встретиться и забрать заказ лично. Место и время договариваетесь в Telegram.</p>
          </div>
        </div>
        <p class="mt-5 max-w-3xl leading-relaxed text-fg-muted">Оплата и все детали согласуются в Telegram: так вы заранее знаете, что и когда получите.</p>
      </div>
    </section>

    <section class="container-page py-8 lg:py-12" aria-labelledby="delivery-faq">
      <h2 id="delivery-faq" class="text-3xl sm:text-4xl">Частые вопросы</h2>
      <div class="mt-8 divide-y divide-line rounded-card border border-line bg-surface">
        <details v-for="item in faq" :key="item.q" class="group px-6 py-5">
          <summary class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-display text-xl">
            {{ item.q }}
            <AppIcon name="chevron-down" :size="20" class="transition-transform group-open:rotate-180 motion-reduce:transition-none" />
          </summary>
          <p class="mt-2 max-w-3xl leading-relaxed text-fg-muted">{{ item.a }}</p>
        </details>
      </div>
      <div class="mt-10 text-center">
        <a :href="TELEGRAM_URL" target="_blank" rel="noopener noreferrer" class="btn btn-primary no-underline">
          <AppIcon name="telegram" :size="18" /> {{ CONTACT_LABEL }}
        </a>
      </div>
    </section>
  </div>
</template>
