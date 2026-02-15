import { OrderStatus, TicketStatus, Prisma, EventStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { CreateOrderInput, UpdateOrderInput, GetOrdersQuery, CancelOrderInput, PayOrderInput
} from '../schemas/orders.schema';

export const createOrder = async (
    userId: string,
    data: CreateOrderInput,
) => {
    const tickets = await prisma.ticket.findMany({
        where: {
            id: { in: data.ticketIds },
        },
        include: {
            event: {
                select: {
                    id: true,
                    title: true,
                    date: true,
                    status: true,
                    organizerId: true,
                },
            },
        },
    });

    if (tickets.length !== data.ticketIds.length) {
        throw new AppError('Uno o más tickets no fueron encontrados', 404);
    }

    const unavailableTickets = tickets.filter(
        (ticket) => ticket.status !== TicketStatus.AVAILABLE,
    );

    if (unavailableTickets.length > 0) {
        throw new AppError(
            'Uno o más tickets no están disponibles para compra',
            400,
        );
    }

    const invalidEvents = tickets.filter(
        (ticket) => ticket.event.status !== EventStatus.PUBLISHED,
    );

    if (invalidEvents.length > 0) {
        throw new AppError(
            'Uno o más tickets pertenecen a eventos no publicados',
            400,
        );
    }

    const pastEvents = tickets.filter(
        (ticket) => new Date(ticket.event.date) < new Date(),
    );

    if (pastEvents.length > 0) {
        throw new AppError(
            'Uno o más tickets pertenecen a eventos que ya ocurrieron',
            400,
        );
    }

    const totalAmount = tickets.reduce(
        (sum, ticket) => sum + Number(ticket.price),
        0,
    );

    const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
            data: {
                userId,
                status: OrderStatus.PENDING,
                totalAmount,
                deliveryEmail: data.deliveryEmail,
                deliveryAddress: data.deliveryAddress,
                eventId: tickets[0].eventId,
            },
        });

        const orderItems = await Promise.all(
            tickets.map(async (ticket) => {
                const orderItem = await tx.orderItem.create({
                    data: {
                        orderId: newOrder.id,
                        ticketId: ticket.id,
                        quantity: 1,
                        price: ticket.price,
                        subtotal: ticket.price,
                    },
                });

                const reservedUntil = new Date();
                reservedUntil.setMinutes(reservedUntil.getMinutes() + 15);

                await tx.ticket.update({
                    where: { id: ticket.id },
                    data: {
                        status: TicketStatus.RESERVED,
                        reservedUntil,
                        orderId: newOrder.id,
                    },
                });

                return orderItem;
            }),
        );

        return {
            ...newOrder,
            items: orderItems,
        };
    });

    const orderWithDetails = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            event: {
                select: {
                    id: true,
                    title: true,
                    date: true,
                },
            },
            items: {
                include: {
                    ticket: {
                        include: {
                            event: {
                                select: {
                                    id: true,
                                    title: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    return orderWithDetails!;
};

export const getOrders = async (
    query: GetOrdersQuery,
    userId: string,
    userRole: string,
) => {
    const { page = 1, limit = 10, status, eventId } = query;

    const skip = (page - 1) * limit;
    const validLimit = Math.min(Math.max(limit, 1), 100);
    const validPage = Math.max(page, 1);

    const where: Prisma.OrderWhereInput = {};

    if (userRole !== 'ADMIN') {
        where.userId = userId;
    }

    if (status) {
        where.status = status;
    }

    if (eventId) {
        where.eventId = eventId;
    }

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            skip,
            take: validLimit,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                event: {
                    select: {
                        id: true,
                        title: true,
                        date: true,
                    },
                },
                items: {
                    include: {
                        ticket: {
                            select: {
                                id: true,
                                type: true,
                                price: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        payments: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        }),
        prisma.order.count({ where }),
    ]);

    return {
        orders,
        total,
        page: validPage,
        totalPages: Math.ceil(total / validLimit),
    };
};

export const getOrderById = async (orderId: string, userId: string, userRole: string) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            event: {
                select: {
                    id: true,
                    title: true,
                    date: true,
                    venue: true,
                },
            },
            items: {
                include: {
                    ticket: {
                        include: {
                            event: {
                                select: {
                                    id: true,
                                    title: true,
                                },
                            },
                        },
                    },
                },
            },
            payments: {
                orderBy: {
                    createdAt: 'desc',
                },
            },
        },
    });

    if (!order) {
        throw new AppError('Orden no encontrada', 404);
    }

    if (userRole !== 'ADMIN' && order.userId !== userId) {
        throw new AppError('No tienes permisos para ver esta orden', 403);
    }

    return order;
};

export const updateOrder = async (
    orderId: string,
    userId: string,
    userRole: string,
    data: UpdateOrderInput,
) => {
    const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
    });

    if (!existingOrder) {
        throw new AppError('Orden no encontrada', 404);
    }

    if (userRole !== 'ADMIN' && existingOrder.userId !== userId) {
        throw new AppError('No tienes permisos para actualizar esta orden', 403);
    }

    if (
        userRole !== 'ADMIN' &&
        data.status &&
        data.status !== OrderStatus.CANCELLED
    ) {
        throw new AppError(
            'Solo puedes cancelar tus propias órdenes pendientes',
            403,
        );
    }

    if (
        userRole !== 'ADMIN' &&
        existingOrder.status !== OrderStatus.PENDING
    ) {
        throw new AppError(
            'Solo se pueden cancelar órdenes pendientes',
            400,
        );
    }

    const updateData: Prisma.OrderUpdateInput = {};

    if (data.status !== undefined) {
        updateData.status = data.status;

        if (data.status === OrderStatus.CANCELLED) {
            await prisma.$transaction(async (tx) => {
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: OrderStatus.CANCELLED },
                });

                await tx.ticket.updateMany({
                    where: { orderId },
                    data: {
                        status: TicketStatus.AVAILABLE,
                        reservedUntil: null,
                        orderId: null,
                    },
                });
            });

            const updatedOrder = await prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    event: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                },
            });

            return updatedOrder!;
        }
    }

    if (data.deliveryEmail !== undefined) {
        updateData.deliveryEmail = data.deliveryEmail;
    }
    if (data.deliveryAddress !== undefined) {
        updateData.deliveryAddress = data.deliveryAddress;
    }

    const order = await prisma.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                },
            },
            event: {
                select: {
                    id: true,
                    title: true,
                },
            },
        },
    });

    return order;
};

export const cancelOrder = async (
    orderId: string,
    userId: string,
    userRole: string,
    data: CancelOrderInput,
) => {
    return updateOrder(
        orderId,
        userId,
        userRole,
        { status: OrderStatus.CANCELLED },
    );
};

export const confirmOrder = async (orderId: string) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: {
                include: {
                    ticket: true,
                },
            },
        },
    });

    if (!order) {
        throw new AppError('Orden no encontrada', 404);
    }

    if (order.status !== OrderStatus.PENDING) {
        throw new AppError(
            'Solo se pueden confirmar órdenes pendientes',
            400,
        );
    }

    const confirmedOrder = await prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.CONFIRMED },
        });

        await tx.ticket.updateMany({
            where: { orderId },
            data: {
                status: TicketStatus.SOLD,
                reservedUntil: null,
            },
        });

        return updatedOrder;
    });

    return confirmedOrder;
};

export const getMyOrders = async (userId: string) => {
    const orders = await prisma.order.findMany({
        where: { userId },
        include: {
            event: {
                select: {
                    id: true,
                    title: true,
                    date: true,
                    venue: true,
                },
            },
            items: {
                include: {
                    ticket: {
                        select: {
                            id: true,
                            type: true,
                            price: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    payments: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return orders;
};

export const payOrder = async (orderId: string, userId: string, data: PayOrderInput) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: true,
        },
    });

    if (!order) {
        throw new AppError('Pedido no encontrado', 404);
    }

    if (order.userId !== userId) {
        throw new AppError('No tienes permisos para pagar este pedido', 403);
    }

    if (order.status !== OrderStatus.PENDING) {
        throw new AppError('Solo se pueden pagar pedidos pendientes', 400);
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
        await tx.payment.create({
            data: {
                orderId,
                userId,
                amount: order.totalAmount,
                method: data.method,
                status: PaymentStatus.COMPLETED,
                transactionId: `tx-${Date.now()}-${orderId.slice(0, 8)}`,
            },
        });

        const orderUpdated = await tx.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.CONFIRMED },
            include: {
                event: {
                    select: {
                        id: true,
                        title: true,
                        date: true,
                    },
                },
                items: {
                    include: {
                        ticket: {
                            select: {
                                id: true,
                                type: true,
                                price: true,
                            },
                        },
                    },
                },
                payments: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        await tx.ticket.updateMany({
            where: { orderId },
            data: { status: TicketStatus.SOLD, reservedUntil: null },
        });

        return orderUpdated;
    });

    return updatedOrder;
};