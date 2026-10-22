import { defineStore } from 'pinia'
import {
  addLine,
  cartTotals,
  reconcileLines,
  removeLine,
  setLineQty,
  isOrderable,
  toCartLine,
  type CartLine,
} from '#shared/utils/cart'
import { MAX_QTY_PER_LINE } from '#shared/utils/site'
import type { Product } from '#shared/types/product'

const STORAGE_KEY = 'sparkle-dani:cart:v1'

interface Notice {
  id: number
  text: string
  tone: 'success' | 'info'
}

/** Проверяет данные из localStorage: битые позиции молча отбрасываются, а не ломают сайт. */
function sanitize(input: unknown): CartLine[] {
  if (!Array.isArray(input)) return []
  const lines: CartLine[] = []
  for (const raw of input) {
    const l = raw as Partial<CartLine> | null
    if (
      !l
      || typeof l.productId !== 'string'
      || typeof l.slug !== 'string'
      || typeof l.title !== 'string'
      || typeof l.price !== 'number'
      || !Number.isFinite(l.price)
      || typeof l.qty !== 'number'
      || !l.image
      || typeof l.image.src !== 'string'
      || (l.availability !== null && l.availability !== 'in_stock' && l.availability !== 'made_to_order')
    ) continue
    const qty = Math.min(Math.max(Math.floor(l.qty), 1), MAX_QTY_PER_LINE)
    lines.push({ ...(l as CartLine), qty })
  }
  return lines
}

export const useCartStore = defineStore('cart', () => {
  const lines = ref<CartLine[]>([])
  /** false на сервере и до монтирования: корзина живёт в localStorage, и мы не рисуем «пустую» раньше времени. */
  const hydrated = ref(false)
  const notice = ref<Notice | null>(null)
  let noticeTimer: ReturnType<typeof setTimeout> | undefined

  const totals = computed(() => cartTotals(lines.value))
  const count = computed(() => totals.value.count)
  const total = computed(() => totals.value.total)

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines.value))
    }
    catch {
      // Приватный режим или переполнение: корзина продолжит работать в рамках вкладки.
    }
  }

  function readStorage(): CartLine[] {
    try {
      return sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'))
    }
    catch {
      return []
    }
  }

  function hydrate() {
    if (hydrated.value) return
    lines.value = readStorage()
    hydrated.value = true
    watch(lines, persist, { deep: true })
    // Синхронизация между вкладками.
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY) lines.value = readStorage()
    })
  }

  function say(text: string, tone: Notice['tone'] = 'success') {
    clearTimeout(noticeTimer)
    notice.value = { id: Date.now(), text, tone }
    noticeTimer = setTimeout(() => (notice.value = null), 3500)
  }

  function add(product: Product, qty = 1) {
    if (!isOrderable(product)) return { lines: lines.value, added: 0, limited: false }
    const result = addLine(lines.value, toCartLine(product), qty)
    lines.value = result.lines
    if (result.added === 0) say('Больше нет в наличии: всё доступное уже в корзине', 'info')
    else if (result.limited) say(`Добавлено ${result.added} — больше в наличии нет`, 'info')
    else say('Добавлено в корзину')
    return result
  }

  function setQty(productId: string, qty: number) {
    lines.value = setLineQty(lines.value, productId, qty)
  }

  function remove(productId: string) {
    lines.value = removeLine(lines.value, productId)
  }

  function clear() {
    lines.value = []
  }

  function quantityOf(productId: string): number {
    return lines.value.find((l) => l.productId === productId)?.qty ?? 0
  }

  /** Подтягивает актуальные цены и остатки из каталога. */
  async function refresh() {
    if (!lines.value.length) return
    try {
      const catalog = await loadCatalog()
      lines.value = reconcileLines(lines.value, catalog.products)
    }
    catch {
      // Нет сети — показываем сохранённые данные.
    }
  }

  return { lines, hydrated, notice, count, total, hydrate, add, setQty, remove, clear, quantityOf, refresh }
})
