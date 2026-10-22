import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/** Токены читаются прямо из CSS: тест ловит ухудшение контраста при любой правке палитры. */
const css = readFileSync(resolve(process.cwd(), 'app/assets/css/main.css'), 'utf8')
const token = (name: string) => {
  const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!m) throw new Error(`Нет токена --color-${name}`)
  return m[1]!
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

const TEXT_ON: Array<[string, string]> = [
  ['fg', 'canvas'], ['fg', 'surface'], ['fg', 'raised'], ['fg', 'high'],
  ['fg-muted', 'canvas'], ['fg-muted', 'surface'], ['fg-muted', 'raised'], ['fg-muted', 'high'],
  ['link', 'canvas'], ['link', 'surface'], ['link', 'raised'],
  ['gold', 'canvas'], ['gold', 'surface'], ['gold', 'raised'],
  ['olive', 'canvas'],
  ['fg', 'accent'], ['fg', 'accent-hover'],
  ['danger', 'canvas'], ['fg', 'danger-bg'],
]
const UI_ON: Array<[string, string]> = [['line-strong', 'canvas'], ['line-strong', 'surface']]

describe('контраст палитры (WCAG AA)', () => {
  it.each(TEXT_ON)('текст %s на %s ≥ 4.5:1', (fg, bg) => {
    expect(ratio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5)
  })
  it.each(UI_ON)('граница/значок %s на %s ≥ 3:1', (fg, bg) => {
    expect(ratio(token(fg), token(bg))).toBeGreaterThanOrEqual(3)
  })
})
