import type { StagingServer } from '../types'

export const STAGING_POLL_INTERVAL_MS = 5000

/** 서버가 켜는 중·끄는 중이거나, 켜졌지만 앱이 아직 뜨는 중이면 5초마다 다시 조회한다 */
export function stagingRefetchInterval(
  server?: Pick<StagingServer, 'state' | 'appStatus'>
): number | false {
  if (!server) return false
  if (server.state === 'PENDING' || server.state === 'STOPPING') return STAGING_POLL_INTERVAL_MS
  if (server.state === 'RUNNING' && server.appStatus !== 'UP' && server.appStatus !== 'DOWN') {
    return STAGING_POLL_INTERVAL_MS
  }
  return false
}

export function getErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { message?: unknown; reason?: unknown } } })?.response?.data
  const msg = data?.message ?? data?.reason
  return typeof msg === 'string' && msg ? msg : fallback
}
