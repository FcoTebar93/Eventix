import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import eventsRoutes from './events.routes';

const router = Router();

router.use('/auth', authRoutes);

router.use('/users', usersRoutes);

router.use('/events', eventsRoutes);

export default router;