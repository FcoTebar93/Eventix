import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const generalLimiter = rateLimit({
    windowMs: env.RATE_LIMITING_WINDOW_MS, 
    max: env.RATE_LIMITING_MAX_REQUESTS, 
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true, 
    legacyHeaders: false, 
});

export const authLimiter = env.NODE_ENV === 'development' 
    ? ((req: any, res: any, next: any) => next())
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: {
            success: false,
            error: 'Too many authentication attempts, please try again later.',
        },
        skipSuccessfulRequests: true,
        standardHeaders: true,
        legacyHeaders: false,
    });