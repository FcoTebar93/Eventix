import Router from 'express';
import * as reservationsService from '../services/reservations.services';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.post(
    '/release-expired-reservations',
    authenticate,
    requireRole('ADMIN'),
    async (req, res) => {
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
    },
);

export default router;