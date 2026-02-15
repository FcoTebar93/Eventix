import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import eventsRoutes from './events.routes';
import ordersRoutes from './orders.routes';

const router = Router();

router.use('/auth', authRoutes);

router.use('/users', usersRoutes);

router.use('/events', eventsRoutes);

router.use('/orders', ordersRoutes);

export default router;