import { describe, expect, it } from 'vitest'
import { buildAskText } from '#shared/utils/telegram'

describe('buildAskText', () => {
  it('называет изделие, размер и ссылку, ничего не обещая от имени покупателя', () => {
    const text = buildAskText({ title: 'Свитер «Какао»', url: 'https://example.com/product/x', sizeLabel: 'M', topics: ['цена и наличие'] })
    expect(text).toContain('Здравствуйте, Дани!')
    expect(text).toContain('«Свитер «Какао»», размер M')
    expect(text).toContain('https://example.com/product/x')
    expect(text).toContain('Подскажите, пожалуйста: цена и наличие.')
  })

  it('без размера и темы оставляет место для вопроса', () => {
    const text = buildAskText({ title: 'Шарф', url: 'https://example.com/p' })
    expect(text).not.toContain('размер')
    expect(text.endsWith('Хочу уточнить: ')).toBe(true)
  })
})
