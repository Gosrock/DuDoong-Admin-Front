import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, XCircle, CreditCard, User, Calendar, Tag } from 'lucide-react'
import { getOrderDetail, cancelOrderWithReason, updateOrderRefundStatus } from '../api/admin'
import type { AdminOrder } from '../types'
import { cn } from '../lib/utils'
import { label, orderStatusLabel, refundStatusLabel } from '../lib/labels'
import ToastContainer from '../components/ToastContainer'
import { useToast } from '../hooks/useToast'

const statusBadge: Record<string, string> = {
  CONFIRM: 'bg-green-100 text-green-700',
  PENDING_APPROVE: 'bg-yellow-100 text-yellow-700',
  REFUND: 'bg-orange-100 text-orange-700',
  CANCELED: 'bg-red-100 text-red-700',
  FAILED: 'bg-red-100 text-red-700',
}

const refundStatusBadge: Record<string, string> = {
  NONE: 'bg-gray-100 text-gray-700',
  REFUND_REQUESTED: 'bg-yellow-100 text-yellow-700',
  REFUND_COMPLETED: 'bg-green-100 text-green-700',
  REFUND_REJECTED: 'bg-red-100 text-red-700',
}

export default function OrderDetailPage() {
  const { uuid } = useParams<{ uuid: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()

  const [cancelReasonOpen, setCancelReasonOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const { data: order, isLoading } = useQuery<AdminOrder>({
    queryKey: ['order', uuid],
    queryFn: () => getOrderDetail(uuid!),
    enabled: !!uuid,
  })

  const cancelMutation = useMutation({
    mutationFn: (reason?: string) => cancelOrderWithReason(uuid!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', uuid] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('주문이 취소되었습니다.')
    },
    onError: () => {
      toast.error('주문 취소에 실패했습니다.')
    },
  })

  const refundStatusMutation = useMutation({
    mutationFn: ({ refundStatus, reason }: { refundStatus: string; reason?: string }) =>
      updateOrderRefundStatus(uuid!, refundStatus, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', uuid] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('환불 상태가 변경되었습니다.')
    },
    onError: () => {
      toast.error('환불 상태 변경에 실패했습니다.')
    },
  })

  const handleRefundComplete = () => {
    if (!confirm('환불을 완료 처리하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.')) return
    refundStatusMutation.mutate({ refundStatus: 'REFUND_COMPLETED' })
  }

  const handleRefundReject = () => {
    if (!confirm('환불을 거절하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.')) return
    const reason = prompt('환불 거절 사유를 입력하세요:')
    if (reason === null) return
    refundStatusMutation.mutate({ refundStatus: 'REFUND_REJECTED', reason })
  }

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

        {/* 환불 상태 섹션 */}
        {order.refundStatus && order.refundStatus !== 'NONE' && (
          <div className="mt-4 rounded-xl border border-gray-200 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">환불 정보</h3>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm text-gray-500">환불 상태:</span>
              <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', refundStatusBadge[order.refundStatus] ?? 'bg-gray-100 text-gray-700')}>
                {label(refundStatusLabel, order.refundStatus)}
              </span>
            </div>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {order.userRefundReason && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">유저 환불 사유</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">{order.userRefundReason}</dd>
                </div>
              )}
              {order.cancelReason && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">취소 사유</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">{order.cancelReason}</dd>
                </div>
              )}
              {order.failReason && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">실패 사유</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">{order.failReason}</dd>
                </div>
              )}
              {order.refundStatusChangedAt && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <dt className="text-xs text-gray-500">환불 상태 변경일</dt>
                  <dd className="mt-0.5 text-sm font-medium text-gray-900">
                    {new Date(order.refundStatusChangedAt).toLocaleString('ko-KR')}
                  </dd>
                </div>
              )}
            </dl>
            {order.refundStatus === 'REFUND_REQUESTED' && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleRefundComplete}
                  disabled={refundStatusMutation.isPending}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  환불 완료
                </button>
                <button
                  onClick={handleRefundReject}
                  disabled={refundStatusMutation.isPending}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  환불 거절
                </button>
              </div>
            )}
          </div>
        )}

        {/* 사유 필드 (환불 상태가 없을 때도 표시) */}
        {!order.refundStatus || order.refundStatus === 'NONE' ? (
          (order.failReason || order.userRefundReason || order.cancelReason) && (
            <div className="mt-4 rounded-xl border border-gray-200 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">사유 정보</h3>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {order.userRefundReason && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <dt className="text-xs text-gray-500">유저 환불 사유</dt>
                    <dd className="mt-0.5 text-sm font-medium text-gray-900">{order.userRefundReason}</dd>
                  </div>
                )}
                {order.cancelReason && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <dt className="text-xs text-gray-500">취소 사유</dt>
                    <dd className="mt-0.5 text-sm font-medium text-gray-900">{order.cancelReason}</dd>
                  </div>
                )}
                {order.failReason && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <dt className="text-xs text-gray-500">실패 사유</dt>
                    <dd className="mt-0.5 text-sm font-medium text-gray-900">{order.failReason}</dd>
                  </div>
                )}
              </dl>
            </div>
          )
        ) : null}

        {canCancel(order.orderStatus) && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <button
              onClick={() => setCancelReasonOpen(true)}
              disabled={cancelMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 sm:w-auto sm:justify-start"
            >
              <XCircle className="h-4 w-4" />
              주문 강제 취소
            </button>
          </div>
        )}
      </div>

      {/* 취소 사유 입력 모달 */}
      {cancelReasonOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-base font-semibold text-gray-900">주문 강제 취소</h3>
            <p className="mb-2 text-sm text-gray-600">이 주문을 강제 취소하시겠습니까?</p>
            <p className="mb-3 text-sm font-semibold text-red-600">⚠️ 이 작업은 되돌릴 수 없습니다.</p>
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
                  setCancelReason('')
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => {
                  cancelMutation.mutate(cancelReason || undefined)
                  setCancelReasonOpen(false)
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
