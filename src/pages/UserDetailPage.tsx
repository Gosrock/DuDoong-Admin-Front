import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { getUserDetail, updateUserRole, updateUserStatus } from '../api/admin'
import type { AdminUserDetail } from '../types'
import { cn } from '../lib/utils'
import { label, roleLabel, accountStateLabel } from '../lib/labels'
import ConfirmModal from '../components/ConfirmModal'
import ToastContainer from '../components/ToastContainer'
import { useToast } from '../hooks/useToast'

const roles = ['USER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']

const roleBadge: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  ADMIN: 'bg-orange-100 text-orange-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  USER: 'bg-gray-100 text-gray-700',
}

const statusBadge: Record<string, string> = {
  NORMAL: 'bg-green-100 text-green-700',
  DELETED: 'bg-red-100 text-red-700',
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const userId = Number(id)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingRole, setPendingRole] = useState<string | null>(null)
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false)

  const { data: user, isLoading } = useQuery<AdminUserDetail>({
    queryKey: ['user', userId],
    queryFn: () => getUserDetail(userId),
    enabled: !isNaN(userId),
  })

  const roleMutation = useMutation({
    mutationFn: (role: string) => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('역할이 변경되었습니다.')
    },
    onError: () => {
      toast.error('역할 변경에 실패했습니다.')
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('계정 상태가 변경되었습니다.')
    },
    onError: () => {
      toast.error('계정 상태 변경에 실패했습니다.')
    },
  })

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-32 rounded bg-gray-200" />
        <div className="h-64 rounded-xl bg-gray-200" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center text-gray-500">
        사용자를 찾을 수 없습니다.
      </div>
    )
  }

  const isNormal = user.accountState === 'NORMAL'

  return (
    <div>
      <button
        onClick={() => navigate('/users')}
        className="mb-6 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        사용자 목록으로
      </button>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('rounded-full px-3 py-1 text-xs font-medium', roleBadge[user.accountRole] ?? 'bg-gray-100 text-gray-700')}>
              {label(roleLabel, user.accountRole)}
            </span>
            <span className={cn('rounded-full px-3 py-1 text-xs font-medium', statusBadge[user.accountState] ?? 'bg-gray-100 text-gray-700')}>
              {label(accountStateLabel, user.accountState)}
            </span>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-4">
            <dt className="text-sm text-gray-500">전화번호</dt>
            <dd className="mt-1 font-medium text-gray-900">
              {user.phoneNumber ?? '-'}
            </dd>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <dt className="text-sm text-gray-500">OAuth 제공자</dt>
            <dd className="mt-1 font-medium text-gray-900">
              {user.oauthProvider ?? '-'}
            </dd>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <dt className="text-sm text-gray-500">마케팅 동의</dt>
            <dd className="mt-1 font-medium text-gray-900">
              {user.marketingAgree ? '동의' : '미동의'}
            </dd>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <dt className="text-sm text-gray-500">가입일</dt>
            <dd className="mt-1 font-medium text-gray-900">
              {new Date(user.createdAt).toLocaleString('ko-KR')}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-200 pt-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">역할 변경:</label>
            <select
              value={user.accountRole}
              onChange={(e) => {
                setPendingRole(e.target.value)
                setConfirmOpen(true)
              }}
              disabled={roleMutation.isPending}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {label(roleLabel, role)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setStatusConfirmOpen(true)}
            disabled={statusMutation.isPending}
            className={cn(
              'rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50',
              isNormal
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            )}
          >
            {isNormal ? '계정 정지' : '계정 복원'}
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="역할 변경"
        description={`역할을 "${label(roleLabel, pendingRole ?? '')}"(으)로 변경하시겠습니까?`}
        confirmLabel="변경"
        onConfirm={() => {
          if (pendingRole) roleMutation.mutate(pendingRole)
          setConfirmOpen(false)
          setPendingRole(null)
        }}
        onCancel={() => {
          setConfirmOpen(false)
          setPendingRole(null)
        }}
      />

      <ConfirmModal
        open={statusConfirmOpen}
        title={isNormal ? '계정 정지' : '계정 복원'}
        description={isNormal ? '이 계정을 정지하시겠습니까?' : '이 계정을 복원하시겠습니까?'}
        confirmLabel={isNormal ? '정지' : '복원'}
        variant={isNormal ? 'danger' : 'default'}
        onConfirm={() => {
          statusMutation.mutate(isNormal ? 'DELETED' : 'NORMAL')
          setStatusConfirmOpen(false)
        }}
        onCancel={() => setStatusConfirmOpen(false)}
      />

      <ToastContainer toasts={toast.toasts} />
    </div>
  )
}
