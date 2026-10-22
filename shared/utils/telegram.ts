import { OWNER_NAME } from './site'

interface AskContext {
  title: string
  /** Полная ссылка на страницу изделия. */
  url: string
  sizeLabel?: string | null
  /** Что именно уточняется: цена и наличие, состав, размер… Если не задано, пишем нейтрально. */
  topics?: string[]
}

/** Готовое сообщение Дани про конкретное изделие. Ничего не отправляется: покупатель копирует его сам. */
export function buildAskText({ title, url, sizeLabel, topics = [] }: AskContext): string {
  const about = `«${title}»${sizeLabel ? `, размер ${sizeLabel}` : ''}`
  const lines = [`Здравствуйте, ${OWNER_NAME}! Пишу про изделие ${about}.`, url, '']
  lines.push(topics.length ? `Подскажите, пожалуйста: ${topics.join(', ')}.` : 'Хочу уточнить: ')
  return lines.join('\n')
}
