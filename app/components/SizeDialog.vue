<script setup lang="ts">
import type { ProductLabels, ModelInfo } from '#shared/types/catalog-data'

/** Справка по выбору размера: измерения изделия, как снять мерки, как читать таблицу. Выбор размера из неё сохраняется. */
const props = defineProps<{
  title: string
  slug: string
  labels: ProductLabels
  model: ModelInfo | null
  selected: string | null
}>()
const emit = defineEmits<{ select: [id: string], ask: [] }>()

const dialog = ref<HTMLDialogElement>()
const titleId = useId()
const columns = computed(() => props.labels.measurements?.[0]?.values.map((v) => ({ id: v.id, label: v.label })) ?? [])
const cell = (row: NonNullable<ProductLabels['measurements']>[number], id: string) => row.values.find((v) => v.id === id)?.cm

function open() { dialog.value?.showModal() }
const close = () => dialog.value?.close()
function choose(id: string) {
  emit('select', id)
  close()
}
defineExpose({ open, close })
</script>

<template>
  <dialog
    ref="dialog"
    class="modal m-auto w-[min(94vw,42rem)] max-h-[90dvh] overflow-y-auto rounded-[1.75rem] bg-canvas p-0 text-fg shadow-soft"
    :aria-labelledby="titleId"
    data-testid="size-dialog"
    @click="(e) => e.target === dialog && close()"
  >
    <div class="p-6 sm:p-8">
      <div class="flex items-start justify-between gap-4">
        <h2 :id="titleId" class="text-3xl">Как выбрать размер</h2>
        <button type="button" class="grid size-11 shrink-0 place-items-center rounded-full hover:bg-raised" aria-label="Закрыть" data-testid="size-dialog-close" @click="close">
          <AppIcon name="close" :size="22" />
        </button>
      </div>
      <p class="mt-1 text-sm text-fg-muted">{{ title }}</p>

      <section class="mt-6" aria-labelledby="size-table-title">
        <h3 id="size-table-title" class="text-xl">Размеры этого изделия</h3>
        <template v-if="labels.measurements">
          <div class="mt-3 overflow-x-auto rounded-md border border-line">
            <table class="w-full min-w-[22rem] text-left text-sm" data-testid="size-table">
              <caption class="sr-only">Измерения изделия в сантиметрах по размерам</caption>
              <thead class="bg-surface text-fg-muted">
                <tr>
                  <th scope="col" class="px-3 py-2 font-semibold">Размер</th>
                  <th v-for="c in columns" :key="c.id" scope="col" class="px-3 py-2 font-semibold">{{ c.label }}, см</th>
                  <th scope="col" class="px-3 py-2"><span class="sr-only">Выбрать</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in labels.measurements" :key="row.size.id" class="border-t border-line" :class="selected === row.size.id ? 'bg-raised' : ''">
                  <th scope="row" class="px-3 py-2 font-semibold">{{ row.size.label }}</th>
                  <td v-for="c in columns" :key="c.id" class="px-3 py-2">{{ cell(row, c.id) ?? '—' }}</td>
                  <td class="px-3 py-1 text-right">
                    <button type="button" class="btn btn-soft btn-sm" :data-testid="`size-choose-${row.size.id}`" :aria-label="`Выбрать размер ${row.size.label}`" @click="choose(row.size.id)">
                      {{ selected === row.size.id ? 'Выбран' : 'Выбрать' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="mt-2 text-xs text-fg-muted">Это размеры самого изделия: оно лежит ровно, измерения в сантиметрах.</p>
        </template>
        <p v-else class="mt-3 text-fg-muted" data-testid="size-no-measurements">
          Измерений этого изделия пока нет. Напишите Дани: она подскажет размер по вашим меркам.
          <button type="button" class="font-semibold text-link underline underline-offset-4" @click="close(); emit('ask')">Написать сообщение</button>
        </p>
        <p v-if="model" class="mt-3 text-sm" data-testid="size-model">
          На модели рост {{ model.heightCm }} см, размер {{ model.wearsSize.label }}.
        </p>
        <p v-if="labels.fit?.hint" class="mt-3 text-sm text-fg-muted">
          <strong class="text-fg">Посадка: {{ labels.fit.label.toLowerCase() }}.</strong> {{ labels.fit.hint }}
        </p>
      </section>

      <section class="mt-6" aria-labelledby="size-howto-title">
        <h3 id="size-howto-title" class="text-xl">Как сравнить со своими мерками</h3>
        <ol class="mt-3 list-decimal space-y-2 pl-5 text-fg-muted">
          <li>Возьмите вещь, которая сидит так, как вам нравится, и положите её ровно.</li>
          <li>Измерьте ширину по груди (от шва до шва под рукавами), длину от плеча до низа и длину рукава.</li>
          <li>Сравните с таблицей и выберите ближайший размер. Для более свободной посадки берите больше, для более облегающей — меньше.</li>
        </ol>
        <p class="mt-3 text-sm">
          <NuxtLink :to="{ path: '/info/sizes', query: { from: slug } }" class="font-semibold text-link underline underline-offset-4" data-testid="size-more">Подробнее о размерах и мерках</NuxtLink>
        </p>
      </section>

      <div class="mt-6 flex flex-wrap gap-3">
        <button type="button" class="btn btn-primary" @click="close">Вернуться к изделию</button>
        <button type="button" class="btn btn-ghost" @click="close(); emit('ask')">
          <AppIcon name="telegram" :size="18" /> Спросить Дани
        </button>
      </div>
    </div>
  </dialog>
</template>
