import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import eventsRoutes from './events.routes';
import ordersRoutes from './orders.routes';
import ticketsRoutes from './tickets.routes';

const router = Router();

router.use('/auth', authRoutes);

router.use('/users', usersRoutes);

router.use('/events', eventsRoutes);

router.use('/orders', ordersRoutes);

router.use('/tickets', ticketsRoutes);

export default router;