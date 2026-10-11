<script setup lang="ts">
/**
 * Двойной ползунок «от — до» на двух нативных <input type="range"> (клавиатура и скринридеры работают из коробки).
 * Во время перетаскивания шлёт `update:*` (поля цены обновляются сразу), по отпусканию — `commit`.
 */
const props = defineProps<{ min: number, max: number, step: number, low: number, high: number }>()
const emit = defineEmits<{ 'update:low': [value: number], 'update:high': [value: number], 'commit': [] }>()

const span = computed(() => Math.max(props.max - props.min, 1))
const fraction = (value: number) => Math.min(Math.max((value - props.min) / span.value, 0), 1)
// Если оба бегунка у правого края, верхним должен быть левый — иначе его не вытащить.
const lowOnTop = computed(() => props.low > props.min + span.value / 2)
const text = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`
</script>

<template>
  <div
    class="price-range"
    :style="{ '--lo': fraction(low), '--hi': fraction(high) }"
    data-testid="price-range"
  >
    <div class="price-range__track" aria-hidden="true"><div class="price-range__fill" /></div>
    <input
      type="range" :min="min" :max="max" :step="step" :value="low"
      aria-label="Минимальная цена" :aria-valuetext="`от ${text(low)}`" data-testid="price-slider-min"
      :style="{ zIndex: lowOnTop ? 5 : 3 }"
      @input="emit('update:low', Number(($event.target as HTMLInputElement).value))"
      @change="emit('commit')"
    >
    <input
      type="range" :min="min" :max="max" :step="step" :value="high"
      aria-label="Максимальная цена" :aria-valuetext="`до ${text(high)}`" data-testid="price-slider-max"
      :style="{ zIndex: lowOnTop ? 3 : 5 }"
      @input="emit('update:high', Number(($event.target as HTMLInputElement).value))"
      @change="emit('commit')"
    >
  </div>
</template>
