import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { getHosts } from '../api/admin'
import type { AdminHost, Page } from '../types'
import { cn } from '../lib/utils'

export default function HostsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [search, setSearch] = useState('')

  const [sortField, setSortField] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { data, isLoading } = useQuery<Page<AdminHost>>({
    queryKey: ['hosts', page, search],
    queryFn: () => getHosts({ page, size: 20, keyword: search || undefined }),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(keyword)
    setPage(0)
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedData = useMemo(() => {
    if (!sortField || !data?.content) return data?.content ?? []
    return [...data.content].sort((a, b) => {
      const aVal = a[sortField as keyof typeof a]
      const bVal = b[sortField as keyof typeof b]
      if (aVal == null) return 1
      if (bVal == null) return -1
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortOrder === 'asc' ? cmp : -cmp
    })
  }, [data?.content, sortField, sortOrder])

  const sortIndicator = (field: string) =>
    sortField === field ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ''

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">호스트 관리</h2>

      <form onSubmit={handleSearch} className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="이름으로 검색"
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
        >
          검색
        </button>
      </form>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th scope="col" onClick={() => handleSort('id')} className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600">ID{sortIndicator('id')}</th>
                <th scope="col" onClick={() => handleSort('name')} className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600">이름{sortIndicator('name')}</th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">소개</th>
                <th scope="col" onClick={() => handleSort('contactEmail')} className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600">대표 이메일{sortIndicator('contactEmail')}</th>
                <th scope="col" onClick={() => handleSort('partner')} className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600">파트너{sortIndicator('partner')}</th>
                <th scope="col" onClick={() => handleSort('createdAt')} className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600">생성일{sortIndicator('createdAt')}</th>
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
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                sortedData.map((host) => (
                  <tr
                    key={host.id}
                    onClick={() => navigate(`/hosts/${host.id}`)}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-gray-900">{host.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{host.name}</td>
                    <td className="max-w-xs px-4 py-3 truncate text-gray-600">{host.introduce ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{host.contactEmail ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                        host.partner ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      )}>
                        {host.partner ? '파트너' : '일반'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(host.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden">
          {isLoading ? (
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse p-4 space-y-2">
                  <div className="h-4 w-32 rounded bg-gray-200" />
                  <div className="h-3 w-48 rounded bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : sortedData.length === 0 ? (
            <p className="px-4 py-12 text-center text-gray-500">검색 결과가 없습니다.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {sortedData.map((host) => (
                <div
                  key={host.id}
                  onClick={() => navigate(`/hosts/${host.id}`)}
                  className="cursor-pointer p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{host.name}</p>
                      <p className="mt-0.5 truncate text-sm text-gray-500">{host.contactEmail ?? '-'}</p>
                    </div>
                    <span className={cn(
                      'shrink-0 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                      host.partner ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    )}>
                      {host.partner ? '파트너' : '일반'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400">
                    생성일: {new Date(host.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {data && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-500">
              총 {data.totalElements.toLocaleString()}개
            </p>
            {data.totalPages > 1 && (
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
            )}
          </div>
        )}
      </div>
    </div>
  )
}
