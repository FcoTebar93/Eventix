jest.mock('../../src/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        },
        event: {
            findUnique: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        },
        ticket: {
            findUnique: jest.fn(),
            create: jest.fn(),
            createMany: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
            delete: jest.fn()
        },
        order: {
            findUnique: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        },
        orderItem: {
            create: jest.fn()
        },
        payment: {
            create: jest.fn()
        },
        $transaction: jest.fn((cb: (tx: any) => Promise<any>) => cb({
            order: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
            orderItem: { create: jest.fn() },
            ticket: { update: jest.fn(), updateMany: jest.fn() },
            payment: { create: jest.fn() }
        })),
        $connect: jest.fn(),
        $disconnect: jest.fn()
    }
}));