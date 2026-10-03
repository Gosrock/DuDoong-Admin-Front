import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMainSiteUrl(): string {
  const host = window.location.hostname
  if (host.includes('staging')) return 'https://staging.dudoong.com'
  if (host.includes('dudoong.com')) return 'https://dudoong.com'
  return 'http://localhost:3000'
}

export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function hasAuthCookie(): boolean {
  return getCookie('accessToken') !== null
}

// v2 API로 만든 '수량 무제한' / '1인 매수 제한 없음' 티켓은 1,000,000 이상의 값으로 저장된다.
export const UNLIMITED_TICKET_COUNT = 1_000_000

export function isUnlimitedTicketCount(count: number): boolean {
  return count >= UNLIMITED_TICKET_COUNT
}

export function formatTicketCount(count: number, unlimitedText: string): string {
  return isUnlimitedTicketCount(count) ? unlimitedText : count.toLocaleString()
}
