'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from '@/i18n/routing';
import ProtectedRouter from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { getPublicProfile, updateMyProfile } from '@/lib/api';

export default function ProfilePage() {
  return (
    <ProtectedRouter>
      <ProfileContent />
    </ProtectedRouter>
  );
}

function ProfileContent() {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const userId = user?.id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['myProfilePublic', userId],
    queryFn: () => getPublicProfile(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user || !data?.profile) return;
    const profile = data.profile;
    setName(user.name);
    setDisplayName(profile.displayName ?? '');
    setBio(profile.bio ?? '');
    setAvatarUrl(profile.avatarUrl ?? '');
    setLocation(profile.location ?? '');
  }, [user, data]);

  const mutation = useMutation({
    mutationFn: async () => {
      setError('');
      setSuccess('');
      const payload: {
        name?: string;
        displayName?: string;
        bio?: string;
        avatarUrl?: string;
        location?: string;
      } = {};
      if (name.trim() && name !== user?.name) payload.name = name.trim();
      payload.displayName = displayName.trim() || undefined;
      payload.bio = bio.trim() || undefined;
      payload.avatarUrl = avatarUrl.trim() || undefined;
      payload.location = location.trim() || undefined;

      if (Object.keys(payload).length === 0) {
        setSuccess(t('noChanges'));
        return null;
      }

      const updated = await updateMyProfile(payload);

      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('user');
        if (stored) {
          const prev = JSON.parse(stored) as typeof updated;
          const next = { ...prev, ...updated };
          localStorage.setItem('user', JSON.stringify(next));
        }
      }

      return updated;
    },
    onSuccess: () => {
      setSuccess(t('updateSuccess'));
    },
    onError: () => {
      setError(t('updateError'));
    },
  });

  if (!userId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-[var(--text-secondary)]">{tCommon('redirecting')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--bg-card)]" />
        <div className="mt-6 h-40 animate-pulse rounded-xl bg-[var(--bg-card)]" />
      </div>
    );
  }

  if (isError || !data?.profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-red-500">{t('notFound')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white">{t('editTitle')}</h1>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{t('editSubtitle')}</p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!mutation.isPending) {
            mutation.mutate();
          }
        }}
      >
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            {t('nameLabel')}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-white placeholder-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
            placeholder={t('namePlaceholder')}
            minLength={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            {t('displayNameLabel')}
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-white placeholder-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
            placeholder={t('displayNamePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            {t('bioLabel')}
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-white placeholder-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
            placeholder={t('bioPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            {t('avatarUrlLabel')}
          </label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-white placeholder-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
            placeholder={t('avatarUrlPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            {t('locationLabel')}
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-white placeholder-[var(--text-secondary)] focus:border-[var(--accent)] focus:outline-none"
            placeholder={t('locationPlaceholder')}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-green-400">{success}</p>}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="mt-2 inline-flex items-center justify-center rounded bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
        >
          {mutation.isPending ? t('saving') : t('save')}
        </button>
      </form>
    </div>
  );
}

