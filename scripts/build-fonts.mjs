// Готовит облегчённые шрифты (только нужные символы) из пакетов @fontsource-variable → app/assets/fonts/ (в git не хранится).
// Кириллица берётся как есть, латиница урезается до букв, цифр и знаков препинания.
// Значка ₽ нет ни в Manrope, ни в Playfair — его рисует системный шрифт (поэтому файлы «latin-ext» не нужны вовсе).
import { createRequire } from 'node:module'
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(root, 'app/assets/fonts')
const pkg = (name) => dirname(require.resolve(`${name}/package.json`))
const manrope = join(pkg('@fontsource-variable/manrope'), 'files')
const playfair = join(pkg('@fontsource-variable/playfair-display'), 'files')

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => String.fromCodePoint(from + i)).join('')
// Должно совпадать с unicode-range в app/assets/css/main.css
const LATIN = range(0x20, 0x7e) + range(0xa0, 0xbf) + '×' + range(0x2010, 0x2015) + range(0x2018, 0x201e) + '•… −'

const jobs = [
  { out: 'manrope-cyrillic.woff2', copy: join(manrope, 'manrope-cyrillic-wght-normal.woff2') },
  { out: 'manrope-latin.woff2', src: join(manrope, 'manrope-latin-wght-normal.woff2'), text: LATIN },
  { out: 'playfair-cyrillic.woff2', copy: join(playfair, 'playfair-display-cyrillic-wght-normal.woff2') },
  { out: 'playfair-cyrillic-italic.woff2', copy: join(playfair, 'playfair-display-cyrillic-wght-italic.woff2') },
  { out: 'playfair-latin.woff2', src: join(playfair, 'playfair-display-latin-wght-normal.woff2'), text: LATIN },
  { out: 'playfair-latin-italic.woff2', src: join(playfair, 'playfair-display-latin-wght-italic.woff2'), text: LATIN },
]

mkdirSync(OUT, { recursive: true })
const pending = jobs.filter((j) => !existsSync(join(OUT, j.out)) || statSync(join(OUT, j.out)).mtimeMs < statSync(j.copy ?? j.src).mtimeMs)
if (pending.length === 0) {
  console.log('[fonts] всё актуально')
  process.exit(0)
}

const subsetFont = (await import(require.resolve('subset-font'))).default
for (const job of pending) {
  const target = join(OUT, job.out)
  if (job.copy) copyFileSync(job.copy, target)
  else writeFileSync(target, await subsetFont(readFileSync(job.src), job.text, { targetFormat: 'woff2' }))
}
console.log(`[fonts] готово: ${pending.length} файлов`)
