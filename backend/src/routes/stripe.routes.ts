import { Router } from 'express';
import * as stripeController from '../controllers/stripe.webhook.controller';
import * as paymentsController from '../controllers/payments.controller';
import * as subscriptionsController from '../controllers/subscriptions.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/webhook', stripeController.handleWebhook);

router.post('/create-intent', authenticate, paymentsController.createPaymentIntent);
router.post('/confirm', authenticate, paymentsController.confirmPayment);

router.post('/subscriptions', authenticate, subscriptionsController.createSubscription);
router.post('/subscriptions/confirm', authenticate, subscriptionsController.confirmSubscription);
router.delete('/subscriptions', authenticate, subscriptionsController.cancelSubscription);
router.get('/subscriptions/me', authenticate, subscriptionsController.getMySubscription);

export default router;
