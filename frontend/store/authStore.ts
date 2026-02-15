import create from 'zustand';
import { User, AuthTokens } from '../lib/types';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    setAuth: (user: User, tokens: AuthTokens) => void;
    logout: () => void;
    loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    accessToken: null,
    refreshToken: null,

    setAuth: (user, tokens) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', tokens.accessToken);
            localStorage.setItem('refreshToken', tokens.refreshToken);
            localStorage.setItem('user', JSON.stringify(user));
        }
        set({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    },

    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
        }
        set({ user: null, accessToken: null, refreshToken: null });
    },

    loadFromStorage: () => {
        if (typeof window === 'undefined') return;
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const userStr = localStorage.getItem('user');
        const user = userStr ? (JSON.parse(userStr) as User) : null;
        set({ user, accessToken, refreshToken });
    },
}));