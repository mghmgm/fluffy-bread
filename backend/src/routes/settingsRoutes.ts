import { Router } from 'express';
import { SettingsController } from '../controllers/settingsController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Все маршруты настроек требуют авторизацию
router.get('/', authMiddleware, SettingsController.getSettings);
router.put('/', authMiddleware, SettingsController.updateSettings);
router.put('/music-volume', authMiddleware, SettingsController.updateMusicVolume);
router.put('/sound-volume', authMiddleware, SettingsController.updateSoundVolume);

export default router;
