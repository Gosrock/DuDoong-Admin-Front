import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/mocks/server'
import BatchHistoryPage from '../../pages/BatchHistoryPage'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <BatchHistoryPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const jobs = [
  {
    jobName: 'ticketSyncJob',
    lastExecutionId: 11,
    lastStatus: 'FAILED',
    lastStartTime: '2026-10-09T03:00:00',
    lastEndTime: '2026-10-09T03:00:02',
    lastSuccessTime: '2026-10-08T03:00:01',
    recentFailureCount: 2,
  },
  {
    jobName: 'dailyStatsJob',
    lastExecutionId: 10,
    lastStatus: 'COMPLETED',
    lastStartTime: '2026-10-09T01:00:00',
    lastEndTime: '2026-10-09T01:02:03',
    lastSuccessTime: '2026-10-09T01:02:03',
    recentFailureCount: 0,
  },
]

const executions = [
  {
    executionId: 11,
    jobName: 'ticketSyncJob',
    status: 'FAILED',
    exitCode: 'FAILED',
    startTime: '2026-10-09T03:00:00',
    endTime: '2026-10-09T03:00:02',
    durationSeconds: 1.4,
    exitMessage: 'java.lang.IllegalStateException: boom',
    parameters: { eventId: '12', version: '1791542770' },
  },
  {
    executionId: 10,
    jobName: 'dailyStatsJob',
    status: 'COMPLETED',
    exitCode: 'COMPLETED',
    startTime: '2026-10-09T01:00:00',
    endTime: '2026-10-09T01:02:03',
    durationSeconds: 123,
    exitMessage: null,
    parameters: { date: '2026-10-09' },
  },
]

const requests: URL[] = []

function mockApi(totalPages = 1) {
  requests.length = 0
  server.use(
    http.get('*/internal-api/v1/batch/jobs', () => HttpResponse.json({ status: 200, data: jobs })),
    http.get('*/internal-api/v1/batch/executions', ({ request }) => {
      const url = new URL(request.url)
      requests.push(url)
      const name = url.searchParams.get('jobName')
      const content = name ? executions.filter((e) => e.jobName === name) : executions
      return HttpResponse.json({
        status: 200,
        data: {
          content,
          totalElements: content.length,
          totalPages,
          number: Number(url.searchParams.get('page') ?? 0),
          size: 20,
        },
      })
    })
  )
}

describe('BatchHistoryPage', () => {
  it('job 요약 카드와 실패 건수 강조를 보여준다', async () => {
    mockApi()
    renderPage()
    const failing = await screen.findByText('최근 7일 실패 2건')
    expect(failing).toHaveClass('text-red-600')
    expect(screen.getByText('최근 7일 실패 0건')).not.toHaveClass('text-red-600')
    expect(screen.getAllByText('실패').length).toBeGreaterThan(0)
    expect(screen.getAllByText('성공').length).toBeGreaterThan(0)
  })

  it('안내 문구를 보여준다', async () => {
    mockApi()
    renderPage()
    expect(await screen.findByText(/\/dudoong\/batch/)).toBeInTheDocument()
    expect(screen.getByText(/Batch Run \(manual\)/)).toBeInTheDocument()
  })

  it('카드를 누르면 jobName 으로 목록을 다시 조회한다', async () => {
    mockApi()
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: /dailyStatsJob/ }))
    await waitFor(() =>
      expect(requests.some((u) => u.searchParams.get('jobName') === 'dailyStatsJob')).toBe(true)
    )
    expect(requests[0].searchParams.get('jobName')).toBeNull()
  })

  it('FAILED 행은 종료 메시지를 보여주고 파라미터를 key=value 로 보여준다', async () => {
    mockApi()
    renderPage()
    expect((await screen.findAllByText('java.lang.IllegalStateException: boom')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('eventId=12, version=1791542770').length).toBeGreaterThan(0)
    expect(screen.getAllByText('date=2026-10-09').length).toBeGreaterThan(0)
    expect(screen.getAllByText('1.4초').length).toBeGreaterThan(0)
    expect(screen.getAllByText('2분 3초').length).toBeGreaterThan(0)
  })

  it('다음 버튼은 다음 페이지를 요청한다', async () => {
    mockApi(3)
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: '다음' }))
    await waitFor(() => expect(requests.some((u) => u.searchParams.get('page') === '1')).toBe(true))
  })

  it('이력이 없으면 빈 상태를 보여준다', async () => {
    server.use(
      http.get('*/internal-api/v1/batch/jobs', () => HttpResponse.json({ status: 200, data: [] }))
    )
    renderPage()
    expect((await screen.findAllByText('실행 이력이 없습니다.')).length).toBeGreaterThan(0)
  })
})
