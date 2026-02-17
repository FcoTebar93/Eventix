import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (
    err: Error | AppError | ZodError,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void => {
    if (err instanceof ZodError) {
        res.status(400).json({
            success: false,
            error: 'Validation Error',
            details: err.errors.map((e) => ({
                path: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }

    if (err instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
            success: false,
            error: 'Invalid token',
        });
        return;
    }

    if (err instanceof jwt.TokenExpiredError) {
        res.status(401).json({
            success: false,
            error: 'Token expired',
        });
        return;
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        logger.error('Prisma error:', err);
        
        if (err.code === 'P2002') {
            res.status(409).json({
                success: false,
                error: 'A record with this value already exists',
            });
            return;
        }

        if (err.code === 'P2025') {
            res.status(404).json({
                success: false,
                error: 'Record not found',
            });
            return;
        }

        res.status(400).json({
            success: false,
            error: 'Database error',
        });
        return;
    }

    if (err instanceof AppError && err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            error: err.message,
        });
        return;
    }

    logger.error('Unexpected Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};