import { TicketStatus, OrderStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

export async function releaseExpiredReservations(): Promise<{
  released: number;
  ordersCancelled: number;
}> {
  try {
    const now = new Date();

    const expiredTickets = await prisma.ticket.findMany({
      where: {
        status: TicketStatus.RESERVED,
        reservedUntil: { lt: now },
      },
      select: { id: true, orderId: true },
    });

    if (expiredTickets.length === 0) {
      return { released: 0, ordersCancelled: 0 };
    }

    const ticketIds = expiredTickets.map((t) => t.id);
    const orderIdsToCancel = new Set(
      expiredTickets
        .filter((t) => t.orderId != null)
        .map((t) => t.orderId as string)
    );

    const result = await prisma.$transaction(async (tx) => {
      await tx.ticket.updateMany({
        where: { id: { in: ticketIds } },
        data: {
          status: TicketStatus.AVAILABLE,
          reservedUntil: null,
          orderId: null,
        },
      });

      let ordersCancelled = 0;
      if (orderIdsToCancel.size > 0) {
        const { count } = await tx.order.updateMany({
          where: {
            id: { in: Array.from(orderIdsToCancel) },
            status: OrderStatus.PENDING,
          },
          data: { status: OrderStatus.CANCELLED },
        });
        ordersCancelled = count;
      }

      return {
        released: ticketIds.length,
        ordersCancelled,
      };
    });

    logger.info(
      `Reservas expiradas liberadas: ${result.released} tickets, ${result.ordersCancelled} órdenes canceladas`,
    );

    return result;
  } catch (error: any) {
    if (error?.message?.includes('Authentication failed') || error?.message?.includes('connect')) {
      throw error;
    }
    logger.error('Error inesperado al liberar reservas expiradas:', error);
    return { released: 0, ordersCancelled: 0 };
  }
}
