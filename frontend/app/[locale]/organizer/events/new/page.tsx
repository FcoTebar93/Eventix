'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { useMutation } from '@tanstack/react-query';
import { createEvent } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { useTranslations } from 'next-intl';

export default function NewEventPage() {
  const t = useTranslations('organizer.newEvent');
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isOrganizer = user?.role === 'ORGANIZER' || user?.role === 'ADMIN';

  const [form, setForm] = useState({
    title: '',
    description: '',
    venue: '',
    address: '',
    city: '',
    country: '',
    date: '',
    imageUrl: '',
    category: '',
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      router.push('/organizer/events');
    },
    onError: (err: unknown) => {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      setError(msg || 'Error al crear el evento');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const date = form.date ? new Date(form.date).toISOString() : '';
    if (!date || new Date(date) <= new Date()) {
      setError('La fecha debe ser futura.');
      return;
    }
    mutation.mutate({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      venue: form.venue.trim(),
      address: form.address.trim() || undefined,
      city: form.city.trim(),
      country: form.country.trim(),
      date,
      imageUrl: form.imageUrl.trim() || undefined,
      category: form.category.trim() || undefined,
    });
  };

  if (user && !isOrganizer) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-red-400">No tienes permiso.</p>
        <Link href="/" className="mt-4 inline-block text-[var(--accent)]">Volver</Link>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/organizer/events" className="text-sm text-[var(--text-secondary)] hover:text-white">
          ← Mis eventos
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-white">{t('title')}</h1>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">{t('titleLabel')}</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={t('titlePlaceholder')}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">{t('descriptionLabel')}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">{t('venueLabel')}</label>
            <input
              type="text"
              required
              value={form.venue}
              onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
              placeholder={t('venuePlaceholder')}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">{t('addressLabel')}</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-[var(--text-secondary)]">{t('cityLabel')}</label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder={t('cityPlaceholder')}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--text-secondary)]">{t('countryLabel')}</label>
              <input
                type="text"
                required
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                placeholder={t('countryPlaceholder')}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">{t('dateLabel')}</label>
            <div className="relative">
              <input
                type="datetime-local"
                required
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 pr-10 text-white [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
              <svg
                className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white pointer-events-none z-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">{t('imageUrlLabel')}</label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">{t('categoryLabel')}</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder={t('categoryPlaceholder')}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white"
            />
          </div>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="mt-2 rounded bg-[var(--accent)] py-3 font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {mutation.isPending ? t('submitting') : t('submit')}
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
}