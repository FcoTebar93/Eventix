import { Request, Response } from 'express';
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/auth.schema';
import * as authService from '../services/auth.service';
import { logger } from '../utils/logger';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
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
    } catch (error) {
        throw error;
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
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
    } catch (error) {
        throw error;
    }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
    try {
        const validatedData = refreshTokenSchema.parse(req.body);

        const tokens = await authService.refreshToken(validatedData);

        res.status(200).json({
            success: true,
            message: 'Tokens renovados exitosamente',
            data: {
                tokens,
            },
        });
    } catch (error) {
        throw error;
    }
};