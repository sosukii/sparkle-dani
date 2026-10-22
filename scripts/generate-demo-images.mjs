// Временные картинки-заглушки для демо-товаров: нейтральный «вязаный» узор в цвете изделия, без текста и без лиц.
// Это НЕ фотографии изделий; настоящие фото Дани заменяют их, см. docs/DATA.md.
// Запуск: node scripts/generate-demo-images.mjs (пересоздаёт public/images/products/*.jpg для товаров с placeholder: true).
import { readdirSync, readFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const taxonomy = JSON.parse(readFileSync(join(root, 'data/taxonomy.json'), 'utf8'))
const hexOf = (id) => taxonomy.colors.find((c) => c.id === id)?.hex ?? '#442d1c'
const W = 1200
const H = 1500

function mix(hex, amount) {
  const n = parseInt(hex.slice(1), 16)
  const ch = (shift) => Math.max(0, Math.min(255, Math.round(((n >> shift) & 255) + amount)))
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`
}

/** Узор из петель «ёлочкой»: scale задаёт размер петли (общий вид — мелкие, деталь — крупные). */
function svg(hex, scale) {
  const w = 24 * scale
  const h = 30 * scale
  const light = mix(hex, 38)
  const dark = mix(hex, -26)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <pattern id="k" width="${w}" height="${h}" patternUnits="userSpaceOnUse">
      <rect width="${w}" height="${h}" fill="${hex}"/>
      <path d="M${w * 0.1} ${h * 0.05} L${w * 0.5} ${h * 0.5} L${w * 0.9} ${h * 0.05}" fill="none" stroke="${light}" stroke-width="${scale * 4.5}" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M${w * 0.1} ${h * 0.55} L${w * 0.5} ${h} L${w * 0.9} ${h * 0.55}" fill="none" stroke="${light}" stroke-width="${scale * 4.5}" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M${w * 0.1} ${h * 0.12} L${w * 0.5} ${h * 0.57} L${w * 0.9} ${h * 0.12}" fill="none" stroke="${dark}" stroke-width="${scale * 1.6}" stroke-linecap="round" stroke-linejoin="round"/>
    </pattern>
    <radialGradient id="v" cx="50%" cy="45%" r="75%">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.55"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#k)"/>
  <rect width="${W}" height="${H}" fill="url(#v)"/>
</svg>`
}

const dir = join(root, 'data/products')
const out = join(root, 'public/images/products')
mkdirSync(out, { recursive: true })
let count = 0
for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const product = JSON.parse(readFileSync(join(dir, file), 'utf8'))
  const hex = hexOf(product.colors?.[0])
  for (const image of product.images) {
    if (!image.placeholder) continue
    const name = image.src.split('/').pop()
    await sharp(Buffer.from(svg(hex, image.kind === "detail" ? 2.6 : 1.2))).jpeg({ quality: 62, mozjpeg: true }).toFile(join(out, name))
    count++
  }
}
console.log(`[demo-images] создано: ${count}`)
