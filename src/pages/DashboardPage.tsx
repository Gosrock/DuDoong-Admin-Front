import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  UserPlus,
  ShoppingCart,
  DollarSign,
  Calendar,
  RotateCcw,
} from 'lucide-react'
import { getDashboard } from '../api/admin'
import type { AdminDashboard } from '../types'
import { cn } from '../lib/utils'
import { label, orderStatusLabel, eventStatusLabel } from '../lib/labels'

const statCards = [
  { key: 'totalUsers' as const, label: '전체 사용자', icon: Users, color: 'text-blue-600 bg-blue-100' },
  { key: 'todayNewUsers' as const, label: '오늘 신규 가입', icon: UserPlus, color: 'text-green-600 bg-green-100' },
  { key: 'todayOrders' as const, label: '오늘 주문 수', icon: ShoppingCart, color: 'text-purple-600 bg-purple-100' },
  { key: 'todayRevenue' as const, label: '오늘 매출', icon: DollarSign, color: 'text-yellow-600 bg-yellow-100', format: 'currency' },
  { key: 'activeEvents' as const, label: '진행중 이벤트', icon: Calendar, color: 'text-indigo-600 bg-indigo-100' },
  { key: 'todayRefunds' as const, label: '오늘 환불', icon: RotateCcw, color: 'text-red-600 bg-red-100' },
]

const orderStatusBadge: Record<string, string> = {
  CONFIRM: 'bg-green-100 text-green-700',
  PENDING_APPROVE: 'bg-yellow-100 text-yellow-700',
  REFUND: 'bg-orange-100 text-orange-700',
  CANCELED: 'bg-red-100 text-red-700',
  FAILED: 'bg-red-100 text-red-700',
}

const eventStatusBadge: Record<string, string> = {
  PREPARING: 'bg-yellow-100 text-yellow-700',
  OPEN: 'bg-green-100 text-green-700',
  CALCULATING: 'bg-blue-100 text-blue-700',
  CLOSED: 'bg-gray-100 text-gray-700',
  DELETED: 'bg-red-100 text-red-700',
}

function formatValue(value: number, format?: string) {
  if (format === 'currency') {
    return value.toLocaleString('ko-KR') + '원'
  }
  return value.toLocaleString('ko-KR')
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-lg bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 rounded bg-gray-200" />
          <div className="h-6 w-16 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const params = useMemo(() => {
    const p: { startDate?: string; endDate?: string } = {}
    if (startDate) p.startDate = startDate
    if (endDate) p.endDate = endDate
    return p
  }, [startDate, endDate])

  const { data, isLoading, isError, refetch } = useQuery<AdminDashboard>({
    queryKey: ['dashboard', params],
    queryFn: () => getDashboard(params),
  })

  if (isError) {
    return (
      <div>
        <h2 className="mb-6 text-2xl font-bold text-gray-900">대시보드</h2>
        <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 shadow-sm">
          <p className="mb-4 text-gray-500">데이터를 불러오는 데 실패했습니다.</p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <RotateCcw className="h-4 w-4" />
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">대시보드</h2>

      {/* Date range filter */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="dashboard-start-date" className="text-sm font-medium text-gray-700">시작일</label>
          <input
            id="dashboard-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="dashboard-end-date" className="text-sm font-medium text-gray-700">종료일</label>
          <input
            id="dashboard-end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(''); setEndDate('') }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            초기화
          </button>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading || !data
          ? statCards.map((card) => <SkeletonCard key={card.key} />)
          : statCards.map((card) => (
              <div
                key={card.key}
                className="rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-lg',
                      card.color
                    )}
                  >
                    <card.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatValue(data[card.key], card.format)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Recent orders */}
      {data && (
        <div className="mt-8">
          <h3 className="mb-3 text-base font-semibold text-gray-900">최근 주문 5건</h3>
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-600">주문번호</th>
                    <th className="px-4 py-3 font-medium text-gray-600">사용자</th>
                    <th className="px-4 py-3 font-medium text-gray-600">이벤트</th>
                    <th className="px-4 py-3 font-medium text-gray-600">금액</th>
                    <th className="px-4 py-3 font-medium text-gray-600">상태</th>
                    <th className="px-4 py-3 font-medium text-gray-600">주문일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {!data.recentOrders || data.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">최근 주문이 없습니다.</td>
                    </tr>
                  ) : (
                    data.recentOrders.map((order) => (
                      <tr key={order.orderId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-900">{order.orderId.slice(0, 8)}...</td>
                        <td className="px-4 py-3 text-gray-900">{order.userName}</td>
                        <td className="px-4 py-3 text-gray-600">{order.eventName}</td>
                        <td className="px-4 py-3 text-gray-900">{order.totalAmount.toLocaleString('ko-KR')}원</td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', orderStatusBadge[order.orderStatus] ?? 'bg-gray-100 text-gray-700')}>
                            {label(orderStatusLabel, order.orderStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{new Date(order.createdAt).toLocaleDateString('ko-KR')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Recent events */}
      {data && (
        <div className="mt-6">
          <h3 className="mb-3 text-base font-semibold text-gray-900">최근 이벤트 5건</h3>
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-600">ID</th>
                    <th className="px-4 py-3 font-medium text-gray-600">이벤트명</th>
                    <th className="px-4 py-3 font-medium text-gray-600">호스트</th>
                    <th className="px-4 py-3 font-medium text-gray-600">상태</th>
                    <th className="px-4 py-3 font-medium text-gray-600">시작일</th>
                    <th className="px-4 py-3 font-medium text-gray-600">생성일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {!data.recentEvents || data.recentEvents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">최근 이벤트가 없습니다.</td>
                    </tr>
                  ) : (
                    data.recentEvents.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{event.id}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{event.name}</td>
                        <td className="px-4 py-3 text-gray-600">{event.hostName}</td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', eventStatusBadge[event.status] ?? 'bg-gray-100 text-gray-700')}>
                            {label(eventStatusLabel, event.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{new Date(event.startAt).toLocaleDateString('ko-KR')}</td>
                        <td className="px-4 py-3 text-gray-500">{new Date(event.createdAt).toLocaleDateString('ko-KR')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
