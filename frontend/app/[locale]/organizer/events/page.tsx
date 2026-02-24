'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Link } from '@/i18n/routing';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyEvents, publishEvent, deleteEvent } from '@/lib/api';
import type { Event } from '@/lib/types';
import { useAuthStore } from '@/store/authStore';
import { useTranslations, useLocale } from 'next-intl';

const ProtectedRoute = dynamic(() => import('@/components/ProtectedRoute'), {
  loading: () => (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="h-8 w-48 animate-pulse rounded bg-[var(--bg-card)]" />
      <div className="mt-6 h-64 animate-pulse rounded-xl bg-[var(--bg-card)]" />
    </div>
  ),
  ssr: false,
});

const statusColors: Record<string, string> = {
  DRAFT: 'text-yellow-400',
  PUBLISHED: 'text-green-400',
  CANCELLED: 'text-red-400',
  COMPLETED: 'text-gray-400',
};

export default function OrganizerEventsPage() {
  const t = useTranslations('organizer');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [includeDrafts, setIncludeDrafts] = useState(true);

  const isOrganizer = user?.role === 'ORGANIZER' || user?.role === 'ADMIN';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['myEvents', includeDrafts],
    queryFn: () => getMyEvents(includeDrafts),
    enabled: !!user && isOrganizer,
  });

  const events = data?.events ?? [];

  const handlePublish = async (e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await publishEvent(eventId);
      await queryClient.invalidateQueries({ queryKey: ['myEvents'] });
    } catch {
      alert(t('publishError'));
    }
  };

  const handleDelete = async (e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await deleteEvent(eventId);
      await queryClient.invalidateQueries({ queryKey: ['myEvents'] });
    } catch {
      alert(t('deleteError'));
    }
  };

  if (user && !isOrganizer) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-red-400">{t('forbidden')}</p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Tu rol actual es: <strong>{user.role}</strong>. Necesitas ser ORGANIZER para acceder a esta página.
        </p>
        <Link href="/" className="mt-4 inline-block text-[var(--accent)] hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={includeDrafts}
                onChange={(e) => setIncludeDrafts(e.target.checked)}
              />
              {t('includeDrafts')}
            </label>
            <Link
              href="/organizer/events/new"
              className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
            >
              {t('create')}
            </Link>
          </div>
        </div>

        {isLoading && (
          <div className="mt-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-[var(--bg-card)]" />
            ))}
          </div>
        )}

        {isError && <p className="mt-6 text-red-500">{t('error')}</p>}

        {!isLoading && !isError && events.length === 0 && (
          <p className="mt-6 text-[var(--text-secondary)]">{t('noEvents')}</p>
        )}

        {!isLoading && !isError && events.length > 0 && (
          <div className="mt-6 space-y-4">
            {events.map((event: Event) => {
              const date = event.date ? new Date(event.date) : null;
              const formattedDate = date
                ? date.toLocaleDateString(locale, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';
              return (
                <div
                  key={event.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{event.title}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{formattedDate}</p>
                    {event._count != null && (
                      <p className="text-xs text-[var(--text-secondary)]">
                        {t('ticketsCount', { count: event._count.tickets })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${statusColors[event.status] ?? ''}`}>
                      {t(`status.${event.status.toLowerCase()}`)}
                    </span>
                    <Link
                      href={`/organizer/events/${event.id}/edit`}
                      className="rounded border border-[var(--border)] px-3 py-1.5 text-sm text-white hover:bg-[var(--bg-secondary)]"
                    >
                      {t('edit')}
                    </Link>
                    {event.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={(e) => handlePublish(e, event.id)}
                        className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
                      >
                        {t('publish')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, event.id)}
                      className="rounded bg-red-600/80 px-3 py-1.5 text-sm text-white hover:bg-red-600"
                    >
                      {t('delete')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
