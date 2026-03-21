import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { hasAuthCookie } from '../lib/utils'

afterEach(() => {
  document.cookie = 'accessToken=; max-age=0'
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!hasAuthCookie()) return <div>리다이렉트됨</div>
  return <>{children}</>
}

describe('ProtectedRoute (쿠키 기반)', () => {
  it('쿠키가 없으면 리다이렉트한다', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<ProtectedRoute><div>대시보드</div></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('리다이렉트됨')).toBeInTheDocument()
  })

  it('accessToken 쿠키가 있으면 자식을 렌더링한다', () => {
    document.cookie = 'accessToken=valid-jwt-token'
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<ProtectedRoute><div>대시보드</div></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('대시보드')).toBeInTheDocument()
  })
})
