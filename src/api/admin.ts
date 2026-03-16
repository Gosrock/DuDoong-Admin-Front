import client from './client'

// Dashboard
export const getDashboard = () =>
  client.get('/internal-api/v1/dashboard').then(r => r.data.data)

// Users
export const getUsers = (params: { page?: number; size?: number; keyword?: string }) =>
  client.get('/internal-api/v1/users', { params }).then(r => r.data.data)
export const getUserDetail = (userId: number) =>
  client.get(`/internal-api/v1/users/${userId}`).then(r => r.data.data)
export const updateUserRole = (userId: number, role: string) =>
  client.patch(`/internal-api/v1/users/${userId}/role`, { role }).then(r => r.data.data)
export const updateUserStatus = (userId: number, status: string) =>
  client.patch(`/internal-api/v1/users/${userId}/status`, { status }).then(r => r.data.data)

// Events
export const getEvents = (params: { page?: number; size?: number; keyword?: string; status?: string }) =>
  client.get('/internal-api/v1/events', { params }).then(r => r.data.data)
export const getEventDetail = (eventId: number) =>
  client.get(`/internal-api/v1/events/${eventId}`).then(r => r.data.data)
export const deleteEvent = (eventId: number) =>
  client.delete(`/internal-api/v1/events/${eventId}`)

// Orders
export const getOrders = (params: { page?: number; size?: number; keyword?: string; status?: string }) =>
  client.get('/internal-api/v1/orders', { params }).then(r => r.data.data)
export const getOrderDetail = (orderUuid: string) =>
  client.get(`/internal-api/v1/orders/${orderUuid}`).then(r => r.data.data)
export const cancelOrder = (orderUuid: string) =>
  client.post(`/internal-api/v1/orders/${orderUuid}/cancel`).then(r => r.data.data)

// Comments
export const getComments = (params: { page?: number; size?: number; keyword?: string }) =>
  client.get('/internal-api/v1/comments', { params }).then(r => r.data.data)
export const deleteComment = (commentId: number) =>
  client.delete(`/internal-api/v1/comments/${commentId}`)

// Auth
export const login = (email: string, name: string) =>
  client.post('/v1/auth/oauth/local/login', {
    email,
    name,
    phoneNumber: '010-0000-0000',
    profileImage: null,
    marketingAgree: false,
  }).then(r => r.data.data)
