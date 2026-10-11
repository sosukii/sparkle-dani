<script setup lang="ts">
import { CONTACT_LABEL, OWNER_NAME, TELEGRAM_URL } from '#shared/utils/site'
import { parseCatalogQuery, queryCatalog } from '#shared/utils/catalog-query'

const { data } = await useAsyncData('about-facets', async () => {
  const catalog = await loadCatalog()
  return queryCatalog(catalog.products, parseCatalogQuery({ pageSize: 1 }), catalog)
})
const fandoms = computed(() => data.value?.facets.fandom ?? [])

usePageSeo({
  title: 'Обо мне',
  description: `Знакомьтесь: ${OWNER_NAME} — мастер, который вяжет игрушки, тёплые вещи и украшения. Как рождаются изделия и что для меня важно.`,
  image: '/images/about/workspace.jpg',
})

const makes = [
  { icon: 'heart', title: 'Игрушки-амигуруми', text: 'Мягкие друзья с вышитыми глазками и собственным характером. Одни охраняют уют на полке, другие отправляются с вами в рюкзаке на край света.', tint: 'bg-rose-soft' },
  { icon: 'sparkle', title: 'Тёплые вещи', text: 'Шарфы, шапки и варежки, в которых хочется гулять до первой звезды, даже когда за окном совсем не лето.', tint: 'bg-lilac-soft' },
  { icon: 'bag', title: 'Мелочи для себя', text: 'Бисерные серьги и браслеты, сумочки, косметички и костеры. Маленькие детали, с которыми день получается ярче.', tint: 'bg-mint-soft' },
] as const

const process = [
  { n: 1, title: 'Идея', text: 'Всё начинается с настроения: герой любимой истории, цвет, который не отпускает, или просто «хочу вот такое». Набрасываю эскиз и подбираю палитру.' },
  { n: 2, title: 'Пряжа', text: 'Выбираю материалы, которые приятно держать в руках: мягкие, надёжные и с красивым, глубоким цветом.' },
  { n: 3, title: 'Вязание', text: 'Петля за петлёй, ряд за рядом. Самая неторопливая и самая любимая часть пути.' },
  { n: 4, title: 'Финальные штрихи', text: 'Вышиваю мордочки, пришиваю помпоны, всё внимательно проверяю и аккуратно упаковываю: изделие можно сразу дарить.' },
]

const values = [
  { title: 'Только вручную', text: 'Без конвейера: у каждого изделия чуть-чуть свой характер, и это не недочёт, а изюминка.' },
  { title: 'Честные описания', text: 'Размеры, материалы и сроки — как есть, чтобы ожидания совпадали с реальностью.' },
  { title: 'Живое общение', text: 'Все детали мы обсуждаем лично в Telegram — спрашивайте о чём угодно.' },
  { title: 'Уют и радость', text: 'Хочу, чтобы от каждого изделия на душе становилось чуть теплее.' },
]
</script>

<template>
  <div>
    <section class="container-page grid items-center gap-10 py-10 lg:grid-cols-2 lg:py-20">
      <div>
        <p class="eyebrow">Обо мне</p>
        <h1 class="mt-4 text-5xl sm:text-6xl lg:text-7xl">Привет, я <span class="em-accent">{{ OWNER_NAME }}</span>!</h1>
        <p class="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
          Я вяжу крючком маленькие радости: игрушек с характером, шарфы, в которые хочется закутаться, и мелочи, от которых обычный день становится чуточку сказочнее. Многое — по мотивам историй, которые люблю сама. Если вы узнаёте в этом себя, заходите: вам здесь рады.
        </p>
        <a :href="TELEGRAM_URL" target="_blank" rel="noopener noreferrer" class="btn btn-primary mt-8 no-underline">
          <AppIcon name="telegram" :size="18" /> {{ CONTACT_LABEL }}
        </a>
      </div>
      <div class="relative">
        <AppIcon name="sparkle" :size="40" class="absolute -left-3 -top-4 z-10 text-rose" />
        <AppImage
          src="/images/about/workspace.jpg" alt="Рабочий стол мастера: клубки пряжи, крючок и вязаный зайчик"
          :width="1200" :height="900" sizes="(min-width: 1024px) 45vw, 100vw" priority
          img-class="w-full rounded-[2rem] object-cover shadow-soft"
        />
      </div>
    </section>

    <section class="container-page py-12 lg:py-16" aria-labelledby="about-makes">
      <SectionHead id="about-makes" eyebrow="Что я делаю" title="Что выходит из-под моего крючка" />
      <ul class="mt-8 grid gap-5 md:grid-cols-3">
        <li v-for="m in makes" :key="m.title" class="rounded-card p-8" :class="m.tint">
          <AppIcon :name="m.icon" :size="28" class="text-berry" />
          <h3 class="mt-4 text-2xl">{{ m.title }}</h3>
          <p class="mt-2 leading-relaxed text-ink-soft">{{ m.text }}</p>
        </li>
      </ul>
    </section>

    <section class="container-page py-12 lg:py-16" aria-labelledby="about-process">
      <SectionHead id="about-process" eyebrow="Как всё устроено" title="Путь одного изделия" />
      <ol class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="s in process" :key="s.n" class="rounded-card border border-line bg-white p-7">
          <span class="grid size-10 place-items-center rounded-full bg-ink font-display text-lg text-paper">{{ s.n }}</span>
          <h3 class="mt-4 text-xl">{{ s.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-ink-soft">{{ s.text }}</p>
        </li>
      </ol>
    </section>

    <section class="container-page py-12 lg:py-16" aria-labelledby="about-values">
      <div class="rounded-[2rem] bg-cream px-6 py-12 sm:px-12">
        <SectionHead id="about-values" eyebrow="Что для меня важно" title="Мои принципы" />
        <dl class="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2">
          <div v-for="v in values" :key="v.title" class="border-t border-ink/15 pt-5">
            <dt class="font-display text-xl">{{ v.title }}</dt>
            <dd class="mt-1.5 leading-relaxed text-ink-soft">{{ v.text }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <section v-if="fandoms.length" class="container-page py-12 lg:py-16" aria-labelledby="about-fandoms">
      <SectionHead id="about-fandoms" eyebrow="Вдохновение" title="Миры, в которые я влюблена" />
      <ul class="mt-6 flex flex-wrap gap-3">
        <li v-for="f in fandoms" :key="f.id">
          <NuxtLink :to="{ path: '/catalog', query: { fandom: f.id } }" class="chip no-underline">
            <AppIcon name="sparkle" :size="12" class="text-berry" /> {{ f.label }}
          </NuxtLink>
        </li>
      </ul>
    </section>

    <section class="container-page pt-12 lg:pt-16">
      <div class="rounded-[2rem] bg-ink px-6 py-14 text-center text-paper sm:px-12">
        <h2 class="text-3xl sm:text-5xl">Хотите что-то <span class="font-display italic text-rose">особенное</span>?</h2>
        <p class="mx-auto mt-4 max-w-xl text-paper/80">Выберите изделие из каталога или напишите мне: обсудим вашу идею и придумаем, как её связать.</p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <NuxtLink to="/catalog" class="btn bg-paper text-ink no-underline hover:bg-rose">В каталог</NuxtLink>
          <a :href="TELEGRAM_URL" target="_blank" rel="noopener noreferrer" class="btn border-2 border-paper/70 text-paper no-underline hover:bg-paper hover:text-ink">
            <AppIcon name="telegram" :size="18" /> {{ CONTACT_LABEL }}
          </a>
        </div>
      </div>
    </section>
  </div>
</template>
