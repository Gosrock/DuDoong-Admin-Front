import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { hasAuthCookie } from '../lib/utils'

afterEach(() => {
  document.cookie = 'accessToken=; max-age=0'
  document.cookie = 'stg_accessToken=; max-age=0'
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

  it('stg_accessToken 쿠키가 있어도 localhost에서는 인식하지 않는다', () => {
    document.cookie = 'stg_accessToken=staging-jwt-token'
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<ProtectedRoute><div>대시보드</div></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    )
    // localhost에서는 accessToken을 찾으므로 stg_ 쿠키는 무시
    expect(screen.getByText('리다이렉트됨')).toBeInTheDocument()
  })
})
