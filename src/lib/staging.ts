import type { StagingServerState } from '../types'

export const STAGING_POLL_INTERVAL_MS = 5000

export function stagingRefetchInterval(state?: StagingServerState): number | false {
  return state === 'PENDING' || state === 'STOPPING' ? STAGING_POLL_INTERVAL_MS : false
}

export function getErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { message?: unknown; reason?: unknown } } })?.response?.data
  const msg = data?.message ?? data?.reason
  return typeof msg === 'string' && msg ? msg : fallback
}
