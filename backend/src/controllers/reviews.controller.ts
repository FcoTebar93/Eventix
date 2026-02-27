import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { createEventReviewSchema, getEventReviewsQuerySchema, createUserReviewSchema, getUserReviewsQuerySchema } from '../schemas/reviews.schema';
import { eventIdParamsSchema } from '../schemas/events.schema';
import { userIdParamsSchema } from '../schemas/users.schema';
import * as reviewsService from '../services/reviews.service';

export const getEventReviews = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = eventIdParamsSchema.parse(req.params);
        const query = getEventReviewsQuerySchema.parse(req.query);
        const result = await reviewsService.getEventReviews(id, query);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        throw error;
    }
};

export const createEventReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const { id } = eventIdParamsSchema.parse(req.params);
        const body = createEventReviewSchema.parse(req.body);
        const result = await reviewsService.upsertEventReview(
            id,
            req.user.userId,
            body,
        );

        res.status(201).json({
            success: true,
            message: 'Reseña guardada correctamente',
            data: result,
        });
    } catch (error) {
        throw error;
    }
};

export const getUserProfileReviews = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = userIdParamsSchema.parse(req.params);
        const query = getUserReviewsQuerySchema.parse(req.query);
        const result = await reviewsService.getUserProfileReviews(id, query);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        throw error;
    }
};

export const createUserProfileReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const { id } = userIdParamsSchema.parse(req.params);
        const body = createUserReviewSchema.parse(req.body);
        const result = await reviewsService.upsertUserProfileReview(
            id,
            req.user.userId,
            body,
        );

        res.status(201).json({
            success: true,
            message: 'Reseña de perfil guardada correctamente',
            data: result,
        });
    } catch (error) {
        throw error;
    }
};

export const deleteEventReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const { id } = eventIdParamsSchema.parse(req.params);
        await reviewsService.deleteEventReview(id, req.user.userId);

        res.status(204).send();
    } catch (error) {
        throw error;
    }
};

export const deleteUserProfileReview = async (
    req: AuthenticatedRequest,
    res: Response,
): Promise<void> => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const { id } = userIdParamsSchema.parse(req.params);
        await reviewsService.deleteUserProfileReview(id, req.user.userId);

        res.status(204).send();
    } catch (error) {
        throw error;
    }
};

