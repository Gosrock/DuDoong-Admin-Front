import type { StagingServer } from '../types'

export const STAGING_POLL_INTERVAL_MS = 5000
/** 앱이 응답 없음(DOWN)이어도 늦게 뜰 수 있어 느리게 계속 확인한다 */
export const STAGING_SLOW_POLL_INTERVAL_MS = 30000

/** 켜는 중·끄는 중·앱 준비 중이면 5초, 앱 응답 없음이면 30초마다 다시 조회한다. 앱이 정상이면 멈춘다 */
export function stagingRefetchInterval(
  server?: Pick<StagingServer, 'state' | 'appStatus'>
): number | false {
  if (!server) return false
  if (server.state === 'PENDING' || server.state === 'STOPPING') return STAGING_POLL_INTERVAL_MS
  if (server.state === 'RUNNING' && server.appStatus === 'DOWN') return STAGING_SLOW_POLL_INTERVAL_MS
  if (server.state === 'RUNNING' && server.appStatus !== 'UP') return STAGING_POLL_INTERVAL_MS
  return false
}

export function getErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { message?: unknown; reason?: unknown } } })?.response?.data
  const msg = data?.message ?? data?.reason
  return typeof msg === 'string' && msg ? msg : fallback
}
