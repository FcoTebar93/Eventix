import request from 'supertest';
import { app } from '../../src/app';
import { env } from '../../src/config/env';
import { prisma } from '../../src/lib/prisma';
import { createMockEvent } from '../helpers/test-helpers';
import { EventStatus } from '@prisma/client';
import { comparePassword } from '../../src/utils/password';
import * as jwtUtils from '../../src/utils/jwt';

jest.mock('../../src/utils/password');
jest.mock('../../src/utils/jwt');
jest.mock('../../src/utils/cache', () => ({
    getEventsListCacheKey: jest.fn((p: Record<string, unknown>) => `events:list:${JSON.stringify(p)}`),
    getEventCacheKey: jest.fn((id: string) => `event:${id}`),
    getFromCache: jest.fn().mockResolvedValue(null),
    setCache: jest.fn().mockResolvedValue(undefined),
    deleteCache: jest.fn().mockResolvedValue(undefined),
}));

const API = env.API_PREFIX;

describe('Events API (e2e)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /events', () => {
        it('should return 401 when no token is sent', async () => {
            const res = await request(app).get(`${API}/events`);
            expect(res.status).toBe(401);
        });

        it('should return 200 and list of events when authenticated', async () => {
            const mockEvent = createMockEvent({ status: EventStatus.PUBLISHED });
            const eventWithOrganizer = {
                ...mockEvent,
                organizer: { id: 'o1', name: 'Org' },
                _count: { tickets: 0, reviews: 0 },
            };

            (prisma.event.findMany as jest.Mock).mockResolvedValue([eventWithOrganizer]);
            (prisma.event.count as jest.Mock).mockResolvedValue(1);

            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 'u1',
                email: 'u@u.com',
                name: 'U',
                role: 'BUYER',
                password: 'hash',
            });
            (comparePassword as jest.Mock).mockResolvedValue(true);
            (jwtUtils.generateTokens as jest.Mock).mockReturnValue({
                accessToken: 'test-access-token',
                refreshToken: 'test-refresh-token',
            });

            const authRes = await request(app)
                .post(`${API}/auth/login`)
                .send({ email: 'u@u.com', password: 'p' });

            const accessToken = authRes.body.data?.tokens?.accessToken;

            const res = await request(app)
                .get(`${API}/events`)
                .set('Authorization', `Bearer ${accessToken || 'test-access-token'}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('events');
        });
    });
});