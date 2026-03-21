export interface AdminDashboard {
  totalUsers: number
  todayNewUsers: number
  todayOrders: number
  todayRevenue: number
  activeEvents: number
  todayRefunds: number
  recentOrders: AdminOrder[]
  recentEvents: AdminEvent[]
}

/** @deprecated use AdminDashboard */
export type DashboardData = AdminDashboard

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

export interface AdminEventDetail extends AdminEvent {
  ticketItemCount: number
  issuedTicketCount: number
  totalOrderCount: number
  content: string | null
  placeName: string | null
  placeAddress: string | null
}

export interface AdminIssuedTicket {
  issuedTicketNo: string
  userName: string
  ticketName: string
  orderUuid: string
  enteredAt: string | null
  status: string
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

export interface AdminHost {
  id: number
  name: string
  introduce: string | null
  contactEmail: string | null
  contactNumber: string | null
  profileImage: string | null
  partner: boolean
  masterUserId: number
  createdAt: string
}

export interface AdminHostMember {
  userId: number
  userName: string
  role: string
  active: boolean
  createdAt: string
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
