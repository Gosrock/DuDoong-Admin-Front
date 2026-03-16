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
import type { DashboardData } from '../types'
import { cn } from '../lib/utils'

const statCards = [
  { key: 'totalUsers' as const, label: '전체 사용자', icon: Users, color: 'text-blue-600 bg-blue-100' },
  { key: 'todayNewUsers' as const, label: '오늘 신규 가입', icon: UserPlus, color: 'text-green-600 bg-green-100' },
  { key: 'todayOrders' as const, label: '오늘 주문 수', icon: ShoppingCart, color: 'text-purple-600 bg-purple-100' },
  { key: 'todayRevenue' as const, label: '오늘 매출', icon: DollarSign, color: 'text-yellow-600 bg-yellow-100', format: 'currency' },
  { key: 'activeEvents' as const, label: '진행중 이벤트', icon: Calendar, color: 'text-indigo-600 bg-indigo-100' },
  { key: 'todayRefunds' as const, label: '오늘 환불', icon: RotateCcw, color: 'text-red-600 bg-red-100' },
]

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
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  })

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">대시보드</h2>

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
    </div>
  )
}
