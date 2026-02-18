'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { addFavorite, removeFavorite, checkFavorite } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';

interface FavoriteButtonProps {
    eventId: string;
    initialIsFavorite?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'icon' | 'text';
}

function HeartIcon({ filled, size }: { filled: boolean; size: string }) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };

    return (
        <svg
            className={sizeClasses[size as keyof typeof sizeClasses]}
            fill={filled ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={filled ? 0 : 2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
        </svg>
    );
}

export function FavoriteButton({ 
    eventId, 
    initialIsFavorite,
    size = 'md',
    variant = 'icon'
}: FavoriteButtonProps) {
    const t = useTranslations('favorites');
    const user = useAuthStore((state) => state.user);
    const router = useRouter();
    const isAuthenticated = !!user;
    const queryClient = useQueryClient();

    // Usar React Query para cachear y sincronizar el estado de favorito
    const { data: favoriteStatus, isLoading: isLoadingStatus } = useQuery({
        queryKey: ['favorite', eventId],
        queryFn: () => checkFavorite(eventId),
        enabled: isAuthenticated, // Solo verificar si está autenticado
        initialData: initialIsFavorite !== undefined ? { isFavorite: initialIsFavorite } : undefined,
        staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    });

    const isFavorite = favoriteStatus?.isFavorite ?? (initialIsFavorite ?? false);

    const addFavoriteMutation = useMutation({
        mutationFn: () => addFavorite(eventId),
        onSuccess: () => {
            // Actualizar el cache de React Query
            queryClient.setQueryData(['favorite', eventId], { isFavorite: true });
            // Invalidar queries relacionadas
            queryClient.invalidateQueries({ queryKey: ['event', eventId] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
        onError: (error: any) => {
            const status = error?.response?.status;
            const message = error?.response?.data?.error || t('addError');
            
            // Si el error es 400 y dice "ya está en favoritos", actualizar el estado
            if (status === 400 && message.includes('ya está')) {
                queryClient.setQueryData(['favorite', eventId], { isFavorite: true });
                queryClient.invalidateQueries({ queryKey: ['favorites'] });
            } else {
                alert(message);
            }
        },
    });

    const removeFavoriteMutation = useMutation({
        mutationFn: () => removeFavorite(eventId),
        onSuccess: () => {
            // Actualizar el cache de React Query
            queryClient.setQueryData(['favorite', eventId], { isFavorite: false });
            // Invalidar queries relacionadas
            queryClient.invalidateQueries({ queryKey: ['event', eventId] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
        onError: (error: any) => {
            const status = error?.response?.status;
            const message = error?.response?.data?.error || t('removeError');
            
            // Si el error es 404 y dice "no está en favoritos", actualizar el estado
            if (status === 404 && message.includes('no está')) {
                queryClient.setQueryData(['favorite', eventId], { isFavorite: false });
                queryClient.invalidateQueries({ queryKey: ['favorites'] });
            } else {
                alert(message);
            }
        },
    });

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            if (confirm(t('loginRequired') + '\n\n¿Deseas ir al login?')) {
                router.push('/login');
            }
            return;
        }

        if (isFavorite) {
            removeFavoriteMutation.mutate();
        } else {
            addFavoriteMutation.mutate();
        }
    };

    const isLoading = isLoadingStatus || addFavoriteMutation.isPending || removeFavoriteMutation.isPending;

    const sizeClasses = {
        sm: 'p-1.5',
        md: 'p-2',
        lg: 'p-2.5',
    };

    const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
    };

    // Estilos dinámicos basados en el estado
    const isFavoriteAndAuth = isFavorite && isAuthenticated;
    
    const iconButtonClasses = isFavoriteAndAuth
        ? `rounded-full border-2 border-red-500 bg-red-500/90 backdrop-blur-md text-white shadow-lg shadow-red-500/50 transition-all hover:border-red-400 hover:bg-red-600 hover:shadow-xl hover:shadow-red-500/60 hover:scale-110 disabled:opacity-50 ${sizeClasses[size]}`
        : `rounded-full border-2 border-white/90 bg-black/60 backdrop-blur-md text-white shadow-lg shadow-black/50 transition-all hover:border-[var(--accent)] hover:bg-black/80 hover:text-[var(--accent)] hover:shadow-xl hover:shadow-black/60 hover:scale-110 disabled:opacity-50 ${sizeClasses[size]}`;

    if (variant === 'text') {
        return (
            <button
                onClick={handleToggle}
                disabled={isLoading}
                className={`flex items-center gap-2 rounded-md border-2 px-3 py-1.5 transition-all disabled:opacity-50 ${
                    isFavoriteAndAuth
                        ? 'border-red-500 bg-red-500/90 text-white shadow-lg shadow-red-500/50 hover:bg-red-600 hover:shadow-xl'
                        : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border)] hover:text-[var(--accent)]'
                } ${textSizeClasses[size]}`}
                aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
            >
                <HeartIcon filled={isFavoriteAndAuth} size={size} />
                {isFavoriteAndAuth ? t('remove') : t('add')}
            </button>
        );
    }

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading}
            className={iconButtonClasses}
            aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
        >
            <HeartIcon filled={isFavoriteAndAuth} size={size} />
        </button>
    );
}