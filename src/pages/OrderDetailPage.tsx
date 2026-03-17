import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, XCircle, CreditCard, User, Calendar, Tag } from 'lucide-react'
import { getOrderDetail, cancelOrder } from '../api/admin'
import type { AdminOrder } from '../types'
import { cn } from '../lib/utils'

const statusBadge: Record<string, string> = {
  CONFIRM: 'bg-green-100 text-green-700',
  PENDING_APPROVE: 'bg-yellow-100 text-yellow-700',
  REFUND: 'bg-orange-100 text-orange-700',
  CANCELED: 'bg-red-100 text-red-700',
  FAILED: 'bg-red-100 text-red-700',
}

export default function OrderDetailPage() {
  const { uuid } = useParams<{ uuid: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: order, isLoading } = useQuery<AdminOrder>({
    queryKey: ['order', uuid],
    queryFn: () => getOrderDetail(uuid!),
    enabled: !!uuid,
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(uuid!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', uuid] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  const handleCancel = () => {
    if (window.confirm('이 주문을 강제 취소하시겠습니까?')) {
      cancelMutation.mutate()
    }
  }

  const canCancel = (status: string) =>
    status === 'CONFIRM' || status === 'PENDING_APPROVE'

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-32 rounded bg-gray-200" />
        <div className="h-64 rounded-xl bg-gray-200" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center text-gray-500">
        주문을 찾을 수 없습니다.
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => navigate('/orders')}
        className="mb-6 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        주문 목록으로
      </button>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">주문 상세</h2>
            <p className="mt-1 font-mono text-sm text-gray-500">{order.orderId}</p>
          </div>
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium',
              statusBadge[order.orderStatus] ?? 'bg-gray-100 text-gray-700'
            )}
          >
            {order.orderStatus}
          </span>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
            <User className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
            <div>
              <dt className="text-sm text-gray-500">주문자</dt>
              <dd className="mt-1 font-medium text-gray-900">{order.userName}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
            <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
            <div>
              <dt className="text-sm text-gray-500">이벤트</dt>
              <dd className="mt-1 font-medium text-gray-900">{order.eventName}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
            <Tag className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
            <div>
              <dt className="text-sm text-gray-500">티켓</dt>
              <dd className="mt-1 font-medium text-gray-900">{order.ticketName}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
            <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
            <div>
              <dt className="text-sm text-gray-500">결제 금액</dt>
              <dd className="mt-1 text-xl font-bold text-gray-900">
                {order.totalAmount.toLocaleString('ko-KR')}원
              </dd>
            </div>
          </div>
        </dl>

        <div className="mt-4 rounded-lg bg-gray-50 p-4">
          <dt className="text-sm text-gray-500">주문일시</dt>
          <dd className="mt-1 font-medium text-gray-900">
            {new Date(order.createdAt).toLocaleString('ko-KR')}
          </dd>
        </div>

        {canCancel(order.orderStatus) && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <button
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              주문 강제 취소
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
