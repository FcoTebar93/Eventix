import Stripe from 'stripe';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';

if (!env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY no está configurada');
}

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-11-20.acacia' as any,
});

export const createPaymentIntent = async (
    amount: number,
    orderId: string,
    userId: string,
    metadata?: Record<string, string>,
): Promise<Stripe.PaymentIntent> => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'eur',
            metadata: {
                orderId,
                userId,
                ...metadata,
            },
            payment_method_types: ['card'],
        });

        return paymentIntent;
    } catch (error) {
        if (error instanceof Stripe.errors.StripeError) {
            throw new AppError(`Error de Stripe: ${error.message}`, 400);
        }
        throw error;
    }
};

export const confirmPaymentIntent = async (
    paymentIntentId: string,
): Promise<Stripe.PaymentIntent> => {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            return paymentIntent;
        }

        throw new AppError('El pago no ha sido completado', 400);
    } catch (error) {
        if (error instanceof Stripe.errors.StripeError) {
            throw new AppError(`Error de Stripe: ${error.message}`, 400);
        }
        throw error;
    }
};

export const createCustomer = async (
    email: string,
    name: string,
    userId: string,
): Promise<Stripe.Customer> => {
    try {
        const customer = await stripe.customers.create({
            email,
            name,
            metadata: {
                userId,
            },
        });

        return customer;
    } catch (error) {
        if (error instanceof Stripe.errors.StripeError) {
            throw new AppError(`Error al crear cliente: ${error.message}`, 400);
        }
        throw error;
    }
};

export const createSubscription = async (
    customerId: string,
    priceId: string,
): Promise<Stripe.Subscription> => {
    try {
        if (!priceId) {
            throw new AppError('Price ID no proporcionado', 500);
        }

        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [
                {
                    price: priceId,
                },
            ],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
        });

        return subscription;
    } catch (error) {
        if (error instanceof Stripe.errors.StripeError) {
            throw new AppError(`Error al crear suscripción: ${error.message}`, 400);
        }
        throw error;
    }
};

export const cancelSubscription = async (
    subscriptionId: string,
    cancelImmediately: boolean = false,
): Promise<Stripe.Subscription> => {
    try {
        if (cancelImmediately) {
            return await stripe.subscriptions.cancel(subscriptionId);
        } else {
            return await stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: true,
            });
        }
    } catch (error) {
        if (error instanceof Stripe.errors.StripeError) {
            throw new AppError(`Error al cancelar suscripción: ${error.message}`, 400);
        }
        throw error;
    }
};

export const getSubscription = async (
    subscriptionId: string,
    expand?: string[],
): Promise<Stripe.Subscription> => {
    try {
        return await stripe.subscriptions.retrieve(subscriptionId, {
            ...(expand?.length ? { expand } : {}),
        });
    } catch (error) {
        if (error instanceof Stripe.errors.StripeError) {
            throw new AppError(`Error al obtener suscripción: ${error.message}`, 400);
        }
        throw error;
    }
};

export const getCustomer = async (customerId: string): Promise<Stripe.Customer> => {
    try {
        return await stripe.customers.retrieve(customerId) as Stripe.Customer;
    } catch (error) {
        if (error instanceof Stripe.errors.StripeError) {
            throw new AppError(`Error al obtener cliente: ${error.message}`, 400);
        }
        throw error;
    }
};

export const constructWebhookEvent = (
    payload: string | Buffer,
    signature: string,
): Stripe.Event => {
    if (!env.STRIPE_WEBHOOK_SECRET) {
        throw new AppError('STRIPE_WEBHOOK_SECRET no está configurado', 500);
    }

    try {
        return stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (error) {
        if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
            throw new AppError(`Firma de webhook inválida: ${error.message}`, 400);
        }
        throw error;
    }
};
