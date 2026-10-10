import { describe, expect, it } from 'vitest'
import { buildPageList } from '#shared/utils/pagination'

describe('buildPageList', () => {
  it('одна страница', () => expect(buildPageList(1, 1)).toEqual([1]))
  it('мало страниц — показываем все', () => expect(buildPageList(2, 4)).toEqual([1, 2, 3, 4]))
  it('много страниц — многоточия по краям', () => {
    expect(buildPageList(1, 10)).toEqual([1, 2, null, 10])
    expect(buildPageList(5, 10)).toEqual([1, null, 4, 5, 6, null, 10])
    expect(buildPageList(10, 10)).toEqual([1, null, 9, 10])
  })
  it('не ставит многоточие вместо одной пропущенной страницы', () => {
    expect(buildPageList(4, 10)).toEqual([1, 2, 3, 4, 5, null, 10])
  })
})
