import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Trash2, Clock, Users } from 'lucide-react'
import { getEventDetail, deleteEvent } from '../api/admin'
import type { AdminEvent } from '../types'
import { cn } from '../lib/utils'

const statusBadge: Record<string, string> = {
  PREPARING: 'bg-yellow-100 text-yellow-700',
  OPEN: 'bg-green-100 text-green-700',
  CALCULATING: 'bg-blue-100 text-blue-700',
  CLOSED: 'bg-gray-100 text-gray-700',
  DELETED: 'bg-red-100 text-red-700',
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const eventId = Number(id)

  const { data: event, isLoading } = useQuery<AdminEvent>({
    queryKey: ['event', eventId],
    queryFn: () => getEventDetail(eventId),
    enabled: !isNaN(eventId),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      navigate('/events')
    },
  })

  const handleDelete = () => {
    if (window.confirm('이 이벤트를 삭제하시겠습니까? (소프트 삭제)')) {
      deleteMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-32 rounded bg-gray-200" />
        <div className="h-64 rounded-xl bg-gray-200" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center text-gray-500">
        이벤트를 찾을 수 없습니다.
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => navigate('/events')}
        className="mb-6 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        이벤트 목록으로
      </button>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{event.name}</h2>
            <p className="mt-1 text-sm text-gray-500">주최: {event.hostName}</p>
          </div>
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium',
              statusBadge[event.status] ?? 'bg-gray-100 text-gray-700'
            )}
          >
            {event.status}
          </span>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
            <div>
              <dt className="text-sm text-gray-500">시작일시</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {new Date(event.startAt).toLocaleString('ko-KR')}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
            <div>
              <dt className="text-sm text-gray-500">런타임</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {event.runTime}분
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
            <Users className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
            <div>
              <dt className="text-sm text-gray-500">생성일</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {new Date(event.createdAt).toLocaleString('ko-KR')}
              </dd>
            </div>
          </div>
        </dl>

        {event.status !== 'DELETED' && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              이벤트 삭제
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
