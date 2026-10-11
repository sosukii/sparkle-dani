// Готовит адаптивные версии картинок для статического хостинга: AVIF, WebP и JPEG нескольких ширин.
// Исходники: public/images/**  →  результат: public/_img/**  (в git не хранится, собирается перед dev/build/generate).
// Уже готовые файлы пропускаются, поэтому повторный запуск быстрый.
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { dirname, extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const sharp = require('sharp')

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(root, 'public/images')
const OUT = join(root, 'public/_img')
const WIDTHS = [360, 640, 960, 1200]
const QUALITY = { avif: 80, webp: 82, jpeg: 82 }

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) yield* walk(full)
    else if (['.jpg', '.jpeg', '.png'].includes(extname(name).toLowerCase())) yield full
  }
}

if (!existsSync(SRC)) process.exit(0)

const jobs = []
for (const file of walk(SRC)) {
  const rel = relative(SRC, file).replace(/\.[^.]+$/, '')
  const { width } = await sharp(file).metadata()
  const widths = [...new Set(WIDTHS.filter((w) => w < width).concat(Math.min(width, WIDTHS.at(-1))))]
  for (const w of widths) {
    for (const format of ['avif', 'webp', 'jpeg']) {
      const target = join(OUT, `${rel}-w${w}.${format === 'jpeg' ? 'jpg' : format}`)
      if (existsSync(target) && statSync(target).mtimeMs >= statSync(file).mtimeMs) continue
      jobs.push({ file, target, w, format })
    }
  }
}

if (jobs.length === 0) {
  console.log('[images] всё актуально')
  process.exit(0)
}

console.log(`[images] готовлю ${jobs.length} файлов…`)
let done = 0
const queue = [...jobs]
async function worker() {
  while (queue.length) {
    const { file, target, w, format } = queue.shift()
    mkdirSync(dirname(target), { recursive: true })
    const image = sharp(file).resize({ width: w, withoutEnlargement: true })
    if (format === 'avif') await image.avif({ quality: QUALITY.avif, effort: 4 }).toFile(target)
    else if (format === 'webp') await image.webp({ quality: QUALITY.webp }).toFile(target)
    else await image.jpeg({ quality: QUALITY.jpeg, mozjpeg: true }).toFile(target)
    if (++done % 200 === 0) console.log(`[images] ${done}/${jobs.length}`)
  }
}
await Promise.all(Array.from({ length: 4 }, worker))
console.log(`[images] готово: ${done} файлов`)
