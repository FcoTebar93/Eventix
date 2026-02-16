import { UserRole } from "@prisma/client";
import { prisma } from "../../../src/lib/prisma";
import * as authService from "../../../src/services/auth.service";
import { hashPassword } from "../../../src/utils/password";
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
        });
    });

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
            (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
            
            const { generateTokens } = require('../../../src/utils/jwt');
            generateTokens.mockReturnValue(mockTokens);

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
});