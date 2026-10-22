<script setup lang="ts">
/** Выбор размера. Выбранное значение хранит страница, поэтому оно не теряется при открытии справки. */
defineProps<{ sizes: { id: string, label: string }[], modelValue: string | null, invalid?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: string], help: [] }>()
const name = useId()
</script>

<template>
  <fieldset class="min-w-0" data-testid="size-picker">
    <legend class="mb-3 flex w-full flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <span class="font-display text-lg">Размер</span>
      <button type="button" class="min-h-11 text-sm font-semibold text-link underline underline-offset-4" data-testid="size-help" @click="emit('help')">
        Как выбрать размер?
      </button>
    </legend>
    <div class="flex flex-wrap gap-2">
      <label v-for="s in sizes" :key="s.id" class="relative cursor-pointer">
        <input
          type="radio" :name="name" :value="s.id" :checked="modelValue === s.id"
          class="peer absolute inset-0 size-full cursor-pointer opacity-0" :data-testid="`size-${s.id}`"
          @change="emit('update:modelValue', s.id)"
        >
        <span class="inline-flex min-h-11 min-w-14 items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-link">
          {{ s.label }}
        </span>
      </label>
    </div>
    <p v-if="invalid" class="mt-2 text-sm font-semibold text-danger" role="alert" data-testid="size-required">Выберите размер, чтобы добавить изделие в корзину.</p>
  </fieldset>
</template>
