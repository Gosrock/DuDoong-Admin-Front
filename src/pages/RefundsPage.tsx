import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRefunds, completeRefund } from '../api/admin'
import type { AdminRefund, Page } from '../types'
import { cn } from '../lib/utils'
import { label, refundStatusLabel } from '../lib/labels'
import ToastContainer from '../components/ToastContainer'
import { useToast } from '../hooks/useToast'

const refundStatuses = ['ALL', 'REFUND_REQUESTED', 'REFUND_COMPLETED']

const refundStatusBadge: Record<string, string> = {
  REFUND_REQUESTED: 'bg-yellow-100 text-yellow-700',
  REFUND_COMPLETED: 'bg-green-100 text-green-700',
}

export default function RefundsPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [page, setPage] = useState(0)
  const [refundStatus, setRefundStatus] = useState('ALL')

  const { data, isLoading } = useQuery<Page<AdminRefund>>({
    queryKey: ['refunds', page, refundStatus],
    queryFn: () =>
      getRefunds({
        page,
        size: 20,
        refundStatus: refundStatus === 'ALL' ? undefined : refundStatus,
      }),
  })

  const completeMutation = useMutation({
    mutationFn: (orderUuid: string) => completeRefund(orderUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refunds'] })
      toast.success('환불이 완료 처리되었습니다.')
    },
    onError: () => {
      toast.error('환불 완료 처리에 실패했습니다.')
    },
  })

  const handleComplete = (e: React.MouseEvent, orderUuid: string) => {
    e.stopPropagation()
    if (!confirm('환불을 완료 처리하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.')) return
    completeMutation.mutate(orderUuid)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">환불 관리</h2>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <select
          value={refundStatus}
          onChange={(e) => {
            setRefundStatus(e.target.value)
            setPage(0)
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {refundStatuses.map((s) => (
            <option key={s} value={s}>
              {s === 'ALL' ? '전체 상태' : label(refundStatusLabel, s)}
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
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">유저</th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">이벤트</th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">티켓</th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">금액</th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">취소사유</th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">환불상태</th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">취소일시</th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-20 rounded bg-gray-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !data?.content || data.content.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    환불 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                data.content.map((refund) => (
                  <tr key={refund.orderId} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-900">
                      {refund.orderNo ?? refund.orderId.slice(0, 8) + '...'}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{refund.userName ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{refund.eventName ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{refund.ticketName ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {refund.totalAmount != null ? `${Number(refund.totalAmount).toLocaleString('ko-KR')}원` : '-'}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-gray-600" title={refund.cancelReason ?? ''}>
                      {refund.cancelReason ?? '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', refundStatusBadge[refund.refundStatus] ?? 'bg-gray-100 text-gray-700')}>
                        {label(refundStatusLabel, refund.refundStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {refund.withDrawAt ? new Date(refund.withDrawAt).toLocaleDateString('ko-KR') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {refund.refundStatus === 'REFUND_REQUESTED' && (
                        <button
                          onClick={(e) => handleComplete(e, refund.orderId)}
                          disabled={completeMutation.isPending}
                          className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                        >
                          환불 확인
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
                <div key={i} className="animate-pulse space-y-2 p-4">
                  <div className="h-4 w-40 rounded bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-200" />
                  <div className="h-3 w-32 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : !data?.content || data.content.length === 0 ? (
            <p className="px-4 py-12 text-center text-gray-500">환불 내역이 없습니다.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.content.map((refund) => (
                <div key={refund.orderId} className="p-4 transition-colors hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{refund.userName ?? '-'}</p>
                      <p className="mt-0.5 truncate text-sm text-gray-500">{refund.eventName ?? '-'}</p>
                      <p className="text-xs text-gray-400">{refund.ticketName ?? '-'}</p>
                      {refund.cancelReason && (
                        <p className="mt-1 truncate text-xs text-gray-400">사유: {refund.cancelReason}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', refundStatusBadge[refund.refundStatus] ?? 'bg-gray-100 text-gray-700')}>
                        {label(refundStatusLabel, refund.refundStatus)}
                      </span>
                      {refund.refundStatus === 'REFUND_REQUESTED' && (
                        <button
                          onClick={(e) => handleComplete(e, refund.orderId)}
                          disabled={completeMutation.isPending}
                          className="rounded-lg bg-green-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          환불 확인
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-gray-400">
                    <span className="font-medium text-gray-700">
                      {refund.totalAmount != null ? `${Number(refund.totalAmount).toLocaleString('ko-KR')}원` : '-'}
                    </span>
                    <span>{refund.withDrawAt ? new Date(refund.withDrawAt).toLocaleDateString('ko-KR') : '-'}</span>
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

      <ToastContainer toasts={toast.toasts} />
    </div>
  )
}
