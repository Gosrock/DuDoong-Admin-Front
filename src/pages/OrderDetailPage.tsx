import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, XCircle, CreditCard, User, Calendar, Tag } from 'lucide-react'
import { getOrderDetail, cancelOrder } from '../api/admin'
import type { AdminOrder } from '../types'
import { cn } from '../lib/utils'
import { label, orderStatusLabel } from '../lib/labels'
import ConfirmModal from '../components/ConfirmModal'
import ToastContainer from '../components/ToastContainer'
import { useToast } from '../hooks/useToast'

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
  const toast = useToast()

  const [confirmOpen, setConfirmOpen] = useState(false)

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
      toast.success('주문이 취소되었습니다.')
    },
    onError: () => {
      toast.error('주문 취소에 실패했습니다.')
    },
  })

  const canCancel = (s: string) => s === 'CONFIRM' || s === 'PENDING_APPROVE'

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
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">주문 상세</h2>
            <p className="mt-1 break-all font-mono text-sm text-gray-500">{order.orderId}</p>
          </div>
          <span
            className={cn(
              'self-start rounded-full px-3 py-1 text-xs font-medium',
              statusBadge[order.orderStatus] ?? 'bg-gray-100 text-gray-700'
            )}
          >
            {label(orderStatusLabel, order.orderStatus)}
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

        {/* 주문 정보 섹션 */}
        {(order.orderNo || order.orderMethod || order.userId !== undefined || order.eventId !== undefined) && (
          <div className="mt-4 rounded-xl border border-gray-200 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">주문 정보</h3>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {order.orderNo && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">주문번호</dt>
                  <dd className="mt-0.5 font-mono text-sm font-medium text-gray-900">{order.orderNo}</dd>
                </div>
              )}
              {order.orderMethod && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">주문방식</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">
                    {order.orderMethod === 'PAYMENT' ? '결제' : order.orderMethod === 'APPROVAL' ? '승인' : order.orderMethod}
                  </dd>
                </div>
              )}
              {order.userId !== undefined && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">유저</dt>
                  <dd className="mt-0.5 text-sm font-medium text-blue-600">
                    <Link to={`/users/${order.userId}`} className="hover:underline">
                      #{order.userId} {order.userName}
                    </Link>
                  </dd>
                </div>
              )}
              {order.eventId !== undefined && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">이벤트</dt>
                  <dd className="mt-0.5 text-sm font-medium text-blue-600">
                    <Link to={`/events/${order.eventId}`} className="hover:underline">
                      #{order.eventId} {order.eventName}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* 결제 상세 섹션 */}
        {(order.paymentMethod || order.supplyAmount || order.discountAmount || order.couponName || order.receiptUrl) && (
          <div className="mt-4 rounded-xl border border-gray-200 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">결제 상세</h3>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {order.paymentMethod && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">결제수단</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">{order.paymentMethod}</dd>
                </div>
              )}
              {order.supplyAmount && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">공급금액</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">{order.supplyAmount}</dd>
                </div>
              )}
              {order.discountAmount && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">할인금액</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">{order.discountAmount}</dd>
                </div>
              )}
              {order.couponName && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">쿠폰</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">{order.couponName}</dd>
                </div>
              )}
              {order.receiptUrl && (
                <div className="rounded-lg bg-gray-50 p-3 sm:col-span-2">
                  <dt className="text-xs text-gray-500">영수증</dt>
                  <dd className="mt-0.5 text-sm font-medium text-blue-600">
                    <a href={order.receiptUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      영수증 보기
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* 시간 정보 섹션 */}
        {(order.approvedAt || order.withDrawAt) && (
          <div className="mt-4 rounded-xl border border-gray-200 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">시간 정보</h3>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {order.approvedAt && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">승인일시</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">
                    {new Date(order.approvedAt).toLocaleString('ko-KR')}
                  </dd>
                </div>
              )}
              {order.withDrawAt && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">취소/환불일시</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">
                    {new Date(order.withDrawAt).toLocaleString('ko-KR')}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {canCancel(order.orderStatus) && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={cancelMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 sm:w-auto sm:justify-start"
            >
              <XCircle className="h-4 w-4" />
              주문 강제 취소
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="주문 강제 취소"
        description="이 주문을 강제 취소하시겠습니까?"
        confirmLabel="주문 취소"
        variant="danger"
        onConfirm={() => {
          cancelMutation.mutate()
          setConfirmOpen(false)
        }}
        onCancel={() => setConfirmOpen(false)}
      />

      <ToastContainer toasts={toast.toasts} />
    </div>
  )
}
