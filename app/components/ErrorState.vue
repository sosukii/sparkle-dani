<script setup lang="ts">
defineProps<{ title?: string, text?: string }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="grid place-items-center rounded-card border border-line-strong bg-raised px-6 py-14 text-center" role="alert" data-testid="error-state">
    <AppIcon name="alert" :size="30" class="text-link" />
    <h2 class="mt-4 text-2xl">{{ title ?? 'Не удалось загрузить' }}</h2>
    <p class="mt-2 max-w-md text-fg-muted">{{ text ?? 'Что-то пошло не так. Проверьте соединение и попробуйте ещё раз.' }}</p>
    <button type="button" class="btn btn-primary mt-6" @click="$emit('retry')">Повторить</button>
  </div>
</template>
