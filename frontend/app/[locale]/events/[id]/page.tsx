'use client';

import { useState, useMemo } from 'react';
import { Link, useParams, useRouter } from '@/i18n/routing';
import { useQuery } from '@tanstack/react-query';
import { getEventById, getTicketsByEvent } from '@/lib/api';
import type { Ticket } from '@/lib/types';
import { useTranslations, useLocale } from 'next-intl';

const DEFAULT_IMAGE_URL = 'https://via.placeholder.com/600x400';

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const t = useTranslations('events');
    const locale = useLocale();

    const id = params?.id as string;

    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { data: event, isLoading: loadingEvent, isError: errorEvent } = useQuery({
        queryKey: ['event', id],
        queryFn: () => getEventById(id),
        enabled: !!id,
    });

    const { data: ticketsData, isLoading: loadingTickets } = useQuery({
        queryKey: ['tickets', id],
        queryFn: () => getTicketsByEvent(id, { status: 'AVAILABLE' }),
        enabled: !!id,
    });

    const tickets = ticketsData?.tickets ?? [];

    const ticketIds = useMemo(() => {
        const ids: string[] = [];
        Object.entries(quantities).forEach(([ticketId, quantity]) => {
            if (quantity > 0) {
                ids.push(ticketId);
            }
        });
        return ids;
    }, [quantities]);

    const totalSelected = ticketIds.length;
    const totalPrice = useMemo(() => {
        return tickets.reduce((sum, ticket) => {
            const quantity = quantities[ticket.id] ?? 0;
            return sum + Number(ticket.price) * quantity;
        }, 0);
    }, [tickets, quantities]);

    const setQuantity = (ticketId: string, value: number) => {
        const n = Math.max(0, Math.min(10, value));
        setQuantities((prev) => {
            const newQuantities = { ...prev };
            if (n === 0) {
                delete newQuantities[ticketId];
            } else {
                newQuantities[ticketId] = n;
            }
            return newQuantities;
        });
    };

    const handleBuy = () => {
        if (totalSelected === 0) {
            return;
        }
        if (totalSelected > 5) {
            setError(t('maxTickets'));
            return;
        }
        if (totalPrice === 0) {
            setError(t('zeroPrice'));
            return;
        }

        router.push(`/checkout?eventId=${id}&ticketIds=${ticketIds.join(',')}`);
    };

    if (loadingEvent || !id){
        return (
            <div className="mx-auto max-w-4xl px-4 py-12">
              <div className="h-8 w-48 animate-pulse rounded bg-[var(--bg-card)]" />
              <div className="mt-6 h-64 animate-pulse rounded-xl bg-[var(--bg-card)]" />
            </div>
        );
    }

    if (errorEvent || !event) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-12">
                <p className="text-red-500">{t('notFound')}</p>
                <Link href="/" className="mt-4 inline-block text-[var(--accent)] hover:underline">{t('backToList')}</Link>
            </div>
        );
    }

    const date = new Date(event.date);
    const formattedDate = date.toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const imageUrl = event.imageUrl || DEFAULT_IMAGE_URL;

    return (
        <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="text-sm text-[var(--text-secondary)] hover:text-white">← {t('backToEvents')}</Link>

      <div className="mt-6 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
        <div className="aspect-video w-full overflow-hidden bg-[var(--bg-secondary)]">
          <img src={imageUrl} alt={event.title} className="h-full w-full object-cover" />
        </div>
        <div className="p-6">
          {event.category && (
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--accent)]">{event.category}</span>
          )}
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{event.title}</h1>
          <p className="mt-2 text-[var(--text-secondary)]">{formattedDate}</p>
          <p className="text-[var(--text-secondary)]">{event.venue} · {event.city}, {event.country}</p>
          {event.description && (
            <p className="mt-4 text-[var(--text-secondary)]">{event.description}</p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold text-white">{t('availableTickets')}</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white">{ticket.type}</h3>
              <p className="text-sm text-[var(--text-secondary)]">{ticket.price}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-white">{t('tickets')}</h2>
        {loadingTickets ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-[var(--bg-card)]" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <p className="mt-4 text-[var(--text-secondary)]">{t('noTicketsAvailable')}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {tickets.map((ticket: Ticket) => {
              const qty = quantities[ticket.id] ?? 0;
              const price = typeof ticket.price === 'string' ? parseFloat(ticket.price) : ticket.price;
              return (
                <li
                  key={ticket.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4"
                >
                  <div>
                    <p className="font-medium text-white">{ticket.type}</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {price.toFixed(2)} €
                      {ticket.section && ` · ${ticket.section}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(ticket.id, qty - 1)}
                      className="h-9 w-9 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-white hover:bg-[var(--border)]"
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center text-white">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(ticket.id, qty + 1)}
                      className="h-9 w-9 rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-white hover:bg-[var(--border)]"
                    >
                      +
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

{totalSelected > 0 && (
          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
            <p className="text-[var(--text-secondary)]">
              {totalSelected} {t('ticket', { count: totalSelected })} · {t('total')}: <span className="font-semibold text-white">{totalPrice.toFixed(2)} €</span>
            </p>
            <button
              type="button"
              onClick={handleBuy}
              className="mt-4 w-full rounded bg-[var(--accent)] py-3 font-semibold text-white hover:bg-[var(--accent-hover)]"
            >
              {t('goToCheckout')}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}