import * as jwt from 'jsonwebtoken';
import { generateTokens, verifyAccessToken, verifyRefreshToken } from '../../../src/utils/jwt';
import { AppError } from '../../../src/middleware/errorHandler';
import { UserRole } from '@prisma/client';

jest.mock('../../../src/config/env', () => ({
    JWT_SECRET: 'test-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    JWT_EXPIRES_IN: '1h',
    JWT_REFRESH_EXPIRES_IN: '7d',
}));

describe('jwt utils', () => {
    const payload = { userId: 'user-1', email: 'test@example.com', role: 'BUYER' as UserRole };

    describe('generateTokens', () => {
        it('should generate access and refresh tokens', () => {
            (jwt.sign as jest.Mock).mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

            const result = generateTokens(payload);

            expect(result).toEqual({
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
            });
            expect(jwt.sign).toHaveBeenCalledWith(payload, 'test-secret', { expiresIn: '1h' });
            expect(jwt.sign).toHaveBeenCalledWith(payload, 'test-refresh-secret', { expiresIn: '7d' });
        });
    });
    
    describe('verifyAccessToken', () => {
        it('should return payload when token is valid', () => {
            (jwt.verify as jest.Mock).mockReturnValue(payload);

            const result = verifyAccessToken('valid-access-token');

            expect(result).toEqual(payload);
            expect(jwt.verify).toHaveBeenCalledWith('valid-access-token', 'test-secret');
        });

        it('should throw AppError when token is invalid', () => {
            (jwt.verify as jest.Mock).mockImplementation(() => {
                const err = new Error('Invalid token') as jwt.JsonWebTokenError;
                err.name = 'JsonWebTokenError';
                throw err;
            });

            expect(() => verifyAccessToken('bad')).toThrow(AppError);
        });

        it('should throw AppError when token is expired', () => {
            (jwt.verify as jest.Mock).mockImplementation(() => {
                const err = new Error('Token expired') as jwt.TokenExpiredError;
                err.name = 'TokenExpiredError';
                throw err;
            });

            expect(() => verifyAccessToken('expired')).toThrow(AppError);
        });
    });

    describe('verifyRefreshToken', () => {
        it('should return payload when token is valid', () => {
            (jwt.verify as jest.Mock).mockReturnValue(payload);

            const result = verifyRefreshToken('valid-refresh-token');

            expect(result).toEqual(payload);
            expect(jwt.verify).toHaveBeenCalledWith('valid-refresh-token', 'test-refresh-secret');
        });

        it('should throw AppError when token is invalid', () => {
            (jwt.verify as jest.Mock).mockImplementation(() => {
                const err = new Error('Invalid refresh token') as jwt.JsonWebTokenError;
                err.name = 'JsonWebTokenError';
                throw err;
            });

            expect(() => verifyRefreshToken('bad')).toThrow(AppError);
        });
    });
});

    