'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from '@/i18n/routing';
import { useQuery } from '@tanstack/react-query';
import { createOrder, getTicketsByEvent, getEventById } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useTranslations } from 'next-intl';

export default function CheckoutPage() {   
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations('checkout');
    const eventId = searchParams.get('eventId');
    const ticketIdsParams = searchParams.get('ticketIds');

    const ticketIds: string[] = ticketIdsParams?.split(',') ?? [];

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { data: event } = useQuery({
        queryKey: ['event', eventId],
        queryFn: () => getEventById(eventId!),
        enabled: !!eventId,
    });

    const { data: ticketsData } = useQuery({
        queryKey: ['tickets', eventId],
        queryFn: () => getTicketsByEvent(eventId!, { status: 'AVAILABLE' }),
        enabled: !!eventId,
    });

    const selectedTickets = ticketsData?.tickets.filter((ticket) => ticketIds.includes(ticket.id)) ?? [];

    const total = selectedTickets.reduce((sum, t) => {
        const p = typeof t.price === 'string' ? parseFloat(t.price) : t.price;
        const count = ticketIds.filter((id) => id === t.id).length;
        return sum + p * count;
      }, 0);

      useEffect(() => {
        if (!eventId || ticketIds.length === 0) {
            router.replace('/');
        }
    }, [eventId, ticketIds.length, router]);

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const order = await createOrder({ ticketIds, deliveryEmail: email });
            router.push(`/orders/${order.id}`);
        } catch (error) {
            const msg = error && typeof error === 'object' && 'response' in error ? (error as { response?: { data?: { error?: string } } }).response?.data?.error : t('error');
            setError(msg || t('error'));
        } finally {
            setLoading(false);
        }
    };

    if (!eventId || ticketIds.length === 0) {
        return null;
    }

    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-lg px-4 py-8">
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          {event && (
            <p className="mt-1 text-[var(--text-secondary)]">{event.title}</p>
          )}
          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <p className="text-[var(--text-secondary)]">
              {ticketIds.length} {ticketIds.length !== 1 ? t('tickets') : t('ticket')} · {t('total')}: <span className="font-semibold text-white">{total.toFixed(2)} €</span>
            </p>
            <form onSubmit={handleConfirm} className="mt-4 flex flex-col gap-4">
              <div>
                <label htmlFor="email" className="block text-sm text-[var(--text-secondary)]">{t('emailLabel')}</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-white"
                  placeholder={t('emailPlaceholder')}
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="rounded bg-[var(--accent)] py-3 font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {loading ? t('processing') : t('confirm')}
              </button>
            </form>
          </div>
        </div>
      </ProtectedRoute>
    );
}
    
     