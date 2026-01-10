import { Router } from 'express';
import { AchievementController } from '../controllers/achievementController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Публичные маршруты
router.get('/', AchievementController.getAllAchievements);

// Защищенные маршруты
router.get('/user', authMiddleware, AchievementController.getUserAchievements);
router.get('/unlocked', authMiddleware, AchievementController.getUnlockedAchievements);
router.post('/:achievementId/unlock', authMiddleware, AchievementController.unlockAchievement);
router.get('/stats', authMiddleware, AchievementController.getAchievementStats);

export default router;
