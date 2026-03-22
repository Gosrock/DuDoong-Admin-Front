import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, XCircle, Download } from 'lucide-react'
import { getOrders, cancelOrderWithReason, exportOrders } from '../api/admin'
import type { AdminOrder, Page } from '../types'
import { cn } from '../lib/utils'
import { label, orderStatusLabel } from '../lib/labels'
import ToastContainer from '../components/ToastContainer'
import { useToast } from '../hooks/useToast'

const statuses = ['ALL', 'CONFIRM', 'PENDING_APPROVE', 'REFUND', 'CANCELED', 'FAILED']

const statusBadge: Record<string, string> = {
  CONFIRM: 'bg-green-100 text-green-700',
  PENDING_APPROVE: 'bg-yellow-100 text-yellow-700',
  REFUND: 'bg-orange-100 text-orange-700',
  CANCELED: 'bg-red-100 text-red-700',
  FAILED: 'bg-red-100 text-red-700',
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const eventId = searchParams.get('eventId') ? Number(searchParams.get('eventId')) : undefined
  const queryClient = useQueryClient()
  const toast = useToast()
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')

  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null)
  const [cancelReasonOpen, setCancelReasonOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const [eventIdInput, setEventIdInput] = useState(eventId ? String(eventId) : '')
  const [sortField, setSortField] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { data, isLoading } = useQuery<Page<AdminOrder>>({
    queryKey: ['orders', page, search, status, eventId],
    queryFn: () =>
      getOrders({
        page,
        size: 20,
        keyword: search || undefined,
        status: status === 'ALL' ? undefined : status,
        eventId,
      }),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      cancelOrderWithReason(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('주문이 취소되었습니다.')
    },
    onError: () => {
      toast.error('주문 취소에 실패했습니다.')
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(keyword)
    setPage(0)
  }

  const handleCancel = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation()
    setPendingCancelId(orderId)
    setCancelReasonOpen(true)
  }

  const handleExport = async () => {
    try {
      const response = await exportOrders({
        keyword: search || undefined,
        status: status === 'ALL' ? undefined : status,
        eventId,
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'orders.xlsx')
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

  const canCancel = (s: string) => s === 'CONFIRM' || s === 'PENDING_APPROVE'

  const sortIndicator = (field: string) =>
    sortField === field ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ''

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">주문 관리</h2>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          엑셀 다운로드
        </button>
      </div>

      {eventId && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
          <span>이벤트 #{eventId}의 주문만 표시 중</span>
          <button onClick={() => { setEventIdInput(''); navigate('/orders') }} className="text-blue-500 hover:text-blue-700 underline">
            전체 보기
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="사용자명 또는 이벤트명 검색"
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
        <input
          type="number"
          placeholder="이벤트 ID"
          value={eventIdInput}
          onChange={(e) => setEventIdInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (eventIdInput) {
                setSearchParams({ eventId: eventIdInput })
              } else {
                setSearchParams({})
              }
              setPage(0)
            }
          }}
          className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
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
              {s === 'ALL' ? '전체 상태' : label(orderStatusLabel, s)}
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
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">주문번호</th>
                <th scope="col" onClick={() => handleSort('userName')} className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600">사용자{sortIndicator('userName')}</th>
                <th scope="col" onClick={() => handleSort('eventName')} className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600">이벤트{sortIndicator('eventName')}</th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">티켓</th>
                <th scope="col" onClick={() => handleSort('totalAmount')} className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600">금액{sortIndicator('totalAmount')}</th>
                <th scope="col" onClick={() => handleSort('orderStatus')} className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600">상태{sortIndicator('orderStatus')}</th>
                <th scope="col" onClick={() => handleSort('createdAt')} className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600">주문일{sortIndicator('createdAt')}</th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-20 rounded bg-gray-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                sortedData.map((order) => (
                  <tr key={order.orderId} onClick={() => navigate(`/orders/${order.orderId}`)} className="cursor-pointer transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-900">
                      {order.orderId.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-gray-900">{order.userName}</td>
                    <td className="px-4 py-3 text-gray-600">{order.eventName}</td>
                    <td className="px-4 py-3 text-gray-600">{order.ticketName}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {order.totalAmount.toLocaleString('ko-KR')}원
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', statusBadge[order.orderStatus] ?? 'bg-gray-100 text-gray-700')}>
                        {label(orderStatusLabel, order.orderStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3">
                      {canCancel(order.orderStatus) && (
                        <button
                          onClick={(e) => handleCancel(e, order.orderId)}
                          disabled={cancelMutation.isPending}
                          aria-label="주문 취소"
                          className="p-2 text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
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
              {sortedData.map((order) => (
                <div
                  key={order.orderId}
                  onClick={() => navigate(`/orders/${order.orderId}`)}
                  className="cursor-pointer p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{order.userName}</p>
                      <p className="mt-0.5 truncate text-sm text-gray-500">{order.eventName}</p>
                      <p className="text-xs text-gray-400">{order.ticketName}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', statusBadge[order.orderStatus] ?? 'bg-gray-100 text-gray-700')}>
                        {label(orderStatusLabel, order.orderStatus)}
                      </span>
                      {canCancel(order.orderStatus) && (
                        <button
                          onClick={(e) => handleCancel(e, order.orderId)}
                          disabled={cancelMutation.isPending}
                          aria-label="주문 취소"
                          className="p-1 text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-gray-400">
                    <span className="font-medium text-gray-700">{order.totalAmount.toLocaleString('ko-KR')}원</span>
                    <span>{new Date(order.createdAt).toLocaleDateString('ko-KR')}</span>
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

      {/* 취소 사유 입력 모달 */}
      {cancelReasonOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setCancelReasonOpen(false)
            setPendingCancelId(null)
            setCancelReason('')
          }}
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-base font-semibold text-gray-900">주문 취소</h3>
            <p className="mb-3 text-sm text-gray-600">이 주문을 취소하시겠습니까?</p>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">취소 사유 (선택)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="취소 사유를 입력하세요"
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setCancelReasonOpen(false)
                  setPendingCancelId(null)
                  setCancelReason('')
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (pendingCancelId) cancelMutation.mutate({ orderId: pendingCancelId, reason: cancelReason || undefined })
                  setCancelReasonOpen(false)
                  setPendingCancelId(null)
                  setCancelReason('')
                }}
                disabled={cancelMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                주문 취소
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toast.toasts} />
    </div>
  )
}
