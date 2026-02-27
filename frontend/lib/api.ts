import axios, { AxiosError } from 'axios';
import type { ApiResponse, AuthTokens, Event, EventStatus, EventReview, UserProfile, UserProfileReview } from './types';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    if (typeof window === 'undefined') {
        return config
    }

    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use( (res) => res, async (err: AxiosError<{ error?: string }>) => {
  const status = err.response?.status;

  if (status === 401 && typeof window !== 'undefined') {
      useAuthStore.getState().logout();
      window.dispatchEvent(new Event('auth-logout'));

      return Promise.reject(err);
  }

  return Promise.reject(err);
});

export interface AuthData {
  user: import('./types').User;
  tokens: AuthTokens;
}

export async function authRegister(body: { email: string; password: string; name: string; role?: string }): Promise<AuthData> {
  const { data } = await api.post<ApiResponse<AuthData>>('/auth/register', body);
  return data.data;
}

export async function authLogin(body: { email: string; password: string }): Promise<AuthData> {
  const { data } = await api.post<ApiResponse<AuthData>>('/auth/login', body);
  return data.data;
}

export async function authRefresh(refreshToken: string): Promise<AuthTokens> {
  const { data } = await api.post<ApiResponse<{ tokens: AuthTokens }>>('/auth/refresh', { refreshToken });
  return data.data.tokens;
}

export interface GetEventsParams {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    city?: string;
    search?: string;
    tags?: string;
}
  
export interface GetEventsResult {
    events: Event[];
    total: number;
    page: number;
    totalPages: number;
}

export async function getEvents(params?: GetEventsParams): Promise<GetEventsResult> {
  const { data } = await api.get<ApiResponse<GetEventsResult>>('/events', { params });
  return data.data;
}

export async function getAdminEvents(params?: GetEventsParams): Promise<GetEventsResult> {
  const { data } = await api.get<ApiResponse<GetEventsResult>>('/admin/events', { params });
  return data.data;
}

export async function getEventById(id: string) {
  const { data } = await api.get<ApiResponse<{ event: Event }>>(`/events/${id}`);
  return data.data.event;
}
export interface GetEventReviewsResult {
  reviews: EventReview[];
  total: number;
  page: number;
  totalPages: number;
  averageRating: number | null;
}

export async function getEventReviews(
  eventId: string,
  params?: { page?: number; limit?: number },
): Promise<GetEventReviewsResult> {
  const { data } = await api.get<ApiResponse<GetEventReviewsResult>>(
    `/events/${eventId}/reviews`,
    { params },
  );
  return data.data;
}

export async function createEventReview(eventId: string, body: { rating: number; comment?: string }) {
  const { data } = await api.post<ApiResponse<{
    review: EventReview;
    averageRating: number | null;
    totalReviews: number;
  }>>(`/events/${eventId}/reviews`, body);
  return data.data;
}

export async function deleteEventReview(eventId: string): Promise<void> {
  await api.delete<ApiResponse<unknown>>(`/events/${eventId}/reviews`);
}

export interface GetTicketsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface GetTicketsResult {
  tickets: import('./types').Ticket[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getTicketsByEvent(eventId: string, params?: GetTicketsParams): Promise<GetTicketsResult> {
  const { data } = await api.get<ApiResponse<GetTicketsResult>>(`/events/${eventId}/tickets`, { params });
  return data.data;
}

export interface CreateTicketsBulkBody {
  type: string;
  price: number;
  quantity: number;
  section?: string;
  row?: string;
  seat?: string;
}

export async function createTicketsBulk(
  eventId: string,
  body: CreateTicketsBulkBody
): Promise<{ tickets: import('./types').Ticket[]; count: number }> {
  const { data } = await api.post<ApiResponse<{ tickets: import('./types').Ticket[]; count: number }>>(
    `/events/${eventId}/tickets/bulk`,
    body
  );
  return data.data;
}

export async function deleteTicket(eventId: string, ticketId: string): Promise<void> {
  await api.delete<ApiResponse<unknown>>(`/events/${eventId}/tickets/${ticketId}`);
}

export async function createOrder(body: { ticketIds: string[]; deliveryEmail?: string; deliveryAddress?: string }) {
  const { data } = await api.post<ApiResponse<{ order: import('./types').Order }>>('/orders', body);
  return data.data.order;
}

export async function getMyOrders() {
  const { data } = await api.get<ApiResponse<{ orders: import('./types').Order[] }>>('/orders/me');
  return data.data.orders;
}

export async function getOrderById(id: string) {
  const { data } = await api.get<ApiResponse<{ order: import('./types').Order }>>(`/orders/${id}`);
  return data.data.order;
}

export async function payOrder(orderId: string, method: import('./types').PaymentMethod) {
  const { data } = await api.post<ApiResponse<{ order: import('./types').Order }>>(`/orders/${orderId}/pay`, { method });
  return data.data.order;
}

export async function createPaymentIntent(orderId: string): Promise<{
  clientSecret: string;
  paymentIntentId: string;
}> {
  const { data } = await api.post<ApiResponse<{ clientSecret: string; paymentIntentId: string }>>('/stripe/create-intent', { orderId });
  return data.data;
}

export async function confirmPayment(orderId: string, paymentIntentId: string): Promise<void> {
  await api.post<ApiResponse<{ message: string }>>('/stripe/confirm', { orderId, paymentIntentId });
}

export async function createSubscription(): Promise<{
  subscriptionId: string;
  clientSecret: string | null;
  customerId: string;
}> {
  const { data } = await api.post<ApiResponse<{ subscriptionId: string; clientSecret: string | null; customerId: string }>>('/stripe/subscriptions');
  return data.data;
}

export async function confirmSubscription(subscriptionId: string): Promise<void> {
  await api.post<ApiResponse<unknown>>('/stripe/subscriptions/confirm', { subscriptionId });
}

export async function cancelSubscription(cancelImmediately: boolean = false): Promise<void> {
  await api.delete('/stripe/subscriptions', {
    data: { cancelImmediately },
  });
}

export async function getMySubscription() {
  const { data } = await api.get<ApiResponse<{ subscription: any }>>('/stripe/subscriptions/me');
  return data.data.subscription;
}

export async function getPublicProfile(userId: string): Promise<{ profile: UserProfile }> {
  const { data } = await api.get<ApiResponse<{ profile: UserProfile }>>(`/users/${userId}/public`);
  return data.data;
}

export async function updateMyProfile(body: {
  name?: string;
  email?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
}) {
  const { data } = await api.patch<ApiResponse<{ user: import('./types').User }>>(
    '/users/profile',
    body,
  );
  return data.data.user;
}

export async function getUserOrganizedEvents(userId: string): Promise<{ events: Event[] }> {
  const { data } = await api.get<ApiResponse<{ events: Event[] }>>(`/users/${userId}/events`);
  return data.data;
}

export interface GetUserProfileReviewsResult {
  reviews: UserProfileReview[];
  total: number;
  page: number;
  totalPages: number;
  averageRating: number | null;
}

export async function getUserProfileReviews(userId: string, params?: { page?: number; limit?: number }): Promise<GetUserProfileReviewsResult> {
  const { data } = await api.get<ApiResponse<GetUserProfileReviewsResult>>(
    `/users/${userId}/reviews`,
    { params },
  );
  return data.data;
}

export async function createUserProfileReview(userId: string, body: { rating: number; comment?: string }) {
  const { data } = await api.post<ApiResponse<{
    review: UserProfileReview;
    averageRating: number | null;
    totalReviews: number;
  }>>(`/users/${userId}/reviews`, body);
  return data.data;
}

export async function deleteUserProfileReview(userId: string): Promise<void> {
  await api.delete<ApiResponse<unknown>>(`/users/${userId}/reviews`);
}

export interface GetFavoritesParams {
  page?: number;
  limit?: number;
}

export interface GetFavoritesResult {
  favorites: Event[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getFavorites(params?: GetFavoritesParams): Promise<GetFavoritesResult> {
  const { data } = await api.get<ApiResponse<GetFavoritesResult>>('/favorites', { params });
  return data.data;
}

export async function addFavorite(eventId: string) {
  const { data } = await api.post<ApiResponse<unknown>>(`/favorites/${eventId}`);
  return data.data;
}

export async function removeFavorite(eventId: string) {
  const { data } = await api.delete<ApiResponse<unknown>>(`/favorites/${eventId}`);
  return data.data;
}

export async function checkFavorite(eventId: string): Promise<{ isFavorite: boolean }> {
  const { data } = await api.get<ApiResponse<{ isFavorite: boolean }>>(`/favorites/${eventId}/check`);
  return data.data;
}

export async function getMyEvents(includeDrafts?: boolean): Promise<{ events: Event[] }> {
  const { data } = await api.get<ApiResponse<{ events: Event[] }>>('/events/organizer/me', {
    params: includeDrafts ? { includeDrafts: 'true' } : undefined,
  });
  return data.data;
}

export async function createEvent(body: { title: string; description?: string; venue: string; address?: string; city: string; country: string; date: string; imageUrl?: string; category?: string; tags?: string[]; }): Promise<Event> {
  const { data } = await api.post<ApiResponse<{ event: Event }>>('/events', body);
  return data.data.event;
}

export async function publishEvent(eventId: string): Promise<Event> {
  const { data } = await api.post<ApiResponse<{ event: Event }>>(`/events/${eventId}/publish`);
  return data.data.event;
}

export async function updateEvent(eventId: string, body: { title?: string; description?: string; venue?: string; address?: string; city?: string; country?: string; date?: string; imageUrl?: string; category?: string; status?: EventStatus; tags?: string[]; }): Promise<Event> {
  const { data } = await api.patch<ApiResponse<{ event: Event }>>(`/events/${eventId}`, body);
  return data.data.event;
}

export async function deleteEvent(eventId: string): Promise<void> {
  await api.delete<ApiResponse<unknown>>(`/events/${eventId}`);
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalEvents: number;
  totalOrders: number;
  totalRevenue: number;
  ordersCompleted: number;
}

export async function getAdminDashboard(): Promise<AdminDashboardStats> {
  const { data } = await api.get<ApiResponse<AdminDashboardStats>>('/admin/dashboard');
  return data.data;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface GetAllUsersResult {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getAllUsers(params?: { page?: number; limit?: number }): Promise<GetAllUsersResult> {
  const { data } = await api.get<ApiResponse<GetAllUsersResult>>('/users', { params });
  return data.data;
}

export interface GetOrdersAdminParams {
  page?: number;
  limit?: number;
  status?: string;
  eventId?: string;
}

export interface GetOrdersAdminResult {
  orders: import('./types').Order[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getOrdersAdmin(params?: GetOrdersAdminParams): Promise<GetOrdersAdminResult> {
  const { data } = await api.get<ApiResponse<GetOrdersAdminResult>>('/orders', { params });
  return data.data;
}

export interface ReleaseReservationsResult {
  released: number;
  ordersCancelled: number;
}

export async function releaseExpiredReservations(): Promise<ReleaseReservationsResult> {
  const { data } = await api.post<ApiResponse<{ released: number; ordersCancelled: number }>>('/admin/release-expired-reservations');
  return data.data;
}

export default api;