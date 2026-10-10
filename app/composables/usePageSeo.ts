import { SITE_NAME } from '#shared/utils/site'

interface PageSeo {
  title: string
  description: string
  /** Относительный или абсолютный путь к картинке для соцсетей. */
  image?: string
  /** Канонический путь страницы, без query. */
  canonicalPath?: string
  noindex?: boolean
}

/** Единая точка настройки title/description/OG/canonical, чтобы страницы не расходились. */
export function usePageSeo(seo: PageSeo | (() => PageSeo)) {
  const config = useRuntimeConfig()
  const route = useRoute()
  const resolve = typeof seo === 'function' ? seo : () => seo
  const siteUrl = String(config.public.siteUrl).replace(/\/$/, '')
  const abs = (path: string) => (path.startsWith('http') ? path : `${siteUrl}${path}`)

  useSeoMeta({
    title: () => resolve().title,
    description: () => resolve().description,
    ogTitle: () => resolve().title,
    ogDescription: () => resolve().description,
    ogType: 'website',
    ogSiteName: SITE_NAME,
    ogLocale: 'ru_RU',
    ogImage: () => abs(resolve().image ?? '/og-default.jpg'),
    twitterCard: 'summary_large_image',
    robots: () => (resolve().noindex ? 'noindex, follow' : 'index, follow'),
  })
  useHead({
    link: [{ rel: 'canonical', href: () => abs(resolve().canonicalPath ?? route.path) }],
  })
}
