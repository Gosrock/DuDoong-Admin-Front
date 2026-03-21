import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, Trash2, Download } from 'lucide-react'
import { getEvents, deleteEvent, exportEvents } from '../api/admin'
import type { AdminEvent, Page } from '../types'
import { cn } from '../lib/utils'
import { label, eventStatusLabel } from '../lib/labels'
import ConfirmModal from '../components/ConfirmModal'
import ToastContainer from '../components/ToastContainer'
import { useToast } from '../hooks/useToast'

const statuses = ['ALL', 'PREPARING', 'OPEN', 'CALCULATING', 'CLOSED', 'DELETED']

const statusBadge: Record<string, string> = {
  PREPARING: 'bg-yellow-100 text-yellow-700',
  OPEN: 'bg-green-100 text-green-700',
  CALCULATING: 'bg-blue-100 text-blue-700',
  CLOSED: 'bg-gray-100 text-gray-700',
  DELETED: 'bg-red-100 text-red-700',
}

export default function EventsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string } | null>(null)

  const [sortField, setSortField] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { data, isLoading } = useQuery<Page<AdminEvent>>({
    queryKey: ['events', page, search, status],
    queryFn: () =>
      getEvents({
        page,
        size: 20,
        keyword: search || undefined,
        status: status === 'ALL' ? undefined : status,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('이벤트가 삭제되었습니다.')
    },
    onError: () => {
      toast.error('이벤트 삭제에 실패했습니다.')
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(keyword)
    setPage(0)
  }

  const handleDelete = (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation()
    setPendingDelete({ id, name })
    setConfirmOpen(true)
  }

  const handleExport = async () => {
    try {
      const response = await exportEvents({
        keyword: search || undefined,
        status: status === 'ALL' ? undefined : status,
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'events.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('엑셀 다운로드에 실패했습니다.')
    }
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
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">이벤트 관리</h2>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          엑셀 다운로드
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="이벤트명 또는 호스트명 검색"
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
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(0)
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s === 'ALL' ? '전체 상태' : label(eventStatusLabel, s)}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th scope="col" onClick={() => handleSort('id')} className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600">ID{sortIndicator('id')}</th>
                <th scope="col" onClick={() => handleSort('name')} className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600">이벤트명{sortIndicator('name')}</th>
                <th scope="col" onClick={() => handleSort('hostName')} className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600">호스트{sortIndicator('hostName')}</th>
                <th scope="col" onClick={() => handleSort('status')} className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600">상태{sortIndicator('status')}</th>
                <th scope="col" onClick={() => handleSort('startAt')} className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600">시작일{sortIndicator('startAt')}</th>
                <th scope="col" onClick={() => handleSort('createdAt')} className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600">생성일{sortIndicator('createdAt')}</th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-20 rounded bg-gray-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                sortedData.map((event) => (
                  <tr key={event.id} onClick={() => navigate(`/events/${event.id}`)} className="cursor-pointer transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{event.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{event.name}</td>
                    <td className="px-4 py-3 text-gray-600">{event.hostName}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', statusBadge[event.status] ?? 'bg-gray-100 text-gray-700')}>
                        {label(eventStatusLabel, event.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(event.startAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(event.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => handleDelete(e, event.id, event.name)}
                        disabled={event.status === 'DELETED' || deleteMutation.isPending}
                        aria-label="이벤트 삭제"
                        className="p-2 text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
                  <div className="h-4 w-40 rounded bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-200" />
                  <div className="h-3 w-32 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : sortedData.length === 0 ? (
            <p className="px-4 py-12 text-center text-gray-500">검색 결과가 없습니다.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {sortedData.map((event) => (
                <div
                  key={event.id}
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="cursor-pointer p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{event.name}</p>
                      <p className="mt-0.5 text-sm text-gray-500">{event.hostName}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', statusBadge[event.status] ?? 'bg-gray-100 text-gray-700')}>
                        {label(eventStatusLabel, event.status)}
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, event.id, event.name)}
                        disabled={event.status === 'DELETED' || deleteMutation.isPending}
                        aria-label="이벤트 삭제"
                        className="p-1 text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-1.5 flex gap-3 text-xs text-gray-400">
                    <span>시작: {new Date(event.startAt).toLocaleDateString('ko-KR')}</span>
                    <span>생성: {new Date(event.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {data && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-500">
              총 {data.totalElements.toLocaleString()}건
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

      <ConfirmModal
        open={confirmOpen}
        title="이벤트 삭제"
        description={`"${pendingDelete?.name}" 이벤트를 삭제하시겠습니까?`}
        confirmLabel="삭제"
        variant="danger"
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete.id)
          setConfirmOpen(false)
          setPendingDelete(null)
        }}
        onCancel={() => {
          setConfirmOpen(false)
          setPendingDelete(null)
        }}
      />

      <ToastContainer toasts={toast.toasts} />
    </div>
  )
}
