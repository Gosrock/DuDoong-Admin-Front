import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('API Client', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('X-Admin-Token 인터셉터', () => {
    it('토큰이 있으면 X-Admin-Token 헤더를 추가한다', async () => {
      localStorage.setItem('admin_token', 'test-admin-jwt')

      // Re-import to get fresh module
      const { default: client } = await import('../api/client')

      // Intercept the request config
      const config = await client.interceptors.request.handlers[0].fulfilled!({
        headers: {} as any,
      } as any)

      expect(config.headers['X-Admin-Token']).toBe('test-admin-jwt')
    })

    it('토큰이 없으면 헤더를 추가하지 않는다', async () => {
      const { default: client } = await import('../api/client')

      const config = await client.interceptors.request.handlers[0].fulfilled!({
        headers: {} as any,
      } as any)

      expect(config.headers['X-Admin-Token']).toBeUndefined()
    })
  })

  describe('401 응답 처리', () => {
    it('401 응답 시 admin_token을 삭제한다', async () => {
      localStorage.setItem('admin_token', 'expired-token')

      const { default: client } = await import('../api/client')
      const errorHandler = client.interceptors.response.handlers[0].rejected!

      // Mock window.location
      const originalHref = window.location.href
      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
      })

      try {
        await errorHandler({ response: { status: 401 } })
      } catch {
        // Expected rejection
      }

      expect(localStorage.getItem('admin_token')).toBeNull()
    })
  })
})
