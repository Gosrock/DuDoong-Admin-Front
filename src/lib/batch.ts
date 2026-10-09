/** 초 → "1.4초" / "2분 3초" / "1시간 2분" */
export function formatDuration(seconds: number | null): string {
  if (seconds == null) return '-'
  if (seconds < 60) return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)}초`
  const total = Math.round(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return m > 0 ? `${h}시간 ${m}분` : `${h}시간`
  return s > 0 ? `${m}분 ${s}초` : `${m}분`
}

/** { eventId: '12', version: '1' } → "eventId=12, version=1" */
export function formatParameters(parameters: Record<string, string> | null | undefined): string {
  const entries = Object.entries(parameters ?? {})
  if (entries.length === 0) return '-'
  return entries.map(([k, v]) => `${k}=${v}`).join(', ')
}
