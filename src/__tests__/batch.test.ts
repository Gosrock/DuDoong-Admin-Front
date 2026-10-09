import { describe, it, expect } from 'vitest'
import { formatDuration, formatParameters } from '../lib/batch'
import { formatDateTime } from '../lib/utils'
import { batchStatusLabel, label } from '../lib/labels'

describe('formatDuration', () => {
  it('1분 미만은 초 단위로 표시한다', () => {
    expect(formatDuration(1.4)).toBe('1.4초')
    expect(formatDuration(0)).toBe('0초')
    expect(formatDuration(5)).toBe('5초')
  })
  it('분/시간 단위로 표시한다', () => {
    expect(formatDuration(123)).toBe('2분 3초')
    expect(formatDuration(120)).toBe('2분')
    expect(formatDuration(3720)).toBe('1시간 2분')
    expect(formatDuration(3600)).toBe('1시간')
  })
  it('null 이면 -', () => {
    expect(formatDuration(null)).toBe('-')
  })
})

describe('formatParameters', () => {
  it('key=value 를 쉼표로 잇는다', () => {
    expect(formatParameters({ eventId: '12', version: '1791542770' })).toBe('eventId=12, version=1791542770')
    expect(formatParameters({ date: '2026-10-09' })).toBe('date=2026-10-09')
  })
  it('비어 있으면 -', () => {
    expect(formatParameters({})).toBe('-')
  })
})

describe('formatDateTime', () => {
  it('타임존 변환 없이 문자열 그대로 자른다', () => {
    expect(formatDateTime('2026-10-09T03:04:05')).toBe('2026-10-09 03:04')
    expect(formatDateTime(null)).toBe('-')
  })
})

describe('batchStatusLabel', () => {
  it('상태를 한글로 바꾸고 모르는 값은 그대로 둔다', () => {
    expect(label(batchStatusLabel, 'COMPLETED')).toBe('성공')
    expect(label(batchStatusLabel, 'FAILED')).toBe('실패')
    expect(label(batchStatusLabel, 'STARTED')).toBe('실행 중')
    expect(label(batchStatusLabel, 'STARTING')).toBe('실행 중')
    expect(label(batchStatusLabel, 'STOPPED')).toBe('중지됨')
    expect(label(batchStatusLabel, 'STOPPING')).toBe('중지됨')
    expect(label(batchStatusLabel, 'ABANDONED')).toBe('중단')
    expect(label(batchStatusLabel, 'UNKNOWN')).toBe('UNKNOWN')
  })
})
