import { describe, expect, it } from 'vitest'
import { formatTicketCount, isUnlimitedTicketCount, UNLIMITED_TICKET_COUNT } from '../lib/utils'

describe('isUnlimitedTicketCount', () => {
  it('저장값(1,000,000) 이상이면 무제한으로 본다', () => {
    expect(isUnlimitedTicketCount(UNLIMITED_TICKET_COUNT)).toBe(true)
    expect(isUnlimitedTicketCount(UNLIMITED_TICKET_COUNT + 10)).toBe(true)
  })

  it('지정 수량 최대값(999,999)과 기존 값은 무제한이 아니다', () => {
    expect(isUnlimitedTicketCount(999_999)).toBe(false)
    expect(isUnlimitedTicketCount(1000)).toBe(false)
  })
})

describe('formatTicketCount', () => {
  it('무제한이면 대체 문구를 쓴다', () => {
    expect(formatTicketCount(UNLIMITED_TICKET_COUNT, '제한 없음')).toBe('제한 없음')
  })

  it('지정 수량이면 숫자를 그대로 쓴다', () => {
    expect(formatTicketCount(1000, '무제한')).toBe((1000).toLocaleString())
  })
})
