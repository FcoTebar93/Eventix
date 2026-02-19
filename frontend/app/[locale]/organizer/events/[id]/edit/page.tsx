'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEventById, updateEvent, getTicketsByEvent, createTicketsBulk } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { useTranslations } from 'next-intl';
import type { Ticket } from '@/lib/types';
import { TagInput } from '@/components/TagInput';

export default function EditEventPage() {
  const params = useParams();
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
    tags: [] as string[],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!event) return;
    const d = event.date ? new Date(event.date) : new Date();
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const tagsArray = event.tags?.map(et => et.tag.name) ?? [];
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
      tags: tagsArray,
    });
  }, [event]);

  const mutation = useMutation({
    mutationFn: (body: Parameters<typeof updateEvent>[1]) => updateEvent(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
    },
    onError: (err: unknown) => {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      setError(msg || 'Error al guardar');
    },
  });

  const { data: ticketsData } = useQuery({
    queryKey: ['tickets', id],
    queryFn: () => getTicketsByEvent(id, { limit: 500 }),
    enabled: !!id && isOrganizer,
  });

  const ticketsByType = useMemo(() => {
    const list = ticketsData?.tickets ?? [];
    const map = new Map<string, { type: string; price: number; count: number; tickets: Ticket[] }>();
    for (const t of list) {
      const price = typeof t.price === 'string' ? parseFloat(t.price) : t.price;
      const key = `${t.type}|${price}`;
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        existing.tickets.push(t);
      } else {
        map.set(key, { type: t.type, price, count: 1, tickets: [t] });
      }
    }
    return Array.from(map.values());
  }, [ticketsData?.tickets]);

  const [ticketForm, setTicketForm] = useState({ type: '', price: '', quantity: '1' });
  const [ticketError, setTicketError] = useState('');

  const addTicketsMutation = useMutation({
    mutationFn: (body: { type: string; price: number; quantity: number }) => createTicketsBulk(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', id] });
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      setTicketForm({ type: '', price: '', quantity: '1' });
      setTicketError('');
    },
    onError: (err: unknown) => {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      setTicketError(msg || t('tickets.addError'));
    },
  });

  const handleAddTickets = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketError('');
    const type = ticketForm.type.trim();
    const price = parseFloat(ticketForm.price.replace(',', '.'));
    const quantity = parseInt(ticketForm.quantity, 10);
    if (!type || !Number.isFinite(price) || price <= 0 || !Number.isInteger(quantity) || quantity < 1 || quantity > 500) {
      setTicketError(t('tickets.addError'));
      return;
    }
    addTicketsMutation.mutate({ type, price, quantity });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const date = form.date ? new Date(form.date).toISOString() : '';
    if (!date || new Date(date) <= new Date()) {
      setError('La fecha debe ser futura.');
      return;
    }
    
    const originalTags = event?.tags?.map(et => et.tag.name) ?? [];
    const tagsChanged = JSON.stringify(originalTags.sort()) !== JSON.stringify(form.tags.sort());
    
    const submitData: Parameters<typeof updateEvent>[1] = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      venue: form.venue.trim(),
      address: form.address.trim() || undefined,
      city: form.city.trim(),
      country: form.country.trim(),
      date,
      imageUrl: form.imageUrl.trim() || undefined,
      category: form.category.trim() || undefined,
    };
    
    if (tagsChanged) {
      submitData.tags = form.tags;
    }
    
    mutation.mutate(submitData);
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
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">{tForm('tagsLabel')}</label>
            <TagInput
              tags={form.tags}
              onChange={(tags: string[]) => setForm((f) => ({ ...f, tags }))}
              placeholder={tForm('tagsPlaceholder')}
            />
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{tForm('tagsHint')}</p>
          </div>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="mt-2 rounded bg-[var(--accent)] py-3 font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {mutation.isPending ? t('editEvent.submitting') : t('editEvent.submit')}
          </button>
        </form>

        <section className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <h2 className="text-lg font-bold text-white">{t('tickets.title')}</h2>
          {ticketsData?.tickets == null ? (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{t('tickets.error')}</p>
          ) : ticketsByType.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{t('tickets.noTickets')}</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {ticketsByType.map((g) => (
                <li
                  key={`${g.type}-${g.price}`}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3"
                >
                  <span className="font-medium text-white">{g.type}</span>
                  <span className="text-[var(--text-secondary)]">
                    {g.price.toFixed(2)} € × {g.count}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {event?.status === 'DRAFT' && (
            <form onSubmit={handleAddTickets} className="mt-6 flex flex-col gap-4 border-t border-[var(--border)] pt-6">
              {ticketError && <p className="text-sm text-red-400">{ticketError}</p>}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm text-[var(--text-secondary)]">{t('tickets.typeLabel')}</label>
                  <input
                    type="text"
                    required
                    value={ticketForm.type}
                    onChange={(e) => setTicketForm((f) => ({ ...f, type: e.target.value }))}
                    placeholder={t('tickets.typePlaceholder')}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[var(--text-secondary)]">{t('tickets.priceLabel')}</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={ticketForm.price}
                    onChange={(e) => setTicketForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[var(--text-secondary)]">{t('tickets.quantityLabel')}</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="500"
                    value={ticketForm.quantity}
                    onChange={(e) => setTicketForm((f) => ({ ...f, quantity: e.target.value }))}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={addTicketsMutation.isPending}
                className="self-start rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {addTicketsMutation.isPending ? t('tickets.submitting') : t('tickets.addType')}
              </button>
            </form>
          )}
        </section>

        <div className="mt-6">
          <Link
            href="/organizer/events"
            className="text-sm text-[var(--text-secondary)] hover:text-white"
          >
            ← Volver a mis eventos
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
