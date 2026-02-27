import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import * as subscriptionsService from '../services/subscriptions.service';
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';

export const createSubscription = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const { getProfile } = await import('../services/users.service');
        const userProfile = await getProfile(req.user.userId);

        const result = await subscriptionsService.createPremiumSubscription(
            req.user.userId,
            userProfile.email,
            userProfile.name,
        );

        logger.info(`Suscripción Premium creada para usuario: ${req.user.userId}`);

        res.status(201).json({
            success: true,
            message: 'Suscripción creada exitosamente',
            data: {
                subscriptionId: result.subscriptionId,
                clientSecret: result.clientSecret,
                customerId: result.customerId,
            },
        });
    },
);

export const cancelSubscription = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const { cancelImmediately } = req.body as { cancelImmediately?: boolean };

        await subscriptionsService.cancelPremiumSubscription(
            req.user.userId,
            cancelImmediately === true,
        );

        logger.info(`Suscripción cancelada para usuario: ${req.user.userId}`);

        res.status(200).json({
            success: true,
            message: cancelImmediately
                ? 'Suscripción cancelada inmediatamente'
                : 'Suscripción cancelada al final del período',
        });
    },
);

export const getMySubscription = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const subscription = await subscriptionsService.getUserSubscription(req.user.userId);

        res.status(200).json({
            success: true,
            data: {
                subscription: subscription || null,
            },
        });
    },
);
