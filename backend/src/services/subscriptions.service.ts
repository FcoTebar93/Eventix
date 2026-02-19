/**
 * Servicio para gestionar suscripciones Premium
 */

import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
// UserPlan eliminado - ahora usamos solo role
import { env } from '../config/env';
import * as stripeService from './stripe.service';

/**
 * Crea una suscripción Premium para un usuario
 * @param userId ID del usuario
 * @param email Email del usuario
 * @param name Nombre del usuario
 */
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
        // Verificar que el usuario no tenga ya una suscripción activa
        const activeSubscription = await prisma.subscription.findFirst({
            where: {
                userId,
                status: 'ACTIVE',
            },
        });

        if (activeSubscription) {
            throw new AppError('Ya tienes una suscripción activa', 400);
        }

        const priceId = env.STRIPE_PREMIUM_PRICE_ID;
        if (!priceId) {
            throw new AppError('STRIPE_PREMIUM_PRICE_ID no está configurado. Debes crear un producto y precio en Stripe Dashboard primero.', 500);
        }

        // Crear o obtener cliente en Stripe
        const existingSubscription = await prisma.subscription.findFirst({
            where: { userId },
            select: { stripeCustomerId: true },
        });

        let customerId: string;
        if (existingSubscription?.stripeCustomerId) {
            customerId = existingSubscription.stripeCustomerId;
            // Verificar que el cliente existe en Stripe
            try {
                await stripeService.getCustomer(customerId);
            } catch (error) {
                // Si no existe en Stripe, crear uno nuevo
                const newCustomer = await stripeService.createCustomer(email, name, userId);
                customerId = newCustomer.id;
                // Actualizar la suscripción existente con el nuevo customerId
                await prisma.subscription.updateMany({
                    where: { userId },
                    data: { stripeCustomerId: customerId },
                });
            }
        } else {
            // Buscar si ya existe un cliente con este email en Stripe
            const newCustomer = await stripeService.createCustomer(email, name, userId);
            customerId = newCustomer.id;
        }

        // Verificar si ya existe una suscripción pendiente o activa para este usuario
        const existingSub = await prisma.subscription.findFirst({
            where: {
                userId,
                stripeSubscriptionId: { not: null },
            },
        });

        let subscription;
        let subscriptionRecord;

        if (existingSub?.stripeSubscriptionId) {
            // Si ya existe una suscripción, obtenerla de Stripe
            try {
                subscription = await stripeService.getSubscription(existingSub.stripeSubscriptionId);
                subscriptionRecord = existingSub;
            } catch (error) {
                // Si la suscripción no existe en Stripe, crear una nueva
                subscription = await stripeService.createSubscription(customerId, priceId);
                subscriptionRecord = null;
            }
        } else {
            // Crear nueva suscripción en Stripe
            subscription = await stripeService.createSubscription(customerId, priceId);
            subscriptionRecord = null;
        }

        // Obtener client secret del payment intent si existe
        const invoice = subscription.latest_invoice as any;
        const paymentIntent = invoice?.payment_intent as any;
        const clientSecret = paymentIntent?.client_secret || null;

        // Guardar o actualizar suscripción en la BD (en estado inicial, se activará cuando se pague)
        if (subscriptionRecord) {
            await prisma.subscription.update({
                where: { id: subscriptionRecord.id },
                data: {
                    stripeCustomerId: customerId,
                    stripeSubscriptionId: subscription.id,
                    status: subscription.status === 'active' ? 'ACTIVE' : 'PAST_DUE',
                    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
                },
            });
        } else {
            await prisma.subscription.create({
                data: {
                    userId,
                    stripeCustomerId: customerId,
                    stripeSubscriptionId: subscription.id,
                    status: subscription.status === 'active' ? 'ACTIVE' : 'PAST_DUE',
                    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
                },
            });
        }

        // Solo actualizar rol si la suscripción ya está activa (pagada)
        // Si no, se actualizará cuando el webhook confirme el pago
        if (subscription.status === 'active') {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    role: 'ORGANIZER',
                },
            });
        }

        return {
            subscriptionId: subscription.id,
            clientSecret,
            customerId,
        };
    } catch (error: any) {
        // Log del error para debugging
        console.error('[createPremiumSubscription] Error:', error);
        
        // Si es un AppError, re-lanzarlo
        if (error instanceof AppError) {
            throw error;
        }
        
        // Si es un error de Stripe, extraer el mensaje
        if (error?.type === 'StripeInvalidRequestError' || error?.code) {
            throw new AppError(`Error de Stripe: ${error.message || error.type}`, 400);
        }
        
        // Error genérico
        throw new AppError(`Error al crear suscripción: ${error.message || 'Error desconocido'}`, 500);
    }
};

/**
 * Confirma una suscripción después del pago inicial
 * @param subscriptionId ID de la suscripción en Stripe
 */
export const confirmSubscription = async (subscriptionId: string): Promise<void> => {
    const subscription = await stripeService.getSubscription(subscriptionId);

    const subscriptionStatus = subscription.status === 'active' ? 'ACTIVE' : 'PAST_DUE';

    console.log(`[confirmSubscription] Procesando suscripción ${subscriptionId} con estado: ${subscriptionStatus}`);

    await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscriptionId },
        data: {
            status: subscriptionStatus,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        },
    });

    // Si la suscripción está activa, actualizar el rol del usuario a ORGANIZER
    if (subscriptionStatus === 'ACTIVE') {
        const sub = await prisma.subscription.findFirst({
            where: { stripeSubscriptionId: subscriptionId },
            select: { userId: true },
        });

        if (sub) {
            const updatedUser = await prisma.user.update({
                where: { id: sub.userId },
                data: {
                    role: 'ORGANIZER',
                },
                select: { id: true, email: true, role: true },
            });
            console.log(`[confirmSubscription] ✅ Usuario ${updatedUser.id} (${updatedUser.email}) actualizado a rol ORGANIZER`);
        } else {
            console.warn(`[confirmSubscription] ⚠️ No se encontró suscripción con ID ${subscriptionId}`);
        }
    } else {
        console.log(`[confirmSubscription] Suscripción ${subscriptionId} no está activa aún (status: ${subscriptionStatus})`);
    }
};

/**
 * Cancela una suscripción
 * @param userId ID del usuario
 * @param cancelImmediately Si cancela inmediatamente o al final del período
 */
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

    // Cancelar en Stripe
    await stripeService.cancelSubscription(
        subscription.stripeSubscriptionId,
        cancelImmediately,
    );

    // Actualizar en BD
    if (cancelImmediately) {
        await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                status: 'CANCELLED',
            },
        });

        // Degradar usuario a BUYER cuando se cancela la suscripción
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

/**
 * Actualiza el estado de una suscripción desde webhook
 */
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

    // Si la suscripción fue cancelada, degradar usuario
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

/**
 * Obtiene la suscripción activa de un usuario
 */
export const getUserSubscription = async (userId: string) => {
    return await prisma.subscription.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
};
