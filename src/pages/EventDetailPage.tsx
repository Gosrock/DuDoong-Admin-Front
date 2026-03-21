import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Trash2, Clock, Users, Ticket, ShoppingCart, Edit2, X, MapPin, Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  getEventDetail,
  deleteEvent,
  updateEventStatus,
  updateEvent,
  getEventIssuedTickets,
  getEventTicketItems,
  updateTicketItem,
  adjustTicketStock,
  exportTicketItems,
  exportIssuedTickets,
} from '../api/admin'
import type { AdminEventDetail, AdminIssuedTicket, AdminTicketItem, Page } from '../types'
import { cn } from '../lib/utils'
import { label, eventStatusLabel } from '../lib/labels'
import ConfirmModal from '../components/ConfirmModal'
import ToastContainer from '../components/ToastContainer'
import { useToast } from '../hooks/useToast'

const statusBadge: Record<string, string> = {
  PREPARING: 'bg-yellow-100 text-yellow-700',
  OPEN: 'bg-green-100 text-green-700',
  CALCULATING: 'bg-blue-100 text-blue-700',
  CLOSED: 'bg-gray-100 text-gray-700',
  DELETED: 'bg-red-100 text-red-700',
}

const editableStatuses = ['PREPARING', 'OPEN', 'CALCULATING', 'CLOSED']

interface EditForm {
  name: string
  startAt: string
  runTime: string
  content: string
  placeName: string
  placeAddress: string
}

interface TicketItemEditForm {
  name: string
  description: string
  price: string
  quantity: string
  purchaseLimit: string
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const eventId = Number(id)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false)
  const [ticketPage, setTicketPage] = useState(0)

  // Status change state
  const [selectedStatus, setSelectedStatus] = useState('')

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    startAt: '',
    runTime: '',
    content: '',
    placeName: '',
    placeAddress: '',
  })

  // Ticket item edit modal state
  const [ticketItemEditOpen, setTicketItemEditOpen] = useState(false)
  const [editingTicketItem, setEditingTicketItem] = useState<AdminTicketItem | null>(null)
  const [ticketItemForm, setTicketItemForm] = useState<TicketItemEditForm>({
    name: '',
    description: '',
    price: '',
    quantity: '',
    purchaseLimit: '',
  })

  // Stock adjust modal state
  const [stockAdjustOpen, setStockAdjustOpen] = useState(false)
  const [adjustingTicketItem, setAdjustingTicketItem] = useState<AdminTicketItem | null>(null)
  const [stockDelta, setStockDelta] = useState('')

  const { data: event, isLoading } = useQuery<AdminEventDetail>({
    queryKey: ['event', eventId],
    queryFn: () => getEventDetail(eventId),
    enabled: !isNaN(eventId),
  })

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery<Page<AdminIssuedTicket>>({
    queryKey: ['event-issued-tickets', eventId, ticketPage],
    queryFn: () => getEventIssuedTickets(eventId, { page: ticketPage, size: 10 }),
    enabled: !isNaN(eventId),
  })

  const { data: ticketItems, isLoading: ticketItemsLoading } = useQuery<AdminTicketItem[]>({
    queryKey: ['event-ticket-items', eventId],
    queryFn: () => getEventTicketItems(eventId),
    enabled: !isNaN(eventId),
  })

  const ticketItemEditMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateTicketItem>[2]) =>
      updateTicketItem(eventId, editingTicketItem!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-ticket-items', eventId] })
      toast.success('티켓 종류가 수정되었습니다.')
      setTicketItemEditOpen(false)
    },
    onError: () => {
      toast.error('티켓 종류 수정에 실패했습니다.')
    },
  })

  const stockAdjustMutation = useMutation({
    mutationFn: (delta: number) =>
      adjustTicketStock(eventId, adjustingTicketItem!.id, delta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-ticket-items', eventId] })
      toast.success('재고가 조정되었습니다.')
      setStockAdjustOpen(false)
    },
    onError: () => {
      toast.error('재고 조정에 실패했습니다.')
    },
  })

  const handleOpenStockAdjust = (item: AdminTicketItem) => {
    setAdjustingTicketItem(item)
    setStockDelta('')
    setStockAdjustOpen(true)
  }

  const handleStockAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const delta = Number(stockDelta)
    if (isNaN(delta) || delta === 0) return
    stockAdjustMutation.mutate(delta)
  }

  const deleteMutation = useMutation({
    mutationFn: () => deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('이벤트가 삭제되었습니다.')
      navigate('/events')
    },
    onError: () => {
      toast.error('이벤트 삭제에 실패했습니다.')
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateEventStatus(eventId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('이벤트 상태가 변경되었습니다.')
      setSelectedStatus('')
    },
    onError: () => {
      toast.error('이벤트 상태 변경에 실패했습니다.')
    },
  })

  const editMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateEvent>[1]) => updateEvent(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.success('이벤트가 수정되었습니다.')
      setEditOpen(false)
    },
    onError: () => {
      toast.error('이벤트 수정에 실패했습니다.')
    },
  })

  const handleOpenEdit = () => {
    if (!event) return
    setEditForm({
      name: event.name,
      startAt: event.startAt ? event.startAt.slice(0, 16) : '',
      runTime: String(event.runTime),
      content: event.content ?? '',
      placeName: event.placeName ?? '',
      placeAddress: event.placeAddress ?? '',
    })
    setEditOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    editMutation.mutate({
      name: editForm.name || undefined,
      startAt: editForm.startAt ? editForm.startAt + ':00' : undefined,
      runTime: editForm.runTime ? Number(editForm.runTime) : undefined,
      content: editForm.content || undefined,
      placeName: editForm.placeName || undefined,
      placeAddress: editForm.placeAddress || undefined,
    })
  }

  const handleStatusChange = () => {
    if (!selectedStatus) return
    setStatusConfirmOpen(true)
  }

  const handleOpenTicketItemEdit = (item: AdminTicketItem) => {
    setEditingTicketItem(item)
    setTicketItemForm({
      name: item.name,
      description: item.description ?? '',
      price: String(item.price),
      quantity: String(item.quantity),
      purchaseLimit: String(item.purchaseLimit),
    })
    setTicketItemEditOpen(true)
  }

  const handleTicketItemEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    ticketItemEditMutation.mutate({
      name: ticketItemForm.name || undefined,
      description: ticketItemForm.description || undefined,
      price: ticketItemForm.price ? Number(ticketItemForm.price) : undefined,
      quantity: ticketItemForm.quantity ? Number(ticketItemForm.quantity) : undefined,
      purchaseLimit: ticketItemForm.purchaseLimit ? Number(ticketItemForm.purchaseLimit) : undefined,
    })
  }

  const handleExportTicketItems = async () => {
    const response = await exportTicketItems(eventId)
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `ticket-items-${id}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const handleExportIssuedTickets = async () => {
    const response = await exportIssuedTickets(eventId)
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `issued-tickets-${id}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
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

      {/* Main info card */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{event.name}</h2>
            <p className="mt-1 text-sm text-gray-500">주최: {event.hostName}</p>
          </div>
          <div className="flex items-center gap-2 self-start">
            <span
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium',
                statusBadge[event.status] ?? 'bg-gray-100 text-gray-700'
              )}
            >
              {label(eventStatusLabel, event.status)}
            </span>
            {event.status !== 'DELETED' && (
              <button
                onClick={handleOpenEdit}
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Edit2 className="h-3 w-3" />
                수정
              </button>
            )}
          </div>
        </div>

        {/* Info grid */}
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
          <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
            <Ticket className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
            <div>
              <dt className="text-sm text-gray-500">티켓 종류 수</dt>
              <dd className="mt-1 font-medium text-gray-900">{event.ticketItemCount}종</dd>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
            <Ticket className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
            <div>
              <dt className="text-sm text-gray-500">발급 티켓 수</dt>
              <dd className="mt-1 font-medium text-gray-900">{event.issuedTicketCount.toLocaleString()}장</dd>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
            <ShoppingCart className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
            <div>
              <dt className="text-sm text-gray-500">총 주문 수</dt>
              <dd className="mt-1 font-medium text-gray-900">{event.totalOrderCount.toLocaleString()}건</dd>
            </div>
          </div>
          {(event.placeName || event.placeAddress) && (
            <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4 sm:col-span-2 lg:col-span-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
              <div>
                <dt className="text-sm text-gray-500">장소</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {event.placeName}{event.placeAddress ? ` · ${event.placeAddress}` : ''}
                </dd>
              </div>
            </div>
          )}
          {event.content && (
            <div className="rounded-lg bg-gray-50 p-4 sm:col-span-2 lg:col-span-3">
              <dt className="text-sm text-gray-500">설명</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-900">{event.content}</dd>
            </div>
          )}
        </dl>

        {/* Status change + actions */}
        <div className="mt-6 border-t border-gray-200 pt-6 space-y-4">
          {/* Status change */}
          {event.status !== 'DELETED' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">상태 변경:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">상태 선택</option>
                {editableStatuses.map((s) => (
                  <option key={s} value={s}>
                    {label(eventStatusLabel, s)}
                  </option>
                ))}
              </select>
              <button
                onClick={handleStatusChange}
                disabled={!selectedStatus || statusMutation.isPending}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                변경
              </button>
            </div>
          )}

          {/* Navigation + delete */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/orders?eventId=${eventId}`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              이 이벤트의 주문 보기
            </Link>
            <Link
              to={`/comments?eventId=${eventId}`}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              이 이벤트의 댓글 보기
            </Link>
            {event.status !== 'DELETED' && (
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                이벤트 삭제
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ticket items section */}
      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">티켓 종류</h3>
          <button
            onClick={handleExportTicketItems}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            엑셀 다운로드
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">이름</th>
                <th className="px-4 py-3 font-medium text-gray-600">가격</th>
                <th className="px-4 py-3 font-medium text-gray-600">수량</th>
                <th className="px-4 py-3 font-medium text-gray-600">판매수</th>
                <th className="px-4 py-3 font-medium text-gray-600">구매제한</th>
                <th className="px-4 py-3 font-medium text-gray-600">타입</th>
                <th className="px-4 py-3 font-medium text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ticketItemsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-20 rounded bg-gray-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !ticketItems || ticketItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    티켓 종류가 없습니다.
                  </td>
                </tr>
              ) : (
                ticketItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-gray-700">{item.price.toLocaleString()}원</td>
                    <td className="px-4 py-3 text-gray-700">{item.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-700">{item.supplyCount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-700">{item.purchaseLimit.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">{item.type}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenTicketItemEdit(item)}
                          className="flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Edit2 className="h-3 w-3" />
                          수정
                        </button>
                        <button
                          onClick={() => handleOpenStockAdjust(item)}
                          className="flex items-center gap-1 rounded-lg border border-blue-300 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                        >
                          재고 조정
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issued tickets section */}
      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">발급된 티켓</h3>
          <button
            onClick={handleExportIssuedTickets}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            엑셀 다운로드
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">티켓번호</th>
                <th className="px-4 py-3 font-medium text-gray-600">유저명</th>
                <th className="px-4 py-3 font-medium text-gray-600">티켓종류</th>
                <th className="px-4 py-3 font-medium text-gray-600">입장여부</th>
                <th className="px-4 py-3 font-medium text-gray-600">발급일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ticketsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-20 rounded bg-gray-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : ticketsData?.content.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    발급된 티켓이 없습니다.
                  </td>
                </tr>
              ) : (
                ticketsData?.content.map((ticket) => (
                  <tr key={ticket.issuedTicketNo} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{ticket.issuedTicketNo}</td>
                    <td className="px-4 py-3 text-gray-900">{ticket.userName}</td>
                    <td className="px-4 py-3 text-gray-700">{ticket.ticketName}</td>
                    <td className="px-4 py-3">
                      {ticket.enteredAt ? (
                        <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          입장 {new Date(ticket.enteredAt).toLocaleString('ko-KR')}
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                          미입장
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(ticket.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {ticketsData && ticketsData.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-500">총 {ticketsData.totalElements.toLocaleString()}장</p>
            <div className="flex gap-1">
              <button
                disabled={ticketPage === 0}
                onClick={() => setTicketPage(ticketPage - 1)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                이전
              </button>
              <span className="flex items-center px-3 text-sm text-gray-600">
                {ticketPage + 1} / {ticketsData.totalPages}
              </span>
              <button
                disabled={ticketPage >= ticketsData.totalPages - 1}
                onClick={() => setTicketPage(ticketPage + 1)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status change confirm modal */}
      <ConfirmModal
        open={statusConfirmOpen}
        title="이벤트 상태 변경"
        description={`이벤트 상태를 ${label(eventStatusLabel, selectedStatus)}(으)로 변경하시겠습니까?`}
        confirmLabel="변경"
        variant="default"
        onConfirm={() => {
          statusMutation.mutate(selectedStatus)
          setStatusConfirmOpen(false)
        }}
        onCancel={() => setStatusConfirmOpen(false)}
      />

      {/* Delete confirm modal */}
      <ConfirmModal
        open={confirmOpen}
        title="이벤트 삭제"
        description="이 이벤트를 삭제하시겠습니까? (소프트 삭제)"
        confirmLabel="삭제"
        variant="danger"
        onConfirm={() => {
          deleteMutation.mutate()
          setConfirmOpen(false)
        }}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Edit modal */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setEditOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
        >
          <div
            className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 id="edit-modal-title" className="text-lg font-bold text-gray-900">이벤트 수정</h3>
              <button onClick={() => setEditOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">이벤트명</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">시작일시</label>
                <input
                  type="datetime-local"
                  value={editForm.startAt}
                  onChange={(e) => setEditForm({ ...editForm, startAt: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">런타임 (분)</label>
                <input
                  type="number"
                  value={editForm.runTime}
                  onChange={(e) => setEditForm({ ...editForm, runTime: e.target.value })}
                  min={0}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">설명</label>
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">장소명</label>
                <input
                  type="text"
                  value={editForm.placeName}
                  onChange={(e) => setEditForm({ ...editForm, placeName: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">장소주소</label>
                <input
                  type="text"
                  value={editForm.placeAddress}
                  onChange={(e) => setEditForm({ ...editForm, placeAddress: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={editMutation.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket item edit modal */}
      {ticketItemEditOpen && editingTicketItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setTicketItemEditOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ticket-item-edit-modal-title"
        >
          <div
            className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 id="ticket-item-edit-modal-title" className="text-lg font-bold text-gray-900">티켓 종류 수정</h3>
              <button onClick={() => setTicketItemEditOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleTicketItemEditSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">이름</label>
                <input
                  type="text"
                  value={ticketItemForm.name}
                  onChange={(e) => setTicketItemForm({ ...ticketItemForm, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">설명</label>
                <textarea
                  value={ticketItemForm.description}
                  onChange={(e) => setTicketItemForm({ ...ticketItemForm, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">가격 (원)</label>
                <input
                  type="number"
                  value={ticketItemForm.price}
                  onChange={(e) => setTicketItemForm({ ...ticketItemForm, price: e.target.value })}
                  min={0}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">수량</label>
                <input
                  type="number"
                  value={ticketItemForm.quantity}
                  onChange={(e) => setTicketItemForm({ ...ticketItemForm, quantity: e.target.value })}
                  min={0}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">구매제한</label>
                <input
                  type="number"
                  value={ticketItemForm.purchaseLimit}
                  onChange={(e) => setTicketItemForm({ ...ticketItemForm, purchaseLimit: e.target.value })}
                  min={0}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTicketItemEditOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={ticketItemEditMutation.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock adjust modal */}
      {stockAdjustOpen && adjustingTicketItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setStockAdjustOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="stock-adjust-modal-title"
        >
          <div
            className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 id="stock-adjust-modal-title" className="text-lg font-bold text-gray-900">재고 조정</h3>
              <button onClick={() => setStockAdjustOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-1 text-sm text-gray-600">
              <span className="font-medium">{adjustingTicketItem.name}</span>
            </p>
            <p className="mb-4 text-sm text-gray-500">
              현재 재고: {adjustingTicketItem.quantity.toLocaleString()} / 공급량: {adjustingTicketItem.supplyCount.toLocaleString()}
            </p>
            <form onSubmit={handleStockAdjustSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  조정량 (양수 = 증가, 음수 = 감소)
                </label>
                <input
                  type="number"
                  value={stockDelta}
                  onChange={(e) => setStockDelta(e.target.value)}
                  placeholder="예: 10 또는 -5"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStockAdjustOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={stockAdjustMutation.isPending || !stockDelta || Number(stockDelta) === 0}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  적용
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer toasts={toast.toasts} />
    </div>
  )
}
