'use client';

import { Link } from '@/i18n/routing';
import { useQuery } from '@tanstack/react-query';
import type { Event } from '@/lib/types';
import { getEvents } from '@/lib/api';
import { EventCard } from '@/components/EventCard';
import { EventSearch, type EventSearchFilters } from '@/components/EventSearch';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

const DEFAULT_FILTERS: EventSearchFilters = {
  search: '',
  category: '',
  city: '',
  tags: '',
};

export default function HomePage() {
  const t = useTranslations('home');
  const [filters, setFilters] = useState<EventSearchFilters>(DEFAULT_FILTERS);

  const params = useMemo(
    () => ({
      page: 1,
      limit: 12,
      search: filters.search || undefined,
      category: filters.category || undefined,
      city: filters.city || undefined,
      tags: filters.tags || undefined,
    }),
    [filters]
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['events', params],
    queryFn: () => getEvents(params),
  });

  return (
    <div>
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-primary)] px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            {t('hero.title')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">
            {t('hero.subtitle')}
          </p>
          <Link
            href="#eventos"
            className="mt-8 inline-block rounded bg-[var(--accent)] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            {t('hero.cta')}
          </Link>
        </div>
      </section>

      <section id="eventos" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          {t('events.title')}
        </h2>

        <div className="mt-6">
          <EventSearch
            filters={filters}
            onFiltersChange={setFilters}
            onSearch={() => refetch()}
          />
        </div>

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
            {error instanceof Error ? error.message : t('events.error')}
          </p>
        )}

        {data && data.events.length === 0 && (
          <p className="mt-6 text-[var(--text-secondary)]">
            {t('events.noEvents')}
          </p>
        )}

        {data && data.events.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.events.map((event: Event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}