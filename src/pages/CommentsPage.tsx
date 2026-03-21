import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, Trash2 } from 'lucide-react'
import { getComments, deleteComment } from '../api/admin'
import type { AdminComment, Page } from '../types'
import { cn } from '../lib/utils'
import { label, commentStatusLabel } from '../lib/labels'
import ConfirmModal from '../components/ConfirmModal'
import ToastContainer from '../components/ToastContainer'
import { useToast } from '../hooks/useToast'

const statusBadge: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  DELETED: 'bg-red-100 text-red-700',
}

export default function CommentsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const eventId = searchParams.get('eventId') ? Number(searchParams.get('eventId')) : undefined
  const queryClient = useQueryClient()
  const toast = useToast()
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [search, setSearch] = useState('')

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  const [sortField, setSortField] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { data, isLoading } = useQuery<Page<AdminComment>>({
    queryKey: ['comments', page, search, eventId],
    queryFn: () => getComments({ page, size: 20, keyword: search || undefined, eventId }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] })
      toast.success('댓글이 삭제되었습니다.')
    },
    onError: () => {
      toast.error('댓글 삭제에 실패했습니다.')
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(keyword)
    setPage(0)
  }

  const handleDelete = (id: number) => {
    setPendingDeleteId(id)
    setConfirmOpen(true)
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

  const sortIndicator = (field: string) =>
    sortField === field ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ''

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-900">댓글 관리</h2>
      </div>

      {eventId && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
          <span>이벤트 #{eventId}의 댓글만 표시 중</span>
          <button onClick={() => navigate('/comments')} className="text-blue-500 hover:text-blue-700 underline">
            전체 보기
          </button>
        </div>
      )}

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="사용자명, 이벤트명 또는 댓글 내용 검색"
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

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th scope="col" onClick={() => handleSort('id')} className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600">ID{sortIndicator('id')}</th>
                <th scope="col" onClick={() => handleSort('userName')} className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600">사용자{sortIndicator('userName')}</th>
                <th scope="col" onClick={() => handleSort('eventName')} className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600">이벤트{sortIndicator('eventName')}</th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">내용</th>
                <th scope="col" onClick={() => handleSort('commentStatus')} className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600">상태{sortIndicator('commentStatus')}</th>
                <th scope="col" onClick={() => handleSort('createdAt')} className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600">작성일{sortIndicator('createdAt')}</th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-20 rounded bg-gray-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                sortedData.map((comment) => (
                  <tr key={comment.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{comment.id}</td>
                    <td className="px-4 py-3 text-gray-900">{comment.userName}</td>
                    <td className="px-4 py-3 text-gray-600">{comment.eventName}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-gray-600" title={comment.content}>
                      {comment.content.length > 50
                        ? comment.content.slice(0, 50) + '...'
                        : comment.content}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', statusBadge[comment.commentStatus] ?? 'bg-gray-100 text-gray-700')}>
                        {label(commentStatusLabel, comment.commentStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={comment.commentStatus === 'DELETED' || deleteMutation.isPending}
                        aria-label="댓글 삭제"
                        className="p-2 text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
                  <div className="h-4 w-32 rounded bg-gray-200" />
                  <div className="h-3 w-48 rounded bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : sortedData.length === 0 ? (
            <p className="px-4 py-12 text-center text-gray-500">검색 결과가 없습니다.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {sortedData.map((comment) => (
                <div key={comment.id} className="p-4 transition-colors hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{comment.userName}</p>
                      <p className="mt-0.5 truncate text-sm text-gray-500">{comment.eventName}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', statusBadge[comment.commentStatus] ?? 'bg-gray-100 text-gray-700')}>
                        {label(commentStatusLabel, comment.commentStatus)}
                      </span>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={comment.commentStatus === 'DELETED' || deleteMutation.isPending}
                        aria-label="댓글 삭제"
                        className="p-1 text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-1.5 text-sm text-gray-600 line-clamp-2">{comment.content}</p>
                  <p className="mt-1 text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString('ko-KR')}</p>
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

      <ConfirmModal
        open={confirmOpen}
        title="댓글 삭제"
        description="이 댓글을 삭제하시겠습니까?"
        confirmLabel="삭제"
        variant="danger"
        onConfirm={() => {
          if (pendingDeleteId !== null) deleteMutation.mutate(pendingDeleteId)
          setConfirmOpen(false)
          setPendingDeleteId(null)
        }}
        onCancel={() => {
          setConfirmOpen(false)
          setPendingDeleteId(null)
        }}
      />

      <ToastContainer toasts={toast.toasts} />
    </div>
  )
}
