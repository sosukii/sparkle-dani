<script setup lang="ts">
import { buildOrderText, type CartLine } from '#shared/utils/cart'
import { OWNER_NAME } from '#shared/utils/site'

const props = defineProps<{ lines: CartLine[] }>()
const dialog = ref<{ open: () => void }>()
const siteUrl = useSiteUrl()
const text = computed(() => buildOrderText(props.lines, siteUrl))

defineExpose({ open: () => dialog.value?.open() })
</script>

<template>
  <MessageDialog
    ref="dialog"
    :title="`Ваш заказ для ${OWNER_NAME}`"
    :text="text"
    :ids="{ text: 'order-text', copy: 'copy-order', open: 'open-telegram' }"
  />
</template>
