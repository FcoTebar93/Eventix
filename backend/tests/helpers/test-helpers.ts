import { EventStatus, Prisma, TicketStatus, UserRole } from "@prisma/client";
import type { Event, Ticket, User } from "@prisma/client";

export const createMockUser = (overrides?: Partial<User>): User => ({
    id: '1239485',
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    role: UserRole.BUYER,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

export const createMockEvent = (overrides?: Partial<Event>): Event => ({
    id: '1239485',
    title: 'Test Event',
    description: 'Test Description',
    venue: 'Test Venue',
    address: 'Test Address',
    city: 'Test City',
    country: 'Test Country',
    date: new Date(),
    imageUrl: 'https://example.com/image.jpg',
    category: 'Test Category',
    status: EventStatus.DRAFT,
    organizerId: '1239485',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

export const createMockTicket = (overrides?: Partial<Ticket>): Ticket => ({
    id: '1239485',
    eventId: '8888',
    type: 'VIP',
    price: new Prisma.Decimal(100.00),
    originalPrice: new Prisma.Decimal(100.00),
    status: TicketStatus.AVAILABLE,
    section: 'A',
    row: '1',
    seat: '10',
    sellerId: null,
    reservedUntil: null,
    orderId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});