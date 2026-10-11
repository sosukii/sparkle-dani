// Мини-сервер, который ведёт себя как GitHub Pages: отдаёт статику из .output-static/public,
// /catalog → /catalog/ (301), неизвестные адреса → 404.html со статусом 404. Нужен для проверки статической сборки.
import { createServer } from 'node:http'
import { gzipSync } from 'node:zlib'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../.output-static/public')
const port = Number(process.env.PORT || 3100)
const base = (process.env.BASE_PATH || '/').replace(/\/?$/, '/')
// GitHub Pages сжимает текстовые ответы gzip — повторяем, чтобы замеры скорости были честными.
const compressible = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.xml', '.txt'])
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon' }

createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  if (!url.pathname.startsWith(base)) { res.writeHead(404); res.end('outside base'); return }
  const rel = decodeURIComponent(url.pathname.slice(base.length))
  let file = normalize(join(root, rel))
  if (!file.startsWith(root)) { res.writeHead(403); res.end(); return }
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!url.pathname.endsWith('/')) { res.writeHead(301, { location: `${url.pathname}/${url.search}` }); res.end(); return }
    file = join(file, 'index.html')
  }
  if (existsSync(file) && statSync(file).isFile()) {
    const type = extname(file)
    const headers = { 'content-type': types[type] || 'application/octet-stream' }
    let body = readFileSync(file)
    if (compressible.has(type) && String(req.headers['accept-encoding'] ?? '').includes('gzip')) {
      body = gzipSync(body)
      headers['content-encoding'] = 'gzip'
    }
    res.writeHead(200, headers)
    res.end(body)
    return
  }
  const notFound = join(root, '404.html')
  res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' })
  res.end(existsSync(notFound) ? readFileSync(notFound) : 'Not found')
}).listen(port, '127.0.0.1', () => console.log(`static: http://127.0.0.1:${port}${base}`))
