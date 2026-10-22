<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const is404 = computed(() => props.error.statusCode === 404)

useHead({ title: () => (is404.value ? 'Страница не найдена' : 'Что-то пошло не так') })
useSeoMeta({ robots: 'noindex, nofollow' })

const handle = () => clearError({ redirect: '/' })
</script>

<template>
  <NuxtLayout>
    <section class="container-page grid min-h-[60vh] place-items-center py-20 text-center" data-testid="error-page">
      <div class="max-w-xl">
        <p class="eyebrow">{{ is404 ? 'Ошибка 404' : `Ошибка ${error.statusCode ?? ''}` }}</p>
        <h1 class="mt-4 text-5xl sm:text-6xl">
          {{ is404 ? 'Такой страницы' : 'Что-то' }}
          <span class="em-accent">{{ is404 ? 'у нас нет' : 'пошло не так' }}</span>
        </h1>
        <p class="mt-5 text-lg text-fg-muted">
          {{ is404 ? 'Возможно, ссылка устарела или изделия больше нет в каталоге. Загляните в каталог: там можно найти похожее.' : 'Мы уже в курсе. Попробуйте обновить страницу или вернуться на главную.' }}
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <NuxtLink to="/catalog" class="btn btn-primary no-underline" @click="handle">В каталог</NuxtLink>
          <button type="button" class="btn btn-ghost" @click="handle">На главную</button>
        </div>
      </div>
    </section>
  </NuxtLayout>
</template>
