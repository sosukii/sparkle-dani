<script setup lang="ts">
const props = withDefaults(defineProps<{ modelValue: number, min?: number, max: number, label?: string }>(), { min: 1, label: 'Количество' })
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const clamp = (n: number) => Math.min(props.max, Math.max(props.min, Math.floor(Number.isFinite(n) ? n : props.min)))
const set = (n: number) => emit('update:modelValue', clamp(n))
const onInput = (event: Event) => {
  const el = event.target as HTMLInputElement
  set(Number(el.value))
  el.value = String(clamp(Number(el.value)))
}
</script>

<template>
  <div class="inline-flex items-center rounded-full border border-line bg-surface" role="group" :aria-label="label">
    <button
      type="button" class="grid size-11 place-items-center rounded-full hover:bg-raised disabled:opacity-40"
      :disabled="modelValue <= min" aria-label="Уменьшить количество" data-testid="qty-minus" @click="set(modelValue - 1)"
    >
      <AppIcon name="minus" :size="18" />
    </button>
    <input
      :value="modelValue" type="number" inputmode="numeric" :min="min" :max="max" :aria-label="label"
      class="h-11 w-12 appearance-none border-0 bg-transparent text-center text-base font-bold [-moz-appearance:textfield] focus:outline-none focus-visible:outline-link [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      data-testid="qty-input" @change="onInput"
    >
    <button
      type="button" class="grid size-11 place-items-center rounded-full hover:bg-raised disabled:opacity-40"
      :disabled="modelValue >= max" aria-label="Увеличить количество" data-testid="qty-plus" @click="set(modelValue + 1)"
    >
      <AppIcon name="plus" :size="18" />
    </button>
  </div>
</template>
