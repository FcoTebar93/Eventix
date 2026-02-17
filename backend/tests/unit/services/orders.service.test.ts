import { EventStatus, OrderStatus, TicketStatus, Prisma, PaymentMethod } from '@prisma/client';
import { prisma } from '../../../src/lib/prisma';
import * as ordersService from '../../../src/services/orders.service';
import { createMockEvent } from '../../helpers/test-helpers';
import { createMockTicket } from '../../helpers/test-helpers';
import { AppError } from '../../../src/middleware/errorHandler';

type EventForTicket = {
    id: string;
    title: string;
    date: Date;
    status: EventStatus;
    organizerId: string;
};

function ticketWithEvent(ticket: ReturnType<typeof createMockTicket>, event: EventForTicket) {
    return { ...ticket, event };
}

const mockTx = {
    order: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
    orderItem: { create: jest.fn() },
    ticket: { update: jest.fn(), updateMany: jest.fn() },
    payment: { create: jest.fn() },
};

describe('Orders Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (prisma.$transaction as jest.Mock).mockImplementation((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx));
    });

    describe('createOrder', () => {
        it('should throw when tickets not found', async () => {
            (prisma.ticket.findMany as jest.Mock).mockResolvedValue([]);

            await expect(ordersService.createOrder('user-1', {
                ticketIds: ['ticket-1'],
                deliveryEmail: 'a@a.com',
            })).rejects.toThrow(AppError);

            expect(prisma.ticket.findMany).toHaveBeenCalledWith({
                where: { id: { in: ['ticket-1'] } },
                include: expect.any(Object),
            });
        });

        it('should throw when a ticket is not available', async () => {
            const eventData: EventForTicket = {
                id: 'e1',
                title: 'E',
                date: new Date(Date.now() + 86400000),
                status: EventStatus.PUBLISHED,
                organizerId: 'o1',
            };
            const ticket = createMockTicket({
                id: 't1',
                status: TicketStatus.RESERVED,
                eventId: 'e1',
            });
            (prisma.ticket.findMany as jest.Mock).mockResolvedValue([ticketWithEvent(ticket, eventData)]);
        
            await expect(ordersService.createOrder('user-1', {
                ticketIds: ['t1'],
            })).rejects.toThrow(AppError);
        });

        it('should throw when event is not published', async () => {
            const eventData: EventForTicket = {
                id: 'e1',
                title: 'E',
                date: new Date(Date.now() + 86400000),
                status: EventStatus.DRAFT,
                organizerId: 'o1',
            };
            const ticket = createMockTicket({ eventId: 'e1' });
            (prisma.ticket.findMany as jest.Mock).mockResolvedValue([ticketWithEvent(ticket, eventData)]);
        
            await expect(ordersService.createOrder('user-1', { ticketIds: [ticket.id] }))
                .rejects.toThrow(AppError);
        });

        it('should create order and reserve tickets when all valid', async () => {
            const event = createMockEvent({
                id: 'e1',
                status: EventStatus.PUBLISHED,
                date: new Date(Date.now() + 86400000),
            });
            const eventForTicket: EventForTicket = {
                id: event.id,
                title: event.title,
                date: event.date,
                status: event.status,
                organizerId: event.organizerId,
            };
            const ticket = createMockTicket({
                id: 't1',
                eventId: event.id,
                status: TicketStatus.AVAILABLE,
                price: new Prisma.Decimal(50),
            });
            const newOrder = {
                id: 'order-1',
                userId: 'user-1',
                status: OrderStatus.PENDING,
                totalAmount: 50,
                deliveryEmail: 'a@a.com',
                deliveryAddress: null,
                eventId: event.id,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const orderWithDetails = { ...newOrder, user: {}, event: {}, items: [] };
        
            (prisma.ticket.findMany as jest.Mock).mockResolvedValue([ticketWithEvent(ticket, eventForTicket)]);
            mockTx.order.create.mockResolvedValue(newOrder);
            mockTx.orderItem.create.mockResolvedValue({});
            mockTx.ticket.update.mockResolvedValue({});
            (prisma.order.findUnique as jest.Mock).mockResolvedValue(orderWithDetails);
        
            const result = await ordersService.createOrder('user-1', {
                ticketIds: [ticket.id],
                deliveryEmail: 'a@a.com',
            });
        
            expect(result).toEqual(orderWithDetails);
            expect(mockTx.order.create).toHaveBeenCalled();
            expect(mockTx.ticket.update).toHaveBeenCalled();
        });
    });

    describe('getOrderById', () => {
        it('should throw when order not found', async () => {
            (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(ordersService.getOrderById('order-1', 'user-1', 'BUYER'))
                .rejects.toThrow(AppError);
        });

        it('should throw when user is not owner and not admin', async () => {
            const order = { id: 'order-1', userId: 'other-user' };
            (prisma.order.findUnique as jest.Mock).mockResolvedValue(order);

            await expect(ordersService.getOrderById('order-1', 'user-1', 'BUYER'))
                .rejects.toThrow(AppError);
        });

        it('should return order when user is owner', async () => {
            const order = { id: 'order-1', userId: 'user-1', user: {}, event: {}, items: [], payments: [] };
            (prisma.order.findUnique as jest.Mock).mockResolvedValue(order);

            const result = await ordersService.getOrderById('order-1', 'user-1', 'BUYER');

            expect(result).toEqual(order);
        });
    });

    describe('payOrder', () => {
        it('should throw when order not found', async () => {
            (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(ordersService.payOrder('order-1', 'user-1', { method: PaymentMethod.CREDIT_CARD })).rejects.toThrow(AppError);
        });

        it('should throw when user is not order owner', async () => {
            (prisma.order.findUnique as jest.Mock).mockResolvedValue({
                id: 'order-1',
                userId: 'other-user',
                status: OrderStatus.PENDING,
                totalAmount: 100,
                items: [],
            });

            await expect(ordersService.payOrder('order-1', 'user-1', { method: PaymentMethod.CREDIT_CARD })).rejects.toThrow(AppError);
        });
    });
});