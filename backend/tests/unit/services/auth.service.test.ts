import { UserRole } from "@prisma/client";
import { prisma } from "../../../src/lib/prisma";
import * as authService from "../../../src/services/auth.service";
import { hashPassword, comparePassword } from "../../../src/utils/password";
import { createMockUser } from "../../helpers/test-helpers";
import { AppError } from "../../../src/middleware/errorHandler";

jest.mock('../../../src/utils/password');
jest.mock('../../../src/utils/jwt');

describe('Auth Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register a new user', async () => {
            const mockUser = createMockUser();
            const mockHashedPassword = 'hashedPassword123';
            const mockTokens = {
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            (hashPassword as jest.Mock).mockResolvedValue(mockHashedPassword);
            (prisma.user.create as jest.Mock).mockResolvedValue({
                ...mockUser,
                password: mockHashedPassword,
            });
            const { generateTokens } = require('../../../src/utils/jwt');
            (generateTokens as jest.Mock).mockReturnValue(mockTokens);

            const result = await authService.register({
                email: mockUser.email,
                password: mockUser.password,
                name: mockUser.name,
                role: mockUser.role,
            });

            expect(result.user.email).toBe('test@example.com');
            expect(result.tokens).toEqual(mockTokens);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
            });
        });

        it('should throw an error if the email already exists', async () => {
            const existingUser = createMockUser();
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

            await expect(authService.register({
                email: existingUser.email,
                password: existingUser.password,
                name: existingUser.name,
            })).rejects.toThrow(AppError);

            expect(prisma.user.create).not.toHaveBeenCalled();
        });
    });

    describe('login', () => {
        it('should return tokens and user when credentials are valid', async () => {
            const mockUser = createMockUser({ password: 'hashed' });
            const mockTokens = { accessToken: 'at', refreshToken: 'rt' };
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (comparePassword as jest.Mock).mockResolvedValue(true);
            const { generateTokens } = require('../../../src/utils/jwt');
            (generateTokens as jest.Mock).mockReturnValue(mockTokens);

            const result = await authService.login({
                email: mockUser.email,
                password: 'plainPassword',
            });

            expect(result.user.email).toBe(mockUser.email);
            expect(result.tokens).toEqual(mockTokens);
            expect(comparePassword).toHaveBeenCalledWith('plainPassword', mockUser.password);
        });

        it('should throw AppError when user does not exist', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(authService.login({
                email: 'nobody@example.com',
                password: 'any',
            })).rejects.toThrow(AppError);

            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'nobody@example.com' } });
            expect(comparePassword).not.toHaveBeenCalled();
        });

        it('should throw AppError when password is invalid', async () => {
            const mockUser = createMockUser();
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (comparePassword as jest.Mock).mockResolvedValue(false);

            await expect(authService.login({
                email: mockUser.email,
                password: 'wrong',
            })).rejects.toThrow(AppError);

            expect(comparePassword).toHaveBeenCalled();
            expect(require('../../../src/utils/jwt').generateTokens).not.toHaveBeenCalled();
        });
    });

    describe('refreshToken', () => {
        it('should return new tokens when refresh token is valid', async () => {
            const mockUser = createMockUser();
            const mockTokens = { accessToken: 'new-at', refreshToken: 'new-rt' };
            const { verifyRefreshToken, generateTokens } = require('../../../src/utils/jwt');
            (verifyRefreshToken as jest.Mock).mockReturnValue({ userId: mockUser.id });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: mockUser.id,
                email: mockUser.email,
                role: mockUser.role,
            });
            (generateTokens as jest.Mock).mockReturnValue(mockTokens);

            const result = await authService.refreshToken({ refreshToken: 'valid-refresh' });

            expect(result).toEqual(mockTokens);
            expect(verifyRefreshToken).toHaveBeenCalledWith('valid-refresh');
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: mockUser.id },
                select: { id: true, email: true, role: true },
            });
        });

        it('should throw AppError when user no longer exists', async () => {
            const { verifyRefreshToken } = require('../../../src/utils/jwt');
            (verifyRefreshToken as jest.Mock).mockReturnValue({ userId: 'deleted-user-id' });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(authService.refreshToken({ refreshToken: 'valid-but-user-gone' }))
                .rejects.toThrow(AppError);
        });
    });
});