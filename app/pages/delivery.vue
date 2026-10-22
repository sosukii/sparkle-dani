<script setup lang="ts">
import { buildBreadcrumbJsonLd, buildFaqJsonLd } from '#shared/utils/seo'
import { CONTACT_LABEL, OWNER_NAME, TELEGRAM_URL } from '#shared/utils/site'

const siteUrl = useSiteUrl()

usePageSeo({
  title: 'Покупка и доставка',
  description: `Как заказать изделие: корзина, готовое сообщение и связь с ${OWNER_NAME} в Telegram. Условия доставки, оплаты и возврата согласуются до заказа.`,
  canonicalPath: '/delivery',
})

const steps = [
  { title: 'Выберите изделие', text: 'Откройте каталог и воспользуйтесь фильтрами: по размеру, посадке, материалу, цвету и цене.' },
  { title: 'Добавьте в корзину', text: 'Выберите размер, если он нужен. Можно собрать несколько изделий; корзина сохраняется в вашем браузере.' },
  { title: `Нажмите «Связаться с ${OWNER_NAME}»`, text: 'Вы увидите состав заказа и сумму. Скопируйте текст и отправьте его в Telegram: сайт сам ничего не отправляет.' },
  { title: 'Договоритесь о деталях', text: `Оплату, получение и сроки вы согласуете с ${OWNER_NAME} в переписке. Онлайн-оплаты на сайте нет, и заказ не считается оформленным, пока вы не договорились.` },
]

// Условия, которые согласуются в переписке. Конкретные способы, сроки и цены появятся здесь, когда будут подтверждены.
const terms = [
  { id: 'delivery', title: 'Доставка', text: `Способ, стоимость и срок согласуются с ${OWNER_NAME} до заказа.` },
  { id: 'payment', title: 'Оплата', text: `Способ оплаты ${OWNER_NAME} назовёт в переписке. На сайте оплата не принимается.` },
  { id: 'returns', title: 'Возврат', text: `Условия возврата уточните у ${OWNER_NAME} до заказа: они зафиксируются в вашем диалоге.` },
]

const faq = [
  { q: 'Нужно ли регистрироваться?', a: 'Нет. Достаточно собрать корзину и написать в Telegram.' },
  { q: 'Что значит «в наличии» и «под заказ»?', a: 'Изделия «в наличии» уже связаны. Изделия «под заказ» делаются после согласования; срок изготовления указан на карточке, а если его нет, спросите.' },
  { q: 'Почему сайт не принимает оплату?', a: `Покупка идёт напрямую: детали обсуждаются в переписке с ${OWNER_NAME}, чтобы вы заранее понимали, что и когда получите.` },
  { q: 'Что делать, если нужного размера или оттенка нет?', a: `Напишите ${OWNER_NAME}: можно обсудить изделие по своим меркам. Подробности на странице «Свой заказ».` },
  { q: 'Если на карточке нет цены или наличия?', a: `Это значит, что сведения пока не заполнены. Нажмите «Уточнить цену и наличие»: сообщение ${OWNER_NAME} подготовится само.` },
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
        Покупка идёт через личную переписку в Telegram: без регистрации и лишних форм.
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

    <section class="container-page py-8 lg:py-12" aria-labelledby="delivery-terms">
      <h2 id="delivery-terms" class="text-3xl sm:text-4xl">Доставка, оплата и возврат</h2>
      <p class="mt-3 max-w-2xl text-fg-muted">Конкретные условия пока согласуются в переписке: здесь мы ничего не обещаем наперёд.</p>
      <ul class="mt-8 grid gap-5 md:grid-cols-3" data-testid="delivery-terms">
        <li v-for="t in terms" :key="t.id" class="rounded-card border border-line bg-surface p-7" :data-testid="`delivery-${t.id}`">
          <h3 class="font-display text-2xl">{{ t.title }}</h3>
          <p class="mt-2 leading-relaxed text-fg-muted">{{ t.text }}</p>
        </li>
      </ul>
    </section>

    <section class="container-page py-8 lg:py-12" aria-labelledby="delivery-status">
      <h2 id="delivery-status" class="text-3xl sm:text-4xl">В наличии и под заказ</h2>
      <div class="mt-8 grid gap-5 md:grid-cols-2">
        <div class="rounded-card border border-line bg-surface p-8">
          <AvailabilityBadge availability="in_stock" />
          <p class="mt-4 leading-relaxed text-fg-muted">Изделие уже готово. Если остаток ограничен, корзина не даст добавить больше, чем есть.</p>
        </div>
        <div class="rounded-card border border-line bg-surface p-8">
          <AvailabilityBadge availability="made_to_order" />
          <p class="mt-4 leading-relaxed text-fg-muted">Изделие делается после согласования. Срок изготовления указан на карточке; если его нет, уточните у {{ OWNER_NAME }}.</p>
        </div>
      </div>
    </section>

    <section class="container-page py-8 lg:py-12" aria-labelledby="delivery-faq">
      <h2 id="delivery-faq" class="text-3xl sm:text-4xl">Частые вопросы</h2>
      <div class="mt-8 divide-y divide-line rounded-card border border-line bg-surface">
        <details v-for="item in faq" :key="item.q" class="group px-6 py-5">
          <summary class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-display text-xl">
            {{ item.q }}
            <AppIcon name="chevron-down" :size="20" class="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
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
