import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../types';
import { AppError } from './errorHandler';

export const authenticate = (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('No token provided', 401);
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        const payload = verifyAccessToken(token);
        req.user = payload;

        next();
    } catch (error) {
        next(error);
    }
};

export const requireRole = (...allowedRoles: string[]) => {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
        if (!req.user) {
            throw new AppError('Authentication required', 401);
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new AppError('Insufficient permissions', 403);
        }

        next();
    };
};