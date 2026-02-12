import * as jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JWTPayload, AuthTokens } from '../types';
import { AppError } from '../middleware/errorHandler';

const getSecret = (secret: string): string => {
    if (!secret) {
        throw new Error('JWT secret is not configured');
    }
    return secret;
};

export const generateTokens = (payload: JWTPayload): AuthTokens => {
    const secret = getSecret(env.JWT_SECRET);
    const refreshSecret = getSecret(env.JWT_REFRESH_SECRET);
    
    const accessToken = jwt.sign(payload, secret, {
        expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, refreshSecret, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): JWTPayload => {
    try {
        const secret = getSecret(env.JWT_SECRET);
        return jwt.verify(token, secret) as JWTPayload;
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw new AppError('Invalid token', 401);
        }
        if (error instanceof jwt.TokenExpiredError) {
            throw new AppError('Token expired', 401);
        }
        throw new AppError('Token verification failed', 401);
    }
};

export const verifyRefreshToken = (token: string): JWTPayload => {
    try {
        const refreshSecret = getSecret(env.JWT_REFRESH_SECRET);
        return jwt.verify(token, refreshSecret) as JWTPayload;
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw new AppError('Invalid refresh token', 401);
        }
        if (error instanceof jwt.TokenExpiredError) {
            throw new AppError('Refresh token expired', 401);
        }
        throw new AppError('Refresh token verification failed', 401);
    }
};