<script setup lang="ts">
import { OWNER_NAME, TELEGRAM_URL } from '#shared/utils/site'

/**
 * Окно с готовым сообщением для Дани: скопировать и открыть Telegram.
 * Ничего не отправляется автоматически, а сообщение видно целиком до любого действия.
 */
const props = defineProps<{
  title: string
  intro?: string
  text: string
  /** Если задано, текст можно править перед копированием. */
  editable?: boolean
  ids?: { text: string, copy: string, open: string }
}>()
const emit = defineEmits<{ 'update:text': [value: string] }>()

const dialog = ref<HTMLDialogElement>()
const area = ref<HTMLTextAreaElement>()
const copied = ref(false)
const copyFailed = ref(false)
const testIds = computed(() => props.ids ?? { text: 'message-text', copy: 'copy-message', open: 'open-telegram-message' })

function open() {
  copied.value = false
  copyFailed.value = false
  dialog.value?.showModal()
}
const close = () => dialog.value?.close()

async function copy() {
  copyFailed.value = false
  try {
    await navigator.clipboard.writeText(props.text)
    copied.value = true
  }
  catch {
    // Нет доступа к буферу обмена: выделяем текст, чтобы скопировать вручную.
    area.value?.focus()
    area.value?.select()
    copyFailed.value = true
  }
}
const titleId = useId()
defineExpose({ open, close })
</script>

<template>
  <dialog
    ref="dialog"
    class="modal m-auto w-[min(92vw,38rem)] rounded-[1.75rem] bg-canvas p-0 text-fg shadow-soft"
    :aria-labelledby="titleId"
    @click="(e) => e.target === dialog && close()"
  >
    <div class="p-6 sm:p-8">
      <div class="flex items-start justify-between gap-4">
        <h2 :id="titleId" class="text-3xl">{{ title }}</h2>
        <button type="button" class="grid size-11 shrink-0 place-items-center rounded-full hover:bg-raised" aria-label="Закрыть" @click="close">
          <AppIcon name="close" :size="22" />
        </button>
      </div>
      <p class="mt-2 text-sm text-fg-muted">
        {{ intro ?? `Мы ничего не отправляем автоматически. Скопируйте текст, откройте Telegram и отправьте его сообщением: дальше ${OWNER_NAME} ответит вам лично.` }}
      </p>

      <label :for="`${titleId}-text`" class="sr-only">Текст сообщения</label>
      <textarea
        :id="`${titleId}-text`" ref="area" :value="text" :readonly="!editable" rows="9"
        class="field mt-5 resize-none py-3 font-mono text-[0.8rem] leading-relaxed" :data-testid="testIds.text"
        @input="emit('update:text', ($event.target as HTMLTextAreaElement).value)"
      />

      <div class="mt-5 flex flex-col gap-3 sm:flex-row">
        <button type="button" class="btn btn-soft flex-1" :data-testid="testIds.copy" @click="copy">
          <AppIcon :name="copied ? 'check' : 'copy'" :size="18" /> {{ copied ? 'Скопировано' : '1. Скопировать сообщение' }}
        </button>
        <a :href="TELEGRAM_URL" target="_blank" rel="noopener noreferrer" class="btn btn-primary flex-1 no-underline" :data-testid="testIds.open">
          <AppIcon name="telegram" :size="18" /> 2. Открыть Telegram
        </a>
      </div>
      <p v-if="copyFailed" class="mt-3 text-sm font-semibold text-link" role="status">
        Не удалось скопировать автоматически — текст выделен, нажмите Ctrl/⌘ + C.
      </p>
    </div>
  </dialog>
</template>
