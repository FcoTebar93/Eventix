'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useQuery } from '@tanstack/react-query';
import {
    createOrder,
    getTicketsByEvent,
    getEventById,
    createPaymentIntent,
    confirmPayment,
} from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useTranslations } from 'next-intl';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function CheckoutPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations('checkout');
    const eventId = searchParams.get('eventId');
    const ticketIdsParams = searchParams.get('ticketIds');

    const ticketIds: string[] = ticketIdsParams?.split(',').filter(Boolean) ?? [];

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [orderId, setOrderId] = useState<string | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

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

    const handleContinueToPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const order = await createOrder({ ticketIds, deliveryEmail: email });
            const { clientSecret: secret, paymentIntentId: piId } = await createPaymentIntent(order.id);
            setOrderId(order.id);
            setClientSecret(secret);
            setPaymentIntentId(piId);
        } catch (err) {
            const msg =
                err && typeof err === 'object' && 'response' in err
                    ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                    : t('error');
            setError(msg || t('error'));
        } finally {
            setLoading(false);
        }
    };

    if (!eventId || ticketIds.length === 0) {
        return null;
    }

    if (clientSecret && orderId && paymentIntentId) {
        return (
            <ProtectedRoute>
                <div className="mx-auto max-w-lg px-4 py-8">
                    <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
                    {event && (
                        <p className="mt-1 text-[var(--text-secondary)]">{event.title}</p>
                    )}
                    <p className="mt-2 text-[var(--text-secondary)]">
                        {ticketIds.length} {ticketIds.length !== 1 ? t('tickets') : t('ticket')} ·{' '}
                        {t('total')}: <span className="font-semibold text-white">{total.toFixed(2)} €</span>
                    </p>
                    <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                            <CheckoutPaymentForm
                                orderId={orderId}
                                paymentIntentId={paymentIntentId}
                                onSuccess={() => router.push(`/orders/${orderId}`)}
                                onBack={() => {
                                    setClientSecret(null);
                                    setPaymentIntentId(null);
                                    setOrderId(null);
                                }}
                                t={t}
                            />
                        </Elements>
                    </div>
                </div>
            </ProtectedRoute>
        );
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
                        {ticketIds.length} {ticketIds.length !== 1 ? t('tickets') : t('ticket')} ·{' '}
                        {t('total')}: <span className="font-semibold text-white">{total.toFixed(2)} €</span>
                    </p>
                    <form onSubmit={handleContinueToPayment} className="mt-4 flex flex-col gap-4">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm text-[var(--text-secondary)]"
                            >
                                {t('emailLabel')}
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
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
                            {loading ? t('processing') : t('continueToPayment')}
                        </button>
                    </form>
                </div>
            </div>
        </ProtectedRoute>
    );
}

function CheckoutPaymentForm({
    orderId,
    paymentIntentId,
    onSuccess,
    onBack,
    t,
}: {
    orderId: string;
    paymentIntentId: string;
    onSuccess: () => void;
    onBack: () => void;
    t: (key: string) => string;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setLoading(true);
        setError(null);

        try {
            const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${typeof window !== 'undefined' ? window.location.origin : ''}/orders/${orderId}`,
                },
                redirect: 'if_required',
            });

            if (stripeError) {
                setError(stripeError.message || t('error'));
                setLoading(false);
                return;
            }

            if (paymentIntent?.status === 'succeeded') {
                await confirmPayment(orderId, paymentIntent.id);
                onSuccess();
            }
        } catch (err: unknown) {
            const msg =
                err && typeof err === 'object' && 'response' in err
                    ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
                    : t('error');
            setError(msg || t('error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-4">
                <PaymentElement />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={loading}
                    className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-white hover:bg-[var(--border)] disabled:opacity-50"
                >
                    {t('back')}
                </button>
                <button
                    type="submit"
                    disabled={!stripe || loading}
                    className="flex-1 rounded bg-[var(--accent)] py-3 font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                    {loading ? t('processing') : t('payNow')}
                </button>
            </div>
        </form>
    );
}
