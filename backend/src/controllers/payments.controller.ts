/**
 * Controladores para pagos de tickets con Stripe
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import * as stripeService from '../services/stripe.service';
import * as ordersService from '../services/orders.service';
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * Crea un Payment Intent para una orden
 * POST /payments/create-intent
 */
export const createPaymentIntent = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const { orderId } = req.body;

        if (!orderId) {
            res.status(400).json({
                success: false,
                error: 'orderId es requerido',
            });
            return;
        }

        const order = await ordersService.getOrderById(orderId, req.user.userId, req.user.role);
        const amountInCents = Math.round(Number(order.totalAmount) * 100);

        const paymentIntent = await stripeService.createPaymentIntent(
            amountInCents,
            orderId,
            req.user.userId,
            { type: 'ticket_purchase' },
        );

        logger.info(`Payment Intent creado para orden: ${orderId}`);

        res.status(200).json({
            success: true,
            data: {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
            },
        });
    },
);

/**
 * Confirma un pago después de que Stripe lo procesa
 * Este endpoint normalmente se llama desde el webhook, pero puede usarse para verificar
 */
export const confirmPayment = asyncHandler(
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const { paymentIntentId, orderId } = req.body;

        if (!paymentIntentId || !orderId) {
            res.status(400).json({
                success: false,
                error: 'paymentIntentId y orderId son requeridos',
            });
            return;
        }

        const paymentIntent = await stripeService.confirmPaymentIntent(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            res.status(400).json({
                success: false,
                error: 'El pago no ha sido completado',
            });
            return;
        }

        // Nota: En producción esto se maneja automáticamente vía webhook
        await ordersService.payOrder(orderId, req.user.userId, {
            method: 'CREDIT_CARD',
        });

        logger.info(`Pago confirmado para orden: ${orderId}`);

        res.status(200).json({
            success: true,
            message: 'Pago confirmado exitosamente',
        });
    },
);
