// Встраивает главный CSS прямо в HTML статической сборки: браузеру не нужен отдельный запрос,
// чтобы начать рисовать страницу (экономит один сетевой круг на первом заходе; дальше сайт работает как SPA).
// Запускается после `nuxt generate`; серверную сборку и тесты не затрагивает.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('..', import.meta.url)), '.output-static/public')
const base = (process.env.NUXT_APP_BASE_URL || '/').replace(/\/?$/, '/')
const cssCache = new Map()
let changed = 0

function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      if (name !== '_nuxt' && name !== '_img' && name !== 'images') yield* htmlFiles(full)
    }
    else if (name.endsWith('.html')) yield full
  }
}

for (const file of htmlFiles(root)) {
  const html = readFileSync(file, 'utf8')
  // Тег вида <link rel="stylesheet" href="/…/_nuxt/entry.XXXX.css" crossorigin>
  const link = html.match(/<link rel="stylesheet" href="([^"]*\/_nuxt\/entry\.[^"]+\.css)"[^>]*>/)
  if (!link) continue
  const name = link[1].split('/_nuxt/')[1]
  if (!cssCache.has(name)) // В отдельном файле url(./шрифт.woff2) считался от самого CSS; внутри HTML путь нужно сделать абсолютным.
  cssCache.set(name, readFileSync(join(root, '_nuxt', name), 'utf8').replace(/url\(\.\//g, `url(${base}_nuxt/`).replace(/<\/style/gi, '<\\/style'))
  writeFileSync(file, html.replace(link[0], () => `<style>${cssCache.get(name)}</style>`))
  changed++
}
console.log(`[inline-css] встроен CSS в ${changed} HTML-файлов`)
