/**
 * Admin Frontend E2E CLI Test
 *
 * 실행 전 필수:
 *   1. cd DuDoong-Backend && docker compose up -d
 *   2. SPRING_PROFILES_ACTIVE=infrastructure,domain,domain-local,common ./gradlew :DuDoong-Api:bootRun
 *   3. cd DuDoong-Admin-Front && npm run test:e2e
 *
 * 환경변수:
 *   API_BASE_URL (기본: http://localhost:8080)
 */

const BASE = process.env.API_BASE_URL || 'http://localhost:8080'
const ADMIN_API = `${BASE}/internal-api/v1`
const PUBLIC_API = `${BASE}/api/v1`
const MYSQL_SETUP = `mysql -h 127.0.0.1 -P 13306 -u dudoong -pdudoong dudoong -e`

let passed = 0
let failed = 0
let adminToken = ''

// ─── Helpers ─────────────────────────────────────────────

async function request(method: string, url: string, body?: unknown, headers?: Record<string, string>) {
  const h: Record<string, string> = { 'Content-Type': 'application/json', ...headers }
  const skipAuth = headers && 'X-Admin-Token' in headers
  if (adminToken && !skipAuth && !headers?.Authorization) {
    h['X-Admin-Token'] = adminToken
  }
  const res = await fetch(url, {
    method,
    headers: h,
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

async function exec(cmd: string): Promise<string> {
  const { execSync } = await import('child_process')
  try {
    return execSync(cmd, { encoding: 'utf-8' }).trim()
  } catch {
    return ''
  }
}

// ─── Setup ───────────────────────────────────────────────

async function setupAdminUser(): Promise<boolean> {
  console.log('\n🔧 테스트 Admin 유저 셋업')

  // 1. Admin login으로 유저 생성 (403이지만 DB에 저장됨)
  await request('POST', `${ADMIN_API}/auth/oauth/local/login`, {
    email: 'e2e-admin@dudoong.com',
    name: 'E2E관리자',
    phoneNumber: '010-9999-9999',
    profileImage: null,
    marketingAgree: false,
  })

  // 2. MySQL에서 role을 MANAGER로 업그레이드
  await exec(`${MYSQL_SETUP} "UPDATE tbl_user SET account_role='MANAGER' WHERE email='e2e-admin@dudoong.com' AND account_role='USER'"`)

  // 3. 다시 로그인 → admin 토큰 획득
  const { status, data } = await request('POST', `${ADMIN_API}/auth/oauth/local/login`, {
    email: 'e2e-admin@dudoong.com',
    name: 'E2E관리자',
    phoneNumber: '010-9999-9999',
    profileImage: null,
    marketingAgree: false,
  })

  if (status === 200 && data?.accessToken) {
    adminToken = data.accessToken
    console.log(`  ✅ Admin 토큰 획득 성공`)
    return true
  }
  console.log(`  ❌ Admin 토큰 획득 실패 (status=${status})`)
  return false
}

// ─── Test: Auth ──────────────────────────────────────────

async function testAuthFlow() {
  console.log('\n📋 Auth 흐름')

  // /me 엔드포인트
  const { status: meStatus, data: meData } = await request('GET', `${ADMIN_API}/auth/me`)
  assert('/me 정상 응답', meStatus === 200, `status=${meStatus}`)
  assert('/me에 이메일 포함', meData?.email === 'e2e-admin@dudoong.com', `email=${meData?.email}`)
  assert('/me에 역할 포함', meData?.accountRole === 'MANAGER', `role=${meData?.accountRole}`)

  // USER 역할 → admin 로그인 차단
  const { status: blockedStatus } = await request('POST', `${ADMIN_API}/auth/oauth/local/login`, {
    email: 'e2e-blocked@dudoong.com', name: 'E2E차단유저',
    phoneNumber: '010-0000-0001', profileImage: null, marketingAgree: false,
  })
  assert('USER 역할 admin 로그인 → 403', blockedStatus === 403, `status=${blockedStatus}`)
}

// ─── Test: Dashboard ─────────────────────────────────────

async function testDashboard() {
  console.log('\n📋 Dashboard')

  const { status, data } = await request('GET', `${ADMIN_API}/dashboard`)
  assert('대시보드 정상 응답', status === 200, `status=${status}`)
  assert('totalUsers 숫자', typeof data?.totalUsers === 'number', `totalUsers=${data?.totalUsers}`)
  assert('todayNewUsers 숫자', typeof data?.todayNewUsers === 'number', `todayNewUsers=${data?.todayNewUsers}`)
  assert('activeEvents 숫자', typeof data?.activeEvents === 'number', `activeEvents=${data?.activeEvents}`)
  assert('todayOrders 숫자', typeof data?.todayOrders === 'number', `todayOrders=${data?.todayOrders}`)
  assert('todayRevenue 숫자', typeof data?.todayRevenue === 'number', `todayRevenue=${data?.todayRevenue}`)
  assert('todayRefunds 숫자', typeof data?.todayRefunds === 'number', `todayRefunds=${data?.todayRefunds}`)
}

// ─── Test: Users CRUD ────────────────────────────────────

async function testUsers() {
  console.log('\n📋 Users API')

  // 목록 조회
  const { status: listStatus, data: listData } = await request('GET', `${ADMIN_API}/users?page=0&size=10`)
  assert('유저 목록 정상 응답', listStatus === 200, `status=${listStatus}`)
  assert('content 배열 존재', Array.isArray(listData?.content), `type=${typeof listData?.content}`)
  assert('totalElements 숫자', typeof listData?.totalElements === 'number', `total=${listData?.totalElements}`)
  assert('유저 1명 이상', (listData?.content?.length ?? 0) > 0, `count=${listData?.content?.length}`)

  // 유저 데이터 필드 검증
  if (listData?.content?.length > 0) {
    const user = listData.content[0]
    assert('유저에 id 필드', typeof user.id === 'number', `id=${user.id}`)
    assert('유저에 name 필드', typeof user.name === 'string', `name=${user.name}`)
    assert('유저에 email 필드', typeof user.email === 'string', `email=${user.email}`)
    assert('유저에 accountRole 필드', typeof user.accountRole === 'string', `role=${user.accountRole}`)
    assert('유저에 accountState 필드', typeof user.accountState === 'string', `state=${user.accountState}`)
    assert('유저에 createdAt 필드', typeof user.createdAt === 'string', `createdAt=${user.createdAt}`)
  }

  // 키워드 검색
  const { status: searchStatus, data: searchData } = await request('GET', `${ADMIN_API}/users?keyword=E2E관리자`)
  assert('키워드 검색 정상', searchStatus === 200, `status=${searchStatus}`)
  assert('검색 결과에 E2E관리자 포함', searchData?.content?.some((u: any) => u.name === 'E2E관리자'), `found=${searchData?.content?.length}`)

  // 상세 조회
  if (listData?.content?.length > 0) {
    const userId = listData.content[0].id
    const { status: detailStatus, data: detailData } = await request('GET', `${ADMIN_API}/users/${userId}`)
    assert('유저 상세 정상', detailStatus === 200, `status=${detailStatus}`)
    assert('상세에 phoneNumber 포함', 'phoneNumber' in (detailData ?? {}), `keys=${Object.keys(detailData ?? {})}`)
    assert('상세에 oauthProvider 포함', 'oauthProvider' in (detailData ?? {}))
    assert('상세에 marketingAgree 포함', 'marketingAgree' in (detailData ?? {}))
  }
}

// ─── Test: Events ────────────────────────────────────────

async function testEvents() {
  console.log('\n📋 Events API')

  const { status: listStatus, data: listData } = await request('GET', `${ADMIN_API}/events?page=0&size=10`)
  assert('이벤트 목록 정상 응답', listStatus === 200, `status=${listStatus}`)
  assert('content 배열 존재', Array.isArray(listData?.content), `type=${typeof listData?.content}`)
  assert('totalElements 숫자', typeof listData?.totalElements === 'number', `total=${listData?.totalElements}`)

  if (listData?.content?.length > 0) {
    const event = listData.content[0]
    assert('이벤트에 id 필드', typeof event.id === 'number')
    assert('이벤트에 name 필드', typeof event.name === 'string')
    assert('이벤트에 hostName 필드', typeof event.hostName === 'string')
    assert('이벤트에 status 필드', typeof event.status === 'string')
    assert('이벤트에 startAt 필드', typeof event.startAt === 'string')

    // 상세 조회
    const { status: detailStatus } = await request('GET', `${ADMIN_API}/events/${event.id}`)
    assert('이벤트 상세 정상', detailStatus === 200, `status=${detailStatus}`)
  } else {
    console.log('  ⚠️ 이벤트 데이터 없음 — 상세/삭제 테스트 스킵')
  }
}

// ─── Test: Orders ────────────────────────────────────────

async function testOrders() {
  console.log('\n📋 Orders API')

  const { status: listStatus, data: listData } = await request('GET', `${ADMIN_API}/orders?page=0&size=10`)
  assert('주문 목록 정상 응답', listStatus === 200, `status=${listStatus}`)
  assert('content 배열 존재', Array.isArray(listData?.content))
  assert('totalElements 숫자', typeof listData?.totalElements === 'number')

  if (listData?.content?.length > 0) {
    const order = listData.content[0]
    assert('주문에 orderId 필드', typeof order.orderId === 'string')
    assert('주문에 userName 필드', typeof order.userName === 'string')
    assert('주문에 eventName 필드', typeof order.eventName === 'string')
    assert('주문에 totalAmount 필드', typeof order.totalAmount === 'string' || typeof order.totalAmount === 'number')
    assert('주문에 orderStatus 필드', typeof order.orderStatus === 'string')

    // 상세 조회
    const { status: detailStatus } = await request('GET', `${ADMIN_API}/orders/${order.orderId}`)
    assert('주문 상세 정상', detailStatus === 200, `status=${detailStatus}`)
  } else {
    console.log('  ⚠️ 주문 데이터 없음 — 상세 테스트 스킵')
  }
}

// ─── Test: Comments ──────────────────────────────────────

async function testComments() {
  console.log('\n📋 Comments API')

  const { status: listStatus, data: listData } = await request('GET', `${ADMIN_API}/comments?page=0&size=10`)
  assert('댓글 목록 정상 응답', listStatus === 200, `status=${listStatus}`)
  assert('content 배열 존재', Array.isArray(listData?.content))
  assert('totalElements 숫자', typeof listData?.totalElements === 'number')

  if (listData?.content?.length > 0) {
    const comment = listData.content[0]
    assert('댓글에 id 필드', typeof comment.id === 'number')
    assert('댓글에 userName 필드', typeof comment.userName === 'string')
    assert('댓글에 content 필드', typeof comment.content === 'string')
    assert('댓글에 commentStatus 필드', typeof comment.commentStatus === 'string')
  } else {
    console.log('  ⚠️ 댓글 데이터 없음 — 필드 테스트 스킵')
  }
}

// ─── Test: Access Control ────────────────────────────────

async function testAccessControl() {
  console.log('\n📋 접근 제어')

  // 미인증 차단
  const endpoints = ['/dashboard', '/users', '/events', '/orders', '/comments']
  for (const ep of endpoints) {
    const { status } = await request('GET', `${ADMIN_API}${ep}`, undefined, { 'X-Admin-Token': '' })
    assert(`미인증 ${ep} → 차단`, status === 401 || status === 403, `status=${status}`)
  }

  // 가짜 토큰 차단
  const { status: fakeStatus } = await request('GET', `${ADMIN_API}/dashboard`, undefined, {
    'X-Admin-Token': 'fake-invalid-token',
  })
  assert('가짜 토큰 → 차단', fakeStatus === 401 || fakeStatus === 403, `status=${fakeStatus}`)

  // Authorization 헤더(일반 토큰 방식)로 admin API 차단
  const { status: bearerStatus } = await request('GET', `${ADMIN_API}/dashboard`, undefined, {
    Authorization: `Bearer ${adminToken}`,
    'X-Admin-Token': '',
  })
  assert('Bearer 헤더 → admin API 차단', bearerStatus === 401 || bearerStatus === 403, `status=${bearerStatus}`)
}

// ─── Test: Role Change + Immediate Effect ────────────────

async function testRoleChangeEffect() {
  console.log('\n📋 역할 변경 즉시 반영')

  // 테스트용 유저 생성
  await request('POST', `${ADMIN_API}/auth/oauth/local/login`, {
    email: 'e2e-roletest@dudoong.com', name: 'E2E역할테스트',
    phoneNumber: '010-8888-7777', profileImage: null, marketingAgree: false,
  })

  // MySQL에서 SUPER_ADMIN으로 현재 admin 유저 승격 (role 변경 API 테스트용)
  await exec(`${MYSQL_SETUP} "UPDATE tbl_user SET account_role='SUPER_ADMIN' WHERE email='e2e-admin@dudoong.com'"`)

  // 토큰 재발급 (새 role 반영)
  const { data: loginData } = await request('POST', `${ADMIN_API}/auth/oauth/local/login`, {
    email: 'e2e-admin@dudoong.com', name: 'E2E관리자',
    phoneNumber: '010-9999-9999', profileImage: null, marketingAgree: false,
  })
  adminToken = loginData?.accessToken ?? adminToken

  // roletest 유저 찾기
  const { data: searchData } = await request('GET', `${ADMIN_API}/users?keyword=e2e-roletest`)
  const targetUser = searchData?.content?.find((u: any) => u.email === 'e2e-roletest@dudoong.com')

  if (targetUser) {
    // MANAGER로 역할 변경
    const { status: roleStatus, data: roleData } = await request(
      'PATCH', `${ADMIN_API}/users/${targetUser.id}/role`, { role: 'MANAGER' }
    )
    assert('역할 변경 API 성공', roleStatus === 200, `status=${roleStatus}`)
    assert('변경 후 역할 = MANAGER', roleData?.accountRole === 'MANAGER', `role=${roleData?.accountRole}`)

    // 즉시 반영 확인 — 상세 조회
    const { data: detailData } = await request('GET', `${ADMIN_API}/users/${targetUser.id}`)
    assert('상세에서도 MANAGER 확인', detailData?.accountRole === 'MANAGER', `role=${detailData?.accountRole}`)

    // 다시 USER로 복원
    const { status: revertStatus } = await request(
      'PATCH', `${ADMIN_API}/users/${targetUser.id}/role`, { role: 'USER' }
    )
    assert('역할 복원 성공', revertStatus === 200, `status=${revertStatus}`)
  } else {
    console.log('  ⚠️ roletest 유저를 찾을 수 없음')
  }

  // admin을 MANAGER로 복원
  await exec(`${MYSQL_SETUP} "UPDATE tbl_user SET account_role='MANAGER' WHERE email='e2e-admin@dudoong.com'"`)
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  console.log(`🚀 DuDoong Admin E2E Test (심층)`)
  console.log(`   API: ${BASE}`)
  console.log(`   시작: ${new Date().toLocaleString('ko-KR')}`)

  // 서버 연결 확인
  try {
    await fetch(`${PUBLIC_API}/v1/examples/health`, { signal: AbortSignal.timeout(5000) })
  } catch {
    console.error('\n❌ 서버에 연결할 수 없습니다.')
    console.error('   1. cd DuDoong-Backend && docker compose up -d')
    console.error('   2. SPRING_PROFILES_ACTIVE=infrastructure,domain,domain-local,common ./gradlew :DuDoong-Api:bootRun')
    process.exit(1)
  }

  // Admin 유저 셋업
  const ready = await setupAdminUser()
  if (!ready) {
    console.error('\n❌ Admin 유저 셋업 실패. MySQL 접근을 확인하세요.')
    process.exit(1)
  }

  await testAuthFlow()
  await testDashboard()
  await testUsers()
  await testEvents()
  await testOrders()
  await testComments()
  await testAccessControl()
  await testRoleChangeEffect()

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
