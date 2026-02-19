'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/routing';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEventById, updateEvent } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { useTranslations } from 'next-intl';

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('organizer');
  const tForm = useTranslations('organizer.newEvent');
  const user = useAuthStore((s) => s.user);
  const id = params?.id as string;

  const isOrganizer = user?.role === 'ORGANIZER' || user?.role === 'ADMIN';

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEventById(id),
    enabled: !!id && isOrganizer,
  });

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

  useEffect(() => {
    if (!event) return;
    const d = event.date ? new Date(event.date) : new Date();
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setForm({
      title: event.title ?? '',
      description: event.description ?? '',
      venue: event.venue ?? '',
      address: event.address ?? '',
      city: event.city ?? '',
      country: event.country ?? '',
      date: localDate,
      imageUrl: event.imageUrl ?? '',
      category: event.category ?? '',
    });
  }, [event]);

  const mutation = useMutation({
    mutationFn: (body: Parameters<typeof updateEvent>[1]) => updateEvent(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      router.push('/organizer/events');
    },
    onError: (err: unknown) => {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      setError(msg || 'Error al guardar');
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
        <p className="text-red-400">{t('forbidden')}</p>
        <Link href="/" className="mt-4 inline-block text-[var(--accent)]">Volver</Link>
      </div>
    );
  }

  if (isLoading || !event) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="h-8 w-48 animate-pulse rounded bg-[var(--bg-card)]" />
          <div className="mt-6 h-64 animate-pulse rounded-xl bg-[var(--bg-card)]" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/organizer/events" className="text-sm text-[var(--text-secondary)] hover:text-white">
          ← Mis eventos
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-white">{t('editEvent.title')}</h1>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">{tForm('titleLabel')}</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={tForm('titlePlaceholder')}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">{tForm('descriptionLabel')}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">{tForm('venueLabel')}</label>
            <input
              type="text"
              required
              value={form.venue}
              onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
              placeholder={tForm('venuePlaceholder')}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">{tForm('addressLabel')}</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-[var(--text-secondary)]">{tForm('cityLabel')}</label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder={tForm('cityPlaceholder')}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--text-secondary)]">{tForm('countryLabel')}</label>
              <input
                type="text"
                required
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                placeholder={tForm('countryPlaceholder')}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">{tForm('dateLabel')}</label>
            <input
              type="datetime-local"
              required
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">{tForm('imageUrlLabel')}</label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">{tForm('categoryLabel')}</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder={tForm('categoryPlaceholder')}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white"
            />
          </div>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="mt-2 rounded bg-[var(--accent)] py-3 font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {mutation.isPending ? t('editEvent.submitting') : t('editEvent.submit')}
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
}
