<script setup lang="ts">
import { buildPageList } from '#shared/utils/pagination'

const props = defineProps<{ page: number, totalPages: number, query: Record<string, string> }>()

const items = computed(() => buildPageList(props.page, props.totalPages))
const link = (page: number) => ({ query: { ...props.query, ...(page > 1 ? { page: String(page) } : { page: undefined }) } })
</script>

<template>
  <nav v-if="totalPages > 1" aria-label="Страницы каталога" class="mt-12 flex flex-wrap items-center justify-center gap-2">
    <NuxtLink
      v-if="page > 1" :to="link(page - 1)" class="chip no-underline" rel="prev" aria-label="Предыдущая страница"
    >
      <AppIcon name="arrow-left" :size="16" /> Назад
    </NuxtLink>
    <template v-for="(item, i) in items" :key="i">
      <span v-if="item === null" class="px-1 text-ink-soft" aria-hidden="true">…</span>
      <NuxtLink
        v-else
        :to="link(item)"
        class="chip min-w-10 justify-center no-underline"
        :data-active="item === page"
        :aria-current="item === page ? 'page' : undefined"
        :aria-label="`Страница ${item}`"
      >
        {{ item }}
      </NuxtLink>
    </template>
    <NuxtLink
      v-if="page < totalPages" :to="link(page + 1)" class="chip no-underline" rel="next" aria-label="Следующая страница"
    >
      Вперёд <AppIcon name="arrow-right" :size="16" />
    </NuxtLink>
  </nav>
</template>
