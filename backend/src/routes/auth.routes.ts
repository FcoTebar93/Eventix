import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, authController.register);

router.post('/login', authLimiter, authController.login);

router.post('/refresh', authController.refresh);

export default router;