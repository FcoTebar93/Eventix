'use client';

import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { Event } from '../lib/types';
import { useState, useMemo, useCallback, memo } from 'react';
import { FavoriteButton } from './FavoriteButton';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop';

function CalendarIcon({ className = '' }: { className?: string }) {
    return (
        <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );
}

function LocationIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

function TicketIcon() {
    return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4v-3a2 2 0 00-2-2H5z" />
        </svg>
    );
}

export const EventCard = memo(function EventCard({ event }: { event: Event }) {
    const t = useTranslations('events');
    const locale = useLocale();
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const eventDate = useMemo(() => new Date(event.date), [event.date]);
    const now = useMemo(() => new Date(), []);
    const daysUntilEvent = useMemo(() => {
        const diff = eventDate.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }, [eventDate, now]);

    const formattedDate = useMemo(() => {
        return eventDate.toLocaleDateString(locale, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    }, [eventDate, locale]);

    const formattedDay = useMemo(() => {
        return eventDate.toLocaleDateString(locale, { day: 'numeric' });
    }, [eventDate, locale]);

    const formattedMonth = useMemo(() => {
        return eventDate.toLocaleDateString(locale, { month: 'short' });
    }, [eventDate, locale]);

    const getDaysText = useCallback(() => {
        if (daysUntilEvent < 0) return t('past');
        if (daysUntilEvent === 0) return t('today');
        if (daysUntilEvent === 1) return t('tomorrow');
        return t('daysAway', { count: daysUntilEvent });
    }, [daysUntilEvent, t]);

    const imageUrl = imageError ? DEFAULT_IMAGE : (event.imageUrl || DEFAULT_IMAGE);
    const hasTickets = event._count && event._count.tickets > 0;
    const isSoldOut = !hasTickets;

    return (
        <Link href={`/events/${event.id}`}>
            <article className="group relative overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] transition-all duration-500 hover:scale-[1.02] hover:border-[var(--accent)] hover:shadow-2xl hover:shadow-[var(--accent)]/30 cursor-pointer">
                <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)]">
                    {!imageLoaded && (
                        <div className="absolute inset-0 animate-pulse bg-[var(--bg-secondary)]" />
                    )}
                    <img
                        src={imageUrl}
                        alt={event.title}
                        className={`h-full w-full object-cover transition-all duration-700 ${
                            imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
                        } group-hover:scale-110`}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => {
                            setImageError(true);
                            setImageLoaded(true);
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-70 transition-opacity" />
                    
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                        <FavoriteButton eventId={event.id} initialIsFavorite={event.isFavorite} size="sm" />
                        {event.status === 'PUBLISHED' && (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                                isSoldOut 
                                    ? 'bg-red-500/90 text-white' 
                                    : 'bg-green-500/90 text-white'
                            }`}>
                                {isSoldOut ? t('soldOut') : t('available')}
                            </span>
                        )}
                    </div>

                    {event.category && (
                        <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--accent)]/90 text-white backdrop-blur-sm">
                                {event.category}
                            </span>
                        </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-center gap-2 text-white text-sm font-medium">
                            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg">
                                <CalendarIcon />
                                <span className="font-bold text-lg">{formattedDay}</span>
                                <span className="text-xs uppercase">{formattedMonth}</span>
                            </div>
                            {daysUntilEvent >= 0 && (
                                <div className="bg-[var(--accent)]/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-semibold">
                                    {getDaysText()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-5">
                    <h2 className="line-clamp-2 text-xl font-bold text-white group-hover:text-[var(--accent)] transition-colors mb-3">
                        {event.title}
                    </h2>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <CalendarIcon className="text-white" />
                            <span>{formattedDate}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <LocationIcon />
                            <span className="line-clamp-1">{event.venue} · {event.city}</span>
                        </div>

                        {hasTickets && (
                            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                <TicketIcon />
                                <span>
                                    {event._count!.tickets} {event._count!.tickets === 1 ? t('ticket') : t('tickets')}
                                </span>
                            </div>
                        )}

                        {event.tags && event.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {event.tags.slice(0, 4).map((et) => (
                                    <span
                                        key={et.id}
                                        className="rounded-md bg-[var(--bg-secondary)] px-2 py-0.5 text-xs text-[var(--text-secondary)] border border-[var(--border)]"
                                    >
                                        {et.tag.name}
                                    </span>
                                ))}
                                {event.tags.length > 4 && (
                                    <span className="text-xs text-[var(--text-secondary)] self-center">
                                        +{event.tags.length - 4}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-[var(--border)]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">
                                {t('viewDetails')}
                            </span>
                            <svg className="w-5 h-5 text-[var(--accent)] transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
});