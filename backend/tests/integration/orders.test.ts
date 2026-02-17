import request from 'supertest';
import { app } from '../../src/app';
import { env } from '../../src/config/env';

jest.mock('../../src/utils/password');
jest.mock('../../src/utils/jwt');

const API = env.API_PREFIX;

describe('Orders API (e2e)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /orders', () => {
        it('should return 401 when no token is sent', async () => {
            const res = await request(app)
                .post(`${API}/orders`)
                .send({ ticketIds: ['ticket-uuid'] });
            expect(res.status).toBe(401);
        });
    });

    describe('GET /orders/me', () => {
        it('should return 401 when no token is sent', async () => {
            const res = await request(app).get(`${API}/orders/me`);
            expect(res.status).toBe(401);
        });
    });
});