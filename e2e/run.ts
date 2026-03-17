/**
 * Admin Frontend E2E CLI Test
 *
 * 실행 전 필수:
 *   1. docker compose up -d (DuDoong-Backend/)
 *   2. ./gradlew :DuDoong-Api:bootRun (DuDoong-Backend/)
 *   3. npx tsx e2e/run.ts
 *
 * 환경변수:
 *   API_BASE_URL (기본: http://localhost:8080)
 */

const BASE = process.env.API_BASE_URL || 'http://localhost:8080'
const ADMIN_API = `${BASE}/internal-api/v1`
const PUBLIC_API = `${BASE}/api/v1`

let passed = 0
let failed = 0
let adminToken = ''

// ─── Helpers ─────────────────────────────────────────────

async function request(method: string, url: string, body?: unknown, headers?: Record<string, string>) {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(adminToken ? { 'X-Admin-Token': adminToken } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => null)
  return { status: res.status, data: json?.data ?? json }
}

function assert(name: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${name}`)
    passed++
  } else {
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`)
    failed++
  }
}

// ─── Tests ───────────────────────────────────────────────

async function testHealthCheck() {
  console.log('\n📋 Health Check')
  const { status } = await request('GET', `${PUBLIC_API}/v1/examples/health`)
  assert('서버 응답', status === 200, `status=${status}`)
}

async function testAdminLoginBlocked() {
  console.log('\n📋 Admin 로그인 — USER 역할 차단')
  const { status } = await request('POST', `${ADMIN_API}/auth/oauth/local/login`, {
    email: 'e2e-blocked@dudoong.com',
    name: 'E2E차단유저',
    phoneNumber: '010-0000-0001',
    profileImage: null,
    marketingAgree: false,
  })
  assert('USER 역할 → 403', status === 403, `status=${status}`)
}

async function testNormalUserTokenBlocked() {
  console.log('\n📋 일반 유저 토큰으로 Admin API 접근 차단')

  // 일반 로그인으로 토큰 획득 (공개 API 또는 admin 로컬 로그인)
  // @DevelopOnlyApi 프로파일 제한으로 공개 로그인이 안 될 수 있으므로 둘 다 시도
  let normalToken = ''

  const { status: publicStatus, data: publicData } = await request('POST', `${PUBLIC_API}/v1/auth/oauth/local/login`, {
    email: 'e2e-normal@dudoong.com',
    name: 'E2E일반유저',
    phoneNumber: '010-0000-0002',
    profileImage: null,
    marketingAgree: false,
  })

  if (publicStatus === 200) {
    normalToken = publicData.accessToken
    assert('일반 로그인 성공 (public)', true)
  } else {
    // 공개 로그인 불가 시, admin 로그인으로 USER 토큰 획득 시도 → 역시 403
    // 이 경우 일반 토큰을 만들 수 없으므로, 가짜 토큰으로 차단 테스트
    console.log('  ⚠️ 공개 로컬 로그인 비활성 (@DevelopOnlyApi) — 가짜 토큰으로 차단 테스트')
    normalToken = 'fake-non-admin-token'
    assert('공개 로그인 차단 확인 (@DevelopOnlyApi)', publicStatus === 403, `status=${publicStatus}`)
  }

  // 일반/가짜 토큰으로 admin dashboard 접근
  const { status: dashStatus } = await request('GET', `${ADMIN_API}/dashboard`, undefined, {
    'X-Admin-Token': normalToken,
  })
  assert('일반 토큰 → dashboard 401/403', dashStatus === 401 || dashStatus === 403, `status=${dashStatus}`)

  // Authorization 헤더로도 차단
  const { status: authStatus } = await request('GET', `${ADMIN_API}/dashboard`, undefined, {
    Authorization: `Bearer ${normalToken}`,
  })
  assert('Authorization 헤더 → dashboard 401/403', authStatus === 401 || authStatus === 403, `status=${authStatus}`)
}

async function testUnauthenticatedBlocked() {
  console.log('\n📋 미인증 Admin API 접근 차단')

  const endpoints = ['/dashboard', '/users', '/events', '/orders', '/comments']
  const savedToken = adminToken
  adminToken = '' // 토큰 제거

  for (const ep of endpoints) {
    const { status } = await request('GET', `${ADMIN_API}${ep}`)
    assert(`${ep} → 401/403`, status === 401 || status === 403, `status=${status}`)
  }

  adminToken = savedToken
}

async function testAdminPublicEndpoints() {
  console.log('\n📋 Admin 공개 엔드포인트 접근 가능')

  const savedToken = adminToken
  adminToken = ''

  // 로그인 엔드포인트는 permitAll (비즈니스 로직에서 403)
  const { status: loginStatus } = await request('POST', `${ADMIN_API}/auth/oauth/local/login`, {
    email: 'e2e-public@dudoong.com',
    name: 'E2E공개테스트',
    phoneNumber: '010-0000-0003',
    profileImage: null,
    marketingAgree: false,
  })
  assert('로그인 엔드포인트 도달 가능 (403=역할부족)', loginStatus === 403, `status=${loginStatus}`)

  // 토큰 갱신 엔드포인트도 permitAll
  const { status: refreshStatus } = await request('POST', `${ADMIN_API}/auth/token/refresh?token=invalid`)
  assert('토큰 갱신 엔드포인트 도달 가능 (401/403=토큰검증실패)', refreshStatus === 401 || refreshStatus === 403, `status=${refreshStatus}`)

  adminToken = savedToken
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  console.log(`🚀 DuDoong Admin E2E Test`)
  console.log(`   API: ${BASE}`)
  console.log(`   시작: ${new Date().toLocaleString('ko-KR')}`)

  // 서버 연결 확인
  try {
    await fetch(`${BASE}/api/v1/examples/health`, { signal: AbortSignal.timeout(5000) })
  } catch {
    console.error('\n❌ 서버에 연결할 수 없습니다.')
    console.error('   1. docker compose up -d (DuDoong-Backend/)')
    console.error('   2. ./gradlew :DuDoong-Api:bootRun')
    process.exit(1)
  }

  await testAdminLoginBlocked()
  await testNormalUserTokenBlocked()
  await testUnauthenticatedBlocked()
  await testAdminPublicEndpoints()

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📊 Total:  ${passed + failed}`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
