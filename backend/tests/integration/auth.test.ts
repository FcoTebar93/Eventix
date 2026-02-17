import request from 'supertest';
import { app } from '../../src/app';
import { env } from '../../src/config/env';
import { prisma } from '../../src/lib/prisma';
import { createMockUser } from '../helpers/test-helpers';
import { hashPassword, comparePassword } from '../../src/utils/password';
import * as jwtUtils from '../../src/utils/jwt';

jest.mock('../../src/utils/password');
jest.mock('../../src/utils/jwt');

const API = env.API_PREFIX;

describe('Auth Integration', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
    });

    describe('POST /auth/register', () => {
        it('should return 201 and user + tokens when registration is successful', async () => {
            const mockUser = createMockUser();
            const mockTokens = { accessToken: 'at', refreshToken: 'rt' };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            (hashPassword as jest.Mock).mockResolvedValue('hashed');
            (prisma.user.create as jest.Mock).mockResolvedValue({
                id: mockUser.id,
                email: 'new@example.com',
                name: 'New User',
                role: mockUser.role,
            });
            (jwtUtils.generateTokens as jest.Mock).mockReturnValue(mockTokens);

            const response = await request(app).post(`${API}/auth/register`).send({
                email: 'new@example.com',
                password: 'Password123',
                name: 'New User',
            });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toMatchObject({
                email: 'new@example.com',
                name: 'New User',
            });
            expect(response.body.data.tokens).toEqual(mockTokens);
        });

        it('should return 409 if email already exists', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(createMockUser());

            const response = await request(app).post(`${API}/auth/register`).send({
                email: 'existing@example.com',
                password: 'Password123',
                name: 'Existing User',
            });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('El email ya está registrado');
        });

        it('should return 400 for validation errors', async () => {
            const response = await request(app).post(`${API}/auth/register`).send({
                email: 'invalid-email',
                password: 'short',
                name: 'Invalid User',
            });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Validation Error');
            expect(response.body.details[0].message).toBeDefined();
        });
    });

    describe('POST /auth/login', () => {
        it('should return 200 and user + tokens when credentials are valid', async () => {
            const mockUser = createMockUser();
            const mockTokens = { accessToken: 'at', refreshToken: 'rt' };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (comparePassword as jest.Mock).mockResolvedValue(true);
            (jwtUtils.generateTokens as jest.Mock).mockReturnValue(mockTokens);

            const response = await request(app).post(`${API}/auth/login`).send({
                email: mockUser.email,
                password: 'plainPassword',
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(mockUser.email);
            expect(response.body.data.tokens).toEqual(mockTokens);
        });

        it('should return 401 if credentials are invalid', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await request(app).post(`${API}/auth/login`).send({
                email: 'invalid@example.com',
                password: 'wrongPassword',
            });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /auth/refresh', () => {
        it('should return 200 and new tokens when refresh token is valid', async () => {
            const mockUser = createMockUser();
            const newTokens = { accessToken: 'new-at', refreshToken: 'new-rt' };

            (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue({ userId: mockUser.id });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: mockUser.id,
                email: mockUser.email,
                role: mockUser.role,
            });
            (jwtUtils.generateTokens as jest.Mock).mockReturnValue(newTokens);

            const response = await request(app).post(`${API}/auth/refresh`).send({
                refreshToken: 'valid-refresh-token',
            });

            expect(response.status).toBe(200);
            expect(response.body.data.tokens).toEqual(newTokens);
        });
    });
});