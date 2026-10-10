/** Список для навигации по страницам: числа и «…» (null), всегда с первой и последней. */
export function buildPageList(current: number, total: number, siblings = 1): (number | null)[] {
  if (total <= 1) return [1]
  const pages = new Set<number>([1, total])
  for (let p = current - siblings; p <= current + siblings; p++) if (p >= 1 && p <= total) pages.add(p)
  const sorted = [...pages].sort((a, b) => a - b)
  const result: (number | null)[] = []
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1]
    if (prev !== undefined && p - prev === 2) result.push(prev + 1)
    else if (prev !== undefined && p - prev > 2) result.push(null)
    result.push(p)
  })
  return result
}
