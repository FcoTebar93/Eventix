import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { updateProfileSchema, changePasswordSchema, userIdParamsSchema } from '../schemas/users.schema';
import * as usersService from '../services/users.service';
import { logger } from '../utils/logger';

export const getProfile = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const user = await usersService.getProfile(req.user.userId);

        res.status(200).json({
            success: true,
            data: {
                user,
            },
        });
    } catch (error) {
        throw error;
    }
};

export const updateProfile = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const validatedData = updateProfileSchema.parse(req.body);
        const user = await usersService.updateProfile(
            req.user.userId,
            validatedData,
        );

        logger.info(`Perfil actualizado para usuario: ${req.user.userId}`);

        res.status(200).json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            data: {
                user,
            },
        });
    } catch (error) {
        throw error;
    }
};

export const changePassword = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const validatedData = changePasswordSchema.parse(req.body);
        await usersService.changePassword(req.user.userId, validatedData);

        logger.info(`Contraseña cambiada para usuario: ${req.user.userId}`);

        res.status(200).json({
            success: true,
            message: 'Contraseña cambiada exitosamente',
        });
    } catch (error) {
        throw error;
    }
};

export const getUserById = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { id } = userIdParamsSchema.parse(req.params);
        const user = await usersService.getUserById(id);

        res.status(200).json({
            success: true,
            data: {
                user,
            },
        });
    } catch (error) {
        throw error;
    }
};

export const getAllUsers = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const validLimit = Math.min(Math.max(limit, 1), 100);
        const validPage = Math.max(page, 1);

        const result = await usersService.getAllUsers(validPage, validLimit);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        throw error;
    }
};