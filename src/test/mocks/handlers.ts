import { http, HttpResponse } from 'msw'

export const handlers = [
  // Dashboard
  http.get('*/internal-api/v1/dashboard', () =>
    HttpResponse.json({
      status: 200,
      data: {
        totalUsers: 1234,
        todayNewUsers: 12,
        todayOrders: 45,
        todayRevenue: 675000,
        activeEvents: 8,
        todayRefunds: 3,
      },
    })
  ),

  // Users list
  http.get('*/internal-api/v1/users', ({ request }) => {
    const url = new URL(request.url)
    const keyword = url.searchParams.get('keyword')
    const users = [
      { id: 1, name: '테스트유저', email: 'test@dudoong.com', profileImage: null, accountRole: 'USER', accountState: 'NORMAL', createdAt: '2026-01-01T00:00:00' },
      { id: 2, name: '관리자', email: 'admin@dudoong.com', profileImage: null, accountRole: 'SUPER_ADMIN', accountState: 'NORMAL', createdAt: '2026-01-01T00:00:00' },
      { id: 3, name: '매니저', email: 'manager@dudoong.com', profileImage: null, accountRole: 'MANAGER', accountState: 'NORMAL', createdAt: '2026-01-02T00:00:00' },
    ]
    const filtered = keyword
      ? users.filter(u => u.name.includes(keyword) || u.email.includes(keyword))
      : users
    return HttpResponse.json({
      status: 200,
      data: { content: filtered, totalElements: filtered.length, totalPages: 1, number: 0, size: 20 },
    })
  }),

  // User detail
  http.get('*/internal-api/v1/users/:id', ({ params }) =>
    HttpResponse.json({
      status: 200,
      data: {
        id: Number(params.id),
        name: '테스트유저',
        email: 'test@dudoong.com',
        profileImage: null,
        accountRole: 'USER',
        accountState: 'NORMAL',
        phoneNumber: '010-1234-5678',
        marketingAgree: false,
        oauthProvider: 'KAKAO',
        createdAt: '2026-01-01T00:00:00',
      },
    })
  ),

  // Admin login
  http.post('*/internal-api/v1/auth/oauth/local/login', async ({ request }) => {
    const body = (await request.json()) as { email?: string }
    if (body.email === 'forbidden@dudoong.com') {
      return HttpResponse.json({ status: 403, code: 'ADMIN_FORBIDDEN' }, { status: 403 })
    }
    return HttpResponse.json({
      status: 200,
      data: {
        accessToken: 'mock-admin-token',
        refreshToken: 'mock-refresh-token',
        accessTokenAge: 3600,
        refreshTokenAge: 7200,
        userProfile: { name: '관리자', email: body.email },
      },
    })
  }),

  // Events list
  http.get('*/internal-api/v1/events', () =>
    HttpResponse.json({
      status: 200,
      data: {
        content: [
          { id: 1, name: '봄 콘서트', hostName: '고스락', status: 'OPEN', startAt: '2026-04-01T18:00:00', runTime: 120, createdAt: '2026-03-01T00:00:00' },
        ],
        totalElements: 1, totalPages: 1, number: 0, size: 20,
      },
    })
  ),

  // Orders list
  http.get('*/internal-api/v1/orders', () =>
    HttpResponse.json({
      status: 200,
      data: {
        content: [
          { orderId: 'uuid-1234-5678', userName: '테스트유저', eventName: '봄 콘서트', ticketName: '일반석', totalAmount: 15000, orderStatus: 'CONFIRM', createdAt: '2026-03-15T10:00:00' },
        ],
        totalElements: 1, totalPages: 1, number: 0, size: 20,
      },
    })
  ),

  // Comments list
  http.get('*/internal-api/v1/comments', () =>
    HttpResponse.json({
      status: 200,
      data: {
        content: [
          { id: 1, userName: '테스트유저', eventName: '봄 콘서트', content: '정말 기대됩니다!', commentStatus: 'ACTIVE', createdAt: '2026-03-15T12:00:00' },
        ],
        totalElements: 1, totalPages: 1, number: 0, size: 20,
      },
    })
  ),
]
