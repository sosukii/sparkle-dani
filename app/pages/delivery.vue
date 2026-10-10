<script setup lang="ts">
import { CONTACT_LABEL, OWNER_NAME, TELEGRAM_URL } from '#shared/utils/site'

usePageSeo({
  title: 'Покупка и доставка',
  description: `Как заказать изделие ручной работы: корзина, связь с ${OWNER_NAME} в Telegram, наличие и сроки изготовления.`,
})

const steps = [
  { title: 'Выберите изделие', text: 'Откройте каталог и воспользуйтесь фильтрами — по фандому, цвету, цене и теплоте.' },
  { title: 'Добавьте в корзину', text: 'Можно собрать несколько изделий. Корзина сохраняется в вашем браузере.' },
  { title: `Нажмите «Связаться с ${OWNER_NAME}»`, text: 'Вы увидите состав заказа и сумму. Скопируйте текст заказа и отправьте его в Telegram.' },
  { title: 'Договоритесь о деталях', text: 'Оплата и доставка согласуются лично — онлайн-оплаты на сайте нет.' },
]

const faq = [
  { q: 'Нужно ли регистрироваться?', a: 'Нет. Достаточно собрать корзину и написать мастеру в Telegram.' },
  { q: 'Что значит «в наличии» и «под заказ»?', a: 'Изделия «в наличии» уже связаны. Изделия «под заказ» мастер сделает после согласования — примерный срок изготовления указан на карточке товара.' },
  { q: 'Почему сайт не принимает оплату?', a: 'Мы работаем напрямую: детали оплаты и доставки обсуждаются в личной переписке, чтобы вы заранее понимали, что и когда получите.' },
  { q: 'Что делать, если нужного нет в каталоге?', a: `Напишите ${OWNER_NAME} в Telegram — возможно, изделие можно сделать на заказ.` },
]
</script>

<template>
  <div>
    <section class="container-page py-10 lg:py-20">
      <MockNote class="mb-6" />
      <p class="eyebrow">Информация</p>
      <h1 class="mt-4 max-w-3xl text-5xl sm:text-6xl lg:text-7xl">Покупка и <span class="em-accent">доставка</span></h1>
      <p class="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
        Покупать у нас просто: выбираете, собираете корзину и пишете {{ OWNER_NAME }}. Без регистрации и лишних форм.
      </p>
    </section>

    <section class="container-page py-8 lg:py-12" aria-labelledby="delivery-steps">
      <h2 id="delivery-steps" class="text-3xl sm:text-4xl">Как сделать заказ</h2>
      <ol class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="(s, i) in steps" :key="s.title" class="rounded-card border border-line bg-white p-7">
          <span class="font-display text-4xl italic text-rose-deep">0{{ i + 1 }}</span>
          <h3 class="mt-3 text-xl">{{ s.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-ink-soft">{{ s.text }}</p>
        </li>
      </ol>
    </section>

    <section class="container-page py-8 lg:py-12" aria-labelledby="delivery-status">
      <h2 id="delivery-status" class="text-3xl sm:text-4xl">В наличии и под заказ</h2>
      <div class="mt-8 grid gap-5 md:grid-cols-2">
        <div class="rounded-card bg-mint-soft p-8">
          <AvailabilityBadge availability="in_stock" />
          <p class="mt-4 leading-relaxed text-ink-soft">Изделие уже готово. После согласования деталей мастер отправит его вам. Если остаток ограничен, корзина не даст добавить больше, чем есть.</p>
        </div>
        <div class="rounded-card bg-lilac-soft p-8">
          <AvailabilityBadge availability="made_to_order" />
          <p class="mt-4 leading-relaxed text-ink-soft">Изделие делается после вашего заказа. Примерный срок изготовления указан на карточке — например, «7–12 дней».</p>
        </div>
      </div>
    </section>

    <section class="container-page py-8 lg:py-12" aria-labelledby="delivery-pay">
      <div class="rounded-[2rem] bg-cream px-6 py-10 sm:px-12">
        <h2 id="delivery-pay" class="text-3xl sm:text-4xl">Оплата и доставка</h2>
        <p class="mt-4 max-w-3xl leading-relaxed text-ink-soft">
          Способы, стоимость и сроки доставки, а также оплата согласуются при оформлении заказа в Telegram. Этот раздел будет дополнен подробностями — {{ OWNER_NAME }} добавит их сама.
        </p>
        <MockNote class="mt-5">Здесь появятся реальные условия доставки и оплаты</MockNote>
      </div>
    </section>

    <section class="container-page py-8 lg:py-12" aria-labelledby="delivery-faq">
      <h2 id="delivery-faq" class="text-3xl sm:text-4xl">Частые вопросы</h2>
      <div class="mt-8 divide-y divide-line rounded-card border border-line bg-white">
        <details v-for="item in faq" :key="item.q" class="group px-6 py-5">
          <summary class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-display text-xl">
            {{ item.q }}
            <AppIcon name="chevron-down" :size="20" class="transition-transform group-open:rotate-180 motion-reduce:transition-none" />
          </summary>
          <p class="mt-2 max-w-3xl leading-relaxed text-ink-soft">{{ item.a }}</p>
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
