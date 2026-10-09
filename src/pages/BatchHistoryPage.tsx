import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getBatchJobs, getBatchExecutions } from '../api/admin'
import type { BatchExecution, BatchJobSummary, Page } from '../types'
import { cn, formatDateTime } from '../lib/utils'
import { label, batchStatusLabel } from '../lib/labels'
import { formatDuration, formatParameters } from '../lib/batch'

const statusBadge: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  STARTED: 'bg-blue-100 text-blue-700',
  STARTING: 'bg-blue-100 text-blue-700',
  STOPPED: 'bg-gray-100 text-gray-700',
  STOPPING: 'bg-gray-100 text-gray-700',
  ABANDONED: 'bg-orange-100 text-orange-700',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusBadge[status] ?? 'bg-gray-100 text-gray-700'
      )}
    >
      {label(batchStatusLabel, status)}
    </span>
  )
}

export default function BatchHistoryPage() {
  const [page, setPage] = useState(0)
  const [jobName, setJobName] = useState('ALL')

  const jobsQuery = useQuery<BatchJobSummary[]>({
    queryKey: ['batch-jobs'],
    queryFn: getBatchJobs,
  })

  const { data, isLoading, isError } = useQuery<Page<BatchExecution>>({
    queryKey: ['batch-executions', page, jobName],
    queryFn: () =>
      getBatchExecutions({
        page,
        size: 20,
        jobName: jobName === 'ALL' ? undefined : jobName,
      }),
  })

  const selectJob = (name: string) => {
    setJobName(name)
    setPage(0)
  }

  const jobs = jobsQuery.data ?? []
  const empty = !data?.content || data.content.length === 0

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">배치 이력</h2>
      </div>

      <p className="mb-4 text-sm text-gray-600">
        실행 로그는 CloudWatch Logs <code className="rounded bg-gray-100 px-1">/dudoong/batch</code> 에서 봅니다.
        수동 실행은 DuDoong-Deploy Actions &quot;Batch Run (manual)&quot;.
      </p>

      {jobsQuery.isLoading ? (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-2 rounded-xl bg-white p-4 shadow-sm">
              <div className="h-4 w-40 rounded bg-gray-200" />
              <div className="h-3 w-24 rounded bg-gray-200" />
              <div className="h-3 w-32 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : jobsQuery.isError ? (
        <p className="mb-6 rounded-xl bg-white p-4 text-center text-gray-500 shadow-sm">
          배치 작업 요약을 불러오지 못했습니다.
        </p>
      ) : jobs.length > 0 ? (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <button
              key={job.jobName}
              type="button"
              onClick={() => selectJob(job.jobName)}
              aria-pressed={jobName === job.jobName}
              className={cn(
                'rounded-xl bg-white p-4 text-left shadow-sm transition-colors hover:bg-gray-50',
                jobName === job.jobName && 'ring-2 ring-blue-500'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 break-all font-medium text-gray-900">{job.jobName}</p>
                <StatusBadge status={job.lastStatus} />
              </div>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">마지막 실행</dt>
                  <dd className="text-gray-900">{formatDateTime(job.lastStartTime)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">마지막 성공</dt>
                  <dd className="text-gray-900">{formatDateTime(job.lastSuccessTime)}</dd>
                </div>
              </dl>
              <p
                className={cn(
                  'mt-2 text-sm',
                  job.recentFailureCount > 0 ? 'font-medium text-red-600' : 'text-gray-500'
                )}
              >
                최근 7일 실패 {job.recentFailureCount}건
              </p>
            </button>
          ))}
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <select
          aria-label="작업 필터"
          value={jobName}
          onChange={(e) => selectJob(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="ALL">전체 작업</option>
          {jobs.map((j) => (
            <option key={j.jobName} value={j.jobName}>
              {j.jobName}
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
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">실행 ID</th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">작업</th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">상태</th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">시작</th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">종료</th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">소요</th>
                <th scope="col" className="px-4 py-3 font-medium text-gray-600">파라미터</th>
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
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    실행 이력을 불러오지 못했습니다.
                  </td>
                </tr>
              ) : empty ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    실행 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                data.content.map((ex) => (
                  <tr key={ex.executionId} className="align-top transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-900">{ex.executionId}</td>
                    <td className="px-4 py-3 text-gray-900">{ex.jobName}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ex.status} />
                      {ex.status === 'FAILED' && ex.exitMessage && (
                        <p className="mt-1 max-w-xs break-words text-xs text-red-600">{ex.exitMessage}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDateTime(ex.startTime)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDateTime(ex.endTime)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDuration(ex.durationSeconds)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{formatParameters(ex.parameters)}</td>
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
          ) : isError ? (
            <p className="px-4 py-12 text-center text-gray-500">실행 이력을 불러오지 못했습니다.</p>
          ) : empty ? (
            <p className="px-4 py-12 text-center text-gray-500">실행 이력이 없습니다.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.content.map((ex) => (
                <div key={ex.executionId} className="p-4 transition-colors hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-all font-medium text-gray-900">{ex.jobName}</p>
                      <p className="mt-0.5 font-mono text-xs text-gray-400">#{ex.executionId}</p>
                      <p className="mt-1 break-all font-mono text-xs text-gray-500">{formatParameters(ex.parameters)}</p>
                    </div>
                    <StatusBadge status={ex.status} />
                  </div>
                  {ex.status === 'FAILED' && ex.exitMessage && (
                    <p className="mt-1.5 break-words text-xs text-red-600">{ex.exitMessage}</p>
                  )}
                  <div className="mt-1.5 flex items-center justify-between text-xs text-gray-400">
                    <span>
                      {formatDateTime(ex.startTime)} ~ {formatDateTime(ex.endTime)}
                    </span>
                    <span className="font-medium text-gray-700">{formatDuration(ex.durationSeconds)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {data && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-500">총 {data.totalElements.toLocaleString()}건</p>
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
    </div>
  )
}
