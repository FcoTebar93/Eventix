'use client';

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrderById, payOrder } from "@/lib/api";
import type { PaymentMethod } from "@/lib/types";
import ProtectedRoute from '@/components/ProtectedRoute';


const statusLabels: Record<string, string> = {
    PENDING: 'Pendiente de pago',
    CONFIRMED: 'Confirmada',
    PROCESSING: 'En proceso',
    COMPLETED: 'Completada',
    CANCELLED: 'Cancelada',
    REFUNDED: 'Reembolsada',
};

const statusColors: Record<string, string> = {
    PENDING: 'text-yellow-400',
    CONFIRMED: 'text-green-400',
    PROCESSING: 'text-blue-400',
    COMPLETED: 'text-green-400',
    CANCELLED: 'text-red-400',
    REFUNDED: 'text-gray-400',
};

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const id= params.id as string;

    const [paying, setPaying] = useState(false);
    const [paymentError, setPaymentError] = useState('');

    const { data: order, isLoading, isError } = useQuery({
        queryKey: ['order', id],
        queryFn: () => getOrderById(id),
        enabled: !!id,
    });

    const handlePay = async () => {
        if (!order || order.status !== 'PENDING') {
            setPaymentError('Este pedido no está pendiente de pago');
            return;
        }
        setPaymentError('');
        setPaying(true);
        try {
            await payOrder(id, 'CREDIT_CARD');
            await queryClient.invalidateQueries({ queryKey: ['order', id] });
            await queryClient.invalidateQueries({ queryKey: ['myOrders'] });
        } catch (error: unknown) {
            const msg = error && typeof error === 'object' && 'response' in error ? (error as { response?: { data?: { error?: string } } }).response?.data?.error : 'Error al procesar el pago';
            setPaymentError(msg || 'Error al procesar el pago');
        } finally {
            setPaying(false);
        }
    };

    if (isLoading || !id) {
        return (
          <ProtectedRoute>
            <div className="mx-auto max-w-4xl px-4 py-8">
                <div className="h-8 w-48 animate-pulse rounded bg-[var(--bg-card)]" />
                <div className="mt-6 h-64 animate-pulse rounded-xl bg-[var(--bg-card)]" />
            </div>
          </ProtectedRoute>
        );
    }

    if (isError || !order) {
        return (
          <ProtectedRoute>
            <div className="mx-auto max-w-4xl px-4 py-8">
                <p className="text-red-400">Pedido no encontrado.</p>
                <Link href="/orders" className="mt-4 inline-block text-[var(--accent)] hover:underline">
                Volver a mis pedidos
                </Link>
            </div>
          </ProtectedRoute>
        );
    }

    const total = typeof order.totalAmount === 'string' ? parseFloat(order.totalAmount) : order.totalAmount;
    const createdAt = order.createdAt ? new Date(order.createdAt) : null;
    const formattedDate = createdAt ? createdAt.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }) : '';

    return (
      <ProtectedRoute>
          <div className="mx-auto max-w-4xl px-4 py-8">
          <Link href="/orders" className="text-sm text-[var(--text-secondary)] hover:text-white">
            ← Volver a mis órdenes
          </Link>

          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white">Orden #{order.id.slice(0, 8)}</h1>
              <span className={`font-medium ${statusColors[order.status]}`}>
                {statusLabels[order.status]}
              </span>
            </div>

            {order.event && (
              <div className="mb-6 border-b border-[var(--border)] pb-6">
                <h2 className="font-semibold text-white">{order.event.title}</h2>
                {order.event.date && (
                  <p className="text-sm text-[var(--text-secondary)]">
                    {new Date(order.event.date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
                {order.event.venue && (
                  <p className="text-sm text-[var(--text-secondary)]">{order.event.venue}</p>
                )}
              </div>
              )}

              {order.items && order.items.length > 0 && (
                <div className="mb-6 border-b border-[var(--border)] pb-6">
                  <h3 className="mb-3 font-semibold text-white">Entradas</h3>
                  <ul className="space-y-2">
                    {order.items.map((item) => {
                      const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
                      return (
                        <li key={item.id} className="flex justify-between text-sm">
                          <span className="text-[var(--text-secondary)]">
                            {item.ticket?.type || 'Entrada'} × {item.quantity}
                          </span>
                          <span className="text-white">{itemPrice.toFixed(2)} €</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
      
              <div className="mb-6 flex justify-between border-b border-[var(--border)] pb-6">
                <span className="text-lg font-semibold text-white">Total</span>
                <span className="text-lg font-semibold text-white">{total.toFixed(2)} €</span>
              </div>

              {formattedDate && (
              <p className="mb-4 text-sm text-[var(--text-secondary)]">
                Fecha de compra: {formattedDate}
              </p>
            )}

            {order.deliveryEmail && (
              <p className="mb-4 text-sm text-[var(--text-secondary)]">
                Email de envío: {order.deliveryEmail}
              </p>
            )}

            {order.status === 'PENDING' && (
              <div className="mt-6">
                {paymentError && <p className="mb-4 text-sm text-red-400">{paymentError}</p>}
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full rounded bg-[var(--accent)] py-3 font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  {paying ? 'Procesando pago...' : 'Pagar ahora'}
                </button>
              </div>
            )}

            {order.status === 'CONFIRMED' && (
                <div className="mt-6 rounded bg-green-500/10 border border-green-500/20 p-4">
                    <p className="text-green-400 font-medium">✓ Pago confirmado</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Tu pedido ha sido confirmado. Recibirás las entradas por email.
                    </p>
                </div>
            )}
          </div>
        </div>
    </ProtectedRoute>
  );
}