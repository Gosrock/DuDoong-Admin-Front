import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, XCircle } from 'lucide-react'
import { getOrders, cancelOrder } from '../api/admin'
import type { AdminOrder, Page } from '../types'
import { cn } from '../lib/utils'

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
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')

  const { data, isLoading } = useQuery<Page<AdminOrder>>({
    queryKey: ['orders', page, search, status],
    queryFn: () =>
      getOrders({
        page,
        size: 20,
        keyword: search || undefined,
        status: status === 'ALL' ? undefined : status,
      }),
  })

  const cancelMutation = useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(keyword)
    setPage(0)
  }

  const handleCancel = (orderId: string) => {
    if (window.confirm('이 주문을 취소하시겠습니까?')) {
      cancelMutation.mutate(orderId)
    }
  }

  const canCancel = (status: string) =>
    status === 'CONFIRM' || status === 'PENDING_APPROVE'

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">주문 관리</h2>

      <div className="mb-4 flex flex-wrap gap-2">
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
              {s === 'ALL' ? '전체 상태' : s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">주문번호</th>
                <th className="px-4 py-3 font-medium text-gray-600">사용자</th>
                <th className="px-4 py-3 font-medium text-gray-600">이벤트</th>
                <th className="px-4 py-3 font-medium text-gray-600">티켓</th>
                <th className="px-4 py-3 font-medium text-gray-600">금액</th>
                <th className="px-4 py-3 font-medium text-gray-600">상태</th>
                <th className="px-4 py-3 font-medium text-gray-600">주문일</th>
                <th className="px-4 py-3 font-medium text-gray-600">작업</th>
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
              ) : data?.content.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                data?.content.map((order) => (
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
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3">
                      {canCancel(order.orderStatus) && (
                        <button
                          onClick={() => handleCancel(order.orderId)}
                          disabled={cancelMutation.isPending}
                          className="text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                          title="주문 취소"
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

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-500">
              총 {data.totalElements.toLocaleString()}건
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
