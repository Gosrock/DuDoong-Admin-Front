import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import { getStagingServer, startStagingServer, stopStagingServer } from '../api/admin'
import type { StagingServer } from '../types'
import { cn } from '../lib/utils'
import { label, stagingAppStatusLabel, stagingServerStateLabel } from '../lib/labels'
import { getErrorMessage, stagingRefetchInterval } from '../lib/staging'
import ConfirmModal from '../components/ConfirmModal'
import ToastContainer from '../components/ToastContainer'
import { useToast } from '../hooks/useToast'

const stateBadge: Record<string, string> = {
  STOPPED: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  RUNNING: 'bg-green-100 text-green-700',
  STOPPING: 'bg-orange-100 text-orange-700',
  NOT_CONFIGURED: 'bg-gray-100 text-gray-500',
  UNKNOWN: 'bg-red-100 text-red-700',
}

const appBadge: Record<string, string> = {
  UP: 'bg-green-100 text-green-700',
  STARTING: 'bg-yellow-100 text-yellow-700',
  DOWN: 'bg-red-100 text-red-700',
}

// 백엔드가 KST 'YYYY-MM-DDTHH:mm:ss'로 준다. Date로 파싱하면 브라우저 타임존에 따라 바뀌므로 문자열 그대로 쓴다
const formatDateTime = (value: string | null) =>
  value ? value.replace('T', ' ').slice(0, 16) : '-'

export default function StagingServerPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [confirmStop, setConfirmStop] = useState(false)

  const { data, isLoading, isError } = useQuery<StagingServer>({
    queryKey: ['staging-server'],
    queryFn: getStagingServer,
    refetchInterval: (query) => stagingRefetchInterval(query.state.data),
  })

  const startMutation = useMutation({
    mutationFn: startStagingServer,
    onSuccess: (server: StagingServer) => {
      queryClient.setQueryData(['staging-server'], server)
      queryClient.invalidateQueries({ queryKey: ['staging-server'] })
      toast.success('스테이징 서버를 켜는 중입니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '스테이징 서버를 켜지 못했습니다.'))
    },
  })

  const stopMutation = useMutation({
    mutationFn: stopStagingServer,
    onSuccess: (server: StagingServer) => {
      queryClient.setQueryData(['staging-server'], server)
      queryClient.invalidateQueries({ queryKey: ['staging-server'] })
      toast.success('스테이징 서버를 끄는 중입니다.')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '스테이징 서버를 끄지 못했습니다.'))
    },
  })

  const busy = startMutation.isPending || stopMutation.isPending
  const canStart = data?.state === 'STOPPED' && !busy
  const canStop = data?.state === 'RUNNING' && !busy

  const handleStop = () => {
    setConfirmStop(false)
    stopMutation.mutate()
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">스테이징 서버</h2>
      </div>

      <div className="max-w-2xl rounded-xl bg-white p-4 shadow-sm sm:p-6">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-6 w-24 rounded bg-gray-200" />
            <div className="h-4 w-48 rounded bg-gray-200" />
            <div className="h-4 w-40 rounded bg-gray-200" />
          </div>
        ) : isError || !data ? (
          <p className="py-8 text-center text-gray-500">스테이징 서버 상태를 불러오지 못했습니다.</p>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">상태</span>
              <span
                className={cn(
                  'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                  stateBadge[data.state] ?? 'bg-gray-100 text-gray-700'
                )}
              >
                {label(stagingServerStateLabel, data.state)}
              </span>
              {data.state === 'RUNNING' && data.appStatus && (
                <span
                  className={cn(
                    'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                    appBadge[data.appStatus] ?? 'bg-gray-100 text-gray-700'
                  )}
                >
                  앱 {label(stagingAppStatusLabel, data.appStatus)}
                </span>
              )}
            </div>

            {data.state === 'RUNNING' && data.appStatus === 'DOWN' && (
              <p className="mt-3 text-sm text-red-600">
                켠 지 10분이 지나도 앱이 응답하지 않습니다. 배포 상태를 확인해 주세요. (30초마다 다시 확인합니다)
              </p>
            )}

            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">켜진 시각</dt>
                <dd className="mt-0.5 text-gray-900">{formatDateTime(data.launchedAt)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">다음 자동 종료</dt>
                <dd className="mt-0.5 text-gray-900">{formatDateTime(data.nextAutoStopAt)}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() => startMutation.mutate()}
                disabled={!canStart}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                켜기
              </button>
              <button
                onClick={() => setConfirmStop(true)}
                disabled={!canStop}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                끄기
              </button>
            </div>

            {data.state === 'NOT_CONFIGURED' && (
              <p className="mt-3 text-sm text-red-600">
                스테이징 서버가 설정되어 있지 않아 켜거나 끌 수 없습니다.
              </p>
            )}

            <div className="mt-6 space-y-2 border-t border-gray-100 pt-4 text-sm text-gray-600">
              <p>켠 뒤 앱이 뜨기까지 2~3분 걸립니다. 매일 새벽 2시에 자동으로 꺼집니다.</p>
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700"
              >
                스테이징 서버 열기
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        open={confirmStop}
        title="스테이징 서버 끄기"
        description="스테이징 서버를 끌까요? 테스트 중인 사람이 있으면 끊깁니다."
        confirmLabel="끄기"
        variant="danger"
        onConfirm={handleStop}
        onCancel={() => setConfirmStop(false)}
      />

      <ToastContainer toasts={toast.toasts} />
    </div>
  )
}
