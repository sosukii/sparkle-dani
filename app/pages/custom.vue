<script setup lang="ts">
import { buildBreadcrumbJsonLd, buildFaqJsonLd } from '#shared/utils/seo'
import { CONTACT_LABEL, OWNER_NAME, TELEGRAM_URL } from '#shared/utils/site'

const siteUrl = useSiteUrl()

usePageSeo({
  title: 'Свой заказ — изделие по вашей идее',
  description: `Нужно изделие по своим меркам или идее? Напишите ${OWNER_NAME}: обсудите размеры, материалы и сроки. Условия согласуются до заказа.`,
  canonicalPath: '/custom',
})

const steps = [
  { icon: 'telegram', title: `Напишите ${OWNER_NAME}`, text: 'Расскажите, что хотите. Можно прислать фото или ссылку на изделие из каталога как пример.' },
  { icon: 'sparkle', title: 'Обсудите детали', text: `Размеры, материал, цвет и срок. ${OWNER_NAME} ответит, что возможно, и назовёт стоимость.` },
  { icon: 'heart', title: 'Договоритесь о заказе', text: 'Оплату и получение вы согласуете в переписке. Пока вы не договорились, заказ не оформляется.' },
] as const

const checklist = [
  { title: 'Что хотите', text: 'Идея, фото или ссылка-пример. Можно «как в каталоге, но…».' },
  { title: 'Бюджет', text: 'Если есть предел, скажите сразу: подберём варианты в нём.' },
  { title: 'Материал', text: 'Пожелания по составу или пряже, если они есть. Что возможно, подскажут в ответ.' },
  { title: 'Размеры и мерки', text: 'Рост, обхват или нужные сантиметры. Подсказка, как измерить, есть на странице «Размеры и мерки».' },
  { title: 'К какому сроку', text: 'Если нужно к дате, например ко дню рождения.' },
]

const faq = [
  { q: 'Можно ли заказать «как в каталоге», но другого цвета или размера?', a: `Напишите ${OWNER_NAME} ссылку на понравившееся изделие и что хотите изменить: она ответит, получится ли.` },
  { q: 'Сколько ждать готовое изделие?', a: `Срок зависит от размера и сложности. ${OWNER_NAME} назовёт его, когда вы обсудите детали.` },
  { q: 'Как оплатить и получить заказ?', a: `Оплату и способ получения вы согласуете с ${OWNER_NAME} в Telegram. На сайте оплаты нет.` },
  { q: 'Можно ли выбрать материал?', a: 'Да, напишите пожелания. Какие варианты возможны для вашего изделия, ответит мастер. Общие сведения о материалах есть на странице «Материалы и уход».' },
]

const template = [
  `Здравствуйте, ${OWNER_NAME}! Хочу заказать изделие по своей идее.`,
  '',
  'Что хочу: …',
  'Фото / пример: …',
  'Бюджет (если есть): …',
  'Материал (пожелания): …',
  'Размеры и мерки: …',
  'К какому сроку: …',
  'Получение: …',
].join('\n')

const copied = ref(false)
const area = ref<HTMLTextAreaElement>()
async function copy() {
  try {
    await navigator.clipboard.writeText(template)
    copied.value = true
    setTimeout(() => (copied.value = false), 2500)
  }
  catch {
    area.value?.focus()
    area.value?.select()
  }
}

useJsonLd(() => buildBreadcrumbJsonLd([{ name: 'Главная', path: '/' }, { name: 'Свой заказ', path: '/custom' }], siteUrl))
useJsonLd(() => buildFaqJsonLd(faq))
</script>

<template>
  <div>
    <section class="container-page grid items-center gap-10 py-10 lg:grid-cols-[1.1fr_1fr] lg:py-20">
      <div>
        <p class="eyebrow">Индивидуальный заказ</p>
        <h1 class="mt-4 text-5xl sm:text-6xl lg:text-[3.6rem] xl:text-7xl">Сделаем что-то <span class="em-accent">только для вас</span></h1>
        <p class="mt-6 max-w-xl text-lg leading-relaxed text-fg-muted">
          Нужно изделие по своим меркам или по своей идее? Опишите, что хотите, и обсудите детали с {{ OWNER_NAME }}.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <a :href="TELEGRAM_URL" target="_blank" rel="noopener noreferrer" class="btn btn-primary px-7 no-underline" data-testid="custom-telegram">
            <AppIcon name="telegram" :size="18" /> {{ CONTACT_LABEL }}
          </a>
          <a href="#how" class="btn btn-ghost no-underline">Как это работает</a>
        </div>
      </div>
      <div class="rounded-card border border-line bg-surface p-8" data-testid="custom-links">
        <h2 class="font-display text-2xl">Пригодится</h2>
        <ul class="mt-4 space-y-3">
          <li><NuxtLink to="/info/sizes" class="font-semibold text-link underline underline-offset-4">Размеры и мерки: как измерить</NuxtLink></li>
          <li><NuxtLink to="/info/materials" class="font-semibold text-link underline underline-offset-4">Материалы и уход</NuxtLink></li>
          <li><NuxtLink to="/catalog" class="font-semibold text-link underline underline-offset-4">Каталог: найти пример</NuxtLink></li>
        </ul>
      </div>
    </section>

    <section id="how" class="container-page py-10 lg:py-14" aria-labelledby="custom-how">
      <SectionHead id="custom-how" eyebrow="Как это работает" title="Три шага" />
      <ol class="mt-8 grid gap-5 md:grid-cols-3">
        <li v-for="(s, i) in steps" :key="s.title" class="rounded-card border border-line bg-surface p-7">
          <div class="flex items-center gap-3">
            <span class="grid size-11 place-items-center rounded-full bg-accent font-display text-lg text-fg">{{ i + 1 }}</span>
            <AppIcon :name="s.icon" :size="22" class="text-link" />
          </div>
          <h3 class="mt-4 text-2xl">{{ s.title }}</h3>
          <p class="mt-2 leading-relaxed text-fg-muted">{{ s.text }}</p>
        </li>
      </ol>
    </section>

    <section class="container-page py-10 lg:py-14" aria-labelledby="custom-tell">
      <div class="rounded-[2rem] bg-raised px-6 py-10 sm:px-12">
        <SectionHead id="custom-tell" eyebrow="Что рассказать" title="Пять вещей для первого сообщения" />
        <ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <li v-for="item in checklist" :key="item.title" class="rounded-2xl bg-surface p-5">
            <h3 class="font-display text-lg">{{ item.title }}</h3>
            <p class="mt-1.5 text-sm leading-relaxed text-fg-muted">{{ item.text }}</p>
          </li>
        </ul>
      </div>
    </section>

    <section class="container-page py-10 lg:py-14" aria-labelledby="custom-template">
      <div class="grid gap-6 rounded-[2rem] border border-line bg-surface p-6 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <p class="eyebrow">Быстрый старт</p>
          <h2 id="custom-template" class="mt-2 text-3xl sm:text-4xl">Скопируйте и дополните</h2>
          <p class="mt-3 leading-relaxed text-fg-muted">Готовый текст первого сообщения: вставьте его в Telegram и заполните пропуски.</p>
          <div class="mt-5 flex flex-col gap-3 sm:flex-row">
            <button type="button" class="btn btn-soft" data-testid="custom-copy" @click="copy">
              <AppIcon :name="copied ? 'check' : 'copy'" :size="18" /> {{ copied ? 'Скопировано' : 'Скопировать текст' }}
            </button>
            <a :href="TELEGRAM_URL" target="_blank" rel="noopener noreferrer" class="btn btn-primary no-underline"><AppIcon name="telegram" :size="18" /> Открыть Telegram</a>
          </div>
        </div>
        <div>
          <label for="custom-template-text" class="sr-only">Шаблон первого сообщения</label>
          <textarea
            id="custom-template-text" ref="area" :value="template" readonly rows="9"
            class="field resize-none py-3 font-mono leading-relaxed" data-testid="custom-template"
          />
        </div>
      </div>
    </section>

    <section class="container-page py-10 lg:py-14" aria-labelledby="custom-faq">
      <SectionHead id="custom-faq" eyebrow="Вопросы" title="Коротко о важном" />
      <div class="mt-8 divide-y divide-line rounded-card border border-line bg-surface">
        <details v-for="item in faq" :key="item.q" class="group px-6 py-5">
          <summary class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-display text-xl">
            {{ item.q }}
            <AppIcon name="chevron-down" :size="20" class="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
          </summary>
          <p class="mt-2 max-w-3xl leading-relaxed text-fg-muted">{{ item.a }}</p>
        </details>
      </div>
    </section>
  </div>
</template>
