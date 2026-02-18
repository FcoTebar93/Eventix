'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addFavorite, removeFavorite, checkFavorite } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useTranslations } from 'next-intl';

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
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
        </svg>
    );
}

export function FavoriteButton({ 
    eventId, 
    initialIsFavorite = false,
    size = 'md',
    variant = 'icon'
}: FavoriteButtonProps) {
    const t = useTranslations('favorites');
    const { isAuthenticated } = useAuthStore();
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const queryClient = useQueryClient();

    // Verificar el estado inicial si el usuario está autenticado
    useEffect(() => {
        if (isAuthenticated && initialIsFavorite === undefined) {
            checkFavorite(eventId)
                .then((data) => setIsFavorite(data.isFavorite))
                .catch(() => {
                    // Silenciar errores si el usuario no está autenticado
                });
        } else if (initialIsFavorite !== undefined) {
            setIsFavorite(initialIsFavorite);
        }
    }, [eventId, initialIsFavorite, isAuthenticated]);

    const addFavoriteMutation = useMutation({
        mutationFn: () => addFavorite(eventId),
        onSuccess: () => {
            setIsFavorite(true);
            // Invalidar queries relacionadas
            queryClient.invalidateQueries({ queryKey: ['event', eventId] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.error || t('addError');
            alert(message);
        },
    });

    const removeFavoriteMutation = useMutation({
        mutationFn: () => removeFavorite(eventId),
        onSuccess: () => {
            setIsFavorite(false);
            // Invalidar queries relacionadas
            queryClient.invalidateQueries({ queryKey: ['event', eventId] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.error || t('removeError');
            alert(message);
        },
    });

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            alert(t('loginRequired'));
            return;
        }

        if (isFavorite) {
            removeFavoriteMutation.mutate();
        } else {
            addFavoriteMutation.mutate();
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    const isLoading = addFavoriteMutation.isPending || removeFavoriteMutation.isPending;

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

    if (variant === 'text') {
        return (
            <button
                onClick={handleToggle}
                disabled={isLoading}
                className={`flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--border)] hover:text-[var(--accent)] disabled:opacity-50 ${textSizeClasses[size]}`}
                aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
            >
                <HeartIcon filled={isFavorite} size={size} />
                {isFavorite ? t('remove') : t('add')}
            </button>
        );
    }

    return (
        <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-all hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50 ${sizeClasses[size]}`}
            aria-label={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
        >
            <HeartIcon filled={isFavorite} size={size} />
        </button>
    );
}
