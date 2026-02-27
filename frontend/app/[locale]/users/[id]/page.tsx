'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@/i18n/routing';
import {
  getPublicProfile,
  getUserProfileReviews,
  getFavorites,
  getEvents,
} from '@/lib/api';
import type { Event } from '@/lib/types';
import { UserAvatar } from '@/components/UserAvatar';
import { RatingStars } from '@/components/RatingStars';
import { EventCard } from '@/components/EventCard';
import { CommentsSection } from '@/components/CommentsSection';
import { useAuthStore } from '@/store/authStore';

export default function UserProfilePage() {
  const params = useParams();
  const { user } = useAuthStore();
  const t = useTranslations('profile');

  const id = params?.id as string;
  const isMe = user?.id === id;

  const {
    data: profileData,
    isLoading: loadingProfile,
    isError: errorProfile,
  } = useQuery({
    queryKey: ['publicProfile', id],
    queryFn: () => getPublicProfile(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });

  const {
    data: profileReviews,
    isLoading: loadingReviews,
  } = useQuery({
    queryKey: ['profileReviewsSummary', id],
    queryFn: () => getUserProfileReviews(id, { page: 1, limit: 1 }),
    enabled: !!id,
    staleTime: 60 * 1000,
  });

  const {
    data: organizedEvents,
    isLoading: loadingEvents,
  } = useQuery({
    queryKey: ['organizedEvents', id],
    queryFn: () =>
      getEvents({
        page: 1,
        limit: 12,
        // backend no filtra por organizador, así que en esta iteración
        // mostraremos simplemente eventos recientes (se puede mejorar después)
      }),
    staleTime: 60 * 1000,
  });

  const {
    data: favoritesData,
    isLoading: loadingFavorites,
  } = useQuery({
    queryKey: ['favorites', id],
    queryFn: () => getFavorites({ page: 1, limit: 12 }),
    enabled: isMe,
    staleTime: 60 * 1000,
  });

  if (loadingProfile || !id) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--bg-card)]" />
        <div className="mt-6 h-40 animate-pulse rounded-xl bg-[var(--bg-card)]" />
      </div>
    );
  }

  if (errorProfile || !profileData) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-red-500">{t('notFound')}</p>
        <Link
          href="/"
          className="mt-4 inline-block text-[var(--accent)] hover:underline"
        >
          {t('backToHome')}
        </Link>
      </div>
    );
  }

  const profile = profileData.profile;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-[var(--text-secondary)] hover:text-white"
      >
        ← {t('backToHome')}
      </Link>

      <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <UserAvatar
            user={{
              id: profile.id,
              name: profile.name,
              displayName: profile.displayName ?? undefined,
              avatarUrl: profile.avatarUrl ?? undefined,
            }}
            subtitle={profile.location ?? undefined}
            size="md"
          />
          <div className="flex flex-col items-start gap-2 sm:items-end">
            {profile.stats.averageProfileRating !== null && (
              <div className="flex items-center gap-2">
                <RatingStars
                  value={profile.stats.averageProfileRating}
                  size="sm"
                />
                <span className="text-sm font-medium text-white">
                  {profile.stats.averageProfileRating.toFixed(1)} / 5
                </span>
              </div>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
              <span>
                {t('organizedEventsCount', {
                  count: profile.stats.organizedEventsCount,
                })}
              </span>
              <span>
                {t('eventReviewsCount', {
                  count: profile.stats.totalEventReviews,
                })}
              </span>
              <span>
                {t('profileReviewsCount', {
                  count: profile.stats.totalProfileReviews,
                })}
              </span>
            </div>
          </div>
        </div>

        {profile.bio && (
          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            {profile.bio}
          </p>
        )}
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-white">
          {t('organizedEventsTitle')}
        </h2>
        {loadingEvents && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-xl bg-[var(--bg-card)]"
              />
            ))}
          </div>
        )}
        {organizedEvents && organizedEvents.events.length > 0 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {organizedEvents.events.map((event: Event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
        {organizedEvents && organizedEvents.events.length === 0 && (
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            {t('noOrganizedEvents')}
          </p>
        )}
      </section>

      {isMe && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-white">
            {t('favoriteEventsTitle')}
          </h2>
          {loadingFavorites && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-48 animate-pulse rounded-xl bg-[var(--bg-card)]"
                />
              ))}
            </div>
          )}
          {favoritesData && favoritesData.favorites.length > 0 && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favoritesData.favorites.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
          {favoritesData && favoritesData.favorites.length === 0 && (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              {t('noFavorites')}
            </p>
          )}
        </section>
      )}

      <CommentsSection
        kind="profile"
        targetId={profile.id}
        title={t('reviewsTitle')}
        emptyLabel={t('noReviews')}
      />
    </div>
  );
}

