import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { server } from '../../test/mocks/server'
import DashboardPage from '../../pages/DashboardPage'

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

describe('DashboardPage', () => {
  it('대시보드 제목을 렌더링한다', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByText('대시보드')).toBeInTheDocument()
  })

  it('KPI 카드 라벨을 렌더링한다', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('전체 사용자')).toBeInTheDocument()
      expect(screen.getByText('오늘 신규 가입')).toBeInTheDocument()
      expect(screen.getByText('오늘 주문 수')).toBeInTheDocument()
      expect(screen.getByText('오늘 매출')).toBeInTheDocument()
      expect(screen.getByText('진행중 이벤트')).toBeInTheDocument()
      expect(screen.getByText('오늘 환불')).toBeInTheDocument()
    })
  })

  it('API 데이터를 포맷하여 표시한다', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('1,234')).toBeInTheDocument() // totalUsers
      expect(screen.getByText('675,000원')).toBeInTheDocument() // todayRevenue
    })
  })
})
