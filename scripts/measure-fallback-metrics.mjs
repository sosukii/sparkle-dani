// Считает, как подогнать системные запасные шрифты (Times New Roman, Arial — метрически совместимые на всех ОС)
// под наши веб-шрифты, чтобы подмена шрифта не сдвигала вёрстку (CLS). Результат вставляется в app/assets/css/main.css.
// Запуск: npm run fonts && node scripts/measure-fallback-metrics.mjs
import { createRequire } from 'node:module'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require('@playwright/test')
const fonts = join(dirname(fileURLToPath(import.meta.url)), '../app/assets/fonts')
const url = (name) => pathToFileURL(join(fonts, name)).href

const SAMPLE = 'Вязаные друзья и тёплые мелочи для вашего мира. Игрушки амигуруми шарфы украшения и вещи для дома по мотивам любимых историй. Каждое изделие связано вручную. Серьги Шапка Варежки Плед Костер Браслет Сумка Косметичка Мишка Зайка Сова Лунный котик Лесной дух Свой заказ Покупка и доставка Обо мне Каталог Корзина'

const cases = [
  { name: 'Playfair normal 600', face: `@font-face{font-family:W;src:url(${url('playfair-cyrillic.woff2')});font-weight:400 900}`, web: '600 100px W', fb: '700 100px "Times New Roman"' },
  { name: 'Playfair italic 500', face: `@font-face{font-family:W;font-style:italic;src:url(${url('playfair-cyrillic-italic.woff2')});font-weight:400 900}`, web: 'italic 500 100px W', fb: 'italic 400 100px "Times New Roman"' },
  { name: 'Manrope 400', face: `@font-face{font-family:W;src:url(${url('manrope-cyrillic.woff2')});font-weight:200 800}`, web: '400 100px W', fb: '400 100px Arial' },
  { name: 'Manrope 700', face: `@font-face{font-family:W;src:url(${url('manrope-cyrillic.woff2')});font-weight:200 800}`, web: '700 100px W', fb: '700 100px Arial' },
]

const browser = await chromium.launch()
for (const c of cases) {
  const page = await browser.newPage()
  // Шрифты из file:// грузятся только со страницы с адресом file://, поэтому пишем временный HTML.
  const file = join(mkdtempSync(join(tmpdir(), 'fb-')), 'index.html')
  writeFileSync(file, `<style>${c.face}</style><body>x</body>`)
  await page.goto(pathToFileURL(file).href)
  const r = await page.evaluate(async ({ web, fb, sample }) => {
    await document.fonts.load(web, sample)
    const ctx = document.createElement('canvas').getContext('2d')
    const measure = (font) => { ctx.font = font; const m = ctx.measureText(sample); return { w: m.width, a: m.fontBoundingBoxAscent, d: m.fontBoundingBoxDescent } }
    return { web: measure(web), fb: measure(fb) }
  }, { web: c.web, fb: c.fb, sample: SAMPLE })
  const sizeAdjust = r.web.w / r.fb.w
  const pct = (v) => `${(v * 100).toFixed(2)}%`
  console.log(`${c.name.padEnd(22)} size-adjust: ${pct(sizeAdjust)}; ascent-override: ${pct(r.web.a / 100 / sizeAdjust)}; descent-override: ${pct(r.web.d / 100 / sizeAdjust)};`)
  await page.close()
}
await browser.close()
