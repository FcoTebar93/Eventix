import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

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
            message: 'Validation error',
            details: err.errors.map((e) => ({
                path: e.path.join('.'),
                message: e.message,
            })),
        });
    return;
    }

    if (err instanceof AppError && err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }

    console.error('Unexpected error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    });
    return;
};