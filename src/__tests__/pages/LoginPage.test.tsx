import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { server } from '../../test/mocks/server'
import LoginPage from '../../pages/LoginPage'

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
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
  it('로그인 폼을 렌더링한다', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByText('DuDoong Admin')).toBeInTheDocument()
    expect(screen.getByText('관리자 로그인')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('admin@dudoong.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('관리자')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
  })

  it('로그인 성공 시 토큰을 저장한다', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByPlaceholderText('admin@dudoong.com'), 'admin@dudoong.com')
    await user.type(screen.getByPlaceholderText('관리자'), '관리자')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(localStorage.getItem('admin_token')).toBe('mock-admin-token')
    })
  })

  it('USER 역할로 로그인 시 에러 메시지를 표시한다', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByPlaceholderText('admin@dudoong.com'), 'forbidden@dudoong.com')
    await user.type(screen.getByPlaceholderText('관리자'), '일반유저')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => {
      expect(screen.getByText('로그인에 실패했습니다. 관리자 계정인지 확인해주세요.')).toBeInTheDocument()
    })
  })
})
