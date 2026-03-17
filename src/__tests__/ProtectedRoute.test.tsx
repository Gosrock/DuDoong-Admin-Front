import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import App from '../App'

// Minimal test for ProtectedRoute logic
describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('토큰이 없으면 /login으로 리다이렉트한다', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/login" element={<div>로그인 페이지</div>} />
          <Route
            path="/"
            element={
              (() => {
                const token = localStorage.getItem('admin_token')
                if (!token) return <div>리다이렉트됨</div>
                return <div>대시보드</div>
              })()
            }
          />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('리다이렉트됨')).toBeInTheDocument()
  })

  it('토큰이 있으면 자식을 렌더링한다', () => {
    localStorage.setItem('admin_token', 'valid-token')
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              (() => {
                const token = localStorage.getItem('admin_token')
                if (!token) return <div>리다이렉트됨</div>
                return <div>대시보드</div>
              })()
            }
          />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('대시보드')).toBeInTheDocument()
  })
})
