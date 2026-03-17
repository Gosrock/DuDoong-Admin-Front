import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { server } from '../../test/mocks/server'
import UsersPage from '../../pages/UsersPage'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
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

describe('UsersPage', () => {
  it('사용자 관리 제목을 렌더링한다', () => {
    renderWithProviders(<UsersPage />)
    expect(screen.getByText('사용자 관리')).toBeInTheDocument()
  })

  it('검색 입력 필드가 표시된다', () => {
    renderWithProviders(<UsersPage />)
    expect(screen.getByPlaceholderText('이름 또는 이메일로 검색')).toBeInTheDocument()
  })

  it('테이블 헤더가 렌더링된다', () => {
    renderWithProviders(<UsersPage />)
    expect(screen.getByText('ID')).toBeInTheDocument()
    expect(screen.getByText('이름')).toBeInTheDocument()
    expect(screen.getByText('이메일')).toBeInTheDocument()
    expect(screen.getByText('역할')).toBeInTheDocument()
    expect(screen.getByText('상태')).toBeInTheDocument()
  })

  it('API에서 유저 목록을 로드하여 표시한다', async () => {
    renderWithProviders(<UsersPage />)
    await waitFor(() => {
      expect(screen.getAllByText('테스트유저').length).toBeGreaterThan(0)
      expect(screen.getAllByText('test@dudoong.com').length).toBeGreaterThan(0)
      expect(screen.getAllByText('admin@dudoong.com').length).toBeGreaterThan(0)
    })
  })

  it('역할 뱃지를 한국어로 표시한다', async () => {
    renderWithProviders(<UsersPage />)
    await waitFor(() => {
      expect(screen.getAllByText('최고관리자').length).toBeGreaterThan(0)
      expect(screen.getAllByText('일반회원').length).toBeGreaterThan(0)
    })
  })
})
