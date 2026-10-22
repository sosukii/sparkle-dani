<script setup lang="ts">
import { CONTACT_LABEL, OWNER_NAME, TELEGRAM_URL } from '#shared/utils/site'

/** Приглашение задать вопрос: размер, оттенок, наличие. Ничего не отправляет и не навязывает. */
withDefaults(defineProps<{ title?: string, text?: string }>(), {
  title: 'Не нашли свой размер или оттенок?',
  text: undefined,
})
</script>

<template>
  <aside class="rounded-card border border-line bg-surface px-6 py-8 sm:px-10" aria-labelledby="ask-title" data-testid="ask-banner">
    <div class="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <h2 id="ask-title" class="text-2xl sm:text-3xl">{{ title }}</h2>
        <p class="mt-2 max-w-xl text-fg-muted">
          {{ text ?? `Напишите ${OWNER_NAME}: можно уточнить размер, наличие и сроки или обсудить изделие по своим меркам. Это обычное сообщение в Telegram, оплата на сайте не требуется.` }}
        </p>
      </div>
      <div class="flex flex-wrap gap-3">
        <a :href="TELEGRAM_URL" target="_blank" rel="noopener noreferrer" class="btn btn-primary no-underline">
          <AppIcon name="telegram" :size="18" /> {{ CONTACT_LABEL }}
        </a>
        <NuxtLink to="/custom" class="btn btn-ghost no-underline">Свой заказ</NuxtLink>
      </div>
    </div>
  </aside>
</template>
