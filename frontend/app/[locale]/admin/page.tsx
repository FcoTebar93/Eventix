'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { getAllUsers, getOrdersAdmin, getAdminEvents, getAdminDashboard, releaseExpiredReservations, type AdminUser, type GetOrdersAdminResult } from '@/lib/api';
import type { OrderStatus } from '@/lib/types';

const PAGE_SIZE = 10;

const orderStatusColors: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  CONFIRMED: 'bg-green-500/20 text-green-400 border-green-500/40',
  PROCESSING: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  COMPLETED: 'bg-green-600/20 text-green-400 border-green-600/40',
  CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/40',
  REFUNDED: 'bg-gray-500/20 text-gray-400 border-gray-500/40',
};

const eventStatusLabels: Record<string, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Completado',
};

export default function AdminDashboardPage() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [usersPage, setUsersPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersStatus, setOrdersStatus] = useState<string | undefined>(undefined);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsStatus, setEventsStatus] = useState<string | undefined>(undefined);

  const { data: dashboardData } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: getAdminDashboard,
  });

  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['adminUsers', usersPage],
    queryFn: () => getAllUsers({ page: usersPage, limit: PAGE_SIZE }),
  });

  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ['adminOrders', ordersPage, ordersStatus],
    queryFn: () =>
      getOrdersAdmin({
        page: ordersPage,
        limit: PAGE_SIZE,
        status: ordersStatus as OrderStatus | undefined,
      }),
  });

  const { data: eventsData, isLoading: loadingEvents } = useQuery({
    queryKey: ['adminEvents', eventsPage, eventsStatus],
    queryFn: () =>
      getAdminEvents({
        page: eventsPage,
        limit: PAGE_SIZE,
        status: eventsStatus,
      }),
  });

  const releaseMutation = useMutation({
    mutationFn: releaseExpiredReservations,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      alert(
        result.released > 0
          ? t('reservationsReleased', {
              count: result.released,
              orders: result.ordersCancelled,
            })
          : t('noReservationsToRelease')
      );
    },
    onError: () => {
      alert(t('releaseError'));
    },
  });

  const users = usersData?.users ?? [];
  const orders = (ordersData as GetOrdersAdminResult | undefined)?.orders ?? [];
  const events = eventsData?.events ?? [];
  const totalUsers = dashboardData?.totalUsers ?? usersData?.total ?? 0;
  const totalOrders = dashboardData?.totalOrders ?? ordersData?.total ?? 0;
  const totalEvents = dashboardData?.totalEvents ?? eventsData?.total ?? 0;
  const totalRevenue = dashboardData?.totalRevenue ?? 0;

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <p className="text-sm text-[var(--text-secondary)]">{t('statsUsers')}</p>
          <p className="mt-1 text-2xl font-bold text-white">{totalUsers}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <p className="text-sm text-[var(--text-secondary)]">{t('statsEvents')}</p>
          <p className="mt-1 text-2xl font-bold text-white">{totalEvents}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <p className="text-sm text-[var(--text-secondary)]">{t('statsOrders')}</p>
          <p className="mt-1 text-2xl font-bold text-white">{totalOrders}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <p className="text-sm text-[var(--text-secondary)]">{t('statsRevenue')}</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {totalRevenue.toFixed(2)} €
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <h2 className="text-lg font-semibold text-white">{t('reservationsTitle')}</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{t('reservationsDescription')}</p>
        <button
          type="button"
          onClick={() => releaseMutation.mutate()}
          disabled={releaseMutation.isPending}
          className="mt-3 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
        >
          {releaseMutation.isPending ? t('releasing') : t('releaseReservations')}
        </button>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        <h2 className="border-b border-[var(--border)] px-4 py-3 text-lg font-semibold text-white">
          {t('usersTitle')}
        </h2>
        {loadingUsers ? (
          <div className="p-4">
            <div className="h-32 animate-pulse rounded-lg bg-[var(--bg-secondary)]" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Rol</th>
                    <th className="px-4 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: AdminUser) => (
                    <tr key={u.id} className="border-b border-[var(--border)]">
                      <td className="px-4 py-3 text-white">{u.email}</td>
                      <td className="px-4 py-3 text-white">{u.name}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border px-2 py-0.5 text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/users/${u.id}`}
                          className="text-[var(--accent)] hover:underline"
                        >
                          {t('viewProfile')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {usersData && usersData.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2">
                <span className="text-sm text-[var(--text-secondary)]">
                  {t('pageOf', { current: usersPage, total: usersData.totalPages })}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                    disabled={usersPage <= 1}
                    className="rounded bg-[var(--bg-secondary)] px-3 py-1 text-sm text-white disabled:opacity-50"
                  >
                    {t('previous')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUsersPage((p) => p + 1)}
                    disabled={usersPage >= usersData.totalPages}
                    className="rounded bg-[var(--bg-secondary)] px-3 py-1 text-sm text-white disabled:opacity-50"
                  >
                    {t('next')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-3">
          <h2 className="text-lg font-semibold text-white">{t('eventsTitle')}</h2>
          <select
            value={eventsStatus ?? ''}
            onChange={(e) => {
              setEventsStatus(e.target.value || undefined);
              setEventsPage(1);
            }}
            className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1.5 text-sm text-white"
          >
            <option value="">{t('allStatuses')}</option>
            <option value="PUBLISHED">Publicados</option>
            <option value="DRAFT">Borrador</option>
            <option value="CANCELLED">Cancelados</option>
            <option value="COMPLETED">Completados</option>
          </select>
        </div>
        {loadingEvents ? (
          <div className="p-4">
            <div className="h-32 animate-pulse rounded-lg bg-[var(--bg-secondary)]" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                    <th className="px-4 py-3 font-medium">Evento</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Tickets</th>
                    <th className="px-4 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev.id} className="border-b border-[var(--border)]">
                      <td className="px-4 py-3 font-medium text-white">{ev.title}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {ev.date
                          ? new Date(ev.date).toLocaleDateString(locale, {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border px-2 py-0.5 text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                          {eventStatusLabels[ev.status] ?? ev.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {ev._count?.tickets ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/events/${ev.id}`}
                          className="text-[var(--accent)] hover:underline"
                        >
                          {t('viewEvent')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {events.length === 0 && (
              <p className="p-4 text-sm text-[var(--text-secondary)]">{t('noEvents')}</p>
            )}
            {eventsData && eventsData.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2">
                <span className="text-sm text-[var(--text-secondary)]">
                  {t('pageOf', { current: eventsPage, total: eventsData.totalPages })}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEventsPage((p) => Math.max(1, p - 1))}
                    disabled={eventsPage <= 1}
                    className="rounded bg-[var(--bg-secondary)] px-3 py-1 text-sm text-white disabled:opacity-50"
                  >
                    {t('previous')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventsPage((p) => p + 1)}
                    disabled={eventsPage >= eventsData.totalPages}
                    className="rounded bg-[var(--bg-secondary)] px-3 py-1 text-sm text-white disabled:opacity-50"
                  >
                    {t('next')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-3">
          <h2 className="text-lg font-semibold text-white">{t('ordersTitle')}</h2>
          <select
            value={ordersStatus ?? ''}
            onChange={(e) => {
              setOrdersStatus(e.target.value || undefined);
              setOrdersPage(1);
            }}
            className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1.5 text-sm text-white"
          >
            <option value="">{t('allStatuses')}</option>
            <option value="PENDING">Pendiente</option>
            <option value="CONFIRMED">Confirmada</option>
            <option value="PROCESSING">Procesando</option>
            <option value="COMPLETED">Completada</option>
            <option value="CANCELLED">Cancelada</option>
            <option value="REFUNDED">Reembolsada</option>
          </select>
        </div>
        {loadingOrders ? (
          <div className="p-4">
            <div className="h-32 animate-pulse rounded-lg bg-[var(--bg-secondary)]" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                    <th className="px-4 py-3 font-medium">ID</th>
                    <th className="px-4 py-3 font-medium">Usuario</th>
                    <th className="px-4 py-3 font-medium">Evento</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: any) => (
                    <tr key={order.id} className="border-b border-[var(--border)]">
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">
                        {order.id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3 text-white">
                        {order.user?.email ?? order.userId}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {order.event?.title ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-white">
                        {typeof order.totalAmount === 'string'
                          ? parseFloat(order.totalAmount).toFixed(2)
                          : order.totalAmount?.toFixed(2)}{' '}
                        €
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs ${
                            orderStatusColors[order.status as OrderStatus] ?? 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-[var(--accent)] hover:underline"
                        >
                          {t('viewOrder')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {orders.length === 0 && (
              <p className="p-4 text-sm text-[var(--text-secondary)]">{t('noOrders')}</p>
            )}
            {ordersData && ordersData.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2">
                <span className="text-sm text-[var(--text-secondary)]">
                  {t('pageOf', {
                    current: ordersPage,
                    total: ordersData.totalPages,
                  })}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                    disabled={ordersPage <= 1}
                    className="rounded bg-[var(--bg-secondary)] px-3 py-1 text-sm text-white disabled:opacity-50"
                  >
                    {t('previous')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrdersPage((p) => p + 1)}
                    disabled={ordersPage >= ordersData.totalPages}
                    className="rounded bg-[var(--bg-secondary)] px-3 py-1 text-sm text-white disabled:opacity-50"
                  >
                    {t('next')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}