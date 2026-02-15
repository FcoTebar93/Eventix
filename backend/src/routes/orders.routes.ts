import { Router } from 'express';
import * as ordersController from '../controllers/orders.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', authenticate, ordersController.createOrder);
router.get('/', authenticate, requireRole('ADMIN'), ordersController.getOrders);
router.get('/:id', authenticate, requireRole('ADMIN'), ordersController.getOrderById);
router.patch('/:id', authenticate, requireRole('ADMIN'), ordersController.updateOrder);
router.delete('/:id', authenticate, requireRole('ADMIN'), ordersController.cancelOrder);
router.get('/me', authenticate, ordersController.getMyOrders);

export default router;