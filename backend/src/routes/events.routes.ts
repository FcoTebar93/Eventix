import { Router } from 'express';
import * as eventsController from '../controllers/events.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, eventsController.getEvents);
router.get('/:id', authenticate, eventsController.getEventById);

router.get('/organizer/me', authenticate, eventsController.getMyEvents);
router.post('/', authenticate, requireRole('ORGANIZER', 'ADMIN'), eventsController.createEvent);
router.patch('/:id', authenticate, requireRole('ORGANIZER', 'ADMIN'), eventsController.updateEvent);
router.delete('/:id', authenticate, requireRole('ORGANIZER', 'ADMIN'), eventsController.deleteEvent);
router.post('/:id/publish', authenticate, requireRole('ORGANIZER', 'ADMIN'), eventsController.publishEvent);

export default router;