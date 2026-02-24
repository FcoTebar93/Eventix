'use client';

import { useQuery } from '@tanstack/react-query';
import { getMyOrders } from '@/lib/api';
import type { OrderStatus } from '@/lib/types';
import { Link } from '@/i18n/routing';
import dynamic from 'next/dynamic';
import { useTranslations, useLocale } from 'next-intl';

const ProtectedRoute = dynamic(() => import('@/components/ProtectedRoute'), {
    loading: () => (
        <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="h-8 w-48 animate-pulse rounded bg-[var(--bg-card)]" />
            <div className="mt-6 h-64 animate-pulse rounded-xl bg-[var(--bg-card)]" />
        </div>
    ),
    ssr: false,
});

const statusColors: Record<OrderStatus, string> = {
    PENDING: 'text-yellow-400',
    CONFIRMED: 'text-green-400',
    PROCESSING: 'text-blue-400',
    COMPLETED: 'text-green-500',
    CANCELLED: 'text-red-400',
    REFUNDED: 'text-gray-400',
};

export default function OrdersPage() {
    const t = useTranslations('orders');
    const locale = useLocale();
    const { data: orders, isLoading, isError } = useQuery({
        queryKey: ['myOrders'],
        queryFn: getMyOrders,
    });

    const getStatusLabel = (status: OrderStatus): string => {
        return t(`status.${status.toLowerCase()}`);
    };

    return (
        <ProtectedRoute>
            <div className="mx-auto max-w-4xl px-4 py-8">
                <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
                {isLoading && (
                    <div className="mt-6 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 animate-pulse rounded-lg bg-[var(--bg-card)]" />
                        ))}
                    </div>
                )}
                {isError && (
                    <p className="mt-6 text-red-500">{t('error')}</p>
                )}
                {!isLoading && !isError && (
                    <>
                        {!orders || orders.length === 0 ? (
                            <p className="mt-6 text-[var(--text-secondary)]">{t('noOrders')}</p>
                        ) : (
                            <div className="mt-6 space-y-4">
                                {orders.map((order) => {
                                    const date = order.createdAt ? new Date(order.createdAt) : null;
                                    const formattedDate = date
                                        ? date.toLocaleDateString(locale, {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })
                                        : '';
                                    const total = typeof order.totalAmount === 'string' ? parseFloat(order.totalAmount) : order.totalAmount;
                                    return (
                                        <Link
                                            key={order.id}
                                            href={`/orders/${order.id}`}
                                            className="block rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-colors hover:border-[var(--accent)]"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-white">
                                                        {order.event?.title || t('order') + ' #' + order.id.slice(0, 8)}
                                                    </p>
                                                    <p className="text-sm text-[var(--text-secondary)]">{formattedDate}</p>
                                                    {order.event?.date && (
                                                        <p className="text-sm text-[var(--text-secondary)]">
                                                            {t('event')}: {new Date(order.event.date).toLocaleDateString(locale)}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-white">{total.toFixed(2)} €</p>
                                                    <p className={`text-sm ${statusColors[order.status]}`}>
                                                        {getStatusLabel(order.status)}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </ProtectedRoute>
    );
}