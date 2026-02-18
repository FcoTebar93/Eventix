'use client';

import { useQuery } from '@tanstack/react-query';
import { getFavorites } from '@/lib/api';
import { EventCard } from '@/components/EventCard';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export default function FavoritesPage() {
    const t = useTranslations('favorites');
    const [page, setPage] = useState(1);
    const limit = 12;

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['favorites', { page, limit }],
        queryFn: () => getFavorites({ page, limit }),
    });

    return (
        <ProtectedRoute>
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">{t('title')}</h1>
                <p className="mt-2 text-[var(--text-secondary)]">{t('subtitle')}</p>

                {isLoading && (
                    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className="h-80 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--bg-card)]"
                            />
                        ))}
                    </div>
                )}

                {isError && (
                    <p className="mt-6 text-red-400">
                        {error instanceof Error ? error.message : t('error')}
                    </p>
                )}

                {!isLoading && !isError && (
                    <>
                        {!data || data.favorites.length === 0 ? (
                            <div className="mt-8 text-center">
                                <svg
                                    className="mx-auto h-24 w-24 text-[var(--text-secondary)]"
                                    fill="none"
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
                                <p className="mt-4 text-lg text-[var(--text-secondary)]">{t('noFavorites')}</p>
                                <p className="mt-2 text-sm text-[var(--text-secondary)]">{t('noFavoritesHint')}</p>
                            </div>
                        ) : (
                            <>
                                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {data.favorites.map((event) => (
                                        <EventCard key={event.id} event={event} />
                                    ))}
                                </div>

                                {data.totalPages > 1 && (
                                    <div className="mt-8 flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--border)] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {t('previous')}
                                        </button>
                                        <span className="px-4 py-2 text-[var(--text-secondary)]">
                                            {t('page', { current: page, total: data.totalPages })}
                                        </span>
                                        <button
                                            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                                            disabled={page === data.totalPages}
                                            className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--border)] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {t('next')}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </ProtectedRoute>
    );
}
