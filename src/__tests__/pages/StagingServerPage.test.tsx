import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/mocks/server'
import StagingServerPage from '../../pages/StagingServerPage'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <StagingServerPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const mockState = (state: string, launchedAt: string | null = null) =>
  server.use(
    http.get('*/internal-api/v1/infra/staging', () =>
      HttpResponse.json({
        status: 200,
        data: {
          state,
          launchedAt,
          nextAutoStopAt: '2026-10-10T02:00:00',
          url: 'https://staging.example.com',
        },
      })
    )
  )

describe('StagingServerPage', () => {
  const cases: [string, string][] = [
    ['STOPPED', '꺼짐'],
    ['PENDING', '켜는 중'],
    ['RUNNING', '켜짐'],
    ['STOPPING', '끄는 중'],
    ['NOT_CONFIGURED', '설정 없음'],
    ['UNKNOWN', '알 수 없음'],
  ]

  it.each(cases)('%s 상태를 "%s"로 표시한다', async (state, text) => {
    mockState(state)
    renderPage()
    expect(await screen.findByText(text, { selector: 'span' })).toBeInTheDocument()
  })

  it('안내 문구와 서버 링크를 표시한다', async () => {
    mockState('STOPPED')
    renderPage()
    expect(await screen.findByText(/2~3분 걸립니다/)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /스테이징 서버 열기/ })
    expect(link).toHaveAttribute('href', 'https://staging.example.com')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('켜진 시각이 없으면 "-"를 표시한다', async () => {
    mockState('STOPPED')
    renderPage()
    await screen.findByText('켜진 시각')
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('STOPPED 상태에서는 켜기만 활성화된다', async () => {
    mockState('STOPPED')
    renderPage()
    await screen.findByText('꺼짐', { selector: 'span' })
    expect(screen.getByRole('button', { name: '켜기' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '끄기' })).toBeDisabled()
  })

  it('RUNNING 상태에서는 끄기만 활성화된다', async () => {
    mockState('RUNNING', '2026-10-09T10:00:00')
    renderPage()
    await screen.findByText('켜짐', { selector: 'span' })
    expect(screen.getByRole('button', { name: '켜기' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '끄기' })).toBeEnabled()
  })

  it.each(['PENDING', 'STOPPING', 'UNKNOWN'])('%s 상태에서는 두 버튼 모두 비활성화된다', async (state) => {
    mockState(state)
    renderPage()
    await screen.findByText(/서버 열기/)
    expect(screen.getByRole('button', { name: '켜기' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '끄기' })).toBeDisabled()
  })

  it('NOT_CONFIGURED 상태에서는 두 버튼이 비활성화되고 안내가 표시된다', async () => {
    mockState('NOT_CONFIGURED')
    renderPage()
    expect(await screen.findByText(/설정되어 있지 않아/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '켜기' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '끄기' })).toBeDisabled()
  })

  it('켜기 클릭 시 API를 호출하고 토스트를 표시한다', async () => {
    mockState('STOPPED')
    let called = false
    server.use(
      http.post('*/internal-api/v1/infra/staging/start', () => {
        called = true
        return HttpResponse.json({
          status: 200,
          data: { state: 'PENDING', launchedAt: null, nextAutoStopAt: '2026-10-10T02:00:00', url: 'https://staging.example.com' },
        })
      })
    )
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: '켜기' }))
    expect(await screen.findByText('스테이징 서버를 켜는 중입니다.')).toBeInTheDocument()
    expect(called).toBe(true)
    expect(await screen.findByText('켜는 중', { selector: 'span' })).toBeInTheDocument()
  })

  it('끄기는 확인 모달을 거쳐야 호출된다', async () => {
    mockState('RUNNING', '2026-10-09T10:00:00')
    let called = false
    server.use(
      http.post('*/internal-api/v1/infra/staging/stop', () => {
        called = true
        return HttpResponse.json({
          status: 200,
          data: { state: 'STOPPING', launchedAt: null, nextAutoStopAt: '2026-10-10T02:00:00', url: 'https://staging.example.com' },
        })
      })
    )
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: '끄기' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(called).toBe(false)

    await user.click(screen.getByRole('button', { name: '취소' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(called).toBe(false)

    await user.click(screen.getByRole('button', { name: '끄기' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '끄기' }))
    expect(await screen.findByText('스테이징 서버를 끄는 중입니다.')).toBeInTheDocument()
    expect(called).toBe(true)
  })

  it('실패 시 백엔드 사유를 토스트로 표시한다', async () => {
    mockState('STOPPED')
    server.use(
      http.post('*/internal-api/v1/infra/staging/start', () =>
        HttpResponse.json({ status: 400, message: '스테이징 서버 설정이 없습니다.' }, { status: 400 })
      )
    )
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: '켜기' }))
    await waitFor(() => {
      expect(screen.getByText('스테이징 서버 설정이 없습니다.')).toBeInTheDocument()
    })
  })
})
