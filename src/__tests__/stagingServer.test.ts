import { describe, it, expect } from 'vitest'
import { stagingRefetchInterval, getErrorMessage, STAGING_POLL_INTERVAL_MS } from '../lib/staging'
import { stagingServerStateLabel } from '../lib/labels'

describe('stagingRefetchInterval', () => {
  it('PENDING, STOPPING 상태에서는 5초 간격으로 폴링한다', () => {
    expect(stagingRefetchInterval({ state: 'PENDING', appStatus: null })).toBe(STAGING_POLL_INTERVAL_MS)
    expect(stagingRefetchInterval({ state: 'STOPPING', appStatus: null })).toBe(5000)
  })

  it('RUNNING 이어도 앱이 준비 중(STARTING)이거나 아직 모르면 폴링한다', () => {
    expect(stagingRefetchInterval({ state: 'RUNNING', appStatus: 'STARTING' })).toBe(5000)
    expect(stagingRefetchInterval({ state: 'RUNNING', appStatus: null })).toBe(5000)
  })

  it('앱이 UP 이면 폴링하지 않는다', () => {
    expect(stagingRefetchInterval({ state: 'RUNNING', appStatus: 'UP' })).toBe(false)
  })

  it('앱이 DOWN 이면 늦게 뜰 수 있어 30초 간격으로 계속 확인한다', () => {
    expect(stagingRefetchInterval({ state: 'RUNNING', appStatus: 'DOWN' })).toBe(30000)
  })

  it('그 외 상태에서는 폴링하지 않는다', () => {
    for (const s of ['STOPPED', 'NOT_CONFIGURED', 'UNKNOWN'] as const) {
      expect(stagingRefetchInterval({ state: s, appStatus: null })).toBe(false)
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
