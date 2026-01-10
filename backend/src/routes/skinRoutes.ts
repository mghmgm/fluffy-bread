import { Router } from 'express';
import { SkinController } from '../controllers/skinController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Все маршруты скинов требуют авторизацию
router.get('/', authMiddleware, SkinController.getUserSkins);
router.get('/unlocked', authMiddleware, SkinController.getUnlockedSkins);
router.post('/:skinId/unlock', authMiddleware, SkinController.unlockSkin);

export default router;
