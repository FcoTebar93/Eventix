import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import eventsRoutes from './events.routes';
import ordersRoutes from './orders.routes';
import favoritesRoutes from './favorites.routes';
import adminRoutes from './admin.routes';
import stripeRoutes from './stripe.routes';

const router = Router();

router.use('/auth', authRoutes);

router.use('/users', usersRoutes);

router.use('/events', eventsRoutes);

router.use('/orders', ordersRoutes);

router.use('/favorites', favoritesRoutes);

router.use('/admin', adminRoutes);

router.use('/stripe', stripeRoutes);

export default router;