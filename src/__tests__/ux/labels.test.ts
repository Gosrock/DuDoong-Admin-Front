import { describe, it, expect } from 'vitest'
import { label, roleLabel, accountStateLabel, eventStatusLabel, orderStatusLabel, commentStatusLabel } from '../../lib/labels'

describe('Korean labels', () => {
  it('역할을 한국어로 변환한다', () => {
    expect(label(roleLabel, 'SUPER_ADMIN')).toBe('최고관리자')
    expect(label(roleLabel, 'ADMIN')).toBe('관리자')
    expect(label(roleLabel, 'MANAGER')).toBe('매니저')
    expect(label(roleLabel, 'USER')).toBe('일반회원')
  })

  it('계정 상태를 한국어로 변환한다', () => {
    expect(label(accountStateLabel, 'NORMAL')).toBe('정상')
    expect(label(accountStateLabel, 'DELETED')).toBe('탈퇴')
  })

  it('이벤트 상태를 한국어로 변환한다', () => {
    expect(label(eventStatusLabel, 'PREPARING')).toBe('준비중')
    expect(label(eventStatusLabel, 'OPEN')).toBe('판매중')
    expect(label(eventStatusLabel, 'CLOSED')).toBe('종료')
    expect(label(eventStatusLabel, 'DELETED')).toBe('삭제됨')
  })

  it('주문 상태를 한국어로 변환한다', () => {
    expect(label(orderStatusLabel, 'CONFIRM')).toBe('확인')
    expect(label(orderStatusLabel, 'PENDING_APPROVE')).toBe('승인대기')
    expect(label(orderStatusLabel, 'CANCELED')).toBe('취소')
  })

  it('댓글 상태를 한국어로 변환한다', () => {
    expect(label(commentStatusLabel, 'ACTIVE')).toBe('활성')
    expect(label(commentStatusLabel, 'DELETED')).toBe('삭제됨')
  })

  it('매핑에 없는 값은 원래 값을 반환한다', () => {
    expect(label(roleLabel, 'UNKNOWN_ROLE')).toBe('UNKNOWN_ROLE')
  })
})
