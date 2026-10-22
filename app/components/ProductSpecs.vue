<script setup lang="ts">
import type { ProductLabels } from '#shared/types/catalog-data'
import type { Product } from '#shared/types/product'
import { OWNER_NAME, TELEGRAM_URL } from '#shared/utils/site'

/**
 * Характеристики: показываем только то, что известно, а неизвестное называем неизвестным
 * и предлагаем уточнить у Дани. Пояснения лежат рядом с характеристикой и раскрываются по запросу.
 */
const props = defineProps<{ product: Product, labels: ProductLabels, slug: string }>()
const emit = defineEmits<{ ask: [topic: string] }>()

const composition = computed(() =>
  props.labels.composition?.map((m) => (m.percent ? `${m.percent}% ${m.title.toLowerCase()}` : m.title.toLowerCase())).join(', ') ?? null,
)
const sizes = computed(() => props.labels.sizes?.map((s) => s.label).join(', ') ?? null)
</script>

<template>
  <section aria-labelledby="product-facts" data-testid="product-specs">
    <h2 id="product-facts" class="text-2xl">Характеристики</h2>
    <dl class="mt-4 divide-y divide-line rounded-card border border-line bg-surface text-sm">
      <div v-if="labels.type" class="grid grid-cols-[7.5rem_1fr] gap-4 px-5 py-3 sm:grid-cols-[10rem_1fr]">
        <dt class="font-semibold text-fg-muted">Тип</dt>
        <dd class="font-semibold">{{ labels.type }}</dd>
      </div>

      <div v-if="labels.fit" class="grid grid-cols-[7.5rem_1fr] gap-4 px-5 py-3 sm:grid-cols-[10rem_1fr]" data-testid="spec-fit">
        <dt class="font-semibold text-fg-muted">Посадка</dt>
        <dd>
          <span class="font-semibold">{{ labels.fit.label }}</span>
          <span v-if="product.fitNote" class="mt-1 block text-fg-muted">{{ product.fitNote }}</span>
          <Explainer v-if="labels.fit.hint" label="Что это значит?">
            <p>{{ labels.fit.hint }}</p>
          </Explainer>
        </dd>
      </div>

      <div class="grid grid-cols-[7.5rem_1fr] gap-4 px-5 py-3 sm:grid-cols-[10rem_1fr]" data-testid="spec-composition">
        <dt class="font-semibold text-fg-muted">Состав</dt>
        <dd>
          <template v-if="composition">
            <span class="font-semibold">{{ composition }}</span>
            <Explainer label="Что означает такой состав?">
              <p v-for="m in labels.composition" :key="m.id"><strong class="text-fg">{{ m.title }}.</strong> {{ m.summary }}</p>
              <p>
                Это общие сведения о материалах, а не обещания про это изделие. По составу нельзя точно сказать, насколько изделие тёплое,
                будет ли оно колоться или давать катышки: это зависит от пряжи, плотности вязки и кроя. Если это важно, спросите {{ OWNER_NAME }}.
              </p>
              <p>
                <NuxtLink :to="{ path: '/info/materials', query: { from: slug } }" class="font-semibold text-link underline underline-offset-4" data-testid="materials-more">Подробнее о материалах и уходе</NuxtLink>
              </p>
            </Explainer>
          </template>
          <template v-else>
            <span class="text-fg-muted" data-testid="composition-unknown">Состав пока не указан.</span>
            <button type="button" class="ml-1 inline-flex min-h-9 items-center font-semibold text-link underline underline-offset-4" @click="emit('ask', 'состав изделия')">Уточнить у {{ OWNER_NAME }}</button>
          </template>
        </dd>
      </div>

      <div v-if="sizes || !labels.sizes" class="grid grid-cols-[7.5rem_1fr] gap-4 px-5 py-3 sm:grid-cols-[10rem_1fr]" data-testid="spec-sizes">
        <dt class="font-semibold text-fg-muted">{{ labels.sizes && labels.sizes.length === 1 ? 'Размер' : 'Размеры' }}</dt>
        <dd>
          <span v-if="sizes" class="font-semibold">{{ sizes }}</span>
          <template v-else>
            <span class="text-fg-muted">Размеры пока не указаны.</span>
            <button type="button" class="ml-1 inline-flex min-h-9 items-center font-semibold text-link underline underline-offset-4" @click="emit('ask', 'какие размеры доступны')">Уточнить у {{ OWNER_NAME }}</button>
          </template>
        </dd>
      </div>

      <div v-if="labels.colors.length" class="grid grid-cols-[7.5rem_1fr] gap-4 px-5 py-3 sm:grid-cols-[10rem_1fr]">
        <dt class="font-semibold text-fg-muted">{{ labels.colors.length > 1 ? 'Цвета' : 'Цвет' }}</dt>
        <dd class="flex flex-wrap items-center gap-x-4 gap-y-1 font-semibold">
          <span v-for="c in labels.colors" :key="c.id" class="inline-flex items-center gap-2">
            <span class="size-4 rounded-full border border-line-strong" :style="{ backgroundColor: c.hex }" aria-hidden="true" />{{ c.label }}
          </span>
        </dd>
      </div>

      <div v-for="row in product.attributes" :key="row.label" class="grid grid-cols-[7.5rem_1fr] gap-4 px-5 py-3 sm:grid-cols-[10rem_1fr]">
        <dt class="font-semibold text-fg-muted">{{ row.label }}</dt>
        <dd class="font-semibold">{{ row.value }}</dd>
      </div>
    </dl>
    <p class="mt-3 text-xs text-fg-muted">
      Нужно что-то ещё? <a :href="TELEGRAM_URL" target="_blank" rel="noopener noreferrer" class="font-semibold text-link underline underline-offset-4">Напишите {{ OWNER_NAME }}</a>.
    </p>
  </section>
</template>
