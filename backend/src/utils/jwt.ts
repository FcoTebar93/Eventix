import * as jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JWTPayload, AuthTokens } from '../types';

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
    const secret = getSecret(env.JWT_SECRET);
    return jwt.verify(token, secret) as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
    const refreshSecret = getSecret(env.JWT_REFRESH_SECRET);
    return jwt.verify(token, refreshSecret) as JWTPayload;
};