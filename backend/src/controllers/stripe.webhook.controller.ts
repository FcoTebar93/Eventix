import { Request, Response } from 'express';
import * as stripeService from '../services/stripe.service';
import * as subscriptionsService from '../services/subscriptions.service';
import * as ordersService from '../services/orders.service';
import { PaymentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
        res.status(400).send('Falta la firma de Stripe');
        return;
    }

    let event;

    try {
        const body = req.body as Buffer;
        event = stripeService.constructWebhookEvent(body, sig as string);
    } catch (error: any) {
        res.status(400).send(`Webhook Error: ${error.message}`);
        return;
    }

    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(event);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentIntentFailed(event);
                break;

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
        }

        res.json({ received: true });
    } catch (error: any) {
        res.status(500).json({ error: 'Error procesando webhook' });
    }
};

async function handlePaymentIntentSucceeded(event: any): Promise<void> {
    const paymentIntent = event.data.object;
    const { orderId, userId } = paymentIntent.metadata;

    if (!orderId) {
        return;
    }

    await prisma.payment.updateMany({
        where: { 
            stripePaymentIntentId: paymentIntent.id 
        } as any,
        data: {
            status: PaymentStatus.COMPLETED,
            stripeChargeId: paymentIntent.latest_charge as string,
            paymentIntentStatus: 'succeeded',
        } as any,
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
    } catch (err) {
        console.error('Error al confirmar la suscripción:', err instanceof Error ? err.message : err);
    }
}

async function handlePaymentIntentFailed(event: any): Promise<void> {
    const paymentIntent = event.data.object;

    await prisma.payment.updateMany({
        where: { 
            stripePaymentIntentId: paymentIntent.id 
        } as any,
        data: {
            status: PaymentStatus.FAILED,
            paymentIntentStatus: 'failed',
            failureReason: paymentIntent.last_payment_error?.message || 'Pago fallido',
        } as any,
    });
}

async function handleSubscriptionCreated(event: any): Promise<void> {
    const subscription = event.data.object;
    await subscriptionsService.confirmSubscription(subscription.id);
}

async function handleSubscriptionUpdated(event: any): Promise<void> {
    const subscription = event.data.object;
    await subscriptionsService.updateSubscriptionFromWebhook(
        subscription.id,
        subscription.status,
        subscription.current_period_end,
        subscription.cancel_at_period_end,
    );
}

async function handleSubscriptionDeleted(event: any): Promise<void> {
    const subscription = event.data.object;
    await subscriptionsService.updateSubscriptionFromWebhook(
        subscription.id,
        'canceled',
        subscription.current_period_end,
        false,
    );
}

async function handleInvoicePaymentSucceeded(event: any): Promise<void> {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription as string;

    if (subscriptionId) {
        try {
            await subscriptionsService.confirmSubscription(subscriptionId);
        } catch (error: any) {
            throw error;
        }
    }
}

async function handleInvoicePaymentFailed(event: any): Promise<void> {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription as string;

    if (subscriptionId) {
        await subscriptionsService.updateSubscriptionFromWebhook(
            subscriptionId,
            'past_due',
            invoice.period_end,
            false,
        );
    }
}
