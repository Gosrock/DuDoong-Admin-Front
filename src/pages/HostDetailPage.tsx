import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import {
  getHostDetail,
  getHostMembers,
  updateHostMemberRole,
  addHostMember,
  removeHostMember,
  updateHostPartner,
} from '../api/admin'
import type { AdminHost, AdminHostMember } from '../types'
import { cn } from '../lib/utils'
import ConfirmModal from '../components/ConfirmModal'
import ToastContainer from '../components/ToastContainer'
import { useToast } from '../hooks/useToast'
import { useAdminMe } from '../hooks/useAdminMe'

const memberRoles = ['MASTER', 'MANAGER', 'GUEST']


export default function HostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const hostId = Number(id)
  const { data: me } = useAdminMe()
  const isSuperAdmin = me?.accountRole === 'SUPER_ADMIN'

  const [partnerConfirmOpen, setPartnerConfirmOpen] = useState(false)
  const [removeConfirmUserId, setRemoveConfirmUserId] = useState<number | null>(null)
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [addUserId, setAddUserId] = useState('')
  const [addRole, setAddRole] = useState('GUEST')
  const [pendingRoleChange, setPendingRoleChange] = useState<{ userId: number; role: string } | null>(null)
  const [roleConfirmOpen, setRoleConfirmOpen] = useState(false)

  const { data: host, isLoading: hostLoading } = useQuery<AdminHost>({
    queryKey: ['host', hostId],
    queryFn: () => getHostDetail(hostId),
    enabled: !isNaN(hostId),
  })

  const { data: members, isLoading: membersLoading } = useQuery<AdminHostMember[]>({
    queryKey: ['host-members', hostId],
    queryFn: () => getHostMembers(hostId),
    enabled: !isNaN(hostId),
  })

  const partnerMutation = useMutation({
    mutationFn: (partner: boolean) => updateHostPartner(hostId, partner),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host', hostId] })
      queryClient.invalidateQueries({ queryKey: ['hosts'] })
      toast.success('파트너 상태가 변경되었습니다.')
    },
    onError: () => {
      toast.error('파트너 상태 변경에 실패했습니다.')
    },
  })

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      updateHostMemberRole(hostId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host-members', hostId] })
      toast.success('역할이 변경되었습니다.')
    },
    onError: () => {
      toast.error('역할 변경에 실패했습니다.')
    },
  })

  const addMemberMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      addHostMember(hostId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host-members', hostId] })
      toast.success('멤버가 추가되었습니다.')
      setAddMemberOpen(false)
      setAddUserId('')
      setAddRole('GUEST')
    },
    onError: () => {
      toast.error('멤버 추가에 실패했습니다.')
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => removeHostMember(hostId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host-members', hostId] })
      toast.success('멤버가 제거되었습니다.')
    },
    onError: () => {
      toast.error('멤버 제거에 실패했습니다.')
    },
  })

  if (hostLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-32 rounded bg-gray-200" />
        <div className="h-64 rounded-xl bg-gray-200" />
      </div>
    )
  }

  if (!host) {
    return (
      <div className="text-center text-gray-500">
        호스트를 찾을 수 없습니다.
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => navigate('/hosts')}
        className="mb-6 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        호스트 목록으로
      </button>

      {/* 기본 정보 카드 */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{host.name}</h2>
            {host.introduce && (
              <p className="mt-1 text-sm text-gray-500">{host.introduce}</p>
            )}
          </div>
          <span className={cn(
            'self-start rounded-full px-3 py-1 text-xs font-medium',
            host.partner ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
          )}>
            {host.partner ? '파트너' : '일반'}
          </span>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-4">
            <dt className="text-sm text-gray-500">대표 이메일</dt>
            <dd className="mt-1 font-medium text-gray-900">{host.contactEmail ?? '-'}</dd>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <dt className="text-sm text-gray-500">연락처</dt>
            <dd className="mt-1 font-medium text-gray-900">{host.contactNumber ?? '-'}</dd>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <dt className="text-sm text-gray-500">마스터 유저 ID</dt>
            <dd className="mt-1 font-medium text-gray-900">{host.masterUserId}</dd>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <dt className="text-sm text-gray-500">생성일</dt>
            <dd className="mt-1 font-medium text-gray-900">
              {new Date(host.createdAt).toLocaleString('ko-KR')}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-200 pt-6">
          {isSuperAdmin && (
            <button
              onClick={() => setPartnerConfirmOpen(true)}
              disabled={partnerMutation.isPending}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50',
                host.partner ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'
              )}
            >
              {host.partner ? '파트너 해제' : '파트너 설정'}
            </button>
          )}
          <Link
            to={`/events?hostId=${host.id}`}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ExternalLink className="h-4 w-4" />
            이 호스트의 이벤트 보기
          </Link>
        </div>
      </div>

      {/* 멤버 목록 */}
      <div className="rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">멤버 목록</h3>
          <button
            onClick={() => setAddMemberOpen(true)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            멤버 추가
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">유저명</th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">역할</th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">활성여부</th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {membersLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-20 rounded bg-gray-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !members || members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    멤버가 없습니다.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.userId}>
                    <td className="px-4 py-3 font-medium text-gray-900">{member.userName}</td>
                    <td className="px-4 py-3">
                      {isSuperAdmin ? (
                        <select
                          value={member.role}
                          onChange={(e) => {
                            setPendingRoleChange({ userId: member.userId, role: e.target.value })
                            setRoleConfirmOpen(true)
                          }}
                          disabled={roleMutation.isPending}
                          className="rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {memberRoles.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-gray-900">{member.role}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                        member.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      )}>
                        {member.active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setRemoveConfirmUserId(member.userId)}
                        disabled={removeMemberMutation.isPending}
                        className="rounded-lg px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        제거
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 파트너 토글 확인 모달 */}
      <ConfirmModal
        open={partnerConfirmOpen}
        title={host.partner ? '파트너 해제' : '파트너 설정'}
        description={host.partner ? '파트너 상태를 해제하시겠습니까?' : '이 호스트를 파트너로 설정하시겠습니까?'}
        confirmLabel={host.partner ? '해제' : '설정'}
        variant={host.partner ? 'danger' : 'default'}
        onConfirm={() => {
          partnerMutation.mutate(!host.partner)
          setPartnerConfirmOpen(false)
        }}
        onCancel={() => setPartnerConfirmOpen(false)}
      />

      {/* 역할 변경 확인 모달 */}
      <ConfirmModal
        open={roleConfirmOpen}
        title="역할 변경"
        description={`역할을 "${pendingRoleChange?.role}"(으)로 변경하시겠습니까?`}
        confirmLabel="변경"
        onConfirm={() => {
          if (pendingRoleChange) roleMutation.mutate(pendingRoleChange)
          setRoleConfirmOpen(false)
          setPendingRoleChange(null)
        }}
        onCancel={() => {
          setRoleConfirmOpen(false)
          setPendingRoleChange(null)
        }}
      />

      {/* 멤버 제거 확인 모달 */}
      <ConfirmModal
        open={removeConfirmUserId !== null}
        title="멤버 제거"
        description="이 멤버를 호스트에서 제거하시겠습니까?"
        confirmLabel="제거"
        variant="danger"
        onConfirm={() => {
          if (removeConfirmUserId !== null) removeMemberMutation.mutate(removeConfirmUserId)
          setRemoveConfirmUserId(null)
        }}
        onCancel={() => setRemoveConfirmUserId(null)}
      />

      {/* 멤버 추가 모달 */}
      {addMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-base font-semibold text-gray-900">멤버 추가</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">유저 ID</label>
                <input
                  type="number"
                  value={addUserId}
                  onChange={(e) => setAddUserId(e.target.value)}
                  placeholder="유저 ID 입력"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">역할</label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {memberRoles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setAddMemberOpen(false)
                  setAddUserId('')
                  setAddRole('GUEST')
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => {
                  const uid = Number(addUserId)
                  if (!uid || isNaN(uid)) {
                    toast.error('유효한 유저 ID를 입력해주세요.')
                    return
                  }
                  addMemberMutation.mutate({ userId: uid, role: addRole })
                }}
                disabled={addMemberMutation.isPending || !addUserId}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toast.toasts} />
    </div>
  )
}
