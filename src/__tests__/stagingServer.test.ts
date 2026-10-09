import { describe, it, expect } from 'vitest'
import { stagingRefetchInterval, getErrorMessage, STAGING_POLL_INTERVAL_MS } from '../lib/staging'
import { stagingServerStateLabel } from '../lib/labels'

describe('stagingRefetchInterval', () => {
  it('PENDING, STOPPING 상태에서만 5초 간격으로 폴링한다', () => {
    expect(stagingRefetchInterval('PENDING')).toBe(STAGING_POLL_INTERVAL_MS)
    expect(stagingRefetchInterval('STOPPING')).toBe(5000)
  })

  it('그 외 상태에서는 폴링하지 않는다', () => {
    for (const s of ['STOPPED', 'RUNNING', 'NOT_CONFIGURED', 'UNKNOWN'] as const) {
      expect(stagingRefetchInterval(s)).toBe(false)
    }
    expect(stagingRefetchInterval(undefined)).toBe(false)
  })
})

describe('getErrorMessage', () => {
  it('백엔드 에러 메시지를 우선 사용한다', () => {
    expect(getErrorMessage({ response: { data: { message: '설정 없음' } } }, '기본')).toBe('설정 없음')
    expect(getErrorMessage({ response: { data: { reason: '사유' } } }, '기본')).toBe('사유')
  })

  it('메시지가 없으면 기본 문구를 사용한다', () => {
    expect(getErrorMessage(new Error('x'), '기본')).toBe('기본')
  })
})

describe('stagingServerStateLabel', () => {
  it('모든 상태를 한국어로 표시한다', () => {
    expect(stagingServerStateLabel).toEqual({
      STOPPED: '꺼짐',
      PENDING: '켜는 중',
      RUNNING: '켜짐',
      STOPPING: '끄는 중',
      NOT_CONFIGURED: '설정 없음',
      UNKNOWN: '알 수 없음',
    })
  })
})
