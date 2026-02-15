'use client';

import Link from 'next/link';
import { Event } from '../lib/types';

const DEFAULT_IMAGE = '/images/event-placeholder.jpg';

export function EventCard({ event }: { event: Event }) {
    const date = new Date(event.date);
    const formattedDate = date.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const imageUrl = event.imageUrl || DEFAULT_IMAGE;

    return (
        <Link href={`/events/${event.id}`}>
            <article className="group relative overflow-hidden rounded-xl bg-[var(--bg-card)] border border-[var(--border)] transition-all duration-300 hover:scale-[1.02] hover:border-[var(--accent)] hover:shadow-lg hover:shadow-[var(--accent)]/20">
                <div className="aspect-video w-full overflow-hidden bg-[var(--bg-secondary)]">
                <img
                    src={imageUrl}
                    alt={event.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                </div>
                <div className="p-4">
                    {event.category && (
                    <span className="text-xs font-medium uppercase tracking-wider text-[var(--accent)]">
                    {event.category}
                    </span>
                )}
                <h2 className="mt-1 line-clamp-2 text-lg font-semibold text-white group-hover:text-[var(--accent)] transition-colors">
                    {event.title}
                </h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {formattedDate}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                    {event.venue} · {event.city}
                </p>
                {event._count && (
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {event._count.tickets} entradas
                    </p>
                )}
                </div>
            </article>
        </Link>
    );
}  