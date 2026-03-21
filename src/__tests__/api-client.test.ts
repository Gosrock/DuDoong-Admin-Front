import { describe, it, expect, afterEach } from 'vitest'

afterEach(() => {
  document.cookie = 'accessToken=; max-age=0'
})

describe('API Client (쿠키 기반)', () => {
  it('withCredentials가 true로 설정되어 있다', async () => {
    const { default: client } = await import('../api/client')
    expect(client.defaults.withCredentials).toBe(true)
  })

  it('X-Admin-Token 헤더를 사용하지 않는다 (request interceptor 없음)', async () => {
    const { default: client } = await import('../api/client')
    // request interceptor가 없거나 X-Admin-Token을 설정하지 않아야 함
    const handlers = (client.interceptors.request as any).handlers
    const hasAdminTokenInterceptor = handlers.some((h: any) => {
      if (!h?.fulfilled) return false
      const fnStr = h.fulfilled.toString()
      return fnStr.includes('X-Admin-Token') || fnStr.includes('admin_token')
    })
    expect(hasAdminTokenInterceptor).toBe(false)
  })

  it('401 응답 시 메인 사이트로 리다이렉트한다', async () => {
    const { default: client } = await import('../api/client')
    const errorHandler = (client.interceptors.response as any).handlers[0].rejected!

    const originalHref = window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: originalHref, hostname: 'localhost' },
      writable: true,
    })

    try {
      await errorHandler({ response: { status: 401 } })
    } catch {
      // Expected rejection
    }

    expect(window.location.href).toBe('http://localhost:3000')
  })

  it('403 응답 시 /login으로 리다이렉트한다', async () => {
    const { default: client } = await import('../api/client')
    const errorHandler = (client.interceptors.response as any).handlers[0].rejected!

    Object.defineProperty(window, 'location', {
      value: { href: '', hostname: 'localhost' },
      writable: true,
    })

    try {
      await errorHandler({ response: { status: 403 } })
    } catch {
      // Expected rejection
    }

    expect(window.location.href).toBe('/login')
  })
})
