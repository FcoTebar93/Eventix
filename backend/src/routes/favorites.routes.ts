import { Router } from 'express';
import * as favoritesController from '../controllers/favorites.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', favoritesController.getFavorites);
router.post('/:eventId', favoritesController.addFavorite);
router.delete('/:eventId', favoritesController.removeFavorite);
router.get('/:eventId/check', favoritesController.checkFavorite);

export default router;
