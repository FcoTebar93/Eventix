import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';
import * as stripeService from './stripe.service';

export const createPremiumSubscription = async (
    userId: string,
    email: string,
    name: string,
): Promise<{
    subscriptionId: string;
    clientSecret: string | null;
    customerId: string;
}> => {
    try {
        const existingRecord = await prisma.subscription.findFirst({
            where: { userId },
        });

        if (existingRecord?.status === 'ACTIVE') {
            throw new AppError('Ya tienes una suscripción activa', 400);
        }

        const priceId = env.STRIPE_PREMIUM_PRICE_ID;
        if (!priceId) {
            throw new AppError('STRIPE_PREMIUM_PRICE_ID no está configurado', 500);
        }

        let customerId: string;
        if (existingRecord?.stripeCustomerId) {
            customerId = existingRecord.stripeCustomerId;
            try {
                await stripeService.getCustomer(customerId);
            } catch {
                const newCustomer = await stripeService.createCustomer(email, name, userId);
                customerId = newCustomer.id;
                await prisma.subscription.updateMany({
                    where: { userId },
                    data: { stripeCustomerId: customerId },
                });
            }
        } else {
            const newCustomer = await stripeService.createCustomer(email, name, userId);
            customerId = newCustomer.id;
        }

        let subscription;

        if (existingRecord?.stripeSubscriptionId) {
            try {
                subscription = await stripeService.getSubscription(existingRecord.stripeSubscriptionId);
            } catch {
                subscription = await stripeService.createSubscription(customerId, priceId);
            }
        } else {
            subscription = await stripeService.createSubscription(customerId, priceId);
        }

        const invoice = subscription.latest_invoice as any;
        const paymentIntent = invoice?.payment_intent as any;
        const clientSecret = paymentIntent?.client_secret || null;

        const subscriptionData = {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            status: subscription.status === 'active' ? 'ACTIVE' : 'PAST_DUE',
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        };

        if (existingRecord) {
            await prisma.subscription.update({
                where: { id: existingRecord.id },
                data: subscriptionData,
            });
        } else {
            await prisma.subscription.create({
                data: { userId, ...subscriptionData },
            });
        }

        if (subscription.status === 'active') {
            await prisma.user.update({
                where: { id: userId },
                data: { role: 'ORGANIZER' },
            });
        }

        return {
            subscriptionId: subscription.id,
            clientSecret,
            customerId,
        };
    } catch (error: any) {
        if (error instanceof AppError) {
            throw error;
        }

        if (error?.type === 'StripeInvalidRequestError' || error?.code) {
            throw new AppError(`Error de Stripe: ${error.message || error.type}`, 400);
        }

        throw new AppError(`Error al crear suscripción: ${error.message || 'Error desconocido'}`, 500);
    }
};

export const confirmSubscription = async (subscriptionId: string): Promise<void> => {
    const subscription = await stripeService.getSubscription(subscriptionId);

    const subscriptionStatus = subscription.status === 'active' ? 'ACTIVE' : 'PAST_DUE';

    await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscriptionId },
        data: {
            status: subscriptionStatus,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        },
    });

    if (subscriptionStatus === 'ACTIVE') {
        const sub = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId: subscriptionId },
            select: { userId: true },
        });

        if (sub) {
            await prisma.user.update({
                where: { id: sub.userId },
                data: {
                    role: 'ORGANIZER',
                },
                select: { id: true, email: true, role: true },
            });
        }
    }
};

export const cancelPremiumSubscription = async (
    userId: string,
    cancelImmediately: boolean = false,
): Promise<void> => {
    const subscription = await prisma.subscription.findFirst({
        where: {
            userId,
            status: 'ACTIVE',
        },
    });

    if (!subscription) {
        throw new AppError('No tienes una suscripción activa', 404);
    }

    await stripeService.cancelSubscription(
        subscription.stripeSubscriptionId,
        cancelImmediately,
    );

    if (cancelImmediately) {
        await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                status: 'CANCELLED',
            },
        });

        await prisma.user.update({
            where: { id: userId },
            data: {
                role: 'BUYER',
            },
        });
    } else {
        await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                cancelAtPeriodEnd: true,
            },
        });
    }
};

export const updateSubscriptionFromWebhook = async (
    stripeSubscriptionId: string,
    status: string,
    currentPeriodEnd: number,
    cancelAtPeriodEnd: boolean,
): Promise<void> => {
    const subscriptionStatus =
        status === 'active' ? 'ACTIVE'
        : status === 'past_due' ? 'PAST_DUE'
        : status === 'canceled' || status === 'unpaid' ? 'CANCELLED'
        : 'PAST_DUE';

    await prisma.subscription.updateMany({
        where: { stripeSubscriptionId },
        data: {
            status: subscriptionStatus,
            currentPeriodEnd: new Date(currentPeriodEnd * 1000),
            cancelAtPeriodEnd: cancelAtPeriodEnd,
        },
    });

    if (subscriptionStatus === 'CANCELLED') {
        const subscription = await prisma.subscription.findUnique({
            where: { stripeSubscriptionId },
            select: { userId: true },
        });

        if (subscription) {
            await prisma.user.update({
                where: { id: subscription.userId },
                data: { role: 'BUYER' },
            });
        }
    }
};

export const getUserSubscription = async (userId: string) => {
    return await prisma.subscription.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
};
