import { Router } from 'express';
import * as ticketsController from '../controllers/tickets.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

router.get('/', authenticate, ticketsController.getTicketsByEvent);
router.post('/', authenticate, requireRole('ORGANIZER', 'ADMIN'), ticketsController.createTicket);
router.post('/bulk', authenticate, requireRole('ORGANIZER', 'ADMIN'), ticketsController.createTicketsBulk);
router.get('/:ticketId', authenticate, ticketsController.getTicketById);
router.patch('/:ticketId', authenticate, requireRole('ORGANIZER', 'ADMIN'), ticketsController.updateTicket);
router.delete('/:ticketId', authenticate, requireRole('ORGANIZER', 'ADMIN'), ticketsController.deleteTicket);

export default router;
