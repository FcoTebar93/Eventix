/**
 * Rutas para webhooks de Stripe y gestión de pagos
 */

import { Router } from 'express';
import * as stripeController from '../controllers/stripe.webhook.controller';
import * as paymentsController from '../controllers/payments.controller';
import * as subscriptionsController from '../controllers/subscriptions.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Webhook de Stripe (sin autenticación, usa firma de Stripe)
router.post('/webhook', stripeController.handleWebhook);

// Rutas de pagos (requieren autenticación)
router.post('/create-intent', authenticate, paymentsController.createPaymentIntent);
router.post('/confirm', authenticate, paymentsController.confirmPayment);

// Rutas de suscripciones (requieren autenticación)
router.post('/subscriptions', authenticate, subscriptionsController.createSubscription);
router.delete('/subscriptions', authenticate, subscriptionsController.cancelSubscription);
router.get('/subscriptions/me', authenticate, subscriptionsController.getMySubscription);

export default router;
