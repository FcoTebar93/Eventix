import axios, { AxiosError } from 'axios';
import type { ApiResponse, AuthTokens, Event } from './types';

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
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
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

export async function getEventById(id: string) {
  const { data } = await api.get<ApiResponse<{ event: Event }>>(`/events/${id}`);
  return data.data.event;
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

// Favorites API
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

export default api;