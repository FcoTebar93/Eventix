/**
 * Controlador para manejar webhooks de Stripe
 * Los webhooks permiten recibir eventos en tiempo real de Stripe
 */

import { Request, Response } from 'express';
import * as stripeService from '../services/stripe.service';
import * as subscriptionsService from '../services/subscriptions.service';
import * as ordersService from '../services/orders.service';
import { logger } from '../utils/logger';
import { PaymentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

/**
 * Maneja todos los webhooks de Stripe
 * POST /stripe/webhook
 */
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
        res.status(400).send('Falta la firma de Stripe');
        return;
    }

    let event;

    try {
        // El body ya viene como Buffer desde express.raw()
        const body = req.body as Buffer;
        // Construir el evento desde el payload y la firma
        event = stripeService.constructWebhookEvent(body, sig as string);
    } catch (error: any) {
        logger.error(`Error verificando webhook: ${error.message}`);
        res.status(400).send(`Webhook Error: ${error.message}`);
        return;
    }

    // Manejar diferentes tipos de eventos
    try {
        switch (event.type) {
            // ========== EVENTOS DE PAGOS (TICKETS) ==========
            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(event);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentIntentFailed(event);
                break;

            // ========== EVENTOS DE SUSCRIPCIONES ==========
            case 'customer.subscription.created':
                await handleSubscriptionCreated(event);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event);
                break;

            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event);
                break;

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event);
                break;

            default:
                logger.info(`Evento no manejado: ${event.type}`);
        }

        // Responder a Stripe que recibimos el evento
        res.json({ received: true });
    } catch (error: any) {
        logger.error(`Error procesando webhook ${event.type}: ${error.message}`);
        res.status(500).json({ error: 'Error procesando webhook' });
    }
};

/**
 * Maneja cuando un Payment Intent es exitoso (pago de ticket completado)
 */
async function handlePaymentIntentSucceeded(event: any): Promise<void> {
    const paymentIntent = event.data.object;
    const { orderId, userId } = paymentIntent.metadata;

    if (!orderId) {
        logger.warn('Payment Intent sin orderId en metadata');
        return;
    }

    logger.info(`Payment Intent exitoso para orden: ${orderId}`);

    await prisma.payment.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: {
            status: PaymentStatus.COMPLETED,
            stripeChargeId: paymentIntent.latest_charge as string,
            paymentIntentStatus: 'succeeded',
        },
    });

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (order?.status === 'PENDING') {
            await ordersService.payOrder(orderId, userId, {
                method: 'CREDIT_CARD',
            });
        }
    } catch (error: any) {
        logger.error(`Error confirmando orden ${orderId}: ${error.message}`);
    }
}

/**
 * Maneja cuando un Payment Intent falla
 */
async function handlePaymentIntentFailed(event: any): Promise<void> {
    const paymentIntent = event.data.object;
    const { orderId } = paymentIntent.metadata;

    logger.warn(`Payment Intent fallido para orden: ${orderId}`);

    await prisma.payment.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: {
            status: PaymentStatus.FAILED,
            paymentIntentStatus: 'failed',
            failureReason: paymentIntent.last_payment_error?.message || 'Pago fallido',
        },
    });
}

/**
 * Maneja cuando se crea una suscripción
 */
async function handleSubscriptionCreated(event: any): Promise<void> {
    const subscription = event.data.object;
    logger.info(`Suscripción creada: ${subscription.id}`);

    await subscriptionsService.confirmSubscription(subscription.id);
}

/**
 * Maneja cuando se actualiza una suscripción
 */
async function handleSubscriptionUpdated(event: any): Promise<void> {
    const subscription = event.data.object;
    logger.info(`Suscripción actualizada: ${subscription.id}`);

    await subscriptionsService.updateSubscriptionFromWebhook(
        subscription.id,
        subscription.status,
        subscription.current_period_end,
        subscription.cancel_at_period_end,
    );
}

/**
 * Maneja cuando se cancela una suscripción
 */
async function handleSubscriptionDeleted(event: any): Promise<void> {
    const subscription = event.data.object;
    logger.info(`Suscripción cancelada: ${subscription.id}`);

    await subscriptionsService.updateSubscriptionFromWebhook(
        subscription.id,
        'canceled',
        subscription.current_period_end,
        false,
    );
}

/**
 * Maneja cuando un pago de suscripción es exitoso
 */
async function handleInvoicePaymentSucceeded(event: any): Promise<void> {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription as string;

    if (subscriptionId) {
        logger.info(`[Webhook] Pago de suscripción exitoso: ${subscriptionId}`);
        logger.info(`[Webhook] Invoice ID: ${invoice.id}, Amount: ${invoice.amount_paid}`);
        // Confirmar la suscripción para actualizar el rol del usuario a ORGANIZER
        try {
            await subscriptionsService.confirmSubscription(subscriptionId);
            logger.info(`[Webhook] ✅ Suscripción ${subscriptionId} confirmada exitosamente`);
        } catch (error: any) {
            logger.error(`[Webhook] ❌ Error confirmando suscripción ${subscriptionId}: ${error.message}`);
            throw error;
        }
    } else {
        logger.warn(`[Webhook] ⚠️ Invoice ${invoice.id} no tiene subscriptionId asociado`);
    }
}

/**
 * Maneja cuando un pago de suscripción falla
 */
async function handleInvoicePaymentFailed(event: any): Promise<void> {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription as string;

    if (subscriptionId) {
        logger.warn(`Pago de suscripción fallido: ${subscriptionId}`);
        // Actualizar estado a PAST_DUE
        await subscriptionsService.updateSubscriptionFromWebhook(
            subscriptionId,
            'past_due',
            invoice.period_end,
            false,
        );
    }
}
