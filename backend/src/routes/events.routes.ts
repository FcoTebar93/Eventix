import { Router } from 'express';
import * as eventsController from '../controllers/events.controller';
import ticketsRoutes from './tickets.routes';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, eventsController.getEvents);
router.get('/organizer/me', authenticate, eventsController.getMyEvents);
router.post('/', authenticate, requireRole('ORGANIZER', 'ADMIN'), eventsController.createEvent);

router.use('/:eventId/tickets', (req, res, next) => {
    // Asegurar que eventId esté disponible en los params de las rutas anidadas
    req.params.eventId = req.params.eventId;
    next();
}, ticketsRoutes);

router.get('/:id', authenticate, eventsController.getEventById);
router.patch('/:id', authenticate, requireRole('ORGANIZER', 'ADMIN'), eventsController.updateEvent);
router.delete('/:id', authenticate, requireRole('ORGANIZER', 'ADMIN'), eventsController.deleteEvent);
router.post('/:id/publish', authenticate, requireRole('ORGANIZER', 'ADMIN'), eventsController.publishEvent);

export default router;