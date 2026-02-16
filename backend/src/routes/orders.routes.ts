import { Router } from 'express';
import * as ordersController from '../controllers/orders.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', ordersController.createOrder);
router.get('/me', ordersController.getMyOrders); // Debe ir ANTES de /:id
router.get('/', requireRole('ADMIN'), ordersController.getOrders);
router.get('/:id', requireRole('ADMIN'), ordersController.getOrderById);
router.patch('/:id', requireRole('ADMIN'), ordersController.updateOrder);
router.delete('/:id', requireRole('ADMIN'), ordersController.cancelOrder);
router.post('/:id/pay', ordersController.payOrder);

export default router;