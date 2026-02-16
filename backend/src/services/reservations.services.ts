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
        reservedUntil: {
          lt: now,
        },
      },
      include: {
        orderItems: {
          include: {
            order: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (expiredTickets.length === 0) {
      return { released: 0, ordersCancelled: 0 };
    }

    const orderIdsToCancel = new Set<string>();

    expiredTickets.forEach((ticket) => {
      if (ticket.orderItems[0]?.order && ticket.orderItems[0].order.status === OrderStatus.PENDING) {
        orderIdsToCancel.add(ticket.orderItems[0].order.id);
      }
    });

    const result = await prisma.$transaction(async (tx) => {
      await tx.ticket.updateMany({
        where: {
          id: {
            in: expiredTickets.map((t) => t.id),
          },
        },
        data: {
          status: TicketStatus.AVAILABLE,
          reservedUntil: null,
          orderId: null,
        },
      });

      let ordersCancelled = 0;
      if (orderIdsToCancel.size > 0) {
        await tx.order.updateMany({
          where: {
            id: {
              in: Array.from(orderIdsToCancel),
            },
            status: OrderStatus.PENDING,
          },
          data: {
            status: OrderStatus.CANCELLED,
          },
        });
        ordersCancelled = orderIdsToCancel.size;
      }

      return {
        released: expiredTickets.length,
        ordersCancelled,
      };
    });

    logger.info(
      `Reservas expiradas liberadas: ${result.released} tickets, ${result.ordersCancelled} órdenes canceladas`,
    );

    return result;
  } catch (error: any) {
    // Si es un error de conexión, relanzar para que el worker lo maneje
    if (error?.message?.includes('Authentication failed') || error?.message?.includes('connect')) {
      throw error;
    }
    // Para otros errores, loguear y retornar valores por defecto
    logger.error('Error inesperado al liberar reservas expiradas:', error);
    return { released: 0, ordersCancelled: 0 };
  }
}
