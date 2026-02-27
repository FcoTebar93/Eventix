import Router from 'express';
import * as reservationsService from '../services/reservations.services';
import * as adminController from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));

router.get('/dashboard', adminController.getDashboard);
router.get('/events', adminController.getEvents);

router.post('/release-expired-reservations', async (_req, res) => {
    try {
        const result = await reservationsService.releaseExpiredReservations();
        res.status(200).json({
            success: true,
            message: 'Reservas expiradas liberadas',
            data: result,
        });
    } catch (error) {
        throw error;
    }
});

export default router;