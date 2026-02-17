import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/auth.schema';
import * as authService from '../services/auth.service';
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/asyncHandler';

export const register = asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const validatedData = registerSchema.parse(req.body);

    const result = await authService.register(validatedData);

    logger.info(`Usuario registrado: ${result.user.email}`);

    res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
            user: result.user,
            tokens: result.tokens,
        },
    });
});

export const login = asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const validatedData = loginSchema.parse(req.body);

    const result = await authService.login(validatedData);

    logger.info(`Usuario autenticado: ${result.user.email}`);

    res.status(200).json({
        success: true,
        message: 'Login exitoso',
        data: {
            user: result.user,
            tokens: result.tokens,
        },
    });
});

export const refresh = asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const validatedData = refreshTokenSchema.parse(req.body);

    const tokens = await authService.refreshToken(validatedData);

    res.status(200).json({
        success: true,
        message: 'Tokens renovados exitosamente',
        data: {
            tokens,
        },
    });
});