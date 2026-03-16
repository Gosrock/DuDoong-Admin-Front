import client from './client'

// Dashboard
export const getDashboard = () =>
  client.get('/v1/admin/dashboard').then(r => r.data.data)

// Users
export const getUsers = (params: { page?: number; size?: number; keyword?: string }) =>
  client.get('/v1/admin/users', { params }).then(r => r.data.data)
export const getUserDetail = (userId: number) =>
  client.get(`/v1/admin/users/${userId}`).then(r => r.data.data)
export const updateUserRole = (userId: number, role: string) =>
  client.patch(`/v1/admin/users/${userId}/role`, { role }).then(r => r.data.data)
export const updateUserStatus = (userId: number, status: string) =>
  client.patch(`/v1/admin/users/${userId}/status`, { status }).then(r => r.data.data)

// Events
export const getEvents = (params: { page?: number; size?: number; keyword?: string; status?: string }) =>
  client.get('/v1/admin/events', { params }).then(r => r.data.data)
export const getEventDetail = (eventId: number) =>
  client.get(`/v1/admin/events/${eventId}`).then(r => r.data.data)
export const deleteEvent = (eventId: number) =>
  client.delete(`/v1/admin/events/${eventId}`)

// Orders
export const getOrders = (params: { page?: number; size?: number; keyword?: string; status?: string }) =>
  client.get('/v1/admin/orders', { params }).then(r => r.data.data)
export const getOrderDetail = (orderUuid: string) =>
  client.get(`/v1/admin/orders/${orderUuid}`).then(r => r.data.data)
export const cancelOrder = (orderUuid: string) =>
  client.post(`/v1/admin/orders/${orderUuid}/cancel`).then(r => r.data.data)

// Comments
export const getComments = (params: { page?: number; size?: number; keyword?: string }) =>
  client.get('/v1/admin/comments', { params }).then(r => r.data.data)
export const deleteComment = (commentId: number) =>
  client.delete(`/v1/admin/comments/${commentId}`)

// Auth
export const login = (email: string, name: string) =>
  client.post('/v1/auth/oauth/local/login', {
    email,
    name,
    phoneNumber: '010-0000-0000',
    profileImage: null,
    marketingAgree: false,
  }).then(r => r.data.data)
