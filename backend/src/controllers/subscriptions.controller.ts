/**
 * Controladores para gestión de suscripciones Premium
 */

import { Response } from 'express';
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

export const confirmSubscription = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const { subscriptionId } = req.body as { subscriptionId?: string };
        if (!subscriptionId || typeof subscriptionId !== 'string') {
            throw new AppError('subscriptionId es requerido', 400);
        }

        const subscription = await subscriptionsService.getSubscriptionByStripeId(subscriptionId);
        if (!subscription || subscription.userId !== req.user.userId) {
            throw new AppError('Suscripción no encontrada o no pertenece al usuario', 404);
        }

        await subscriptionsService.confirmSubscription(subscriptionId);

        logger.info(`Suscripción confirmada por cliente: ${subscriptionId} (usuario: ${req.user.userId})`);

        res.status(200).json({
            success: true,
            message: 'Suscripción confirmada',
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
