import { OrderStatus } from '@prisma/client';
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