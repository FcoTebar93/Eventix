import { OrderStatus, UserRole, EventStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface DashboardStats {
    totalUsers: number;
    totalEvents: number;
    totalOrders: number;
    totalRevenue: number;
    ordersCompleted: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const [totalUsers, totalEvents, totalOrders, revenueResult, ordersCompleted] =
        await Promise.all([
            prisma.user.count(),
            prisma.event.count(),
            prisma.order.count(),
            prisma.order.aggregate({
                where: {
                    status: { in: [OrderStatus.CONFIRMED, OrderStatus.COMPLETED] },
                },
                _sum: { totalAmount: true },
            }),
            prisma.order.count({
                where: { status: OrderStatus.COMPLETED },
            }),
        ]);

    return {
        totalUsers,
        totalEvents,
        totalOrders,
        totalRevenue: Number(revenueResult._sum.totalAmount ?? 0),
        ordersCompleted,
    };
};

export const updateUserRole = async (userId: string, role: UserRole) => {
    const user = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
        },
    });

    return user;
};

export const updateEventStatus = async (eventId: string, status: EventStatus) => {
    const event = await prisma.event.update({
        where: { id: eventId },
        data: { status },
        include: {
            organizer: {
                select: { id: true, name: true },
            },
            _count: {
                select: {
                    tickets: true,
                    reviews: true,
                },
            },
        },
    });

    return event;
};