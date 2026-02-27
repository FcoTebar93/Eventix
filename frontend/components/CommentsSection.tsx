'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { getEventReviews, createEventReview, getUserProfileReviews, createUserProfileReview, deleteEventReview, deleteUserProfileReview, type GetEventReviewsResult, type GetUserProfileReviewsResult } from '@/lib/api';
import type { EventReview, UserProfileReview } from '@/lib/types';
import { RatingStars } from './RatingStars';
import { UserAvatar } from './UserAvatar';

type Comment = EventReview | UserProfileReview;

interface CommentsSectionBaseProps {
  title: string;
  emptyLabel: string;
  targetId: string;
}

interface EventCommentsProps extends CommentsSectionBaseProps {
  kind: 'event';
}

interface ProfileCommentsProps extends CommentsSectionBaseProps {
  kind: 'profile';
}

type CommentsSectionProps = EventCommentsProps | ProfileCommentsProps;

export function CommentsSection(props: CommentsSectionProps) {
  const { kind, title, emptyLabel, targetId } = props;
  const t = useTranslations('comments');
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const queryKey =
    kind === 'event'
      ? ['eventReviews', targetId]
      : ['profileReviews', targetId];

  const {
    data,
    isLoading,
    isError,
  } = useQuery<{
    reviews: Comment[];
    averageRating: number | null;
  }>({
    queryKey,
    queryFn: async () => {
      if (kind === 'event') {
        const res: GetEventReviewsResult = await getEventReviews(targetId, {
          page: 1,
          limit: 20,
        });
        return { reviews: res.reviews, averageRating: res.averageRating };
      }
      const res: GetUserProfileReviewsResult = await getUserProfileReviews(
        targetId,
        { page: 1, limit: 20 },
      );
      return { reviews: res.reviews, averageRating: res.averageRating };
    },
    staleTime: 30 * 1000,
  });

  const mutation = useMutation<
    unknown,
    Error,
    { rating: number; comment?: string }
  >({
    mutationFn: async (body) =>
      kind === 'event'
        ? createEventReview(targetId, body)
        : createUserProfileReview(targetId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setComment('');
    },
  });

  const reviews = (data?.reviews ?? []) as Comment[];
  const averageRating = data?.averageRating ?? null;

  const myReview = useMemo(() => {
    if (!user) return null;
    return reviews.find((review) => {
      const isEventReview = (review as EventReview).user !== undefined;
      const author = isEventReview
        ? (review as EventReview).user
        : (review as UserProfileReview).authorUser;
      return author.id === user.id;
    }) as Comment | null;
  }, [reviews, user]);

  useEffect(() => {
    if (!myReview) return;
    setRating(myReview.rating);
    setComment(myReview.comment ?? '');
  }, [myReview]);

  const deleteMutation = useMutation<unknown, Error, void>({
    mutationFn: async () => {
      if (kind === 'event') {
        await deleteEventReview(targetId);
      } else {
        await deleteUserProfileReview(targetId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setComment('');
      setRating(5);
    },
  });

  return (
    <section className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {averageRating !== null && (
            <div className="mt-1 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <RatingStars value={averageRating} size="sm" />
              <span className="font-medium text-white">
                {averageRating.toFixed(1)} / 5
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                ({reviews.length})
              </span>
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="mt-4 space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-[var(--bg-secondary)]"
            />
          ))}
        </div>
      )}

      {isError && (
        <p className="mt-4 text-sm text-red-400">
          {t('loadError')}
        </p>
      )}

      {!isLoading && !isError && reviews.length === 0 && (
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          {emptyLabel}
        </p>
      )}

      {!isLoading && reviews.length > 0 && (
        <ul className="mt-4 space-y-4">
          {reviews.map((review) => {
            const isEventReview = (review as EventReview).user !== undefined;
            const author = isEventReview
              ? (review as EventReview).user
              : (review as UserProfileReview).authorUser;

            return (
              <li
                key={review.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <UserAvatar
                    user={{
                      id: author.id,
                      name: author.name,
                      displayName: author.displayName,
                      avatarUrl: author.avatarUrl ?? undefined,
                    }}
                    size="sm"
                  />
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      {review.rating > 0 ? (
                        <RatingStars value={review.rating} size="sm" />
                      ) : (
                        <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-xs text-[var(--text-secondary)] border border-[var(--border)]">
                          {t('noRating')}
                        </span>
                      )}
                      {kind === 'event' &&
                        (review as EventReview).hasAttended && (
                          <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400 border border-green-500/40">
                            {t('attended')}
                          </span>
                        )}
                    </div>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                    {user && myReview && myReview.id === review.id && (
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate()}
                        className="mt-1 text-[10px] text-red-400 hover:text-red-300"
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending
                          ? t('deleting')
                          : t('deleteReview')}
                      </button>
                    )}
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-3 text-sm text-[var(--text-secondary)]">
                    {review.comment}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 border-t border-[var(--border)] pt-4">
        {!user ? (
          <p className="text-sm text-[var(--text-secondary)]">
            {t('loginToComment')}
          </p>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (mutation.isPending) return;
              mutation.mutate({ rating, comment: comment || undefined });
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--text-secondary)]">
                {t('yourRating')}
              </span>
              <RatingStars value={rating} onChange={setRating} />
            </div>
            <textarea
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-white placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
              rows={3}
              placeholder={t('placeholder')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? t('sending') : t('submit')}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

