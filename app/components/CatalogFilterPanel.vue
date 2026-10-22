<script setup lang="ts">
import type { CatalogFilters, FacetOption, Facets } from '#shared/types/catalog'
import { formatPrice } from '#shared/utils/format'

type GroupKey = 'availability' | 'fandom' | 'type' | 'color' | 'warmth'
type Patch = Partial<Pick<CatalogFilters, GroupKey | 'minPrice' | 'maxPrice'>>

const props = defineProps<{ facets: Facets, filters: CatalogFilters, idPrefix: string }>()
const emit = defineEmits<{ update: [patch: Patch] }>()

const groups: { key: GroupKey, label: string }[] = [
  { key: 'availability', label: 'Наличие' },
  { key: 'fandom', label: 'Фандом' },
  { key: 'type', label: 'Тип изделия' },
  { key: 'color', label: 'Цвет' },
  { key: 'warmth', label: 'Теплота / сезон' },
]

// «Наличие» имеет смысл, только если в выборке есть оба варианта (или один уже выбран).
const visibleGroups = computed(() => groups.filter((g) => (g.key === 'availability' ? props.facets.availability.filter((o) => o.count > 0 || props.filters.availability.includes(o.id)).length > 1 || props.filters.availability.length > 0 : props.facets[g.key].length > 0)))

function toggle(key: GroupKey, id: string, checked: boolean) {
  const current = props.filters[key]
  emit('update', { [key]: checked ? [...current, id] : current.filter((x) => x !== id) })
}

const isSelected = (key: GroupKey, option: FacetOption) => props.filters[key].includes(option.id)
// Опции, после выбора которых ничего не найдётся, блокируем — чтобы не заводить пользователя в тупик.
const isDisabled = (key: GroupKey, option: FacetOption) => option.count === 0 && !isSelected(key, option)

// ── цена ──
const bounds = computed(() => {
  const price = props.facets.price
  if (!price) return null
  const range = price.max - price.min
  const step = range > 5000 ? 50 : range > 1000 ? 10 : 1
  return { min: Math.floor(price.min / step) * step, max: Math.ceil(price.max / step) * step, step }
})
// У <input type="number"> Vue отдаёт число (или пустую строку), поэтому храним оба варианта.
const minText = ref<string | number>(props.filters.minPrice?.toString() ?? '')
const maxText = ref<string | number>(props.filters.maxPrice?.toString() ?? '')
watch(() => [props.filters.minPrice, props.filters.maxPrice] as const, ([min, max]) => {
  minText.value = min?.toString() ?? ''
  maxText.value = max?.toString() ?? ''
})

const parsePrice = (value: string | number | null | undefined): number | undefined => {
  const text = String(value ?? '').trim()
  if (text === '') return undefined
  const n = Number(text)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined
}

let priceTimer: ReturnType<typeof setTimeout> | undefined
function schedulePrice() {
  clearTimeout(priceTimer)
  priceTimer = setTimeout(commitPrice, 600)
}
function commitPrice() {
  clearTimeout(priceTimer)
  let min = parsePrice(minText.value)
  let max = parsePrice(maxText.value)
  if (min !== undefined && max !== undefined && min > max) [min, max] = [max, min]
  if (min !== props.filters.minPrice || max !== props.filters.maxPrice) emit('update', { minPrice: min, maxPrice: max })
  else {
    minText.value = min?.toString() ?? ''
    maxText.value = max?.toString() ?? ''
  }
}
onBeforeUnmount(() => clearTimeout(priceTimer))

// Положение бегунков всегда считается из полей «от/до» — так они синхронизированы в обе стороны.
const lowValue = computed(() => {
  const b = bounds.value!
  return Math.min(Math.max(parsePrice(minText.value) ?? b.min, b.min), b.max)
})
const highValue = computed(() => {
  const b = bounds.value!
  return Math.min(Math.max(parsePrice(maxText.value) ?? b.max, b.min), b.max)
})
// Край диапазона = «без ограничения», поэтому поле очищается, а не заполняется крайним числом.
function onLow(value: number) {
  const v = Math.min(value, highValue.value)
  minText.value = v <= bounds.value!.min ? '' : v
}
function onHigh(value: number) {
  const v = Math.max(value, lowValue.value)
  maxText.value = v >= bounds.value!.max ? '' : v
}
</script>

<template>
  <div class="space-y-7">
    <fieldset v-if="facets.price" class="min-w-0">
      <legend class="mb-3 font-display text-lg">Цена, ₽</legend>
      <PriceRange
        v-if="bounds && bounds.max > bounds.min"
        class="mb-4"
        :min="bounds.min" :max="bounds.max" :step="bounds.step" :low="lowValue" :high="highValue"
        @update:low="onLow" @update:high="onHigh" @commit="commitPrice"
      />
      <div class="flex items-end gap-2">
        <div class="flex-1">
          <label :for="`${idPrefix}-min`" class="mb-1 block text-xs font-semibold text-fg-muted">От</label>
          <input
            :id="`${idPrefix}-min`" v-model="minText" type="number" inputmode="numeric" min="0" step="50"
            :placeholder="String(facets.price.min)" class="field" data-testid="price-min"
            :aria-describedby="`${idPrefix}-price-hint`"
            @input="schedulePrice" @change="commitPrice" @keydown.enter.prevent="commitPrice"
          >
        </div>
        <span class="pb-3 text-fg-muted" aria-hidden="true">—</span>
        <div class="flex-1">
          <label :for="`${idPrefix}-max`" class="mb-1 block text-xs font-semibold text-fg-muted">До</label>
          <input
            :id="`${idPrefix}-max`" v-model="maxText" type="number" inputmode="numeric" min="0" step="50"
            :placeholder="String(facets.price.max)" class="field" data-testid="price-max"
            :aria-describedby="`${idPrefix}-price-hint`"
            @input="schedulePrice" @change="commitPrice" @keydown.enter.prevent="commitPrice"
          >
        </div>
      </div>
      <p :id="`${idPrefix}-price-hint`" class="mt-2 text-xs text-fg-muted">
        В этом разделе: {{ formatPrice(facets.price.min) }} — {{ formatPrice(facets.price.max) }}
      </p>
    </fieldset>

    <fieldset v-for="group in visibleGroups" :key="group.key" class="min-w-0">
      <legend class="mb-3 font-display text-lg">{{ group.label }}</legend>

      <!-- Цвета: «таблетки» с цветной точкой -->
      <div v-if="group.key === 'color'" class="flex flex-wrap gap-2">
        <label
          v-for="option in facets.color" :key="option.id"
          class="relative cursor-pointer" :class="isDisabled('color', option) ? 'cursor-not-allowed opacity-40' : ''"
        >
          <input
            type="checkbox" class="peer absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed" :value="option.id" :checked="isSelected('color', option)"
            :disabled="isDisabled('color', option)" :data-testid="`filter-color-${option.id}`"
            @change="toggle('color', option.id, ($event.target as HTMLInputElement).checked)"
          >
          <span class="inline-flex min-h-9 items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold transition-colors peer-checked:border-line-strong peer-checked:bg-accent peer-checked:text-fg peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-link">
            <span class="size-4 rounded-full border border-line-strong" :style="{ backgroundColor: option.hex }" aria-hidden="true" />
            {{ option.label }}
            <span class="text-xs font-medium opacity-60">{{ option.count }}</span>
          </span>
        </label>
      </div>

      <!-- Остальные группы: чекбоксы -->
      <ul v-else class="space-y-1">
        <li v-for="option in facets[group.key]" :key="option.id">
          <label
            class="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-1 text-sm hover:bg-raised"
            :class="isDisabled(group.key, option) ? 'cursor-not-allowed opacity-45' : ''"
          >
            <input
              type="checkbox" class="size-5 shrink-0 accent-link" :value="option.id"
              :checked="isSelected(group.key, option)" :disabled="isDisabled(group.key, option)"
              :data-testid="`filter-${group.key}-${option.id}`"
              @change="toggle(group.key, option.id, ($event.target as HTMLInputElement).checked)"
            >
            <span class="flex-1 font-semibold">
              {{ option.label }}
              <span v-if="option.hint" class="block text-xs font-medium text-fg-muted">{{ option.hint }}</span>
            </span>
            <span class="text-xs text-fg-muted">{{ option.count }}</span>
          </label>
        </li>
      </ul>
    </fieldset>
  </div>
</template>
