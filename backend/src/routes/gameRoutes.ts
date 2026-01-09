import { Router } from 'express';
import { GameController } from '../controllers/gameController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Все эндпоинты требуют авторизации
router.use(authMiddleware);

// Синхронизация
router.post('/sync', GameController.syncGameData);

export default router;
