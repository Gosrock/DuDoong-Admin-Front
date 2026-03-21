import client from './client'

// Dashboard
export const getDashboard = (params?: { startDate?: string; endDate?: string }) =>
  client.get('/internal-api/v1/dashboard', { params }).then(r => r.data.data)

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
export const updateEventStatus = (eventId: number, status: string) =>
  client.patch(`/internal-api/v1/events/${eventId}/status`, { status }).then(r => r.data.data)
export const updateEvent = (eventId: number, data: {
  name?: string; startAt?: string; runTime?: number;
  content?: string; placeName?: string; placeAddress?: string;
}) =>
  client.patch(`/internal-api/v1/events/${eventId}`, data).then(r => r.data.data)
export const getEventIssuedTickets = (eventId: number, params: { page?: number; size?: number }) =>
  client.get(`/internal-api/v1/events/${eventId}/issued-tickets`, { params }).then(r => r.data.data)
export const getEventTicketItems = (eventId: number) =>
  client.get(`/internal-api/v1/events/${eventId}/ticket-items`).then(r => r.data.data)
export const updateTicketItem = (eventId: number, ticketItemId: number, data: {
  name?: string; description?: string; price?: number; quantity?: number; purchaseLimit?: number;
}) =>
  client.patch(`/internal-api/v1/events/${eventId}/ticket-items/${ticketItemId}`, data).then(r => r.data.data)
export const adjustTicketStock = (eventId: number, ticketItemId: number, delta: number) =>
  client.post(`/internal-api/v1/events/${eventId}/ticket-items/${ticketItemId}/adjust-stock`, { delta }).then(r => r.data.data)

// Orders
export const getOrders = (params: { page?: number; size?: number; keyword?: string; status?: string; eventId?: number }) =>
  client.get('/internal-api/v1/orders', { params }).then(r => r.data.data)
export const getOrderDetail = (orderUuid: string) =>
  client.get(`/internal-api/v1/orders/${orderUuid}`).then(r => r.data.data)
export const cancelOrder = (orderUuid: string) =>
  client.post(`/internal-api/v1/orders/${orderUuid}/cancel`).then(r => r.data.data)

// Comments
export const getComments = (params: { page?: number; size?: number; keyword?: string; eventId?: number }) =>
  client.get('/internal-api/v1/comments', { params }).then(r => r.data.data)
export const deleteComment = (commentId: number) =>
  client.delete(`/internal-api/v1/comments/${commentId}`)

// Hosts
export const getHosts = (params: { page?: number; size?: number; keyword?: string }) =>
  client.get('/internal-api/v1/hosts', { params }).then(r => r.data.data)
export const getHostDetail = (hostId: number) =>
  client.get(`/internal-api/v1/hosts/${hostId}`).then(r => r.data.data)
export const getHostMembers = (hostId: number) =>
  client.get(`/internal-api/v1/hosts/${hostId}/members`).then(r => r.data.data)
export const updateHostMemberRole = (hostId: number, userId: number, role: string) =>
  client.patch(`/internal-api/v1/hosts/${hostId}/members/${userId}/role`, { role }).then(r => r.data.data)
export const addHostMember = (hostId: number, userId: number, role: string) =>
  client.post(`/internal-api/v1/hosts/${hostId}/members`, { userId, role }).then(r => r.data.data)
export const removeHostMember = (hostId: number, userId: number) =>
  client.delete(`/internal-api/v1/hosts/${hostId}/members/${userId}`)
export const updateHostPartner = (hostId: number, partner: boolean) =>
  client.patch(`/internal-api/v1/hosts/${hostId}/partner`, { partner }).then(r => r.data.data)
export const updateHostProfile = (hostId: number, data: {
  name?: string; introduce?: string; contactEmail?: string; contactNumber?: string;
}) =>
  client.patch(`/internal-api/v1/hosts/${hostId}/profile`, data).then(r => r.data.data)
export const getHostEvents = (hostId: number, params: { page?: number; size?: number }) =>
  client.get(`/internal-api/v1/hosts/${hostId}/events`, { params }).then(r => r.data.data)

// Exports
export const exportOrders = (params: { keyword?: string; status?: string; eventId?: number }) =>
  client.get('/internal-api/v1/orders/export', { responseType: 'blob', params })
export const exportUsers = (params: { keyword?: string }) =>
  client.get('/internal-api/v1/users/export', { responseType: 'blob', params })
export const exportEvents = (params: { keyword?: string; status?: string }) =>
  client.get('/internal-api/v1/events/export', { responseType: 'blob', params })
export const exportTicketItems = (eventId: number) =>
  client.get(`/internal-api/v1/events/${eventId}/ticket-items/export`, { responseType: 'blob' })
export const exportIssuedTickets = (eventId: number) =>
  client.get(`/internal-api/v1/events/${eventId}/issued-tickets/export`, { responseType: 'blob' })

// Auth
export const getAdminMe = () =>
  client.get('/internal-api/v1/auth/me').then(r => r.data.data)
