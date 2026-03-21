import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { server } from '../../test/mocks/server'
import AdminLayout from '../../layouts/AdminLayout'
import LoginPage from '../../pages/LoginPage'
import EventsPage from '../../pages/EventsPage'

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  document.cookie = 'accessToken=; max-age=0'
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

describe('접근성', () => {
  it('AdminLayout 모바일 메뉴 버튼에 aria-label이 있다', () => {
    renderWithProviders(<AdminLayout />)
    expect(screen.getByLabelText('메뉴 열기')).toBeInTheDocument()
  })

  it('LoginPage 쿠키 없을 때 메인 사이트 링크가 있다', () => {
    renderWithProviders(<LoginPage />)
    const link = screen.getByText('메인 사이트로 이동')
    expect(link).toBeInTheDocument()
    expect(link.tagName).toBe('A')
  })

  it('LoginPage 쿠키 있고 권한 없을 때 안내 메시지가 있다', () => {
    document.cookie = 'accessToken=some-token'
    renderWithProviders(<LoginPage />)
    expect(screen.getByText('관리자 권한이 없는 계정입니다.')).toBeInTheDocument()
  })

  it('EventsPage 테이블 헤더에 scope="col"이 있다', async () => {
    renderWithProviders(<EventsPage />)
    await waitFor(() => {
      const headers = screen.getAllByRole('columnheader')
      headers.forEach((th) => {
        expect(th).toHaveAttribute('scope', 'col')
      })
    })
  })

  it('EventsPage 삭제 버튼에 aria-label이 있다', async () => {
    renderWithProviders(<EventsPage />)
    await waitFor(() => {
      const deleteBtns = screen.getAllByLabelText('이벤트 삭제')
      expect(deleteBtns.length).toBeGreaterThan(0)
    })
  })
})
