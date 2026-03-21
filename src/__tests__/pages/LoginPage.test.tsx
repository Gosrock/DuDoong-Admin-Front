import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { server } from '../../test/mocks/server'
import LoginPage from '../../pages/LoginPage'

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  // 쿠키 초기화
  document.cookie = 'accessToken=; max-age=0'
  document.cookie = 'stg_accessToken=; max-age=0'
})
afterAll(() => server.close())

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('LoginPage', () => {
  it('쿠키 없으면 메인 사이트 이동 안내를 보여준다', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByText('DuDoong Admin')).toBeInTheDocument()
    expect(screen.getByText('관리자 전용 페이지입니다')).toBeInTheDocument()
    expect(screen.getByText('메인 사이트로 이동')).toBeInTheDocument()
    expect(screen.getByText('메인 사이트로 이동').closest('a')).toHaveAttribute('href', 'http://localhost:3000')
  })

  it('쿠키 있지만 권한 없으면(403) 권한 없음 메시지를 보여준다', async () => {
    document.cookie = 'accessToken=invalid-token'
    renderWithProviders(<LoginPage />)

    // getAdminMe 호출 후 403 → 권한 없음 표시
    await waitFor(() => {
      expect(screen.getByText('관리자 권한이 없는 계정입니다.')).toBeInTheDocument()
    })
  })
})
