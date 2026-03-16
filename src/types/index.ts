export interface DashboardData {
  totalUsers: number
  todayNewUsers: number
  todayOrders: number
  todayRevenue: number
  activeEvents: number
  todayRefunds: number
}

export interface AdminUser {
  id: number
  name: string
  email: string
  profileImage: string | null
  accountRole: string
  accountState: string
  createdAt: string
}

export interface AdminUserDetail extends AdminUser {
  phoneNumber: string | null
  marketingAgree: boolean
  oauthProvider: string | null
}

export interface AdminEvent {
  id: number
  name: string
  hostName: string
  status: string
  startAt: string
  runTime: number
  createdAt: string
}

export interface AdminOrder {
  orderId: string
  userName: string
  eventName: string
  ticketName: string
  totalAmount: number
  orderStatus: string
  createdAt: string
}

export interface AdminComment {
  id: number
  userName: string
  eventName: string
  content: string
  commentStatus: string
  createdAt: string
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
