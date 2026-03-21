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

export function getAccessTokenCookieName(): string {
  const host = window.location.hostname
  if (host.includes('staging')) return 'stg_accessToken'
  return 'accessToken'
}

export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function hasAuthCookie(): boolean {
  return getCookie(getAccessTokenCookieName()) !== null
}
