import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMainSiteUrl, hasAuthCookie } from '../lib/utils'
import { getAdminMe } from '../api/admin'

export default function LoginPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (hasAuthCookie()) {
      // 쿠키 있으면 권한 확인
      getAdminMe()
        .then(() => navigate('/', { replace: true }))
        .catch(() => {
          // 403 = 권한 없음 (ADMIN/SUPER_ADMIN 아님)
          // 여기서는 리다이렉트하지 않고 안내 메시지 표시
        })
    }
  }, [navigate])

  const mainSiteUrl = getMainSiteUrl()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
          DuDoong Admin
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          관리자 전용 페이지입니다
        </p>

        {hasAuthCookie() ? (
          <div className="text-center">
            <p className="mb-4 text-sm text-red-600">
              관리자 권한이 없는 계정입니다.
            </p>
            <p className="text-xs text-gray-400">
              ADMIN 이상 권한이 필요합니다.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-center text-sm text-gray-600">
              메인 사이트에서 로그인 후 다시 방문해주세요.
            </p>
            <a
              href={mainSiteUrl}
              className="block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              메인 사이트로 이동
            </a>
          </>
        )}
      </div>
    </div>
  )
}
