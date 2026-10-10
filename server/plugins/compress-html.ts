import { brotliCompressSync, constants, gzipSync } from 'node:zlib'

/**
 * Сжимает HTML-ответы (brotli/gzip), если клиент это поддерживает и ответ ещё не сжат.
 * За CDN или nginx с включённым сжатием плагин безвреден: они увидят заголовок content-encoding.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', (event, response) => {
    const body = response.body
    if (typeof body !== 'string' || body.length < 1024) return
    // Страницу ошибки Nuxt собирает внутренним подзапросом и читает его как текст: сжатые байты сломались бы.
    if (event.path.startsWith('/__nuxt_error') || getResponseStatus(event) >= 400) return
    if (!String(getResponseHeader(event, 'content-type') ?? '').includes('text/html')) return
    if (getResponseHeader(event, 'content-encoding')) return

    const accept = String(getRequestHeader(event, 'accept-encoding') ?? '')
    if (accept.includes('br')) {
      response.body = brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 4 } })
      setResponseHeader(event, 'content-encoding', 'br')
    }
    else if (accept.includes('gzip')) {
      response.body = gzipSync(body, { level: 6 })
      setResponseHeader(event, 'content-encoding', 'gzip')
    }
    else return
    appendResponseHeader(event, 'vary', 'Accept-Encoding')
  })
})
