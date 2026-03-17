import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { server } from '../../test/mocks/server'
import AdminLayout from '../../layouts/AdminLayout'
import LoginPage from '../../pages/LoginPage'
import EventsPage from '../../pages/EventsPage'

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

describe('접근성', () => {
  it('AdminLayout 모바일 메뉴 버튼에 aria-label이 있다', () => {
    renderWithProviders(<AdminLayout />)
    expect(screen.getByLabelText('메뉴 열기')).toBeInTheDocument()
  })

  it('LoginPage 이메일 input에 label이 연결되어 있다', () => {
    renderWithProviders(<LoginPage />)
    const emailInput = screen.getByLabelText('이메일')
    expect(emailInput).toBeInTheDocument()
    expect(emailInput.tagName).toBe('INPUT')
  })

  it('LoginPage 이름 input에 label이 연결되어 있다', () => {
    renderWithProviders(<LoginPage />)
    const nameInput = screen.getByLabelText('이름')
    expect(nameInput).toBeInTheDocument()
    expect(nameInput.tagName).toBe('INPUT')
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
      const deleteBtn = screen.getByLabelText('이벤트 삭제')
      expect(deleteBtn).toBeInTheDocument()
    })
  })
})
