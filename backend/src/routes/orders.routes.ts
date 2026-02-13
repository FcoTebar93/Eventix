import { Router } from 'express';
import * as ordersController from '../controllers/orders.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/orders', authenticate, ordersController.createOrder);
router.get('/orders', authenticate, requireRole('ADMIN'), ordersController.getOrders);
router.get('/orders/:id', authenticate, requireRole('ADMIN'), ordersController.getOrderById);
router.patch('/orders/:id', authenticate, requireRole('ADMIN'), ordersController.updateOrder);
router.delete('/orders/:id', authenticate, requireRole('ADMIN'), ordersController.cancelOrder);
router.get('/orders/me', authenticate, ordersController.getMyOrders);

export default router;