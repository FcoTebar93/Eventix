import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.get('/profile', authenticate, usersController.getProfile);
router.patch('/profile', authenticate, usersController.updateProfile);
router.post('/profile/change-password', authenticate, usersController.changePassword);

router.get('/', authenticate, requireRole('ADMIN'), usersController.getAllUsers);
router.get('/:id', authenticate, requireRole('ADMIN'), usersController.getUserById);

export default router;