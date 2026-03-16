import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { getUsers } from '../api/admin'
import type { AdminUser, Page } from '../types'
import { cn } from '../lib/utils'

const roleBadge: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  ADMIN: 'bg-orange-100 text-orange-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  USER: 'bg-gray-100 text-gray-700',
}

const statusBadge: Record<string, string> = {
  NORMAL: 'bg-green-100 text-green-700',
  DELETED: 'bg-red-100 text-red-700',
}

export default function UsersPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery<Page<AdminUser>>({
    queryKey: ['users', page, search],
    queryFn: () => getUsers({ page, size: 20, keyword: search || undefined }),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(keyword)
    setPage(0)
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">사용자 관리</h2>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="이름 또는 이메일로 검색"
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          검색
        </button>
      </form>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="px-4 py-3 font-medium text-gray-600">이름</th>
                <th className="px-4 py-3 font-medium text-gray-600">이메일</th>
                <th className="px-4 py-3 font-medium text-gray-600">역할</th>
                <th className="px-4 py-3 font-medium text-gray-600">상태</th>
                <th className="px-4 py-3 font-medium text-gray-600">가입일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-20 rounded bg-gray-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data?.content.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                data?.content.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => navigate(`/users/${user.id}`)}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-gray-900">{user.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', roleBadge[user.accountRole] ?? 'bg-gray-100 text-gray-700')}>
                        {user.accountRole}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', statusBadge[user.accountState] ?? 'bg-gray-100 text-gray-700')}>
                        {user.accountState}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-500">
              총 {data.totalElements.toLocaleString()}명
            </p>
            <div className="flex gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                이전
              </button>
              <span className="flex items-center px-3 text-sm text-gray-600">
                {page + 1} / {data.totalPages}
              </span>
              <button
                disabled={page >= data.totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
