<script setup lang="ts">
import { buildOrderText, type CartLine } from '#shared/utils/cart'
import { OWNER_NAME, TELEGRAM_URL } from '#shared/utils/site'

const props = defineProps<{ lines: CartLine[] }>()
const dialog = ref<HTMLDialogElement>()
const area = ref<HTMLTextAreaElement>()
const copied = ref(false)
const copyFailed = ref(false)
const siteUrl = useSiteUrl()

const text = computed(() => buildOrderText(props.lines, siteUrl))

function open() {
  copied.value = false
  copyFailed.value = false
  dialog.value?.showModal()
}
const close = () => dialog.value?.close()

async function copy() {
  copyFailed.value = false
  try {
    await navigator.clipboard.writeText(text.value)
    copied.value = true
  }
  catch {
    // Нет доступа к буферу обмена: выделяем текст, чтобы скопировать вручную.
    area.value?.focus()
    area.value?.select()
    copyFailed.value = true
  }
}
defineExpose({ open })
</script>

<template>
  <dialog
    ref="dialog"
    class="modal m-auto w-[min(92vw,38rem)] rounded-[1.75rem] bg-paper p-0 text-ink shadow-soft"
    aria-labelledby="order-title"
    @click="(e) => e.target === dialog && close()"
  >
    <div class="p-6 sm:p-8">
      <div class="flex items-start justify-between gap-4">
        <h2 id="order-title" class="text-3xl">Ваш заказ для {{ OWNER_NAME }}</h2>
        <button type="button" class="grid size-11 shrink-0 place-items-center rounded-full hover:bg-cream" aria-label="Закрыть" @click="close">
          <AppIcon name="close" :size="22" />
        </button>
      </div>
      <p class="mt-2 text-sm text-ink-soft">
        Мы ничего не отправляем автоматически. Скопируйте текст, откройте Telegram и отправьте его сообщением — дальше {{ OWNER_NAME }} ответит вам лично.
      </p>

      <label for="order-text" class="sr-only">Текст заказа</label>
      <textarea
        id="order-text" ref="area" :value="text" readonly rows="9"
        class="field mt-5 resize-none py-3 font-mono text-[0.8rem] leading-relaxed" data-testid="order-text"
      />

      <div class="mt-5 flex flex-col gap-3 sm:flex-row">
        <button type="button" class="btn btn-soft flex-1" data-testid="copy-order" @click="copy">
          <AppIcon :name="copied ? 'check' : 'copy'" :size="18" /> {{ copied ? 'Скопировано' : '1. Скопировать заказ' }}
        </button>
        <a :href="TELEGRAM_URL" target="_blank" rel="noopener noreferrer" class="btn btn-primary flex-1 no-underline" data-testid="open-telegram">
          <AppIcon name="telegram" :size="18" /> 2. Открыть Telegram
        </a>
      </div>
      <p v-if="copyFailed" class="mt-3 text-sm font-semibold text-berry" role="status">
        Не удалось скопировать автоматически — текст выделен, нажмите Ctrl/⌘ + C.
      </p>
    </div>
  </dialog>
</template>
