import axios, { AxiosError } from 'axios';
import { ApiResponse } from './types';

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

export async function authRegister(body: { email: string; password: string; role?: string }): Promise<ApiResponse<AuthTokens>> {
    try {
        const { data } = await api.post<ApiResponse<{ user: import('./types').User; tokens: import('./types').AuthTokens }>>('/auth/login', body);
        return data;
    } catch (error) {
        throw error;
    }
}

export async function authRefresh(refreshToken: string) {
    try {
        const { data } = await api.post<ApiResponse<{ tokens: import('./types').AuthTokens }>>('/auth/refresh', { refreshToken });
        return data.data.tokens;
    } catch (error) {
        throw error;
    }
}

export default api;