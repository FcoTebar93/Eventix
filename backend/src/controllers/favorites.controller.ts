import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { eventIdParamsSchema, getFavoritesQuerySchema } from '../schemas/favorites.schema';
import * as favoritesService from '../services/favorites.service';

export const addFavorite = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const { eventId } = eventIdParamsSchema.parse(req.params);
        const favorite = await favoritesService.addFavorite(req.user.userId, eventId);

        res.status(201).json({
            success: true,
            data: favorite,
        });
    } catch (error) {
        throw error;
    }
};

export const removeFavorite = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const { eventId } = eventIdParamsSchema.parse(req.params);
        const result = await favoritesService.removeFavorite(req.user.userId, eventId);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        throw error;
    }
};

export const getFavorites = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const query = getFavoritesQuerySchema.parse(req.query);
        const result = await favoritesService.getFavorites(req.user.userId, query);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        throw error;
    }
};

export const checkFavorite = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const { eventId } = eventIdParamsSchema.parse(req.params);
        const isFavorite = await favoritesService.isFavorite(req.user.userId, eventId);

        res.status(200).json({
            success: true,
            data: { isFavorite },
        });
    } catch (error) {
        throw error;
    }
};
